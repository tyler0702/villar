import type { Content, Heading, Paragraph, List, ListItem, Strong, Text, InlineCode } from "mdast";

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
  // Japanese
  "結論", "まとめ", "つまり", "要するに", "総括", "以上から", "結果として",
  // English
  "In conclusion", "In summary", "To summarize", "Therefore", "Thus",
  "In short", "To sum up", "The key takeaway",
  // Chinese
  "总结", "综上", "总之", "简而言之",
  // Korean
  "결론", "요약하면", "정리하면",
];

export function extractTldr(children: Content[]): TldrData | null {
  const summary = extractSummary(children);
  const points = extractPoints(children);
  const keywords = extractKeywords(children);
  const conclusion = extractConclusion(children);

  // Must have a summary
  if (!summary) return null;

  // Summary alone >= 50 chars is enough to display
  if (summary.length >= MIN_CHAR_COUNT) {
    return { summary, points, keywords, conclusion };
  }

  // Otherwise check total chars
  const totalChars =
    summary.length +
    points.join("").length +
    keywords.join("").length +
    (conclusion?.length || 0);

  if (totalChars < MIN_CHAR_COUNT) return null;

  return { summary, points, keywords, conclusion };
}

function extractSummary(children: Content[]): string | null {
  const paragraphs = collectParagraphs(children);
  if (paragraphs.length === 0) return null;

  // For 3+ paragraphs, try TextRank
  if (paragraphs.length >= 3) {
    const textRankResult = textRankSummary(paragraphs);
    const ruleResult = ruleBasedSummary(paragraphs[0]);
    if (textRankResult && (!ruleResult || textRankResult.length >= ruleResult.length)) {
      return textRankResult;
    }
    // Fall back to rule-based if TextRank result is shorter
    return ruleResult;
  }

  // 1-2 paragraphs: rule-based
  return ruleBasedSummary(paragraphs[0]);
}

function collectParagraphs(children: Content[]): string[] {
  const result: string[] = [];
  for (const node of children) {
    if (node.type === "paragraph") {
      const text = getPlainText(node as Paragraph).trim();
      if (text) result.push(text);
    }
  }
  return result;
}

function ruleBasedSummary(text: string): string | null {
  const sentences = text.match(/[^。.!！？?]+[。.!！？?]?/g);
  if (sentences) {
    return sentences.slice(0, 2).join("").trim();
  }
  return text.trim() || null;
}

// --- TextRank ---

function splitSentences(text: string): string[] {
  const raw = text.match(/[^。.!！？?\n]+[。.!！？?]?/g);
  if (!raw) return [];
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function tokenize(sentence: string): string[] {
  // Simple word-level tokenization: split on whitespace and CJK boundaries
  return sentence
    .toLowerCase()
    .split(/[\s,;:()[\]{}'"、，；：（）「」『』【】]+/)
    .filter((w) => w.length > 1);
}

function sentenceSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let common = 0;
  for (const word of a) {
    if (setB.has(word)) common++;
  }
  if (common === 0) return 0;
  const denom = Math.log(a.length + 1) + Math.log(b.length + 1);
  return denom > 0 ? common / denom : 0;
}

function textRankSummary(paragraphs: string[]): string | null {
  // Collect all sentences
  let sentences: string[] = [];
  for (const p of paragraphs) {
    sentences.push(...splitSentences(p));
  }
  if (sentences.length < 3) return null;

  // Truncate to 30 if over 50
  if (sentences.length > 50) {
    sentences = sentences.slice(0, 30);
  }

  const n = sentences.length;
  const tokens = sentences.map(tokenize);

  // Build similarity matrix (only store edges above threshold)
  const THRESHOLD = 0.1;
  const edges: number[][] = Array.from({ length: n }, () => []);
  const weights: number[][] = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = sentenceSimilarity(tokens[i], tokens[j]);
      if (sim >= THRESHOLD) {
        edges[i].push(j);
        weights[i].push(sim);
        edges[j].push(i);
        weights[j].push(sim);
      }
    }
  }

  // PageRank
  const DAMPING = 0.85;
  const ITERATIONS = 30;
  let scores = new Float64Array(n).fill(1 / n);
  let next = new Float64Array(n);

  // Precompute outgoing weight sums
  const outSum = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (const w of weights[i]) s += w;
    outSum[i] = s;
  }

  for (let iter = 0; iter < ITERATIONS; iter++) {
    next.fill((1 - DAMPING) / n);
    for (let i = 0; i < n; i++) {
      if (outSum[i] === 0) continue;
      const neighbors = edges[i];
      const ws = weights[i];
      for (let k = 0; k < neighbors.length; k++) {
        next[neighbors[k]] += DAMPING * scores[i] * (ws[k] / outSum[i]);
      }
    }
    [scores, next] = [next, scores];
  }

  // Pick top 2 sentences, maintaining original order
  const indexed = Array.from(scores, (score, i) => ({ score, i }));
  indexed.sort((a, b) => b.score - a.score);
  const topIndices = indexed.slice(0, 2).map((x) => x.i).sort((a, b) => a - b);

  return topIndices.map((i) => sentences[i]).join(" ").trim() || null;
}

function extractPoints(children: Content[]): string[] {
  // Prefer bullet/ordered lists over H3 headings
  for (const node of children) {
    if (node.type === "list") {
      const list = node as List;
      return list.children.slice(0, MAX_POINTS).map((item: ListItem) => {
        return getPlainTextFromChildren(item.children);
      });
    }
  }

  // Fallback: extract H3 headings as points
  const h3Points: string[] = [];
  for (const node of children) {
    if (node.type === "heading" && (node as Heading).depth === 3) {
      const text = (node as Heading).children
        .map((c) => ("value" in c ? (c as Text).value : ""))
        .join("");
      if (text.trim()) h3Points.push(text.trim());
      if (h3Points.length >= MAX_POINTS) break;
    }
  }
  return h3Points;
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
      if (node.type === "inlineCode") {
        const text = (node as InlineCode).value.trim();
        if (text) keywords.push(text);
      }
      if ("children" in node && Array.isArray(node.children)) {
        walk(node.children as Content[]);
      }
    }
  }

  walk(children);
  return [...new Set(keywords)].slice(0, MAX_KEYWORDS);
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
