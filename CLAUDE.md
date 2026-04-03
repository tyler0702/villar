# CLAUDE.md - Development Guide for villar

## What is villar?

A Tauri v2 desktop app that re-renders AI-generated Markdown into a card-based reading UI. Read-only, local-only, never modifies source files.

## Quick Commands

```bash
npm run tauri dev    # Dev server + Tauri window
npm test             # Run vitest (96 unit + component + performance tests)
npm run test:e2e     # Run Playwright E2E tests (69 tests, needs dev server)
npm run tauri build  # Production build
```

## Development Rules

### Before Every Commit
1. `npx tsc --noEmit` — TypeScript must pass with 0 errors
2. `npm test` — All 96 unit tests must pass
3. If Tauri config or Rust changed: `cargo check --manifest-path src-tauri/Cargo.toml`

### Before Every Release
1. All 3 checks above
2. `npm run test:e2e` — All 69 E2E tests must pass
3. **Must run `npm run tauri dev` and manually verify the app launches** — cargo check cannot detect runtime plugin config errors (learned from v0.2.1 crash)
4. Update CHANGELOG.md
5. Use `/release` skill for the full release flow

### Tauri Plugin Changes
- When adding a Tauri plugin (`lib.rs` + `Cargo.toml`), **always** add the corresponding config in `tauri.conf.json` and permissions in `capabilities/default.json`
- **Always** run `npm run tauri dev` to verify the app starts — `cargo check` does NOT catch missing plugin config

### i18n (Translations)
- **All 10 locales must be updated simultaneously**: en, ja, zh-TW, zh-CN, ko, ar, es, de, ms, vi
- Never add a key to only EN/JA — always all 10
- When delegating to workers, explicitly state "全10言語の翻訳も忘れずに"
- Reference: `src/i18n/locales/en.ts` has all keys

### CSS Zoom Awareness
- Font scale is applied via `style={{ zoom }}` on the main content area
- **Never use relative/absolute positioning with coordinate calculations inside zoomed elements** — coordinates will be wrong at non-100% zoom
- For overlay elements (Reading Ruler, modals): place them **outside** the zoom container and use `position: fixed` with `e.clientY`/`e.clientX` directly
- Use `data-ruler-bounds` on the zoom-outside wrapper to get correct bounds

### Worker Delegation (Hive)
- Always include the base commit hash in task messages
- Describe the current state of files being modified (key variables, existing functions)
- Include acceptance criteria: "tsc, npm test がパスすることを確認してコミット"
- After merge, always resolve conflicts by keeping both sides' changes

### Feature Development
- New UX features: prototype first → user confirmation → full implementation
- Do NOT batch-implement many features without intermediate user testing
- Features that change card interaction (scroll, click, navigation) are high-risk — test thoroughly

### GitHub API Usage
- **Always use `gh api` instead of `curl` for GitHub API calls** — `gh` uses authenticated tokens (5000 req/hr), `curl` is unauthenticated (60 req/hr)
- Example: `gh api repos/tyler0702/villar/releases/latest` instead of `curl https://api.github.com/...`
- This prevents rate limiting that affects the user's browser (same IP)

### Dev Server Management
- Always kill existing process before starting: `lsof -ti:1420 | xargs kill -9 2>/dev/null; sleep 1;`
- If app closes immediately, check the output file for errors

