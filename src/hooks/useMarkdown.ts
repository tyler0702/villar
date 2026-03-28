import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { remarkSection, type Section } from "../plugins/remark-section";
import { extractTldr, type TldrData } from "../plugins/remark-tldr";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { collapseHtml, type CollapsedBlock, COLLAPSE_MARKER } from "../plugins/remark-collapse";
import { convertFileSrc } from "@tauri-apps/api/core";
import { logRenderTime, logTldrResult } from "./useMetrics";
import type { Root as MdastRoot, Content, Code, Heading } from "mdast";

const MERMAID_PLACEHOLDER = "___MERMAID_BLOCK___";

function extractSubHeadings(children: Content[]): SubHeading[] {
  const subs: SubHeading[] = [];
  for (const node of children) {
    if (node.type === "heading" && (node as Heading).depth >= 3) {
      const h = node as Heading;
      const title = h.children
        .map((c) => ("value" in c ? c.value : ""))
        .join("");
      subs.push({ depth: h.depth, title });
    }
  }
  return subs;
}

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

function addCopyButtonsToHtml(html: string): string {
  return html.replace(/<pre><code/g, '<pre><button class="code-copy-btn" data-copy>Copy</button><code');
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

function addHeadingAnchors(html: string): string {
  return html.replace(/<(h[3-6])>(.*?)<\/\1>/g, (_match, tag: string, content: string) => {
    const plain = content.replace(/<[^>]+>/g, "");
    const id = slugify(plain);
    return `<${tag} id="${id}" class="heading-anchor-target"><a href="#${id}" class="heading-anchor" aria-hidden="true">#</a>${content}</${tag}>`;
  });
}

export interface SubHeading {
  depth: number; // 3, 4, 5, 6
  title: string;
}

export interface ProcessedSection {
  title: string;
  html: string;
  tldr: TldrData | null;
  mermaidCodes: string[];
  subHeadings: SubHeading[];
  collapsed: CollapsedBlock[];
}

interface CollapseConfig {
  listThreshold: number;
  codeThreshold: number;
}

function resolveImagePaths(html: string, basePath: string | null): string {
  if (!basePath) return html;
  return html.replace(/<img\s+src="([^"]+)"/g, (_match, src: string) => {
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
      return `<img src="${src}"`;
    }
    // Resolve relative path against the file's directory
    const dir = basePath.substring(0, basePath.lastIndexOf("/"));
    const fullPath = src.startsWith("/") ? src : `${dir}/${src}`;
    return `<img src="${convertFileSrc(fullPath)}"`;
  });
}

export function useMarkdown(content: string | null, collapseConfig?: CollapseConfig, filePath?: string | null): ProcessedSection[] {
  return useMemo(() => {
    if (!content) return [];

    const start = performance.now();
    const processor = unified().use(remarkParse).use(remarkGfm).use(remarkSection);

    const tree = processor.parse(content);
    const transformed = processor.runSync(tree) as MdastRoot & {
      data?: { sections?: Section[] };
    };

    const sections = transformed.data?.sections || [];

    const result = sections.map((section) => {
      const { cleaned, mermaidCodes } = extractMermaidBlocks(section.children);
      const tldr = extractTldr(section.children);
      logTldrResult(section.title, tldr !== null);
      const rendered = renderChildren(cleaned);
      const { html: collapsedHtml, collapsed } = collapseHtml(rendered, collapseConfig);
      return {
        title: section.title,
        html: addHeadingAnchors(resolveImagePaths(addCopyButtonsToHtml(collapsedHtml), filePath ?? null)),
        tldr,
        mermaidCodes,
        subHeadings: extractSubHeadings(section.children),
        collapsed: collapsed.map((b) => ({ ...b, html: addCopyButtonsToHtml(b.html) })),
      };
    });

    const elapsed = performance.now() - start;
    logRenderTime(Math.round(elapsed), content.length);

    return result;
  }, [content, collapseConfig?.listThreshold, collapseConfig?.codeThreshold, filePath]);
}

export { MERMAID_PLACEHOLDER, COLLAPSE_MARKER };
