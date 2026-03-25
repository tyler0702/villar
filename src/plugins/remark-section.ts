import type { Root, Content, Heading } from "mdast";
import type { Plugin } from "unified";

export interface Section {
  title: string;
  children: Content[];
}

const PARAGRAPHS_PER_CHUNK = 5;

export const remarkSection: Plugin<[], Root> = () => {
  return (tree: Root) => {
    const sections: Section[] = [];
    const h2Indices: number[] = [];

    // Find all H2 positions
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      if (node.type === "heading" && (node as Heading).depth === 2) {
        h2Indices.push(i);
      }
    }

    if (h2Indices.length === 0) {
      // No H2: split by paragraph count
      splitByParagraphs(tree.children, sections);
    } else {
      // Intro section (before first H2)
      if (h2Indices[0] > 0) {
        const introChildren = tree.children.slice(0, h2Indices[0]);
        if (introChildren.length > 0) {
          sections.push({ title: "Introduction", children: introChildren });
        }
      }

      // H2-based sections
      for (let i = 0; i < h2Indices.length; i++) {
        const start = h2Indices[i];
        const end = i + 1 < h2Indices.length ? h2Indices[i + 1] : tree.children.length;
        const heading = tree.children[start] as Heading;
        const title = extractText(heading);
        const children = tree.children.slice(start + 1, end);
        sections.push({ title, children });
      }
    }

    // Store sections in tree data for downstream use
    (tree as Root & { data?: Record<string, unknown> }).data = {
      ...(tree as Root & { data?: Record<string, unknown> }).data,
      sections,
    };
  };
};

function splitByParagraphs(children: Content[], sections: Section[]) {
  let chunk: Content[] = [];
  let paraCount = 0;
  let chunkIndex = 1;

  for (const node of children) {
    // Skip the document title H1 - use it as first section title
    if (node.type === "heading" && (node as Heading).depth === 1 && sections.length === 0 && chunk.length === 0) {
      sections.push({ title: extractText(node as Heading), children: [] });
      continue;
    }

    chunk.push(node);

    if (node.type === "paragraph") {
      paraCount++;
    }

    if (paraCount >= PARAGRAPHS_PER_CHUNK) {
      if (sections.length > 0 && sections[0].children.length === 0) {
        sections[0].children = chunk;
      } else {
        sections.push({ title: `Section ${chunkIndex}`, children: chunk });
        chunkIndex++;
      }
      chunk = [];
      paraCount = 0;
    }
  }

  if (chunk.length > 0) {
    if (sections.length > 0 && sections[0].children.length === 0) {
      sections[0].children = chunk;
    } else {
      sections.push({ title: `Section ${chunkIndex}`, children: chunk });
    }
  }

  if (sections.length === 0 && children.length > 0) {
    sections.push({ title: "Document", children });
  }
}

function extractText(heading: Heading): string {
  return heading.children
    .map((child) => {
      if (child.type === "text") return child.value;
      if ("children" in child) {
        return (child.children as { type: string; value?: string }[])
          .map((c) => c.value || "")
          .join("");
      }
      return "";
    })
    .join("");
}
