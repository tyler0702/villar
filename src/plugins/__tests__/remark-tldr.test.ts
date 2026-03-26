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

// --- TL;DR improvement tests (TDD: some tests may fail until wt1/wt2 merge) ---

describe("extractTldr - rule strengthening", () => {
  it("detects English conclusion marker 'In conclusion'", () => {
    const children = getChildren(`
This is a sufficiently long overview paragraph with enough content for TL;DR extraction to work properly.

Some middle paragraph with additional details and supporting information.

In conclusion, the system demonstrates high reliability and consistent performance across all tested scenarios.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.conclusion).toContain("In conclusion");
  });

  it("extracts points from numbered list", () => {
    const children = getChildren(`
This is a sufficiently long overview paragraph with enough content for TL;DR extraction to operate correctly.

1. First numbered point with detail
2. Second numbered point with detail
3. Third numbered point with detail
4. Fourth numbered point (should be excluded)
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.points).toHaveLength(3);
    expect(tldr!.points[0]).toContain("First numbered point");
  });

  it("extracts points from H3 headings when no list exists", () => {
    const children = getChildren(`
This is a sufficiently long overview paragraph providing enough content for the TL;DR generation system.

### Performance Optimization

Details about performance improvements and benchmarks.

### Security Hardening

Details about security measures and vulnerability fixes.

### Scalability Improvements

Details about horizontal and vertical scaling capabilities.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.points.length).toBeGreaterThanOrEqual(2);
    expect(tldr!.points.some((p) => p.includes("Performance"))).toBe(true);
  });

  it("extracts inline code as keywords", () => {
    const children = getChildren(`
The system uses \`Redis\` for caching and \`PostgreSQL\` for the primary database, with **Docker** for containerization.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.keywords).toContain("Redis");
    expect(tldr!.keywords).toContain("PostgreSQL");
  });

  it("shows TL;DR with summary only when 50+ chars (relaxed visibility)", () => {
    const children = getChildren(`
This is a paragraph that has more than fifty characters of meaningful content for display purposes.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.summary).not.toBeNull();
    expect(tldr!.summary!.length).toBeGreaterThanOrEqual(50);
  });

  it("detects Chinese conclusion marker '总结'", () => {
    const children = getChildren(`
本文介绍了系统架构的核心设计原则和实现方法，涵盖了多个关键技术领域的最佳实践。

总结：通过以上分析可以看出，该架构具有良好的扩展性和可维护性。
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.conclusion).toContain("总结");
  });
});

describe("extractTldr - TextRank", () => {
  it("selects the most important sentence as summary from 3+ paragraphs", () => {
    const children = getChildren(`
Machine learning models require careful tuning of hyperparameters to achieve optimal performance.

The gradient descent algorithm iterates through training data to minimize the loss function. Each epoch processes the entire dataset once. Batch size affects both convergence speed and memory usage.

Transfer learning enables models to leverage pre-trained weights from large datasets. This approach significantly reduces training time and improves accuracy on smaller datasets.

Data augmentation techniques such as rotation, flipping, and color jittering help prevent overfitting by artificially expanding the training set.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    // TextRank should pick a more representative sentence than just the first one
    expect(tldr!.summary).not.toBeNull();
    expect(tldr!.summary!.length).toBeGreaterThan(20);
  });

  it("falls back to first paragraph for short documents (2 paragraphs or fewer)", () => {
    const children = getChildren(`
This is the first paragraph with introductory content that sets the context for the discussion.

This is the second paragraph with some additional supporting information and elaboration.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.summary).toContain("first paragraph");
  });

  it("completes within 10ms for a 30-sentence section", () => {
    const sentences = Array.from({ length: 30 }, (_, i) =>
      `Sentence number ${i + 1} contains relevant information about topic ${i % 5} with detailed technical analysis and supporting evidence.`
    );
    const md = sentences.join("\n\n");
    const children = getChildren(md);

    const start = performance.now();
    const tldr = extractTldr(children);
    const elapsed = performance.now() - start;

    expect(tldr).not.toBeNull();
    expect(elapsed).toBeLessThan(10);
  });
});

describe("extractTldr - edge cases", () => {
  it("generates TL;DR for English-only documents", () => {
    const children = getChildren(`
The microservices architecture pattern decomposes applications into small, independently deployable services. Each service runs its own process and communicates via lightweight mechanisms.

- Service discovery enables automatic detection of network locations
- Circuit breakers prevent cascading failures across services
- API gateways provide unified entry points for clients

In summary, this approach offers significant benefits for scalability and team autonomy.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    expect(tldr!.summary).not.toBeNull();
    expect(tldr!.points.length).toBeGreaterThan(0);
  });

  it("handles mixed bullet list, numbered list, and H3 headings", () => {
    const children = getChildren(`
This comprehensive overview covers the system architecture with sufficient detail for proper TL;DR extraction.

- Bullet point one about infrastructure
- Bullet point two about deployment

1. Numbered step one for migration
2. Numbered step two for validation

### Monitoring Setup

Details about the monitoring and alerting configuration.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    // Should extract points from at least one source
    expect(tldr!.points.length).toBeGreaterThan(0);
  });

  it("extracts keywords from mixed bold and inline code", () => {
    const children = getChildren(`
The **Kubernetes** cluster uses \`Istio\` service mesh with **Prometheus** for metrics and \`Grafana\` dashboards for visualization.
`);
    const tldr = extractTldr(children);
    expect(tldr).not.toBeNull();
    // Bold keywords
    expect(tldr!.keywords).toContain("Kubernetes");
    expect(tldr!.keywords).toContain("Prometheus");
    // Inline code keywords (requires implementation)
    expect(tldr!.keywords).toContain("Istio");
    expect(tldr!.keywords).toContain("Grafana");
  });
});
