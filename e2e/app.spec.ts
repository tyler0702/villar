import { test, expect } from "./fixtures/test";

const SAMPLE_MD = [
  "# Document Title",
  "",
  "## Introduction",
  "",
  "This is the **first** section with some content.",
  "",
  "- Item one",
  "- Item two",
  "",
  "## Details",
  "",
  "Here are the details with `inline code`.",
  "",
  "```js",
  'console.log("hello");',
  "```",
  "",
  "## Conclusion",
  "",
  "Final thoughts on the topic.",
].join("\n");

const SAMPLE_MD_2 = [
  "# Second Document",
  "",
  "## Overview",
  "",
  "This is a second test document with enough content.",
  "",
  "## Analysis",
  "",
  "Detailed analysis section here.",
].join("\n");

// Rich document with GFM table, long list, long code, and TL;DR-worthy content
const RICH_MD = [
  "## Architecture Overview",
  "",
  "This section provides a comprehensive overview of the system architecture including all **key components** and their interactions across services.",
  "",
  "- Component A handles user authentication",
  "- Component B manages data persistence",
  "- Component C orchestrates message passing",
  "",
  "| Feature | Status | Owner |",
  "|---------|--------|-------|",
  "| Auth    | Done   | Alice |",
  "| API     | WIP    | Bob   |",
  "| UI      | Done   | Carol |",
  "",
  "```typescript",
  'const config = {',
  '  host: "localhost",',
  '  port: 3000,',
  '  debug: true,',
  '};',
  "```",
  "",
  "## Implementation Details",
  "",
  "The implementation follows standard patterns with sufficient detail for proper TL;DR generation across multiple paragraphs.",
  "",
  "- Item 1: First long list entry",
  "- Item 2: Second long list entry",
  "- Item 3: Third long list entry",
  "- Item 4: Fourth long list entry",
  "- Item 5: Fifth long list entry",
  "- Item 6: Sixth long list entry",
  "- Item 7: Seventh long list entry",
  "- Item 8: Eighth long list entry",
  "",
  "```python",
  ...Array.from({ length: 25 }, (_, i) => `line_${i + 1} = compute(${i})`),
  "```",
].join("\n");

function injectContent(md: string, name = "test.md", path = "/mock/test.md") {
  return `
    const store = window.__villarStore;
    store.getState().openTab(
      { name: ${JSON.stringify(name)}, path: ${JSON.stringify(path)} },
      ${JSON.stringify(md)}
    );
  `;
}

function openSettings() {
  return `window.__villarStore.getState().setSettingsOpen(true);`;
}

test.describe("App shell", () => {
  test("loads and shows empty state", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Open" })).toBeVisible();
    await expect(page.getByText("Open a folder, pick a file")).toBeVisible();
  });

  test("Focus button is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Focus" })).toBeVisible();
  });

  test("Settings panel opens and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByTitle("Settings (Cmd+,)").click();
    await expect(page.getByText("Font Size")).toBeVisible();
  });
});

test.describe("Markdown rendering", () => {
  test("renders section cards from markdown", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    // Cards should render H2 headings
    const cards = page.locator("main");
    await expect(cards.getByRole("heading", { name: "Introduction" }).first()).toBeVisible();
    await expect(cards.getByRole("heading", { name: "Details" }).first()).toBeVisible();
    await expect(cards.getByRole("heading", { name: "Conclusion" }).first()).toBeVisible();
  });

  test("shows card navigation footer", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    // Navigation footer should show "1 / N"
    await expect(page.getByText(/1 \/ \d+/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Prev/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Next/ })).toBeVisible();
  });

  test("navigates between cards with Next/Prev", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    // Should start at card 1
    await expect(page.getByText(/1 \/ /)).toBeVisible();

    // Click Next
    await page.getByRole("button", { name: /Next/ }).click();
    await expect(page.getByText(/2 \/ /)).toBeVisible();

    // Click Prev
    await page.getByRole("button", { name: /Prev/ }).click();
    await expect(page.getByText(/1 \/ /)).toBeVisible();
  });
});

