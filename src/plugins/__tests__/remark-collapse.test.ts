import { describe, it, expect } from "vitest";
import { collapseHtml, COLLAPSE_MARKER } from "../remark-collapse";

describe("collapseHtml", () => {
  it("replaces long lists with collapse markers", () => {
    const items = Array.from({ length: 8 }, (_, i) => `<li>Item ${i + 1}</li>`).join("");
    const html = `<ul>${items}</ul>`;
    const result = collapseHtml(html);
    expect(result.html).toContain(COLLAPSE_MARKER);
    expect(result.collapsed).toHaveLength(1);
    expect(result.collapsed[0].type).toBe("list");
    expect(result.collapsed[0].label).toContain("8 items");
  });

  it("does not collapse short lists", () => {
    const html = `<ul><li>A</li><li>B</li><li>C</li></ul>`;
    const result = collapseHtml(html);
    expect(result.html).not.toContain(COLLAPSE_MARKER);
    expect(result.collapsed).toHaveLength(0);
  });

  it("replaces long code blocks with collapse markers", () => {
    const lines = Array.from({ length: 25 }, (_, i) => `line ${i + 1}`).join("\n");
    const html = `<pre><code class="language-js">${lines}</code></pre>`;
    const result = collapseHtml(html);
    expect(result.html).toContain(COLLAPSE_MARKER);
    expect(result.collapsed).toHaveLength(1);
    expect(result.collapsed[0].type).toBe("code");
    expect(result.collapsed[0].label).toContain("25 lines");
  });

  it("does not collapse short code blocks", () => {
    const html = `<pre><code>short code</code></pre>`;
    const result = collapseHtml(html);
    expect(result.html).not.toContain(COLLAPSE_MARKER);
    expect(result.collapsed).toHaveLength(0);
  });

  it("preserves other HTML unchanged", () => {
    const html = `<p>Hello</p><h2>Title</h2>`;
    const result = collapseHtml(html);
    expect(result.html).toBe(html);
    expect(result.collapsed).toHaveLength(0);
  });

  it("respects custom list threshold", () => {
    const items = Array.from({ length: 4 }, (_, i) => `<li>Item ${i + 1}</li>`).join("");
    const html = `<ul>${items}</ul>`;
    expect(collapseHtml(html).collapsed).toHaveLength(0);
    expect(collapseHtml(html, { listThreshold: 3 }).collapsed).toHaveLength(1);
  });

  it("respects custom code threshold", () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join("\n");
    const html = `<pre><code>${lines}</code></pre>`;
    expect(collapseHtml(html).collapsed).toHaveLength(0);
    expect(collapseHtml(html, { codeThreshold: 5 }).collapsed).toHaveLength(1);
  });
});
