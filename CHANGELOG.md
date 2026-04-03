# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.4.0] - 2026-04-03

### Added
- **Raw Markdown view** — Toggle between card view and raw source with "Raw" button
- **Copy All** — One-click copy of entire markdown source
- **Keyboard integration** — Arrow keys/Home/End/F disabled in raw mode (browser default scroll)
- **Outline integration** — Clicking outline items scrolls to H2 position in raw view
- **Menu integration** — Card navigation menu items disabled in raw mode
- **Daily download stats** — GitHub Actions cron job tracking downloads per platform
- **CLAUDE.md** — Development rules and architecture docs added to repository

### Changed
- Raw mode state stored in Zustand (accessible from keyboard, menu, outline hooks)

### Fixed
- Thin scrollbar styling (6px overlay, hover to reveal)
- Text selection and copy in card view (card click no longer blocks selection)
- Reading Ruler zoom offset (moved outside zoom container, uses fixed positioning)

## [0.3.0] - 2026-03-30

### Added
- **Speed Read** — Bold word prefixes for faster scanning (Bionic Reading style, OFF by default)
- **Reading Ruler** — Highlight bar follows cursor to guide reading (OFF by default)
- **Auto-update** — In-app download, install, and relaunch
- **Crash reporting** — Error Boundary + global error logger
- **8 new E2E tests** (69 total)
- **GitHub Issues templates** (bug report + feature request)
- **Homebrew Cask** — `brew tap tyler0702/tap && brew install --cask villar`
- **CHANGELOG.md** for all releases

### Changed
- Default paragraph spacing increased from 100% to 150% (WCAG recommendation)
- 14 theme color contrast ratios fixed to meet WCAG AA
- CI now includes Tauri debug build to catch plugin config errors

### Fixed
- Updater plugin crash on launch (missing tauri.conf.json config)

## [0.2.0] - 2026-03-28

### Added
- **Paragraph spacing** control (settings slider, 100-300%)
- **Letter spacing** control (settings slider, -50 to 200)
- **Space/Shift+Space** page scroll within cards
- **Image click to zoom** with modal preview
- **H3 heading anchors** (hover to reveal # link)
- **Reading time estimate** per document (CJK/EN auto-detected)
- **Card position restore** on file reopen
- **Table horizontal scroll** with sticky headers
- **Link hover tooltips** showing domain for external links
- **Code block line numbers** (CSS counter-based, copy-safe)
- **Bookmarks** — pin cards with persistent localStorage storage
- **PDF export** via print dialog with clean white output
- **About villar dialog** with version info and links
- **Help menu** (About, Website, GitHub Repository)
- **macOS code signing + notarization** — no more "app is damaged"
- **Auto-update** — in-app download, install, and relaunch
- **Crash reporting** — Error Boundary + global error logger
- **Google Tag Manager** on landing page
- **Dynamic download links** — OS-detected direct downloads
- **GitHub Issues templates** (bug report + feature request)
- **8 new E2E tests** (69 total)

### Changed
- Settings panel toggles with gear button (removed X close button)
- Onboarding spotlight fixes (card + nav positioning)
- Smart card scroll (click vs navigation distinction)
- Markdown links open in external browser
- Landing page: macOS unsigned workaround note added

### Fixed
- Japanese SegmentControl buttons overflowing vertically
- Prev/Outline/Thumbnail navigation not scrolling to target card
- Print CSS: dark theme colors leaking into PDF output
- Asset protocol for local image display in markdown

## [0.1.2] - 2026-03-27

### Added
- Onboarding tutorial (7 steps with spotlight overlay)
- Update notification banner (GitHub release check)
- Onboarding + update banner E2E tests

## [0.1.1] - 2026-03-26

### Added
- Overlay title bar with drag support
- Custom menu bar with i18n support
- New window support (Cmd+Shift+N)
- H3 sub-heading outline in sidebar
- Code copy button embedded in HTML
- Image path resolution for local files

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