test.describe("Theme and settings", () => {
  test("theme toggle applies dark class via theme selection", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(openSettings());

    // Select Dracula (a dark theme) — use exact name to avoid "Dracula Soft"
    const draculaBtn = page.getByRole("button", { name: "Dracula", exact: true });
    await draculaBtn.click();

    // html should have dark class (Dracula bg luminance < 0.5)
    await expect(page.locator("html")).toHaveClass(/dark/);

    // data-vscode-theme attribute should be set
    await expect(page.locator("html")).toHaveAttribute("data-vscode-theme", "Dracula");
  });

  test("font change updates --reading-font CSS variable", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(openSettings());

    // Change font to Georgia
    const fontSelect = page.locator("select").filter({ has: page.locator("optgroup[label='Serif']") });
    await fontSelect.selectOption("georgia");

    // Verify CSS variable is set
    const fontValue = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--reading-font")
    );
    expect(fontValue).toContain("Georgia");
  });

  test("language change updates UI text", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(openSettings());

    // Verify English button text — scope to header banner to avoid settings "Open"
    const header = page.getByRole("banner");
    await expect(header.getByRole("button", { name: "Open" })).toBeVisible();

    // Switch to Japanese
    const langSelect = page.locator("select").first();
    await langSelect.selectOption("ja");

    // The Open button should now show Japanese text "開く"
    await expect(header.getByRole("button", { name: "開く" })).toBeVisible();
  });

  test("font size slider changes zoom", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(openSettings());

    // Get the font scale slider (input[type=range] with min=50, max=150)
    const slider = page.locator('input[type="range"][min="50"][max="150"]');
    await expect(slider).toBeVisible();

    // Change to 120%
    await slider.fill("120");

    // Verify store has updated fontScale
    const fontScale = await page.evaluate(() =>
      (window as unknown as { __villarStore: { getState: () => { settings: { fontScale: number } } } }).__villarStore.getState().settings.fontScale
    );
    expect(fontScale).toBe(120);
  });
});

test.describe("Tab operations", () => {
  test("opens two files, switches tabs, closes tab", async ({ page }) => {
    await page.goto("/");

    // Open first file
    await page.evaluate(injectContent(SAMPLE_MD, "test.md", "/mock/test.md"));
    await expect(page.getByRole("heading", { name: "Introduction" }).first()).toBeVisible();

    // Open second file — tab bar should appear (only shows with 2+ tabs)
    await page.evaluate(injectContent(SAMPLE_MD_2, "second.md", "/mock/second.md"));
    const tabBar = page.locator("[data-tabbar]");
    await expect(tabBar).toBeVisible();

    // Second tab is active — should show Overview heading
    await expect(page.getByRole("heading", { name: "Overview" }).first()).toBeVisible();

    // Click on first tab to switch back
    await tabBar.locator("text=test").click();
    await expect(page.getByRole("heading", { name: "Introduction" }).first()).toBeVisible();

    // Close first tab via close button
    const firstTab = tabBar.locator("[data-tab-index='0']");
    await firstTab.hover();
    await firstTab.locator("[data-close]").click();

    // Tab bar should disappear (only 1 tab remaining)
    await expect(tabBar).not.toBeVisible();

    // Second doc should be showing
    await expect(page.getByRole("heading", { name: "Overview" }).first()).toBeVisible();
  });
});

test.describe("Search and Find", () => {
  test("Cmd+K opens search modal", async ({ page }) => {
    await page.goto("/");

    // Set a folder path so search button is available
    await page.evaluate(() => {
      const store = (window as unknown as { __villarStore: { getState: () => { setFolderPath: (p: string) => void; setTree: (t: unknown[]) => void } } }).__villarStore;
      store.getState().setFolderPath("/mock/folder");
      store.getState().setTree([]);
    });

    // Use keyboard shortcut to open search
    await page.keyboard.press("Meta+k");

    // Search modal should be visible with input
    await expect(page.locator("input[placeholder*='Search in all files']")).toBeVisible();

    // Type query — should show no results
    await page.locator("input[placeholder*='Search in all files']").fill("test query");
    await expect(page.getByText("No results")).toBeVisible({ timeout: 3000 });

    // Escape closes
    await page.keyboard.press("Escape");
    await expect(page.locator("input[placeholder*='Search in all files']")).not.toBeVisible();
  });

  test("Cmd+F opens FindBar and Escape closes it", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    // Open FindBar
    await page.keyboard.press("Meta+f");
    await expect(page.locator("input[placeholder*='Search in document']")).toBeVisible();

    // Escape closes FindBar
    await page.keyboard.press("Escape");
    await expect(page.locator("input[placeholder*='Search in document']")).not.toBeVisible();
  });
});

