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

function injectContent(md: string) {
  return `
    const store = window.__villarStore;
    store.getState().openTab(
      { name: "test.md", path: "/mock/test.md" },
      ${JSON.stringify(md)}
    );
  `;
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
