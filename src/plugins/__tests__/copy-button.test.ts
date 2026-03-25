import { describe, it, expect } from "vitest";

// Inline the function to test (it's in useMarkdown.ts but not exported)
function addCopyButtonsToHtml(html: string): string {
  return html.replace(/<pre><code/g, '<pre><button class="code-copy-btn" data-copy>Copy</button><code');
}

describe("addCopyButtonsToHtml", () => {
  it("injects copy button before <code> in <pre>", () => {
    const html = '<pre><code>console.log("hi")</code></pre>';
    const result = addCopyButtonsToHtml(html);
    expect(result).toContain('<button class="code-copy-btn" data-copy>Copy</button>');
    expect(result).toContain("<pre><button");
  });

  it("handles rehype-highlight output with class attribute", () => {
    const html = '<pre><code class="hljs language-python"><span>print("hello")</span></code></pre>';
    const result = addCopyButtonsToHtml(html);
    expect(result).toContain('<button class="code-copy-btn" data-copy>Copy</button>');
    expect(result).toContain('<code class="hljs language-python">');
  });

  it("handles multiple code blocks", () => {
    const html = '<pre><code>a</code></pre><p>text</p><pre><code class="hljs">b</code></pre>';
    const result = addCopyButtonsToHtml(html);
    const matches = result.match(/code-copy-btn/g);
    expect(matches).toHaveLength(2);
  });

  it("does not inject into inline code", () => {
    const html = "<p>Use <code>npm install</code> to install.</p>";
    const result = addCopyButtonsToHtml(html);
    expect(result).not.toContain("code-copy-btn");
  });

  it("preserves the rest of the HTML", () => {
    const html = "<h2>Title</h2><p>Content</p>";
    const result = addCopyButtonsToHtml(html);
    expect(result).toBe(html);
  });
});