test.describe("Card thumbnails", () => {
  test("shows thumbnail buttons in footer and navigates on click", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    // Wait for cards to render
    await expect(page.getByText(/1 \/ /)).toBeVisible();

    // Thumbnail buttons have max-w-[100px] class, unique to the card thumbnail strip
    const thumbs = page.locator("button.max-w-\\[100px\\]");
    const count = await thumbs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Click "Conclusion" thumbnail and verify store index changed
    const conclusionThumb = thumbs.filter({ hasText: "Conclusion" });
    await conclusionThumb.click();

    const activeIdx = await page.evaluate(() =>
      (window as unknown as { __villarStore: { getState: () => { tabs: { activeCardIndex: number }[]; activeTabIndex: number } } })
        .__villarStore.getState().tabs[
          (window as unknown as { __villarStore: { getState: () => { activeTabIndex: number } } }).__villarStore.getState().activeTabIndex
        ].activeCardIndex
    );
    // Conclusion is the last section — should be >= 2
    expect(activeIdx).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Markdown rendering - GFM and code", () => {
  test("GFM table renders as <table>", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(RICH_MD));

    // Table should be rendered
    const table = page.locator("main table");
    await expect(table.first()).toBeVisible();

    // Check table headers
    await expect(table.first().locator("th", { hasText: "Feature" })).toBeVisible();
    await expect(table.first().locator("td", { hasText: "Alice" })).toBeVisible();
  });

  test("code block has syntax highlight classes", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(RICH_MD));

    // rehype-highlight adds hljs classes to code elements
    const codeEl = page.locator("main pre code.hljs").first();
    await expect(codeEl).toBeVisible();
  });

  test("code block has Copy button with data-copy", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(RICH_MD));

    // Copy button injected inside <pre> by addCopyButtonsToHtml
    const copyBtn = page.locator("main pre button[data-copy]").first();
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveText("Copy");
  });
});

test.describe("TL;DR card", () => {
  test("TL;DR card displays with summary text", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(RICH_MD));

    // TL;DR button should be visible
    const tldrBtn = page.locator("button", { hasText: "TL;DR" }).first();
    await expect(tldrBtn).toBeVisible();

    // Summary text should be visible (default expanded)
    await expect(page.getByText("comprehensive overview").first()).toBeVisible();
  });

  test("TL;DR toggle collapses and expands", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(RICH_MD));

    // TL;DR card container (has the rounded-xl border class)
    const tldrCard = page.locator(".rounded-xl.border").first();
    const tldrBtn = tldrCard.locator("button", { hasText: "TL;DR" });

    // TL;DR is expanded by default — content div should be visible
    const contentDiv = tldrCard.locator(".mt-3");
    await expect(contentDiv).toBeVisible();

    // Click TL;DR button to collapse
    await tldrBtn.click();

    // Content should be hidden
    await expect(contentDiv).not.toBeVisible();

    // Click again to expand
    await tldrBtn.click();
    await expect(contentDiv).toBeVisible();
  });
});

test.describe("Collapsible blocks", () => {
  test("long list is collapsed with expand button", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(RICH_MD));

    // Navigate to Implementation Details section (second section)
    await page.getByRole("button", { name: /Next/ }).click();

    // Should show collapse button for the 8-item list
    const collapseBtn = page.locator("button", { hasText: /List.*items.*click to expand/ });
    await expect(collapseBtn).toBeVisible();
  });

  test("clicking collapse button expands the content", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(RICH_MD));

    // Navigate to Implementation Details
    await page.getByRole("button", { name: /Next/ }).click();

    // The collapsed list items should NOT be visible initially
    await expect(page.getByText("Eighth long list entry")).not.toBeVisible();

    // Click to expand
    const collapseBtn = page.locator("button", { hasText: /click to expand/ }).first();
    await collapseBtn.click();

    // Now the list items should be visible
    await expect(page.getByText("Eighth long list entry")).toBeVisible();
  });
});

test.describe("Search with mock results", () => {
  test("search shows results from mock and clicking opens tab", async ({ page }) => {
    await page.goto("/");

    // Set up folder path and mock search results
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__TAURI_MOCK_DATA__ = {
        files: [],
        fileContents: { "/mock/result.md": "## Found\n\nContent from search result." },
        searchResults: [
          { file_name: "result.md", file_path: "/mock/result.md", line_number: 1, line_text: "Found matching content" },
        ],
      };
      const store = w.__villarStore as { getState: () => { setFolderPath: (p: string) => void; setTree: (t: unknown[]) => void } };
      store.getState().setFolderPath("/mock/folder");
      store.getState().setTree([]);
    });

    // Open search
    await page.keyboard.press("Meta+k");
    const searchInput = page.locator("input[placeholder*='Search in all files']");
    await expect(searchInput).toBeVisible();

    // Type query
    await searchInput.fill("Found");

    // Wait for debounced results (200ms + render)
    const resultBtn = page.locator("button", { hasText: "result" });
    await expect(resultBtn).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Found matching content")).toBeVisible();

    // Click result to open file
    await resultBtn.click();

    // Search modal should close and tab should be opened
    await expect(searchInput).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Found" }).first()).toBeVisible();
  });
});

