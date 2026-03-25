import { describe, it, expect } from "vitest";
import { collapseHtml } from "../remark-collapse";

describe("collapseHtml", () => {
  it("wraps long lists in details/summary (default threshold)", () => {
    const items = Array.from({ length: 8 }, (_, i) => `<li>Item ${i + 1}</li>`).join("");
    const html = `<ul>${items}</ul>`;
    const result = collapseHtml(html);
    expect(result).toContain("<details>");
    expect(result).toContain("8 items");
  });

  it("does not wrap short lists", () => {
    const html = `<ul><li>A</li><li>B</li><li>C</li></ul>`;
    const result = collapseHtml(html);
    expect(result).not.toContain("<details>");
  });

  it("wraps long code blocks in details/summary", () => {
    const lines = Array.from({ length: 25 }, (_, i) => `line ${i + 1}`).join("\n");
    const html = `<pre><code class="language-js">${lines}</code></pre>`;
    const result = collapseHtml(html);
    expect(result).toContain("<details>");
    expect(result).toContain("25 lines");
  });

  it("does not wrap short code blocks", () => {
    const html = `<pre><code>short code</code></pre>`;
    const result = collapseHtml(html);
    expect(result).not.toContain("<details>");
  });

  it("preserves other HTML unchanged", () => {
    const html = `<p>Hello</p><h2>Title</h2>`;
    const result = collapseHtml(html);
    expect(result).toBe(html);
  });

  it("respects custom list threshold", () => {
    const items = Array.from({ length: 4 }, (_, i) => `<li>Item ${i + 1}</li>`).join("");
    const html = `<ul>${items}</ul>`;
    // Default threshold 5 — should NOT collapse 4 items
    expect(collapseHtml(html)).not.toContain("<details>");
    // Custom threshold 3 — should collapse 4 items
    expect(collapseHtml(html, { listThreshold: 3 })).toContain("<details>");
  });

  it("respects custom code threshold", () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join("\n");
    const html = `<pre><code>${lines}</code></pre>`;
    // Default threshold 20 — should NOT collapse 10 lines
    expect(collapseHtml(html)).not.toContain("<details>");
    // Custom threshold 5 — should collapse 10 lines
    expect(collapseHtml(html, { codeThreshold: 5 })).toContain("<details>");
  });
});
