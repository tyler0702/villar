# CLAUDE.md - Development Guide for villar

## What is villar?

A Tauri v2 desktop app that re-renders AI-generated Markdown into a card-based reading UI. Read-only, local-only, never modifies source files.

## Quick Commands

```bash
npm run tauri dev    # Dev server + Tauri window
npm test             # Run vitest (75 unit + component + performance tests)
npm run test:e2e     # Run Playwright E2E tests (6 tests, needs dev server)
npm run tauri build  # Production build
```

## Architecture

### Frontend (React 19 + TypeScript)

**Markdown pipeline:** `remark-parse` -> `remark-gfm` -> `remark-section` (custom) -> `remark-rehype` -> `rehype-highlight` -> `rehype-stringify`, then `collapseHtml` + `addCopyButtonsToHtml` + `resolveImagePaths` post-processing.

**Custom plugins** in `src/plugins/`:
- `remark-section.ts` - H2-based splitting, stores sections in tree.data.sections. H2-less docs rescued by paragraph splitting.
- `remark-tldr.ts` - Extracts summary/points/keywords/conclusion from section children. Non-display conditions: no paragraph, <50 chars, <1 valid element.
- `mermaid-linear.ts` - Parses flowchart text, checks if graph is linear (all degrees <= 1, no loops).
- `remark-collapse.ts` - Returns `{html, collapsed[]}` with placeholder markers. React `CollapsibleBlock` handles toggle (not HTML `<details>`).

**State** managed via Zustand (`src/stores/useAppStore.ts`):
- Tab system: `tabs[]`, `activeTabIndex`, per-tab content/scroll/cardIndex
- Settings: persisted to localStorage (fontFamily, fontScale, lineHeight, contentWidth, theme, collapse thresholds, etc.)
- Session: folder path + open tabs persisted, restored on launch

### Backend (Rust / Tauri)

All in `src-tauri/src/lib.rs`:
- `list_md_files` - Returns `FsNode` tree (name, path, is_dir, children). Folders sorted before files, hidden dirs excluded.
- `read_file` - Reads file content
- `search_files` - Case-insensitive grep across all .md files, capped at 100 results
- `watch_folder` - Uses `notify` crate with 300ms debounce, emits `file-changed` and `tree-changed` events
- `write_log` - Appends JSONL metrics to app log directory

### Mermaid Handling

Mermaid code blocks are extracted before HTML rendering (replaced with placeholders). `SectionContent.tsx` splits the HTML at placeholders and renders `MermaidBlock` components. Each block tries: linear step UI -> mermaid.js diagram -> raw text fallback. Mermaid.js is dynamically imported (~1MB, loaded on demand). Theme colors applied via mermaid "base" theme + custom themeVariables.

### Theme System

25 built-in color themes applied via CSS custom properties (`--vs-bg`, `--vs-fg`, `--vs-accent`, etc.). `useVscodeTheme` hook sets properties on `<html>`. Dark/light auto-detected from background luminance. Theme affects: header, sidebar, cards, TL;DR, Mermaid diagrams, borders, selections.

## Implementation Constraints (from MVP spec)

- H2-only splitting (no H3/length-based dynamic splits, except paragraph rescue for no-H2 docs)
- TL;DR: rule-based only (no AI/API calls)
- No react-virtual (add when card count becomes a problem)
- Never write to source files

## Testing

### Unit Tests (vitest) - 75 tests
- `src/plugins/__tests__/` - remark-section (10), remark-tldr (10), mermaid-linear (16), remark-collapse (7), performance (6), copy-button (5)
- `src/components/__tests__/` - TldrCard, Outline, FileTree, TabBar (21 tests)

### E2E Tests (Playwright) - 6 tests
- `e2e/app.spec.ts` - Empty state, settings panel, markdown rendering, card navigation
- Tauri API mocked via `e2e/fixtures/tauri-mock.js`
- Run with `npm run test:e2e`

### Performance Budget
- Full pipeline: < 500ms for 50KB+ documents
- Section splitting: < 50ms
- TL;DR per section: < 10ms
- Mermaid linear check: < 5ms

## Key Patterns

- **CSS variables for theming** - `[data-vscode-theme] .vs-card { ... }` pattern
- **Reading settings via CSS variables** - `--reading-font`, `--reading-line-height` on `.reading-root`
- **Copy buttons embedded in HTML** - `addCopyButtonsToHtml` injects `<button data-copy>` into `<pre>`, event delegation in `HtmlBlock`
- **Collapse via React** - Not HTML `<details>` (broken in Tauri WebView). Uses placeholder markers + `CollapsibleBlock` component.
- **Font scale via CSS zoom** - Applied to sidebar + main via `style={{ zoom }}`, header/settings excluded

## Rust PATH Note

Rust toolchain is at `~/.rustup/toolchains/stable-aarch64-apple-darwin/bin/`, symlinked to `~/.cargo/bin/` which is in PATH via `~/.zshrc`.
