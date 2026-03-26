<p align="center">
  <img src="docs/logo.png" alt="villar" width="180" />
</p>

<h1 align="center">villar</h1>

<p align="center">AI-generated Markdown reader. Restructures long md files into a card-based reading experience.</p>

## Features

### Reading Experience
- **H2 Card View** - Splits documents by H2 headings into navigable cards
- **Focus Mode** - Dims inactive cards (configurable opacity)
- **TL;DR Cards** - Auto-generated summaries per section (rule-based)
- **Reading Progress** - Scroll-based progress bar + section read marks
- **Split View** - View two files side by side

### Markdown Support
- **GFM** - Tables, task lists, strikethrough, autolinks
- **Mermaid** - Flowchart (linear step UI + diagram), sequence, class diagrams
- **Code Highlight** - Syntax highlighting with copy button
- **Auto Collapse** - Long lists and code blocks folded by default
- **Image Preview** - Local images resolved and displayed

### File Management
- **Folder Tree** - Hierarchical file/folder sidebar with live updates
- **Multi-Tab** - Open multiple files with tab bar
- **Full-Text Search** - Cmd+K to search across all files
- **In-Document Search** - Cmd+F to find within current document
- **Drag & Drop** - Drop files or folders to open
- **Session Restore** - Reopens last folder and files on launch
- **File Watcher** - Live reload when source files change externally

### Customization
- **25 Color Themes** - Dracula, Nord, Tokyo Night, Catppuccin, Gruvbox, and more
- **11 Font Families** - Sans-serif, serif, and monospace options
- **Font Scale** - 50%-150% zoom for content area
- **Line Height** - 100%-250% adjustable
- **Content Width** - Narrow, medium, or wide layout
- **Settings Sidebar** - All options accessible via Cmd+, or gear icon

### Window
- **Overlay Title Bar** - Themed header with native macOS traffic lights
- **Resizable Sidebars** - Drag to resize file tree and settings panel
- **Diff Indicators** - Changed sections highlighted on external file update

## Design Principles

- **Read-only** - Source files are never modified
- **Local-only** - No external network requests
- **Fallback-first** - When conversion fails, show original content

## Tech Stack

| Layer | Choice |
|---|---|
| Desktop | Tauri v2 (Rust backend) |
| Frontend | React 19 + TypeScript |
| Markdown | remark + rehype + remark-gfm (custom plugins) |
| Mermaid | mermaid.js (dynamic import + LRU cache) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Unit Tests | Vitest (75 tests) |
| E2E Tests | Playwright (6 tests) |

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Run unit tests
npm test

# Run E2E tests (needs dev server running)
npm run test:e2e

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
| `Cmd+K` | Full-text search |
| `Cmd+F` | Find in document |
| `Cmd+W` | Close tab |
| `Cmd+,` | Open settings |

## Project Structure

```
src/
  components/
    CardView/       # Card display, TL;DR, Mermaid, SectionContent
    Header/         # Themed header with window controls
    Sidebar/        # File tree + outline
    TabBar/         # Multi-tab navigation
    FindBar/        # In-document search
    Search/         # Full-text search modal
    Settings/       # Settings right sidebar
  hooks/            # useMarkdown, useTheme, useKeyboard, useDragDrop, etc.
  plugins/          # Custom remark/rehype plugins
    remark-section.ts   # H2-based document splitting
    remark-tldr.ts      # TL;DR extraction
    remark-collapse.ts  # Auto-collapse with React markers
    mermaid-linear.ts   # Linear flowchart detection
  stores/           # Zustand state management
  themes/           # 25 built-in color themes + 11 font presets
src-tauri/
  src/lib.rs        # Rust commands (file tree, watcher, search, logging)
e2e/                # Playwright E2E tests
docs/
  mvp.md            # MVP specification
```
