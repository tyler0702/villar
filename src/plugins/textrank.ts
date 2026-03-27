function splitSentences(text: string): string[] {
  const raw = text.match(/[^。.!！？?\n]+[。.!！？?]?/g);
  if (!raw) return [];
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function tokenize(sentence: string): string[] {
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

/**
 * TextRank-based extractive summary.
 * Given 3+ paragraphs, picks the top 2 most representative sentences.
 */
export function textRankSummary(paragraphs: string[]): string | null {
  let sentences: string[] = [];
  for (const p of paragraphs) {
    sentences.push(...splitSentences(p));
  }
  if (sentences.length < 3) return null;

  if (sentences.length > 50) {
    sentences = sentences.slice(0, 30);
  }

  const n = sentences.length;
  const tokens = sentences.map(tokenize);

  // Build similarity graph (sparse)
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

  // PageRank iteration
  const DAMPING = 0.85;
  const ITERATIONS = 30;
  let scores = new Float64Array(n).fill(1 / n);
  let next = new Float64Array(n);

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
