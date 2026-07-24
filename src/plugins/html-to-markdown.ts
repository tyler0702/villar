import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import type { Root, Element, Parent } from "hast";

// Subtrees that must not reach the reading view: executable content,
// rendering machinery, and document metadata. Without this, rehype-remark
// flattens their text (CSS rules, JS source) into visible paragraphs.
// Dropping script/style here also doubles as sanitization — the converted
// markdown re-enters the normal pipeline, so no raw HTML is ever injected.
const DROP_TAGS = new Set([
  "script",
  "style",
  "noscript",
  "template",
  "iframe",
  "object",
  "embed",
  "head",
  "svg",
  "canvas",
  "video",
  "audio",
]);

function stripNonContent() {
  return (tree: Root) => {
    const prune = (node: Parent) => {
      node.children = node.children.filter(
        (child) => !(child.type === "element" && DROP_TAGS.has((child as Element).tagName))
      );
      for (const child of node.children) {
        if ("children" in child) prune(child as Parent);
      }
    };
    prune(tree);
  };
}

export function isHtmlPath(path: string | null | undefined): boolean {
  return /\.html?$/i.test(path ?? "");
}

// Convert an HTML document (or fragment) to GFM markdown so it can flow
// through the existing markdown → card pipeline unchanged.
export function htmlToMarkdown(html: string): string {
  const file = unified()
    .use(rehypeParse)
    .use(stripNonContent)
    .use(rehypeRemark)
    .use(remarkGfm)
    .use(remarkStringify)
    .processSync(html);
  return String(file);
}
