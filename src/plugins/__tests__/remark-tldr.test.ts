import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { extractTldr } from "../remark-tldr";
import type { Root as MdastRoot, Content } from "mdast";

function getChildren(md: string): Content[] {
  const tree = unified().use(remarkParse).parse(md) as MdastRoot;
  return tree.children as Content[];
}

describe("extractTldr", () => {
  it("extracts summary from first paragraph", () => {
    const children = getChildren(`
This is the first paragraph with enough text to pass the threshold. It has multiple sentences.

Some more content here.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.summary).toContain("first paragraph");
  });

  it("extracts bullet points", () => {
    const children = getChildren(`
Overview paragraph with sufficient text content for the TL;DR generation to work properly.

- Point one
- Point two
- Point three
- Point four (should be excluded)
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.points).toHaveLength(3);
    expect(tldr!.points[0]).toContain("Point one");
  });

  it("extracts keywords from bold text", () => {
    const children = getChildren(`
This paragraph mentions **important keyword** and **another term** that should be extracted as keywords.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.keywords).toContain("important keyword");
    expect(tldr!.keywords).toContain("another term");
  });

  it("extracts conclusion from lines starting with conclusion prefixes", () => {
    const children = getChildren(`
This is a long enough overview paragraph that provides sufficient content for TL;DR generation.

結論：このシステムは高い信頼性を持つ。
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.conclusion).toContain("結論");
  });

  it("returns null when content is too short", () => {
    const children = getChildren("Short.");
    const tldr = extractTldr(children);
    expect(tldr).toBeNull();
  });

  it("returns null when no paragraph exists", () => {
    const children = getChildren(`
- Just a list
- Without paragraph
`);
    const tldr = extractTldr(children);
    expect(tldr).toBeNull();
  });

  it("handles content with only headings and no paragraphs", () => {
    const children = getChildren(`
### Sub heading

#### Another heading
`);
    const tldr = extractTldr(children);
    expect(tldr).toBeNull();
  });

  it("handles ordered list (extracts points)", () => {
    const children = getChildren(`
This is a sufficiently long paragraph with enough text to pass the minimum character threshold for TL;DR generation.

1. First ordered item
2. Second ordered item
3. Third ordered item
4. Fourth ordered item
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.points).toHaveLength(3);
    expect(tldr!.points[0]).toContain("First ordered item");
  });

  it("extracts duplicate bold keywords only once", () => {
    const children = getChildren(`
This paragraph has **duplicate** keyword and **duplicate** keyword again plus **unique** keyword to reach the threshold.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.keywords.filter((k) => k === "duplicate")).toHaveLength(1);
  });

  it("extracts conclusion with まとめ prefix", () => {
    const children = getChildren(`
This is a long enough overview paragraph that provides sufficient content for TL;DR generation to work properly.

まとめ：全体的に良好な結果が得られた。
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.conclusion).toContain("まとめ");
  });
});
