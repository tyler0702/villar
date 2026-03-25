export interface MermaidNode {
  id: string;
  label: string;
}

export interface MermaidEdge {
  from: string;
  to: string;
}

export interface FlowchartData {
  nodes: MermaidNode[];
  edges: MermaidEdge[];
}

export interface LinearSteps {
  steps: string[];
}

/**
 * Parse a mermaid flowchart definition into nodes and edges.
 * Only handles simple flowchart syntax (graph TD/LR, flowchart TD/LR).
 */
export function parseFlowchart(code: string): FlowchartData | null {
  const lines = code.trim().split("\n");
  if (lines.length === 0) return null;

  // Check first line is flowchart/graph declaration
  const firstLine = lines[0].trim().toLowerCase();
  if (!firstLine.match(/^(flowchart|graph)\s+(td|tb|lr|rl|bt)/)) {
    return null;
  }

  const nodes = new Map<string, MermaidNode>();
  const edges: MermaidEdge[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("%%") || line.startsWith("style") || line.startsWith("class")) {
      continue;
    }

    // Match edge patterns: A --> B, A-->B, A --- B, A ==> B, A -.-> B, etc.
    // Also with labels: A -->|text| B, A -- text --> B
    const edgeMatch = line.match(
      /^(\w+)(?:\[([^\]]*)\]|{([^}]*)}|\(([^)]*)\))?\s*(?:--+>|==+>|-\.+->|--+)\s*(?:\|[^|]*\|\s*)?(\w+)(?:\[([^\]]*)\]|{([^}]*)}|\(([^)]*)\))?/
    );

    if (edgeMatch) {
      const fromId = edgeMatch[1];
      const fromLabel = edgeMatch[2] || edgeMatch[3] || edgeMatch[4] || fromId;
      const toId = edgeMatch[5];
      const toLabel = edgeMatch[6] || edgeMatch[7] || edgeMatch[8] || toId;

      if (!nodes.has(fromId)) {
        nodes.set(fromId, { id: fromId, label: fromLabel });
      } else if (fromLabel !== fromId && nodes.get(fromId)!.label === fromId) {
        nodes.get(fromId)!.label = fromLabel;
      }

      if (!nodes.has(toId)) {
        nodes.set(toId, { id: toId, label: toLabel });
      } else if (toLabel !== toId && nodes.get(toId)!.label === toId) {
        nodes.get(toId)!.label = toLabel;
      }

      edges.push({ from: fromId, to: toId });
      continue;
    }

    // Match node definitions: A[label], B{label}, C(label)
    const nodeMatch = line.match(/^(\w+)(?:\[([^\]]*)\]|{([^}]*)}|\(([^)]*)\))/);
    if (nodeMatch) {
      const id = nodeMatch[1];
      const label = nodeMatch[2] || nodeMatch[3] || nodeMatch[4] || id;
      if (!nodes.has(id)) {
        nodes.set(id, { id, label });
      } else {
        nodes.get(id)!.label = label;
      }
    }
  }

  if (nodes.size === 0) return null;

  return { nodes: Array.from(nodes.values()), edges };
}

/**
 * Check if a flowchart is linear (no branching, no merging, no loops).
 * Returns ordered steps if linear, null otherwise.
 */
export function checkLinear(data: FlowchartData): LinearSteps | null {
  const { nodes, edges } = data;

  // Build adjacency info
  const outDegree = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const nextNode = new Map<string, string>();

  for (const node of nodes) {
    outDegree.set(node.id, 0);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    outDegree.set(edge.from, (outDegree.get(edge.from) || 0) + 1);
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    nextNode.set(edge.from, edge.to);
  }

  // Check conditions: all out-degree <= 1, all in-degree <= 1
  for (const [, deg] of outDegree) {
    if (deg > 1) return null;
  }
  for (const [, deg] of inDegree) {
    if (deg > 1) return null;
  }

  // Find start node (in-degree 0)
  const startNodes = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0);
  if (startNodes.length !== 1) return null;

  // Walk the chain
  const steps: string[] = [];
  const visited = new Set<string>();
  let current: string | undefined = startNodes[0].id;

  while (current) {
    if (visited.has(current)) return null; // Loop detected
    visited.add(current);

    const node = nodes.find((n) => n.id === current);
    if (node) steps.push(node.label);

    current = nextNode.get(current);
  }

  // Ensure all nodes are visited (no disconnected nodes)
  if (visited.size !== nodes.length) return null;

  return { steps };
}
