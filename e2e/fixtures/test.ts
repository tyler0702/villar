import { test as base } from "@playwright/test";
import path from "node:path";

/**
 * Extended test fixture that injects Tauri API mocks before every page load.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Clear stored session so tests start fresh
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.addInitScript({
      path: path.resolve(import.meta.dirname, "tauri-mock.js"),
    });
    await use(page);
  },
});

export { expect } from "@playwright/test";
