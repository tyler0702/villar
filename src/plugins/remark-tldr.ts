import type { Content, Heading, Paragraph, List, ListItem, Strong, Text } from "mdast";

export interface TldrData {
  summary: string | null;
  points: string[];
  keywords: string[];
  conclusion: string | null;
}

const MIN_CHAR_COUNT = 50;
const MAX_POINTS = 3;
const CONCLUSION_PREFIXES = ["結論", "まとめ", "つまり"];

export function extractTldr(children: Content[]): TldrData | null {
  const summary = extractSummary(children);
  const points = extractPoints(children);
  const keywords = extractKeywords(children);
  const conclusion = extractConclusion(children);

  // Check visibility conditions
  if (!summary) return null;

  const totalChars =
    (summary?.length || 0) +
    points.join("").length +
    keywords.join("").length +
    (conclusion?.length || 0);

  if (totalChars < MIN_CHAR_COUNT) return null;

  const validElements = [summary, points.length > 0 ? points : null, conclusion].filter(Boolean);
  if (validElements.length < 1) return null;

  return { summary, points, keywords, conclusion };
}

function extractSummary(children: Content[]): string | null {
  for (const node of children) {
    if (node.type === "paragraph") {
      const text = getPlainText(node as Paragraph);
      // Take first 1-2 sentences
      const sentences = text.match(/[^。.!！？?]+[。.!！？?]?/g);
      if (sentences) {
        return sentences.slice(0, 2).join("").trim();
      }
      return text.trim() || null;
    }
  }
  return null;
}

function extractPoints(children: Content[]): string[] {
  for (const node of children) {
    if (node.type === "list") {
      const list = node as List;
      return list.children.slice(0, MAX_POINTS).map((item: ListItem) => {
        return getPlainTextFromChildren(item.children);
      });
    }
  }
  return [];
}

function extractKeywords(children: Content[]): string[] {
  const keywords: string[] = [];

  function walk(nodes: Content[]) {
    for (const node of nodes) {
      if (node.type === "strong") {
        const text = (node as Strong).children
          .filter((c): c is Text => c.type === "text")
          .map((c) => c.value)
          .join("");
        if (text.trim()) keywords.push(text.trim());
      }
      if ("children" in node && Array.isArray(node.children)) {
        walk(node.children as Content[]);
      }
    }
  }

  walk(children);
  return [...new Set(keywords)];
}

function extractConclusion(children: Content[]): string | null {
  for (const node of children) {
    if (node.type === "paragraph") {
      const text = getPlainText(node as Paragraph);
      for (const prefix of CONCLUSION_PREFIXES) {
        if (text.startsWith(prefix)) {
          return text;
        }
      }
    }
  }
  return null;
}

function getPlainText(paragraph: Paragraph): string {
  return paragraph.children
    .map((child) => {
      if (child.type === "text") return child.value;
      if (child.type === "strong" || child.type === "emphasis") {
        return (child.children as { type: string; value?: string }[])
          .map((c) => c.value || "")
          .join("");
      }
      if (child.type === "inlineCode") return child.value;
      return "";
    })
    .join("");
}

function getPlainTextFromChildren(children: Content[]): string {
  return children
    .map((node) => {
      if (node.type === "paragraph") return getPlainText(node as Paragraph);
      if (node.type === "text") return (node as Text).value;
      return "";
    })
    .join("")
    .trim();
}
