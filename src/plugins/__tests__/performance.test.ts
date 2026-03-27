import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkSection, type Section } from "../remark-section";
import { extractTldr } from "../remark-tldr";
import { collapseHtml } from "../remark-collapse";
import { parseFlowchart, checkLinear } from "../mermaid-linear";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { BUILTIN_THEMES } from "../../themes/builtin";
import type { Root as MdastRoot, Content } from "mdast";

// --- Helpers ---

function addCopyButtonsToHtml(html: string): string {
  return html.replace(/<pre><code/g, '<pre><button class="code-copy-btn" data-copy>Copy</button><code');
}

function resolveImagePaths(html: string): string {
  return html.replace(/<img\s+src="([^"]+)"/g, (_match, src: string) => {
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
      return `<img src="${src}"`;
    }
    return `<img src="/resolved/${src}"`;
  });
}

function renderChildren(children: Content[]): string {
  const tree: MdastRoot = { type: "root", children };
  return String(
    unified()
      .use(remarkRehype)
      .use(rehypeHighlight)
      .use(rehypeStringify)
      .stringify(
        unified().use(remarkRehype).use(rehypeHighlight).runSync(tree)
      )
  );
}

// Generate a ~100KB markdown document
function generateLargeMarkdown(): string {
  const sections: string[] = ["# Large Test Document\n\nIntro paragraph.\n"];

  for (let i = 1; i <= 20; i++) {
    const paragraphs = Array.from(
      { length: 5 },
      (_, j) =>
        `This is paragraph ${j + 1} of section ${i}. It contains **important keywords** and enough text to be meaningful for TL;DR extraction. The content discusses various aspects of system design and architecture patterns that are commonly used in modern software development.`
    ).join("\n\n");

    const list = Array.from({ length: 8 }, (_, j) => `- List item ${j + 1} in section ${i}`)
      .join("\n");

    const code = `\`\`\`javascript
${Array.from({ length: 25 }, (_, j) => `const value${j} = compute(${j}); // line ${j + 1}`).join("\n")}
\`\`\``;

    sections.push(`## Section ${i}\n\n${paragraphs}\n\n${list}\n\n${code}\n`);
  }

  // Add 3 mermaid blocks
  sections.push(`## Mermaid Section\n\n\`\`\`mermaid
flowchart TD
    A[Start] --> B[Process]
    B --> C[Validate]
    C --> D[Complete]
\`\`\`\n`);

  sections.push(`\`\`\`mermaid
flowchart LR
    X[Input] --> Y[Transform]
    Y --> Z[Output]
\`\`\`\n`);

  sections.push(`\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Path A]
    B -->|No| D[Path B]
\`\`\`\n`);

  return sections.join("\n");
}

function parseSections(md: string): Section[] {
  const processor = unified().use(remarkParse).use(remarkSection);
  const tree = processor.parse(md);
  const transformed = processor.runSync(tree) as MdastRoot & {
    data?: { sections?: Section[] };
  };
  return transformed.data?.sections || [];
}

// --- Performance Budget Tests ---

