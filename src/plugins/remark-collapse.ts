export interface CollapseOptions {
  listThreshold: number;
  codeThreshold: number;
}

const DEFAULTS: CollapseOptions = { listThreshold: 5, codeThreshold: 20 };

/**
 * Post-process HTML to wrap long lists and code blocks in <details> elements.
 */
export function collapseHtml(html: string, options?: Partial<CollapseOptions>): string {
  const { listThreshold, codeThreshold } = { ...DEFAULTS, ...options };

  // Wrap long <ul>/<ol> lists
  html = html.replace(/<(ul|ol)>([\s\S]*?)<\/\1>/g, (match, _tag, inner) => {
    const itemCount = (inner.match(/<li/g) || []).length;
    if (itemCount > listThreshold) {
      return `<details><summary>List (${itemCount} items) - click to expand</summary>${match}</details>`;
    }
    return match;
  });

  // Wrap long <pre><code> blocks
  html = html.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (match, inner) => {
    const lineCount = (inner.match(/\n/g) || []).length + 1;
    if (lineCount > codeThreshold) {
      return `<details><summary>Code (${lineCount} lines) - click to expand</summary>${match}</details>`;
    }
    return match;
  });

  return html;
}
