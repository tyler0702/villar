export interface CollapseOptions {
  listThreshold: number;
  codeThreshold: number;
}

const DEFAULTS: CollapseOptions = { listThreshold: 5, codeThreshold: 20 };

export const COLLAPSE_MARKER = "___COLLAPSE___";

export interface CollapsedBlock {
  type: "list" | "code";
  label: string;
  html: string;
}

/**
 * Replace long lists and code blocks with collapse markers.
 * Returns modified HTML and an array of collapsed blocks.
 */
export function collapseHtml(
  html: string,
  options?: Partial<CollapseOptions>
): { html: string; collapsed: CollapsedBlock[] } {
  const { listThreshold, codeThreshold } = { ...DEFAULTS, ...options };
  const collapsed: CollapsedBlock[] = [];

  // Wrap long <ul>/<ol> lists
  html = html.replace(/<(ul|ol)>([\s\S]*?)<\/\1>/g, (match, _tag, inner) => {
    const itemCount = (inner.match(/<li/g) || []).length;
    if (itemCount > listThreshold) {
      const idx = collapsed.length;
      collapsed.push({ type: "list", label: `List (${itemCount} items)`, html: match });
      return `<p>${COLLAPSE_MARKER}${idx}</p>`;
    }
    return match;
  });

  // Wrap long <pre><code> blocks
  html = html.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (match, inner) => {
    const lineCount = (inner.match(/\n/g) || []).length + 1;
    if (lineCount > codeThreshold) {
      const idx = collapsed.length;
      collapsed.push({ type: "code", label: `Code (${lineCount} lines)`, html: match });
      return `<p>${COLLAPSE_MARKER}${idx}</p>`;
    }
    return match;
  });

  return { html, collapsed };
}