test.describe("FindBar advanced", () => {
  test("FindBar shows Found/No match after Enter", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(RICH_MD));

    // Open FindBar
    await page.keyboard.press("Meta+f");
    const findInput = page.locator("input[placeholder*='Search in document']");
    await expect(findInput).toBeVisible();

    // Type existing text and press Enter
    await findInput.fill("Architecture");
    await findInput.press("Enter");
    await expect(page.getByText("Found")).toBeVisible();

    // Clear and type non-existing text
    await findInput.fill("xyznonexistent");
    await findInput.press("Enter");
    await expect(page.getByText("No match")).toBeVisible();

    // Escape to close
    await page.keyboard.press("Escape");
    await expect(findInput).not.toBeVisible();
  });

  test("IME compositionStart prevents search during composition", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(RICH_MD));

    // Open FindBar
    await page.keyboard.press("Meta+f");
    const findInput = page.locator("input[placeholder*='Search in document']");
    await expect(findInput).toBeVisible();

    // Simulate compositionStart
    await findInput.dispatchEvent("compositionstart");

    // Type text during composition — should not trigger search
    await findInput.fill("テスト");
    await findInput.press("Enter");

    // During composition, Enter should not trigger find (composingRef is true)
    // Verify no Found/No match indicators appear
    const foundIndicator = page.getByText("Found");
    const noMatchIndicator = page.getByText("No match");
    // Neither indicator should be visible because composing blocks Enter
    await expect(foundIndicator).not.toBeVisible({ timeout: 500 });
    await expect(noMatchIndicator).not.toBeVisible({ timeout: 500 });

    // End composition
    await findInput.dispatchEvent("compositionend");

    // Now Enter should work
    await findInput.press("Enter");
    // "テスト" is not in the document so should show No match
    await expect(noMatchIndicator).toBeVisible();
  });
});

// --- Theme & Settings Tests ---

test.describe("Theme switching", () => {
  test("switching themes changes CSS variables on html", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    // Open settings
    await page.getByTitle("Settings (Cmd+,)").click();

    // Click Dracula theme
    await page.getByText("Dracula", { exact: true }).click();
    const bgDracula = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--vs-bg").trim()
    );
    expect(bgDracula).toBe("#282a36");

    // Click Nord theme
    await page.getByText("Nord").click();
    const bgNord = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--vs-bg").trim()
    );
    expect(bgNord).toBe("#2e3440");

    // Click GitHub Light theme
    await page.getByText("GitHub Light").click();
    const bgGhLight = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--vs-bg").trim()
    );
    expect(bgGhLight).toBe("#ffffff");
  });

  test("theme is applied to card background (vs-card class)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    // Apply Dracula theme
    await page.getByTitle("Settings (Cmd+,)").click();
    await page.getByText("Dracula", { exact: true }).click();

    // Verify data-vscode-theme attribute is set
    const attrValue = await page.evaluate(() =>
      document.documentElement.getAttribute("data-vscode-theme")
    );
    expect(attrValue).toBe("Dracula");

    // Verify --vs-editor-bg is set (cards use this via CSS)
    const editorBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--vs-editor-bg").trim()
    );
    expect(editorBg).toBe("#282a36");
  });

  test("theme heading color (--vs-heading) is applied", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    await page.getByTitle("Settings (Cmd+,)").click();
    await page.getByText("Dracula", { exact: true }).click();

    const headingColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--vs-heading").trim()
    );
    expect(headingColor).toBe("#ff79c6");
  });
});

test.describe("Font settings", () => {
  test("selecting a Japanese font updates --reading-font", async ({ page }) => {
    await page.goto("/");

    // Open settings
    await page.getByTitle("Settings (Cmd+,)").click();

    // Select Noto Sans JP font
    const fontSelect = page.locator("select").first();
    // Language selector is first, font is second
    const selects = page.locator("select");
    const fontDropdown = selects.nth(1);
    await fontDropdown.selectOption("noto-sans");

    const fontValue = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--reading-font").trim()
    );
    expect(fontValue).toContain("Noto Sans");
  });
});