### Releases
- Use semantic versioning: breaking=major, features=minor, fixes=patch
- Do NOT release multiple patches in succession for non-critical fixes — batch them
- Critical fixes (app won't launch) get immediate hotfix releases
- Release workflow auto-updates Homebrew Cask via `update-homebrew` job

### File Operations
- Before creating directories, check if they already exist with `ls`
- Before moving files, verify the destination path

### Security
- Never ask users to paste passwords/tokens in chat
- Guide them to use `gh secret set` or direct GitHub Settings UI
- Certificates and keys in `docs/` are gitignored — never commit them

## Architecture

### Frontend (React 19 + TypeScript)

**Markdown pipeline:** `remark-parse` → `remark-gfm` → `remark-section` (custom) → `remark-rehype` → `rehype-highlight` → `rehype-stringify`, then `collapseHtml` → `addCopyButtonsToHtml` → `addTableWrapToHtml` → `resolveImagePaths` → `addHeadingAnchors` → `applySpeedRead` (conditional) post-processing.

**Custom plugins** in `src/plugins/`:
- `remark-section.ts` - H2-based splitting. H2-less docs rescued by paragraph splitting.
- `remark-tldr.ts` - TextRank + rule-based extraction (summary/points/keywords/conclusion).
- `mermaid-linear.ts` - Parses flowchart, checks if linear (all degrees <= 1, no loops).
- `remark-collapse.ts` - Returns `{html, collapsed[]}` with placeholder markers. React `CollapsibleBlock` handles toggle.

**State** managed via Zustand (`src/stores/useAppStore.ts`):
- UI: tree, focusMode, settingsOpen, aboutOpen, bookmarks, previewImage, cardScrollRef, cardNavigated
- Tabs: `tabs[]`, `activeTabIndex`, per-tab content/scroll/cardIndex/changedSections
- Settings: persisted to localStorage (font, scale, lineHeight, paragraphSpacing, letterSpacing, contentWidth, theme, speedRead, readingRuler, etc.)
- Navigation: `navigateToCard(index)` sets `cardNavigated=true` + calls `setActiveCardIndex` — used by Prev/Next/Outline/Thumbnails/Keyboard to always scroll. Direct card clicks use `setActiveCardIndex` without the flag to preserve the "don't scroll if card top is hidden" behavior.

### Backend (Rust / Tauri)

All in `src-tauri/src/lib.rs`:
- `list_md_files` - Returns `FsNode` tree. SKIP_DIRS, MAX_DEPTH=8, MAX_FILES=5000.
- `read_file` - Reads file content
- `get_file_meta` - Returns created/updated timestamps
- `search_files` - Case-insensitive grep across all .md files, capped at 100 results
- `watch_folder` - Uses `notify` crate with 300ms debounce, emits `file-changed` and `tree-changed` events
- `write_log` - Appends JSONL metrics to app log directory
- `update_menu` - Rebuilds native menu with i18n labels
- Custom menu bar: villar (About), File, Edit, View, Window, Help (Check for Updates)

### Tauri Plugins
- `tauri-plugin-dialog` - File/folder open dialogs
- `tauri-plugin-fs` - File system access
- `tauri-plugin-opener` - Open URLs in external browser
- `tauri-plugin-updater` - In-app auto-update (requires `plugins.updater` in tauri.conf.json + `latest.json` in releases)
- `tauri-plugin-process` - App relaunch after update

### Theme System

46 built-in color themes with 18 CSS custom properties (`--vs-bg`, `--vs-fg`, `--vs-accent`, etc.). All themes pass WCAG AA contrast ratios (body 4.5:1, headings/links/blockquotes 3.0:1). `useVscodeTheme` hook sets properties on `<html>`. Dark/light auto-detected from background luminance.

### Key Patterns

- **CSS variables for theming** — `[data-vscode-theme] .vs-card { ... }` uses `var(--vs-*)` properties
- **Reading settings via CSS variables** — `--reading-line-height`, `--reading-paragraph-spacing`, `--reading-letter-spacing` on `.reading-root`
- **Copy buttons embedded in HTML** — `addCopyButtonsToHtml` injects `<button data-copy>` into `<pre>`, event delegation in `HtmlBlock`
- **Collapse via React** — Not HTML `<details>` (broken in Tauri WebView). Uses placeholder markers + `CollapsibleBlock` component.
- **Font scale via CSS zoom** — Applied to main content area via `style={{ zoom }}`. Header/settings excluded. Reading Ruler is placed OUTSIDE zoom container.
- **Card click vs navigation scroll** — `navigateToCard()` (Prev/Next/Outline/Thumbnails/Keyboard) always scrolls. Direct card click only scrolls if card top is visible (not hidden above viewport).
- **Links open in external browser** — `HtmlBlock` intercepts `<a>` clicks and uses `@tauri-apps/plugin-opener`
- **Print CSS** — `@media print` overrides all `--vs-*` variables to white/black, hides UI chrome. Theme-agnostic PDF output.

## Testing

### Unit Tests (vitest) - 96 tests
- `src/plugins/__tests__/` - remark-section (10), remark-tldr (10), mermaid-linear (16), remark-collapse (7), performance (6), copy-button (5)
- `src/components/__tests__/` - TldrCard, Outline, FileTree, TabBar (21 tests + more)

### E2E Tests (Playwright) - 69 tests
- `e2e/app.spec.ts` - Empty state, settings, navigation, bookmarks, PDF, keyboard, image preview, onboarding, update banner
- Tauri API mocked via `e2e/fixtures/tauri-mock.js`

### Performance Budget (relaxed for CI)
- Full pipeline: < 1000ms for 50KB+ documents
- Section splitting: < 50ms
- TL;DR per section: < 30ms
- Mermaid linear check: < 5ms

### CI Pipeline
- `test` job: tsc + vitest + playwright
- `build-check` job: `tauri build --debug` — catches plugin config errors that cargo check misses

## Implementation Constraints

- H2-only splitting (no dynamic splits, except paragraph rescue for no-H2 docs)
- TL;DR: rule-based + TextRank only (no AI/API calls)
- Never write to source files
- Local-only: no network requests from the app (except update check)

## Rust PATH Note

Rust toolchain is at `~/.rustup/toolchains/stable-aarch64-apple-darwin/bin/`, symlinked to `~/.cargo/bin/` which is in PATH via `~/.zshrc`.
