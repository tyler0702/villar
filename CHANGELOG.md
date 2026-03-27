# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] - 2026-03-27

### Added

- **H2-based card view** with Prev/Next navigation and position indicator (e.g. "2 / 5 - 40%")
- **Focus mode** dims inactive cards (configurable opacity 10-50%, toggle with F key)
- **TL;DR cards** with rule-based extraction (summary, bullet points, keywords, conclusion) and TextRank summarization for longer sections
- **Multilingual conclusion markers** for TL;DR (Japanese, English, Chinese, Korean)
- **Mermaid diagram support** with linear flowchart-to-step-UI conversion, mermaid.js fallback, and raw text fallback
- **46 color themes** including Dracula, Nord, Tokyo Night, Catppuccin, Rosé Pine, Gruvbox, Material, Night Owl, Vitesse, and more
- **10-language i18n** for the entire UI
- **Multi-tab system** with drag-and-drop reordering and right-click context menu (Close Others, Open in Split Right)
- **Full-text search** across all markdown files (Rust-side grep, Cmd+K)
- **In-document search** with highlight and match count (Cmd+F)
- **Folder tree sidebar** with recursive directory listing and file selection
- **Outline sidebar** showing H1 document title and H2/H3 section headings with click-to-navigate
- **Drag & drop** file and folder opening
- **Session restore** preserving folder path and open tabs across restarts
- **Font customization** with 46 font options (sans-serif, serif, monospace) and adjustable scale (50-150%), line height, and content width
- **Card thumbnails** in the navigation footer for quick section jumping
- **File date display** (Created / Updated) from filesystem metadata
- **Code copy button** on all code blocks with one-click clipboard copy
- **Auto-collapse** for long lists (>5 items) and code blocks (>20 lines) with expand/collapse toggle
- **Custom menu bar** with native Tauri menu integration (Overlay title bar with drag support)
- **VS Code-style tab dragging** with visual tab follow and neighbor shift animation
- **Read tracking** with checkmark indicators for visited sections
- **Change detection** highlighting modified sections with amber ring after file updates
- **Keyboard shortcuts** for navigation (arrows, Home/End), zoom (Cmd+/-, Cmd+0), focus (F), search (Cmd+K), find (Cmd+F), close tab (Cmd+W), settings (Cmd+,)
- **GFM support** (tables, strikethrough, task lists) via remark-gfm
- **Syntax highlighting** for code blocks via rehype-highlight
- **E2E test suite** (51 Playwright tests) and unit tests (96 vitest tests) with Tauri API mocking
- **Performance budget tests** ensuring <500ms pipeline, <50ms section splitting, <10ms TL;DR per section

### Changed

- **Removed Split view** due to architecture constraints (may return in a future version)
- **Refactored App.tsx** from 187 lines to 80 lines by extracting useFileWatcher and useMenuActions hooks
- **Refactored useAppStore** from 334 lines to 71 lines using Zustand slice pattern (settingsSlice, tabSlice)

### Fixed

- **IME input handling** in FindBar preventing premature search during Japanese/Chinese composition
- **Arrow key navigation** no longer interferes with text input fields
- **Theme dark mode detection** working correctly with Tailwind CSS v4
- **Code collapse regression** where addCopyButtonsToHtml broke the collapse regex by inserting elements between `<pre>` and `<code>`