test.describe("Font size (zoom)", () => {
  test("Cmd+= zooms in", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    // Get initial fontScale
    const initialScale = await page.evaluate(() =>
      (window as any).__villarStore.getState().settings.fontScale
    );
    expect(initialScale).toBe(100);

    // Press Cmd+=
    await page.keyboard.press("Meta+=");
    await page.waitForTimeout(100);

    const newScale = await page.evaluate(() =>
      (window as any).__villarStore.getState().settings.fontScale
    );
    expect(newScale).toBeGreaterThan(100);
  });

  test("Cmd+- zooms out", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    await page.keyboard.press("Meta+-");
    await page.waitForTimeout(100);

    const newScale = await page.evaluate(() =>
      (window as any).__villarStore.getState().settings.fontScale
    );
    expect(newScale).toBeLessThan(100);
  });

  test("Cmd+0 resets zoom", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    // First zoom in
    await page.keyboard.press("Meta+=");
    await page.waitForTimeout(100);

    // Then reset
    await page.keyboard.press("Meta+0");
    await page.waitForTimeout(100);

    const scale = await page.evaluate(() =>
      (window as any).__villarStore.getState().settings.fontScale
    );
    expect(scale).toBe(100);
  });
});

test.describe("Line height", () => {
  test("changing line height slider updates --reading-line-height", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    await page.getByTitle("Settings (Cmd+,)").click();

    // Change line height via store (slider interaction is tricky in Playwright)
    await page.evaluate(() => {
      (window as any).__villarStore.getState().updateSettings({ lineHeight: 200 });
    });

    // The reading-root elements should have the updated value
    const card = page.locator(".reading-root").first();
    await expect(card).toBeVisible();
    const lh = await card.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--reading-line-height").trim()
    );
    expect(lh).toBe("2");
  });
});

test.describe("Content width", () => {
  test("switching width changes max-w class", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));

    // Default is medium -> max-w-4xl
    const container = page.locator(".max-w-4xl").first();
    await expect(container).toBeVisible();

    // Switch to narrow via store
    await page.evaluate(() => {
      (window as any).__villarStore.getState().updateSettings({ contentWidth: "narrow" });
    });
    await expect(page.locator(".max-w-2xl").first()).toBeVisible();

    // Switch to wide
    await page.evaluate(() => {
      (window as any).__villarStore.getState().updateSettings({ contentWidth: "wide" });
    });
    await expect(page.locator(".max-w-none").first()).toBeVisible();
  });
});

// --- Language Tests ---