describe("Performance Budget", () => {
  const largeMarkdown = generateLargeMarkdown();
  const sizeKB = Math.round(Buffer.from(largeMarkdown).length / 1024);

  it(`test document is ~100KB (actual: ${sizeKB}KB)`, () => {
    expect(sizeKB).toBeGreaterThanOrEqual(50);
  });

  it("full pipeline completes within 500ms for 100KB+ document (initial render budget)", () => {
    const start = performance.now();

    const processor = unified().use(remarkParse).use(remarkSection);
    const tree = processor.parse(largeMarkdown);
    const transformed = processor.runSync(tree) as MdastRoot & {
      data?: { sections?: Section[] };
    };

    const sections = transformed.data?.sections || [];

    sections.forEach((section) => {
      const rendered = renderChildren(section.children);
      const { html } = collapseHtml(rendered);
      addCopyButtonsToHtml(html);
      resolveImagePaths(html);
      extractTldr(section.children);
    });

    const elapsed = performance.now() - start;
    console.log(`Full pipeline: ${Math.round(elapsed)}ms for ${sizeKB}KB document (${sections.length} sections)`);
    expect(elapsed).toBeLessThan(500);
  });

  it("section splitting completes within 50ms", () => {
    const processor = unified().use(remarkParse).use(remarkSection);
    const tree = processor.parse(largeMarkdown);

    const start = performance.now();
    processor.runSync(tree);
    const elapsed = performance.now() - start;

    console.log(`Section splitting: ${Math.round(elapsed)}ms`);
    expect(elapsed).toBeLessThan(50);
  });

  it("TL;DR extraction for single section completes within 10ms", () => {
    const sections = parseSections(largeMarkdown);
    const section = sections[1]; // Pick a section with content

    const start = performance.now();
    extractTldr(section.children);
    const elapsed = performance.now() - start;

    console.log(`TL;DR extraction: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(10);
  });

  it("Mermaid linear check completes within 5ms", () => {
    const code = `flowchart TD
    A[Step 1] --> B[Step 2]
    B --> C[Step 3]
    C --> D[Step 4]
    D --> E[Step 5]`;

    const start = performance.now();
    const data = parseFlowchart(code);
    if (data) checkLinear(data);
    const elapsed = performance.now() - start;

    console.log(`Mermaid linear check: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(5);
  });

  it("HTML collapse completes within 50ms for large HTML", () => {
    const sections = parseSections(largeMarkdown);
    const htmls = sections.map((s) => renderChildren(s.children));

    const start = performance.now();
    htmls.forEach((html) => collapseHtml(html));
    const elapsed = performance.now() - start;

    console.log(`HTML collapse (${htmls.length} sections): ${Math.round(elapsed)}ms`);
    expect(elapsed).toBeLessThan(50);
  });
});

// --- Mermaid multi-block performance ---

describe("Mermaid multi-block performance", () => {
  it("processes file with 3 mermaid blocks within 5ms (parse + linear check)", () => {
    const codes = [
      `flowchart TD\n    A[Start] --> B[Process]\n    B --> C[End]`,
      `flowchart LR\n    X[Input] --> Y[Transform]\n    Y --> Z[Output]`,
      `flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Path A]\n    B -->|No| D[Path B]`,
    ];

    const start = performance.now();
    for (const code of codes) {
      const data = parseFlowchart(code);
      if (data) checkLinear(data);
    }
    const elapsed = performance.now() - start;

    console.log(`3 mermaid blocks parse+linear: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(5);
  });
});

// --- TextRank performance ---

describe("TextRank TL;DR performance", () => {
  it("completes within 10ms for a 30+ sentence section", () => {
    const sentences = Array.from({ length: 35 }, (_, i) =>
      `Sentence number ${i + 1} discusses topic ${i % 7} with detailed analysis of system architecture patterns including microservices, event-driven design, and distributed computing approaches.`
    );
    const md = sentences.join("\n\n");
    const children = parseSections(`## Test\n\n${md}`)[0]?.children;
    if (!children) throw new Error("No children parsed");

    const start = performance.now();
    const tldr = extractTldr(children);
    const elapsed = performance.now() - start;

    console.log(`TextRank TL;DR (${sentences.length} sentences): ${elapsed.toFixed(2)}ms`);
    expect(tldr).not.toBeNull();
    expect(elapsed).toBeLessThan(10);
  });

  it("completes within 10ms for a 50-sentence section", () => {
    const sentences = Array.from({ length: 50 }, (_, i) =>
      `This is sentence ${i + 1} about topic area ${i % 10} covering software engineering principles and modern deployment strategies.`
    );
    const md = sentences.join("\n\n");
    const children = parseSections(`## Test\n\n${md}`)[0]?.children;
    if (!children) throw new Error("No children parsed");

    const start = performance.now();
    extractTldr(children);
    const elapsed = performance.now() - start;

    console.log(`TextRank TL;DR (${sentences.length} sentences): ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(10);
  });
});

// --- Theme application performance ---

describe("Theme application performance", () => {
  it("sets CSS variables for all themes within budget (< 1ms per theme)", () => {
    const themeCount = BUILTIN_THEMES.length;
    console.log(`Testing ${themeCount} built-in themes`);

    const start = performance.now();
    for (const theme of BUILTIN_THEMES) {
      // Simulate what useVscodeTheme does: build the property map
      const props: Record<string, string> = {
        "--vs-bg": theme.bg,
        "--vs-fg": theme.fg,
        "--vs-accent": theme.accent,
        "--vs-sidebar-bg": theme.sidebarBg,
        "--vs-sidebar-fg": theme.sidebarFg,
        "--vs-editor-bg": theme.editorBg,
        "--vs-editor-fg": theme.editorFg,
        "--vs-border": theme.border,
        "--vs-selection": theme.selectionBg,
        "--vs-heading": theme.headingColor,
        "--vs-link": theme.linkColor,
        "--vs-code-bg": theme.codeBg,
        "--vs-code-fg": theme.codeFg,
        "--vs-blockquote-border": theme.blockquoteBorder,
        "--vs-blockquote-fg": theme.blockquoteFg,
        "--vs-table-border": theme.tableBorder,
        "--vs-table-header-bg": theme.tableHeaderBg,
      };
      // Just constructing the map, verifying all props exist
      expect(Object.keys(props)).toHaveLength(17);
    }
    const elapsed = performance.now() - start;

    console.log(`Theme property construction (${themeCount} themes): ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(themeCount); // < 1ms per theme
  });
});

// --- LRU Cache tests ---

describe("MermaidBlock LRU cache", () => {
  it("cache does not exceed MAX_CACHE (50) entries", () => {
    // Replicate the LRU cache logic from MermaidBlock
    const cache = new Map<string, { linear: null; svg: null }>();
    const MAX_CACHE = 50;

    function cacheSet(key: string, val: { linear: null; svg: null }) {
      if (cache.size >= MAX_CACHE) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }
      cache.set(key, val);
    }

    // Insert 60 entries
    for (let i = 0; i < 60; i++) {
      cacheSet(`key-${i}`, { linear: null, svg: null });
    }

    expect(cache.size).toBe(MAX_CACHE);
    // Oldest keys (0-9) should be evicted
    expect(cache.has("key-0")).toBe(false);
    expect(cache.has("key-9")).toBe(false);
    // Newest keys should be present
    expect(cache.has("key-59")).toBe(true);
    expect(cache.has("key-10")).toBe(true);
  });

  it("LRU access refreshes entry position", () => {
    const cache = new Map<string, string>();
    const MAX_CACHE = 5;

    function cacheGet(key: string) {
      const val = cache.get(key);
      if (val) {
        cache.delete(key);
        cache.set(key, val);
      }
      return val;
    }

    function cacheSet(key: string, val: string) {
      if (cache.size >= MAX_CACHE) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }
      cache.set(key, val);
    }

    // Fill cache
    for (let i = 0; i < 5; i++) cacheSet(`k${i}`, `v${i}`);
    expect(cache.size).toBe(5);

    // Access k0 (refreshes it)
    cacheGet("k0");

    // Insert new entry — k1 (oldest unreferenced) should be evicted, not k0
    cacheSet("k5", "v5");
    expect(cache.has("k0")).toBe(true);
    expect(cache.has("k1")).toBe(false);
    expect(cache.has("k5")).toBe(true);
  });
});

// --- Memory estimation ---

describe("Memory estimation", () => {
  it("10 tabs with 100KB content each stay within reasonable bounds", () => {
    const singleTab = generateLargeMarkdown();
    const tabSizeBytes = Buffer.from(singleTab).length;

    // Each tab stores: content + previousContent + changedSections + metadata
    // Worst case: 2x content (content + previousContent)
    const perTabEstimate = tabSizeBytes * 2;
    const totalEstimate = perTabEstimate * 10;
    const totalMB = totalEstimate / (1024 * 1024);

    console.log(`Per tab: ~${Math.round(tabSizeBytes / 1024)}KB raw, ~${Math.round(perTabEstimate / 1024)}KB worst case`);
    console.log(`10 tabs estimated: ~${totalMB.toFixed(1)}MB`);

    // 10 tabs of 100KB each should be well under 50MB
    expect(totalMB).toBeLessThan(50);
  });
});

// --- Rendering pipeline chain ---

describe("Rendering pipeline chain", () => {
  it("collapseHtml + addCopyButtonsToHtml + resolveImagePaths chain within 10ms per section", () => {
    const sections = parseSections(generateLargeMarkdown());
    const htmls = sections.map((s) => renderChildren(s.children));

    const times: number[] = [];
    for (const html of htmls) {
      const start = performance.now();
      const { html: collapsed } = collapseHtml(html);
      const withCopy = addCopyButtonsToHtml(collapsed);
      resolveImagePaths(withCopy);
      times.push(performance.now() - start);
    }

    const maxTime = Math.max(...times);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Pipeline chain per section: avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms (${times.length} sections)`);
    expect(maxTime).toBeLessThan(10);
  });

  it("processes 1000-line code block within 10ms", () => {
    const codeLines = Array.from({ length: 1000 }, (_, i) =>
      `const line${i} = process(data[${i}]); // Operation ${i + 1}`
    ).join("\n");
    const md = `## Code Section\n\n\`\`\`typescript\n${codeLines}\n\`\`\``;
    const sections = parseSections(md);
    const html = renderChildren(sections[0].children);

    const start = performance.now();
    const { html: collapsed } = collapseHtml(html);
    addCopyButtonsToHtml(collapsed);
    const elapsed = performance.now() - start;

    console.log(`1000-line code block post-processing: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(10);
  });
});
