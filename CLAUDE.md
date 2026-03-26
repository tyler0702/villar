# CLAUDE.md - Development Guide for villar

## What is villar?

A Tauri v2 desktop app that re-renders AI-generated Markdown into a card-based reading UI. Read-only, local-only, never modifies source files.

## Quick Commands

```bash
npm run tauri dev    # Dev server + Tauri window
npm test             # Run vitest (unit + performance tests)
npm run tauri build  # Production build
```

## Architecture

### Frontend (React + TypeScript)

The Markdown pipeline: `remark-parse` -> `remark-gfm` -> `remark-section` (custom) -> `remark-rehype` -> `rehype-highlight` -> `rehype-stringify`, then `collapseHtml` post-processing. Relative image paths are resolved to Tauri asset URLs via `convertFileSrc`.

Key custom plugins in `src/plugins/`:
- `remark-section.ts` - H2-based splitting, stores sections in tree.data.sections
- `remark-tldr.ts` - Extracts summary/points/keywords/conclusion from section children
- `mermaid-linear.ts` - Parses flowchart text, checks if graph is linear (all degrees <= 1)
- `remark-collapse.ts` - HTML post-processing to wrap long lists/code in `<details>`

Additional frontend features:
- H3+ sub-heading outline in sidebar (extracted per section, shown under active card)
- Code copy button injected into `<pre>` blocks by `SectionContent.tsx`
- Multi-tab support with session restore, drag & drop, and file diff indicators
- Full-text search (Cmd+K) and in-page find (Cmd+F)
- VSCode theme import and 10+ built-in color themes

State is managed via Zustand (`src/stores/useAppStore.ts`).

### Backend (Rust / Tauri)

All in `src-tauri/src/lib.rs`:
- `list_md_files` - Recursively lists .md files as an `FsNode` tree (name, path, is_dir, children)
- `read_file` - Reads file content
- `watch_folder` - Uses `notify` crate with 300ms debounce, emits `file-changed` and `tree-changed` events
- `write_log` - Appends JSONL metrics to app log directory

### Mermaid Handling

Mermaid code blocks are extracted before HTML rendering (replaced with placeholders). `SectionContent.tsx` splits the HTML at placeholders and renders `MermaidBlock` components. Each block tries: linear step UI -> mermaid.js diagram -> raw text fallback.

## Implementation Constraints (from MVP spec)

- H2-only splitting (no H3/length-based dynamic splits, except paragraph rescue for no-H2 docs)
- Mermaid: flowchart linear only (no sequence/class/state diagrams)
- TL;DR: rule-based only (no AI/API calls)
- No react-virtual (add when card count becomes a problem)
- Never write to source files

## Testing

Plugin tests in `src/plugins/__tests__/` (5 files): remark-section, remark-tldr, remark-collapse, mermaid-linear, performance.
Component tests in `src/components/__tests__/` (4 files): TldrCard, Outline, FileTree, TabBar.

Performance tests verify the pipeline stays within budget:
- Full pipeline: < 500ms for 50KB+ documents
- Section splitting: < 50ms
- TL;DR per section: < 10ms
- Mermaid linear check: < 5ms

## Rust PATH Note

Rust toolchain is at `~/.rustup/toolchains/stable-aarch64-apple-darwin/bin/`, symlinked to `~/.cargo/bin/` which is in PATH via `~/.zshrc`.