test.describe("Language switching", () => {
  test("switching en to ja changes header buttons to Japanese", async ({ page }) => {
    await page.goto("/");

    // Verify English first
    await expect(page.getByRole("button", { name: "Open" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Focus" })).toBeVisible();

    // Switch language to Japanese
    await page.evaluate(() => {
      (window as any).__villarStore.getState().updateSettings({ language: "ja" });
    });

    // Verify Japanese text
    await expect(page.getByRole("button", { name: "\u958B\u304F" })).toBeVisible(); // 開く
    await expect(page.getByRole("button", { name: "\u96C6\u4E2D" })).toBeVisible(); // 集中
  });

  test("switching ja back to en restores English buttons", async ({ page }) => {
    await page.goto("/");

    // Switch to Japanese
    await page.evaluate(() => {
      (window as any).__villarStore.getState().updateSettings({ language: "ja" });
    });
    await expect(page.getByRole("button", { name: "\u958B\u304F" })).toBeVisible();

    // Switch back to English
    await page.evaluate(() => {
      (window as any).__villarStore.getState().updateSettings({ language: "en" });
    });
    await expect(page.getByRole("button", { name: "Open" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Focus" })).toBeVisible();
  });

  test("settings panel labels are translated", async ({ page }) => {
    await page.goto("/");

    // Open settings
    await page.getByTitle("Settings (Cmd+,)").click();
    // Verify English labels
    await expect(page.getByText("Display").first()).toBeVisible();
    await expect(page.getByText("Font Size")).toBeVisible();

    // Switch to Japanese
    await page.evaluate(() => {
      (window as any).__villarStore.getState().updateSettings({ language: "ja" });
    });

    // Translated section titles should be in Japanese
    await expect(page.getByText("\u8868\u793A")).toBeVisible(); // 表示 (Display)
    await expect(page.getByText("\u8A00\u8A9E")).toBeVisible(); // 言語 (Language label)
  });
});

// --- Window Tests ---

test.describe("Window controls", () => {
  test("settings panel opens with Cmd+, keyboard shortcut", async ({ page }) => {
    await page.goto("/");

    // Font Size label should not be visible initially (settings closed)
    await expect(page.getByText("Font Size")).not.toBeVisible();

    // Open settings via keyboard
    await page.keyboard.press("Meta+,");
    await page.waitForTimeout(200);

    // Settings panel should now be visible
    await expect(page.getByText("Font Size")).toBeVisible();
  });

  test("settings panel has resize handle", async ({ page }) => {
    await page.goto("/");

    // Open settings
    await page.getByTitle("Settings (Cmd+,)").click();

    // Resize handle should be adjacent to settings panel
    const resizeHandles = page.locator(".resize-handle");
    // There should be at least 2: sidebar + settings
    const count = await resizeHandles.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// --- Session Restore ---

test.describe("Session restore", () => {
  test("settings persist across page reload", async ({ page }) => {
    await page.goto("/");

    // Apply Dracula theme via store
    await page.evaluate(() => {
      const store = (window as any).__villarStore;
      store.getState().updateSettings({
        vscodeTheme: {
          name: "Dracula",
          bg: "#282a36", fg: "#f8f8f2", accent: "#bd93f9",
          sidebarBg: "#21222c", sidebarFg: "#f8f8f2",
          editorBg: "#282a36", editorFg: "#f8f8f2",
          border: "#44475a", selectionBg: "#44475a",
          headingColor: "#ff79c6", linkColor: "#8be9fd",
          codeBg: "#1e1f29", codeFg: "#50fa7b",
          blockquoteBorder: "#6272a4", blockquoteFg: "#6272a4",
          tableBorder: "#44475a", tableHeaderBg: "#343746",
        }
      });
    });

    // Verify it's applied
    const bgBefore = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--vs-bg").trim()
    );
    expect(bgBefore).toBe("#282a36");

    // Grab the persisted settings from localStorage
    const settingsJson = await page.evaluate(() =>
      localStorage.getItem("villar-settings")
    );
    expect(settingsJson).toBeTruthy();

    // Add init script that restores settings AFTER the fixture's localStorage.clear()
    await page.addInitScript((json) => {
      localStorage.setItem("villar-settings", json);
    }, settingsJson!);

    await page.reload();
    await page.waitForTimeout(500);

    // Theme should still be applied after reload
    const bgAfter = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--vs-bg").trim()
    );
    expect(bgAfter).toBe("#282a36");
  });
});

// ============================================================
// Helper data and functions for file-management / tab / card tests
// ============================================================

const SAMPLE_MD_3 = [
  "# Third Doc",
  "",
  "## Alpha",
  "",
  "Alpha content paragraph with enough text here.",
  "",
  "## Beta",
  "",
  "Beta content paragraph with enough text here.",
].join("\n");

const ALPHA_MD = [
  "# Alpha Doc",
  "",
  "## Section A",
  "",
  "Alpha section A content with enough text for TL;DR.",
  "",
  "## Section B",
  "",
  "Alpha section B content.",
].join("\n");

const BETA_MD = [
  "# Beta Doc",
  "",
  "## Part One",
  "",
  "Beta part one content text.",
  "",
  "## Part Two",
  "",
  "Beta part two content.",
].join("\n");

const MOCK_TREE = [
  { name: "alpha.md", path: "/mock/folder/alpha.md", is_dir: false, children: [] },
  { name: "beta.md", path: "/mock/folder/beta.md", is_dir: false, children: [] },
];

function setupMockFolder(page: import("@playwright/test").Page) {
  return page.evaluate(({ alphaMd, betaMd, tree }) => {
    (window as any).__TAURI_MOCK_DATA__ = {
      files: tree,
      fileContents: {
        "/mock/folder/alpha.md": alphaMd,
        "/mock/folder/beta.md": betaMd,
      },
    };
    const store = (window as any).__villarStore;
    store.getState().setFolderPath("/mock/folder");
    store.getState().setTree(tree);
  }, { alphaMd: ALPHA_MD, betaMd: BETA_MD, tree: MOCK_TREE });
}

// ============================================================
// File management tests
// ============================================================

test.describe("File management", () => {
  test("sidebar shows file tree after folder selection", async ({ page }) => {
    await page.goto("/");
    await setupMockFolder(page);
    await expect(page.getByText("alpha")).toBeVisible();
    await expect(page.getByText("beta")).toBeVisible();
  });

  test("clicking a file in sidebar opens it as card view", async ({ page }) => {
    await page.goto("/");
    await setupMockFolder(page);
    await page.getByText("alpha").click();
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Section A" }).first()).toBeVisible();
  });

  test("outline shows H1 title and H2 sections", async ({ page }) => {
    await page.goto("/");
    await setupMockFolder(page);
    await page.getByText("alpha").click();

    await expect(page.getByText("Outline")).toBeVisible();
    await expect(page.getByText("Alpha Doc", { exact: true }).first()).toBeVisible();
    // Scope to sidebar to avoid card thumbnail buttons
    const sidebar = page.getByRole("complementary");
    await expect(sidebar.getByRole("button", { name: "Section A" })).toBeVisible();
    await expect(sidebar.getByRole("button", { name: "Section B" })).toBeVisible();
  });
});

// ============================================================
// Tab tests
// ============================================================

test.describe("Tab management", () => {
  test("two files open shows two tabs", async ({ page }) => {
    await page.goto("/");
    await setupMockFolder(page);
    await page.getByText("alpha").click();
    await page.getByText("beta").click();

    const tabBar = page.locator("[data-tabbar]");
    await expect(tabBar).toBeVisible();
    await expect(tabBar.locator("[data-tab-index='0']")).toBeVisible();
    await expect(tabBar.locator("[data-tab-index='1']")).toBeVisible();
  });

  test("tab click switches displayed content", async ({ page }) => {
    await page.goto("/");
    await setupMockFolder(page);
    await page.getByText("alpha").click();
    await page.getByText("beta").click();

    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Part One" }).first()).toBeVisible();
    const tabBar = page.locator("[data-tabbar]");
    await tabBar.locator("[data-tab-index='0']").click();
    await expect(main.getByRole("heading", { name: "Section A" }).first()).toBeVisible();
  });

  test("Cmd+W closes active tab", async ({ page }) => {
    await page.goto("/");
    await setupMockFolder(page);
    await page.getByText("alpha").click();
    await page.getByText("beta").click();

    const tabBar = page.locator("[data-tabbar]");
    await expect(tabBar).toBeVisible();
    await page.keyboard.press("Meta+w");
    await expect(tabBar).not.toBeVisible();
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Section A" }).first()).toBeVisible();
  });

  test("context menu Close Others closes other tabs", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD, "first.md", "/mock/first.md"));
    await page.evaluate(injectContent(SAMPLE_MD_2, "second.md", "/mock/second.md"));
    await page.evaluate(injectContent(SAMPLE_MD_3, "third.md", "/mock/third.md"));

    const tabBar = page.locator("[data-tabbar]");
    await expect(tabBar).toBeVisible();
    await tabBar.locator("[data-tab-index='2']").click({ button: "right" });
    await expect(page.getByText("Close Others")).toBeVisible();
    await page.getByText("Close Others").click();
    await expect(tabBar).not.toBeVisible();
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Alpha" }).first()).toBeVisible();
  });
});

// ============================================================
// Card display tests
// ============================================================

test.describe("Card display", () => {
  test("H2 splitting produces multiple section cards", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));
    await expect(page.getByText(/1 \/ [3-9]/)).toBeVisible();
  });

  test("Prev/Next navigation changes card content", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));
    await expect(page.getByText(/1 \/ /)).toBeVisible();
    await page.getByRole("button", { name: /Next/ }).click();
    await expect(page.getByText(/2 \/ /)).toBeVisible();
    await page.getByRole("button", { name: /Next/ }).click();
    await expect(page.getByText(/3 \/ /)).toBeVisible();
    await page.getByRole("button", { name: /Prev/ }).click();
    await expect(page.getByText(/2 \/ /)).toBeVisible();
  });

  test("focus mode toggles opacity on inactive cards", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));
    await expect(page.getByText(/1 \/ /)).toBeVisible();

    await page.keyboard.press("f");
    await expect.poll(() =>
      page.evaluate(() => (window as any).__villarStore.getState().focusMode)
    ).toBe(true);

    const cards = page.locator(".vs-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
    await expect(cards.nth(1)).toHaveCSS("opacity", /^0\./);
    await expect(cards.nth(0)).toHaveCSS("opacity", "1");

    await page.keyboard.press("f");
    await expect.poll(() =>
      page.evaluate(() => (window as any).__villarStore.getState().focusMode)
    ).toBe(false);
  });

  test("read mark appears after visiting a card", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));
    await page.getByRole("button", { name: /Next/ }).click();
    await expect(page.getByText(/2 \/ /)).toBeVisible();
    await page.getByRole("button", { name: /Prev/ }).click();
    const readCount = await page.evaluate(() =>
      (window as any).__villarStore.getState().readSections.size
    );
    expect(readCount).toBeGreaterThanOrEqual(2);
  });

  test("file dates shown when file is open", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(injectContent(SAMPLE_MD));
    await expect(page.getByText(/Created/).first()).toBeVisible();
    await expect(page.getByText(/Updated/).first()).toBeVisible();
  });
});

