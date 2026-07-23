import { describe, it, expect } from "vitest";

// Inlined copy of addCodeLineNumbers from useMarkdown.ts (matches the
// convention used by copy-button.test.ts). Keep in sync with the source.
function addCodeLineNumbers(html: string): string {
  return html.replace(/(<pre><code[^>]*>)([\s\S]*?)(<\/code><\/pre>)/g, (_m, open: string, inner: string, close: string) => {
    const body = inner.replace(/\n$/, "");
    const openTags: string[] = [];
    const tagRe = /<span\b[^>]*>|<\/span>/g;
    const lines = body.split("\n").map((line) => {
      const prefix = openTags.join("");
      tagRe.lastIndex = 0;
      let mt: RegExpExecArray | null;
      while ((mt = tagRe.exec(line)) !== null) {
        if (mt[0] === "</span>") openTags.pop();
        else openTags.push(mt[0]);
      }
      const suffix = "</span>".repeat(openTags.length);
      return `<span class="code-line">${prefix}${line}${suffix}</span>`;
    });
    return open + lines.join("\n") + "\n" + close;
  });
}

const countCodeLines = (html: string) => (html.match(/<span class="code-line">/g) || []).length;
const balanced = (html: string) =>
  (html.match(/<span\b/g) || []).length === (html.match(/<\/span>/g) || []).length;

describe("addCodeLineNumbers", () => {
  it("wraps exactly one .code-line per source line regardless of token count", () => {
    // A line with multiple highlight tokens must still be ONE line (the bug:
    // token spans were each counted as a line, producing stray inline numbers).
    const html =
      '<pre><code class="hljs language-bash">' +
      '<span class="hljs-built_in">sudo</span> install -d /etc/x\n' +
      '<span class="hljs-built_in">sudo</span> <span class="hljs-built_in">stat</span> -f <span class="hljs-string">\'%N\'</span> /etc/x\n' +
      "</code></pre>";
    const out = addCodeLineNumbers(html);
    expect(countCodeLines(out)).toBe(2); // two source lines, not four token spans
    expect(balanced(out)).toBe(true);
  });

  it("keeps token spans nested inside .code-line (not as siblings of code)", () => {
    const html = '<pre><code class="hljs language-js"><span class="hljs-keyword">const</span> x = <span class="hljs-number">1</span>;\n</code></pre>';
    const out = addCodeLineNumbers(html);
    expect(countCodeLines(out)).toBe(1);
    expect(out).toContain('<span class="code-line"><span class="hljs-keyword">const</span>');
  });

  it("splits a highlight span that crosses a newline, reopening it per line", () => {
    // A multi-line string is one <span> crossing 3 newlines in hljs output.
    const html =
      '<pre><code class="hljs language-python">x = <span class="hljs-string">"""\nhello\n"""</span>\nprint(x)\n</code></pre>';
    const out = addCodeLineNumbers(html);
    expect(countCodeLines(out)).toBe(4); // """ , hello, """, print(x)
    expect(balanced(out)).toBe(true);
    // the string span is reopened on the interior line
    expect(out).toContain('<span class="code-line"><span class="hljs-string">hello</span></span>');
  });

  it("numbers plain (unhighlighted) code by line too", () => {
    const html = "<pre><code>line one\nline two\nline three\n</code></pre>";
    const out = addCodeLineNumbers(html);
    expect(countCodeLines(out)).toBe(3);
  });

  it("preserves newlines so copied text keeps line breaks", () => {
    const html = '<pre><code class="hljs">a\nb\n</code></pre>';
    const out = addCodeLineNumbers(html);
    const text = out.replace(/<[^>]+>/g, "");
    expect(text).toBe("a\nb\n");
  });

  it("leaves inline <code> (outside <pre>) untouched", () => {
    const html = "<p>use <code>npm test</code> here</p>";
    expect(addCodeLineNumbers(html)).toBe(html);
  });
});
