import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkSection, type Section } from "../remark-section";
import type { Root as MdastRoot } from "mdast";

function parseSections(md: string): Section[] {
  const processor = unified().use(remarkParse).use(remarkSection);
  const tree = processor.parse(md);
  const transformed = processor.runSync(tree) as MdastRoot & {
    data?: { sections?: Section[] };
  };
  return transformed.data?.sections || [];
}

describe("remarkSection", () => {
  it("splits document by H2 headings", () => {
    const md = `# Title

Intro text.

## Section One

Content one.

## Section Two

Content two.
`;
    const sections = parseSections(md);
    expect(sections).toHaveLength(3);
    expect(sections[0].title).toBe("Introduction");
    expect(sections[1].title).toBe("Section One");
    expect(sections[2].title).toBe("Section Two");
  });

  it("handles document with no H2 headings (paragraph-based split)", () => {
    const md = `# Title

Para 1.

Para 2.

Para 3.

Para 4.

Para 5.

Para 6.
`;
    const sections = parseSections(md);
    expect(sections.length).toBeGreaterThanOrEqual(1);
    // First section should use the H1 title
    expect(sections[0].title).toBe("Title");
  });

  it("handles empty document", () => {
    const sections = parseSections("");
    expect(sections).toHaveLength(0);
  });

  it("puts content before first H2 into Introduction section", () => {
    const md = `Some intro text.

## First Section

Content.
`;
    const sections = parseSections(md);
    expect(sections[0].title).toBe("Introduction");
    expect(sections[1].title).toBe("First Section");
  });

  it("handles single H2 section", () => {
    const md = `## Only Section

This is the only section.
`;
    const sections = parseSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Only Section");
  });
});
