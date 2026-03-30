# Contributing to villar

Thank you for your interest in contributing to villar! This guide covers everything you need to get started.

## Prerequisites

- **Node.js** >= 20
- **Rust** stable toolchain
- **Platform**: macOS, Windows, or Linux

## Setup

```bash
git clone https://github.com/tyler0702/villar.git
cd villar
npm install
npm run tauri dev
```

## Project Structure

```
src/
  components/       # React UI components (CardView, Header, Sidebar, TabBar, etc.)
  hooks/            # Custom React hooks (useMarkdown, useTheme, useKeyboard, etc.)
  plugins/          # Custom remark/rehype plugins (section splitting, TL;DR, collapse, mermaid)
  stores/           # Zustand state management
  themes/           # Built-in color themes and font presets
  i18n/
    translations.ts # Language registry and TranslationDict type
    useTranslation.ts
    locales/        # Per-language translation files (en.ts, ja.ts, zh-TW.ts, etc.)
src-tauri/
  src/lib.rs        # Rust commands (file tree, watcher, search, logging)
e2e/
  app.spec.ts       # Playwright E2E tests
  fixtures/         # Tauri API mocks for E2E
docs/               # Specifications and design documents
```

## Development Workflow

### Branch Naming

Use prefixed branch names:

- `feature/description` — new functionality
- `fix/description` — bug fixes
- `refactor/description` — code restructuring
- `docs/description` — documentation changes

### Commit Messages

Follow the `type: description` format:

```
feat: add keyboard shortcut for card navigation
fix: prevent crash when markdown has no H2 headings
refactor: split translations into per-locale files
docs: update CONTRIBUTING.md with testing section
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Ensure all tests pass (see Testing below)
5. Open a PR against `main`
6. Address review feedback

## Testing

All three checks must pass before a PR can be merged:

```bash
# Unit tests (vitest) — 96 tests
npm test

# E2E tests (Playwright) — 69 tests
# Requires dev server running or will auto-start
npm run test:e2e

# Type checking
npm run typecheck    # or: npx tsc --noEmit
```

## Code Style

- **TypeScript** strict mode — no `any` unless absolutely necessary
- **React** functional components only — no class components
- **State management** via Zustand (`src/stores/useAppStore.ts`)
- **Styling** with Tailwind CSS v4 — utility classes, no CSS modules
- **i18n** — all user-facing text must use `useTranslation()` hook:
  ```tsx
  const t = useTranslation();
  return <span>{t("settings.title")}</span>;
  ```
- **Source files are read-only** — villar never writes to the user's markdown files

## Adding a New Theme

Themes are defined in `src/themes/builtin.ts`. Each theme implements the `VscodeThemeColors` interface with 18 color tokens:

```typescript
// src/themes/builtin.ts
{
  name: "My Theme",
  bg: "#1e1e2e",          // App background
  fg: "#cdd6f4",          // Default text
  accent: "#89b4fa",      // Accent / primary color
  sidebarBg: "#181825",   // Sidebar background
  sidebarFg: "#cdd6f4",   // Sidebar text
  editorBg: "#1e1e2e",    // Card / editor background
  editorFg: "#cdd6f4",    // Card / editor text
  border: "#313244",      // Border color
  selectionBg: "#45475a", // Selection highlight
  headingColor: "#f38ba8",// Heading text
  linkColor: "#89b4fa",   // Link text
  codeBg: "#181825",      // Code block background
  codeFg: "#a6e3a1",      // Code block text
  blockquoteBorder: "#585b70", // Blockquote left border
  blockquoteFg: "#a6adc8",    // Blockquote text
  tableBorder: "#313244",     // Table border
  tableHeaderBg: "#181825",   // Table header background
}
```

Add your theme object to the `BUILTIN_THEMES` array and it will appear in the Settings > Color Theme gallery.

## Adding a New Language

1. Create a locale file at `src/i18n/locales/{code}.ts`:

   ```typescript
   import type { TranslationDict } from "../translations";

   export const xx: TranslationDict = {
     "settings.title": "...",
     // ... translate all keys from en.ts
   };
   ```

2. Import and register it in `src/i18n/translations.ts`:

   ```typescript
   import { xx } from "./locales/xx";

   // Add to the translations record:
   export const translations: Record<string, TranslationDict> = {
     // ... existing languages
     xx,
   };
   ```

3. Add the language to the `LANGUAGES` array in the same file:

   ```typescript
   export const LANGUAGES = [
     // ... existing entries
     { code: "xx", label: "Language Name" },
   ] as const;
   ```

Use `src/i18n/locales/en.ts` as the reference for all translation keys. Missing keys will fall back to English automatically.
