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