// --- Onboarding Tests ---

test.describe("Onboarding", () => {
  // These tests need onboarding to show — override the fixture default
  const enableOnboarding = async (page: any) => {
    await page.addInitScript(() => {
      localStorage.removeItem("villar-onboarding-done");
    });
  };

  test("shows onboarding overlay on first launch", async ({ page }) => {
    await enableOnboarding(page);
    await page.goto("/");
    await expect(page.getByText("Welcome to villar!")).toBeVisible();
  });

  test("Next button advances to next step", async ({ page }) => {
    await enableOnboarding(page);
    await page.goto("/");
    await expect(page.getByText("1 / 7")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("2 / 7")).toBeVisible();
  });

  test("step indicator updates correctly", async ({ page }) => {
    await enableOnboarding(page);
    await page.goto("/");
    await expect(page.getByText("1 / 7")).toBeVisible();

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("2 / 7")).toBeVisible();

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("3 / 7")).toBeVisible();
  });

  test("Skip button closes onboarding", async ({ page }) => {
    await enableOnboarding(page);
    await page.goto("/");
    await expect(page.getByText("Welcome to villar!")).toBeVisible();

    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page.getByText("Welcome to villar!")).not.toBeVisible();
  });

  test("onboarding does not reappear when localStorage flag is set", async ({ page }) => {
    // Default fixture sets villar-onboarding-done = "true"
    await page.goto("/");
    await page.waitForTimeout(300);
    // Onboarding should NOT appear
    await expect(page.getByText("Welcome to villar!")).not.toBeVisible();

    // Verify the localStorage flag is what prevents it
    const done = await page.evaluate(() => localStorage.getItem("villar-onboarding-done"));
    expect(done).toBe("true");
  });

  test("Show Onboarding button in Settings resets and re-shows onboarding", async ({ page }) => {
    // Start with onboarding already done (fixture default)
    await page.goto("/");
    await expect(page.getByText("Welcome to villar!")).not.toBeVisible();

    // Open settings
    await page.getByTitle("Settings (Cmd+,)").click();

    // Click "Show Onboarding" button
    await page.getByTestId("restart-onboarding").click();

    // Onboarding should reappear
    await expect(page.getByText("Welcome to villar!")).toBeVisible();
    await expect(page.getByText("1 / 7")).toBeVisible();
  });
});

