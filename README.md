# villar

AI-generated Markdown reader. Restructures long md files into a card-based reading experience.

## Features

- **H2 Card View** - Splits documents by H2 headings into navigable cards
- **H3+ Outline** - Sub-headings displayed in sidebar under the active card
- **Focus Mode** - Dims inactive cards to reduce visual noise
- **TL;DR Cards** - Auto-generated summaries per section (rule-based)
- **Mermaid Step UI** - Linear flowcharts rendered as step indicators
- **Code Copy Button** - One-click copy on all code blocks
- **Auto Collapse** - Long lists and code blocks are folded by default
- **Image Support** - Relative image paths resolved to local files
- **Multi-Tab** - Open multiple files with session restore and drag & drop
- **Full-Text Search** - Cmd+K to search across all files in folder
- **File Watcher** - Live reload when source files change
- **Theme Gallery** - 10+ built-in color themes, VSCode theme import

## Design Principles

- **Read-only** - Source files are never modified
- **Local-only** - No external network requests
- **Fallback-first** - When conversion fails, show original content

## Tech Stack

| Layer | Choice |
|---|---|
| Desktop | Tauri v2 (Rust backend) |
| Frontend | React + TypeScript |
| Markdown | remark + rehype (custom plugins) |
| Mermaid | mermaid.js + LRU cache |
| Styling | Tailwind CSS v4 |
| State | Zustand |

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Run tests
npm test

# Production build
npm run tauri build
```

### Prerequisites

- Node.js >= 20
- Rust toolchain (stable)
- macOS / Windows / Linux

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Arrow Left/Right` | Navigate between cards |
| `Home` / `End` | Jump to first/last card |
| `F` | Toggle focus mode |
| `Cmd+K` | Search across files |
| `Cmd+F` | Find in current document |
| `Cmd+,` | Open settings |

## Project Structure

```
src/
  components/     # React components
    CardView/     # Card display, TL;DR, Mermaid, SectionContent
    Header/       # App header with controls
    Sidebar/      # File tree + H3 outline
    TabBar/       # Multi-tab bar
    FindBar/      # In-page find
    Search/       # Full-text search panel
    Settings/     # Settings sidebar
    __tests__/    # Component tests (TldrCard, Outline, FileTree, TabBar)
  hooks/          # Custom React hooks
  plugins/        # remark/rehype custom plugins
    remark-section.ts   # H2-based document splitting
    remark-tldr.ts      # TL;DR extraction
    remark-collapse.ts  # Auto-collapse for long content
    mermaid-linear.ts   # Linear flowchart detection
    __tests__/          # Plugin + performance tests
  stores/         # Zustand state management
src-tauri/
  src/lib.rs      # Rust commands (file ops, watcher, logging)
docs/
  mvp.md          # MVP specification
```
