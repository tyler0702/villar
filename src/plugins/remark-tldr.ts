import type { Content, Heading, Paragraph, List, ListItem, Strong, Text, InlineCode } from "mdast";
import { textRankSummary } from "./textrank";

export interface TldrData {
  summary: string | null;
  points: string[];
  keywords: string[];
  conclusion: string | null;
}

const MIN_CHAR_COUNT = 50;
const MAX_POINTS = 3;
const MAX_KEYWORDS = 8;
const CONCLUSION_PREFIXES = [
  "結論", "まとめ", "つまり", "要するに", "総括", "以上から", "結果として",
  "In conclusion", "In summary", "To summarize", "Therefore", "Thus", "In short", "To sum up", "The key takeaway",
  "总结", "综上", "总之", "简而言之", "결론", "요약하면", "정리하면",
];

export function extractTldr(children: Content[]): TldrData | null {
  const summary = extractSummary(children);
  if (!summary) return null;
  const points = extractPoints(children);
  const keywords = extractKeywords(children);
  const conclusion = extractConclusion(children);
  if (summary.length >= MIN_CHAR_COUNT) return { summary, points, keywords, conclusion };
  const total = summary.length + points.join("").length + keywords.join("").length + (conclusion?.length || 0);
  return total < MIN_CHAR_COUNT ? null : { summary, points, keywords, conclusion };
}

function extractSummary(children: Content[]): string | null {
  const paras = children.filter((n): n is Paragraph => n.type === "paragraph")
    .map((p) => getPlainText(p).trim()).filter(Boolean);
  if (paras.length === 0) return null;
  if (paras.length >= 3) {
    const tr = textRankSummary(paras);
    const rb = ruleBasedSummary(paras[0]);
    return tr && (!rb || tr.length >= rb.length) ? tr : rb;
  }
  return ruleBasedSummary(paras[0]);
}

function ruleBasedSummary(text: string): string | null {
  const s = text.match(/[^。.!！？?]+[。.!！？?]?/g);
  return s ? s.slice(0, 2).join("").trim() : (text.trim() || null);
}

function extractPoints(children: Content[]): string[] {
  const list = children.find((n) => n.type === "list") as List | undefined;
  if (list) return list.children.slice(0, MAX_POINTS).map((item: ListItem) => plainTextFromChildren(item.children));
  const pts: string[] = [];
  for (const n of children) {
    if (n.type === "heading" && (n as Heading).depth === 3) {
      const t = (n as Heading).children.map((c) => ("value" in c ? (c as Text).value : "")).join("");
      if (t.trim()) { pts.push(t.trim()); if (pts.length >= MAX_POINTS) break; }
    }
  }
  return pts;
}

function extractKeywords(children: Content[]): string[] {
  const kw: string[] = [];
  (function walk(nodes: Content[]) {
    for (const node of nodes) {
      if (node.type === "strong") {
        const t = (node as Strong).children.filter((c): c is Text => c.type === "text").map((c) => c.value).join("");
        if (t.trim()) kw.push(t.trim());
      }
      if (node.type === "inlineCode") { const t = (node as InlineCode).value.trim(); if (t) kw.push(t); }
      if ("children" in node && Array.isArray(node.children)) walk(node.children as Content[]);
    }
  })(children);
  return [...new Set(kw)].slice(0, MAX_KEYWORDS);
}

function extractConclusion(children: Content[]): string | null {
  for (const n of children) {
    if (n.type !== "paragraph") continue;
    const text = getPlainText(n as Paragraph);
    const match = CONCLUSION_PREFIXES.find((p) => text.startsWith(p));
    if (match) return text;
  }
  return null;
}

function getPlainText(p: Paragraph): string {
  return p.children.map((c) => {
    if (c.type === "text") return c.value;
    if (c.type === "strong" || c.type === "emphasis") return (c.children as { value?: string }[]).map((x) => x.value || "").join("");
    return c.type === "inlineCode" ? c.value : "";
  }).join("");
}

function plainTextFromChildren(children: Content[]): string {
  return children.map((n) =>
    n.type === "paragraph" ? getPlainText(n as Paragraph) : n.type === "text" ? (n as Text).value : ""
  ).join("").trim();
}
