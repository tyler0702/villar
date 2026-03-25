import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkSection, type Section } from "../plugins/remark-section";
import { extractTldr, type TldrData } from "../plugins/remark-tldr";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { collapseHtml } from "../plugins/remark-collapse";
import { logRenderTime, logTldrResult } from "./useMetrics";
import type { Root as MdastRoot, Content, Code } from "mdast";

const MERMAID_PLACEHOLDER = "___MERMAID_BLOCK___";

function extractMermaidBlocks(children: Content[]): { cleaned: Content[]; mermaidCodes: string[] } {
  const mermaidCodes: string[] = [];
  const cleaned: Content[] = [];

  for (const node of children) {
    if (node.type === "code" && (node as Code).lang === "mermaid") {
      const idx = mermaidCodes.length;
      mermaidCodes.push((node as Code).value);
      // Replace with a paragraph containing a placeholder
      cleaned.push({
        type: "paragraph",
        children: [{ type: "text", value: `${MERMAID_PLACEHOLDER}${idx}` }],
      } as Content);
    } else {
      cleaned.push(node);
    }
  }

  return { cleaned, mermaidCodes };
}

function renderChildren(children: Content[]): string {
  const tree: MdastRoot = { type: "root", children };
  const result = unified()
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .stringify(
      unified()
        .use(remarkRehype)
        .use(rehypeHighlight)
        .runSync(tree)
    );
  return String(result);
}

export interface ProcessedSection {
  title: string;
  html: string;
  tldr: TldrData | null;
  mermaidCodes: string[];
}

export function useMarkdown(content: string | null): ProcessedSection[] {
  return useMemo(() => {
    if (!content) return [];

    const start = performance.now();
    const processor = unified().use(remarkParse).use(remarkSection);

    const tree = processor.parse(content);
    const transformed = processor.runSync(tree) as MdastRoot & {
      data?: { sections?: Section[] };
    };

    const sections = transformed.data?.sections || [];

    const result = sections.map((section) => {
      const { cleaned, mermaidCodes } = extractMermaidBlocks(section.children);
      const tldr = extractTldr(section.children);
      logTldrResult(section.title, tldr !== null);
      return {
        title: section.title,
        html: collapseHtml(renderChildren(cleaned)),
        tldr,
        mermaidCodes,
      };
    });

    const elapsed = performance.now() - start;
    logRenderTime(Math.round(elapsed), content.length);

    return result;
  }, [content]);
}

export { MERMAID_PLACEHOLDER };
