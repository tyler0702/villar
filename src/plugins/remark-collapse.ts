const LIST_THRESHOLD = 5;
const CODE_LINE_THRESHOLD = 20;

/**
 * Post-process HTML to wrap long lists and code blocks in <details> elements.
 */
export function collapseHtml(html: string): string {
  // Wrap long <ul>/<ol> lists
  html = html.replace(/<(ul|ol)>([\s\S]*?)<\/\1>/g, (match, tag, inner) => {
    const itemCount = (inner.match(/<li/g) || []).length;
    if (itemCount > LIST_THRESHOLD) {
      return `<details><summary>List (${itemCount} items) - click to expand</summary>${match}</details>`;
    }
    return match;
  });

  // Wrap long <pre><code> blocks
  html = html.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (match, inner) => {
    const lineCount = (inner.match(/\n/g) || []).length + 1;
    if (lineCount > CODE_LINE_THRESHOLD) {
      return `<details><summary>Code (${lineCount} lines) - click to expand</summary>${match}</details>`;
    }
    return match;
  });

  return html;
}
