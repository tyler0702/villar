<p align="center">
  <img src="public/logo.png" alt="villar" width="180" />
</p>

<h1 align="center">villar</h1>

<p align="center">
  A beautiful way to read AI-generated Markdown.<br />
  Card-based, local-only, open source.
</p>

<p align="center">
  <a href="https://github.com/tyler0702/villar/actions/workflows/ci.yml"><img src="https://github.com/tyler0702/villar/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/tyler0702/villar/releases/latest"><img src="https://img.shields.io/github/v/release/tyler0702/villar" alt="Release" /></a>
  <a href="https://github.com/tyler0702/villar/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tyler0702/villar" alt="License" /></a>
  <a href="https://tyler0702.github.io/villar/"><img src="https://img.shields.io/badge/website-villar-teal" alt="Website" /></a>
</p>

<!-- TODO: Add screenshot here
<p align="center">
  <img src="docs/screenshots/hero.png" alt="villar screenshot" width="800" />
</p>
-->

## Download

**macOS** (signed & notarized):
```bash
brew tap tyler0702/tap
brew install --cask villar
```

Or download `.dmg` from [Releases](https://github.com/tyler0702/villar/releases/latest).

**Windows**: Download `.msi` or `.exe` from [Releases](https://github.com/tyler0702/villar/releases/latest).

**Linux**: Download `.AppImage` or `.deb` from [Releases](https://github.com/tyler0702/villar/releases/latest).

## Features

### Reading Experience
- **H2 Card View** — Splits documents by H2 headings into navigable cards
- **Focus Mode** — Dims inactive cards (adjustable opacity, toggle with `F`)
- **TL;DR Cards** — Auto-generated summaries per section (rule-based + TextRank)
- **Speed Read** — Bold word prefixes for faster scanning (Bionic Reading style)
- **Reading Ruler** — Cursor-following highlight bar to guide reading
- **Bookmarks** — Pin cards for later with persistent storage
- **Reading Time** — Estimated reading time per document (CJK/EN auto-detected)
- **Card Position Restore** — Remembers last viewed card when reopening files
- **Reading Progress** — Scroll-based progress bar + section read marks
- **PDF Export** — Clean white output from any theme

### Markdown Support
- **GFM** — Tables, task lists, strikethrough, autolinks
- **Mermaid** — Linear flowchart step UI + mermaid.js diagram fallback
- **Syntax Highlighting** — Code blocks with copy button and line numbers
- **Auto Collapse** — Long lists and code blocks folded by default
- **Image Preview** — Click to zoom, local image support
- **H3 Anchor Links** — Hover headings to reveal anchor links
- **Table Scroll** — Horizontal scroll with sticky headers
- **Link Tooltips** — Hover to see domain for external links

### File Management
- **Folder Tree** — Hierarchical sidebar with live updates
- **Multi-Tab** — Drag-and-drop reordering and context menu
- **Full-Text Search** — `Cmd+K` to search across all files
- **In-Document Search** — `Cmd+F` to find within current document
- **Drag & Drop** — Drop files or folders to open
- **Session Restore** — Reopens last folder and files on launch
- **File Watcher** — Live reload when source files change externally

### Customization
- **46 Color Themes** — Dracula, Nord, Tokyo Night, Catppuccin, Gruvbox, and more (all WCAG AA compliant)
- **46+ Font Families** — Including CJK fonts (Japanese, Chinese, Korean, Arabic)
- **Font Scale** — 50%-150% zoom (`Cmd+=`/`Cmd+-`)
- **Line Height** — 100%-250%
- **Letter Spacing** — Adjustable character spacing
- **Paragraph Spacing** — Adjustable paragraph gap (default 150%, research-backed)
- **Content Width** — Narrow, medium, or wide
- **10 Languages** — EN, JA, ZH-TW, ZH-CN, KO, ES, DE, VI, MS, AR

### Infrastructure
- **Auto-Update** — In-app download, install, and relaunch
- **Crash Reporting** — Error Boundary + global error logger (local logs only)
- **macOS Code Signing** — Signed and notarized, no "app is damaged" warning
- **Cross-Platform** — macOS (ARM + Intel), Windows, Linux

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Read-only** | Source files are never modified |
| **Local-only** | No network requests (except update check) |
| **Fallback-first** | When conversion fails, show original content |
| **Research-backed** | Defaults informed by readability research ([details](docs/research.md)) |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Left` / `Right` | Navigate between cards |
| `Home` / `End` | First / last card |
| `Space` / `Shift+Space` | Scroll page down / up |
| `F` | Toggle focus mode |
| `Cmd+K` | Search files |
| `Cmd+F` | Find in document |
| `Cmd+W` | Close tab |
| `Cmd+,` | Settings |
| `Cmd+=` / `Cmd+-` / `Cmd+0` | Zoom in / out / reset |
| `Cmd+Shift+N` | New window |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Desktop | Tauri v2 (Rust) |
| Frontend | React 19 + TypeScript |
| Markdown | remark + rehype (custom plugins) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Tests | Vitest (96) + Playwright (69) |

## Development

### Prerequisites
- Node.js >= 20
- Rust stable toolchain
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Setup
```bash
git clone https://github.com/tyler0702/villar.git
cd villar
npm install
npm run tauri dev
```

### Testing
```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run typecheck     # TypeScript check
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

[MIT](LICENSE)
