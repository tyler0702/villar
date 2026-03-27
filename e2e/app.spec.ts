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
