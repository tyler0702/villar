import { describe, it, expect } from "vitest";
import { htmlToMarkdown, isHtmlPath } from "../html-to-markdown";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { remarkSection, type Section } from "../remark-section";
import type { Root } from "mdast";

function toSections(markdown: string): Section[] {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkSection);
  const tree = processor.parse(markdown);
  const transformed = processor.runSync(tree) as Root & { data?: { sections?: Section[] } };
  return transformed.data?.sections || [];
}

describe("isHtmlPath", () => {
  it("matches .html and .htm case-insensitively", () => {
    expect(isHtmlPath("/docs/report.html")).toBe(true);
    expect(isHtmlPath("/docs/report.htm")).toBe(true);
    expect(isHtmlPath("/docs/REPORT.HTML")).toBe(true);
  });

  it("rejects .md and null", () => {
    expect(isHtmlPath("/docs/report.md")).toBe(false);
    expect(isHtmlPath(null)).toBe(false);
    expect(isHtmlPath(undefined)).toBe(false);
  });
});

describe("htmlToMarkdown", () => {
  it("converts headings and paragraphs", () => {
    const md = htmlToMarkdown("<h1>Title</h1><h2>Section</h2><p>Body text.</p>");
    expect(md).toContain("# Title");
    expect(md).toContain("## Section");
    expect(md).toContain("Body text.");
  });

  it("handles a full HTML document with head", () => {
    const md = htmlToMarkdown(
      `<!DOCTYPE html><html><head><title>Doc</title><meta charset="utf-8"><style>body{color:red}</style></head><body><h2>Intro</h2><p>Hello</p></body></html>`
    );
    expect(md).toContain("## Intro");
    expect(md).toContain("Hello");
    expect(md).not.toContain("color:red");
    expect(md).not.toContain("Doc");
  });

  it("strips script and style content", () => {
    const md = htmlToMarkdown(
      `<p>Keep</p><script>alert("xss")</script><style>.x{display:none}</style><noscript>fallback</noscript>`
    );
    expect(md).toContain("Keep");
    expect(md).not.toContain("alert");
    expect(md).not.toContain("display:none");
    expect(md).not.toContain("fallback");
  });

  it("converts tables to GFM", () => {
    const md = htmlToMarkdown(
      "<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Ann</td><td>30</td></tr></tbody></table>"
    );
    expect(md).toContain("| Name | Age |");
    expect(md).toContain("| Ann  | 30  |");
  });

  it("preserves code block language", () => {
    const md = htmlToMarkdown(
      `<pre><code class="language-python">print("hi")</code></pre>`
    );
    expect(md).toContain("```python");
    expect(md).toContain('print("hi")');
  });

  it("preserves links and images", () => {
    const md = htmlToMarkdown(
      `<p><a href="https://example.com">site</a> and <img src="./fig.png" alt="fig"></p>`
    );
    expect(md).toContain("[site](https://example.com)");
    expect(md).toContain("![fig](./fig.png)");
  });

  it("converts lists including nesting", () => {
    const md = htmlToMarkdown(
      "<ul><li>one</li><li>two<ol><li>a</li><li>b</li></ol></li></ul>"
    );
    expect(md).toContain("* one");
    expect(md).toContain("* two");
    expect(md).toContain("1. a");
  });

  it("flattens layout wrappers (div/section) without losing content", () => {
    const md = htmlToMarkdown(
      `<div class="container"><section><h2>Wrapped</h2><p>Inside</p></section></div>`
    );
    expect(md).toContain("## Wrapped");
    expect(md).toContain("Inside");
  });

  it("feeds the existing H2 section splitter", () => {
    const md = htmlToMarkdown(
      "<h1>Doc</h1><h2>First</h2><p>aaa</p><h2>Second</h2><p>bbb</p>"
    );
    const sections = toSections(md);
    const titles = sections.map((s) => s.title);
    expect(titles).toContain("First");
    expect(titles).toContain("Second");
  });
});