// --- Update Banner Tests ---

test.describe("Update Banner", () => {
  // Helper to mock GitHub releases API
  const mockFetchUpdate = async (page: any) => {
    await page.addInitScript(() => {
      const origFetch = window.fetch;
      window.fetch = async (url: string | URL | Request, opts?: RequestInit) => {
        if (typeof url === "string" && url.includes("api.github.com/repos")) {
          return new Response(JSON.stringify({
            tag_name: "v99.0.0",
            html_url: "https://github.com/tyler0702/villar/releases/tag/v99.0.0",
          }), { status: 200 });
        }
        return origFetch(url, opts);
      };
    });
  };

  test("shows UpdateBanner when new version is available (mocked fetch)", async ({ page }) => {
    await mockFetchUpdate(page);
    await page.goto("/");

    await expect(page.getByText(/New version available.*v99\.0\.0/)).toBeVisible();
  });

  test("Later button dismisses banner", async ({ page }) => {
    await mockFetchUpdate(page);
    await page.goto("/");

    await expect(page.getByText(/New version available/)).toBeVisible();
    await page.getByRole("button", { name: "Later" }).click();
    await expect(page.getByText(/New version available/)).not.toBeVisible();
  });

  test("Skip this version saves to localStorage", async ({ page }) => {
    await mockFetchUpdate(page);
    await page.goto("/");

    await expect(page.getByText(/New version available/)).toBeVisible();
    await page.getByRole("button", { name: "Skip this version" }).click();

    await expect(page.getByText(/New version available/)).not.toBeVisible();

    const skipped = await page.evaluate(() => localStorage.getItem("villar-skip-version"));
    expect(skipped).toBe("v99.0.0");
  });

  test("skipped version does not show banner", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("villar-skip-version", "v99.0.0");

      const origFetch = window.fetch;
      window.fetch = async (url: string | URL | Request, opts?: RequestInit) => {
        if (typeof url === "string" && url.includes("api.github.com/repos")) {
          return new Response(JSON.stringify({
            tag_name: "v99.0.0",
            html_url: "https://github.com/tyler0702/villar/releases/tag/v99.0.0",
          }), { status: 200 });
        }
        return origFetch(url, opts);
      };
    });

    await page.goto("/");
    await page.waitForTimeout(500);

    await expect(page.getByText(/New version available/)).not.toBeVisible();
  });
});
