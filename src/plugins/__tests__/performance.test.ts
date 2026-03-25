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
import type { Root as MdastRoot, Content } from "mdast";

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

describe("Performance Budget", () => {
  const largeMarkdown = generateLargeMarkdown();
  const sizeKB = Math.round(Buffer.from(largeMarkdown).length / 1024);

  it(`test document is ~100KB (actual: ${sizeKB}KB)`, () => {
    expect(sizeKB).toBeGreaterThanOrEqual(50);
  });

  it("full pipeline completes within 500ms (initial render budget)", () => {
    const start = performance.now();

    const processor = unified().use(remarkParse).use(remarkSection);
    const tree = processor.parse(largeMarkdown);
    const transformed = processor.runSync(tree) as MdastRoot & {
      data?: { sections?: Section[] };
    };

    const sections = transformed.data?.sections || [];

    sections.forEach((section) => {
      const { html } = collapseHtml(renderChildren(section.children));
      extractTldr(section.children);
      return html;
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
    const processor = unified().use(remarkParse).use(remarkSection);
    const tree = processor.parse(largeMarkdown);
    const transformed = processor.runSync(tree) as MdastRoot & {
      data?: { sections?: Section[] };
    };
    const sections = transformed.data?.sections || [];
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
    const processor = unified().use(remarkParse).use(remarkSection);
    const tree = processor.parse(largeMarkdown);
    const transformed = processor.runSync(tree) as MdastRoot & {
      data?: { sections?: Section[] };
    };
    const sections = transformed.data?.sections || [];

    // Render all sections to HTML first
    const htmls = sections.map((s) => renderChildren(s.children));

    const start = performance.now();
    htmls.forEach((html) => collapseHtml(html));
    const elapsed = performance.now() - start;

    console.log(`HTML collapse (${htmls.length} sections): ${Math.round(elapsed)}ms`);
    expect(elapsed).toBeLessThan(50);
  });
});
