import { describe, it, expect } from "vitest";
import { parseFlowchart, checkLinear } from "../mermaid-linear";

describe("parseFlowchart", () => {
  it("parses a simple flowchart", () => {
    const code = `flowchart TD
    A[Start] --> B[Process]
    B --> C[End]`;
    const data = parseFlowchart(code);
    expect(data).not.toBeNull();
    expect(data!.nodes).toHaveLength(3);
    expect(data!.edges).toHaveLength(2);
  });

  it("parses node labels in brackets", () => {
    const code = `flowchart TD
    A[Client Request] --> B[API Gateway]`;
    const data = parseFlowchart(code);
    expect(data).not.toBeNull();
    expect(data!.nodes[0].label).toBe("Client Request");
    expect(data!.nodes[1].label).toBe("API Gateway");
  });

  it("returns null for non-flowchart", () => {
    const code = `sequenceDiagram
    Alice->>Bob: Hello`;
    const data = parseFlowchart(code);
    expect(data).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseFlowchart("")).toBeNull();
  });

  it("handles graph keyword", () => {
    const code = `graph LR
    A --> B --> C`;
    const data = parseFlowchart(code);
    expect(data).not.toBeNull();
  });
});

describe("checkLinear", () => {
  it("detects linear flow", () => {
    const data = parseFlowchart(`flowchart TD
    A[Step 1] --> B[Step 2]
    B --> C[Step 3]`)!;
    const result = checkLinear(data);
    expect(result).not.toBeNull();
    expect(result!.steps).toEqual(["Step 1", "Step 2", "Step 3"]);
  });

  it("rejects branching flow", () => {
    const data = parseFlowchart(`flowchart TD
    A[Start] --> B[Path 1]
    A --> C[Path 2]`)!;
    const result = checkLinear(data);
    expect(result).toBeNull();
  });

  it("rejects merging flow", () => {
    const data = parseFlowchart(`flowchart TD
    A[Input 1] --> C[Merge]
    B[Input 2] --> C`)!;
    const result = checkLinear(data);
    expect(result).toBeNull();
  });

  it("returns steps in correct order", () => {
    const data = parseFlowchart(`flowchart TD
    X[First] --> Y[Second]
    Y --> Z[Third]
    Z --> W[Fourth]`)!;
    const result = checkLinear(data);
    expect(result).not.toBeNull();
    expect(result!.steps).toEqual(["First", "Second", "Third", "Fourth"]);
  });

  it("handles single node", () => {
    const data = {
      nodes: [{ id: "A", label: "Only Node" }],
      edges: [],
    };
    const result = checkLinear(data);
    expect(result).not.toBeNull();
    expect(result!.steps).toEqual(["Only Node"]);
  });
});
