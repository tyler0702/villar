// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../useAppStore";

const mdDoc = (b: string) => `# T\n\nintro\n\n## A\n\naaa\n\n## B\n\n${b}\n`;
const htmlDoc = (b: string) =>
  `<html><head><style>body{color:red}</style></head><body><h1>T</h1><p>intro</p><h2>A</h2><p>aaa</p><h2>B</h2><p>${b}</p></body></html>`;

beforeEach(() => {
  useAppStore.setState({ tabs: [], activeTabIndex: 0 });
});

describe("setTabContent diff detection", () => {
  it("attributes changes to the right section for markdown files", () => {
    useAppStore.getState().openTab({ name: "a.md", path: "/docs/a.md" }, mdDoc("bbb"));
    useAppStore.getState().setTabContent("/docs/a.md", mdDoc("changed"));
    const tab = useAppStore.getState().tabs.find((t) => t.file.path === "/docs/a.md");
    expect(tab?.changedSections).toEqual([2]);
  });

  it("attributes changes to the right section for HTML files", () => {
    useAppStore.getState().openTab({ name: "a.html", path: "/docs/a.html" }, htmlDoc("bbb"));
    useAppStore.getState().setTabContent("/docs/a.html", htmlDoc("changed"));
    const tab = useAppStore.getState().tabs.find((t) => t.file.path === "/docs/a.html");
    expect(tab?.changedSections).toEqual([2]);
  });

  it("ignores whitespace-only HTML source changes that do not alter content", () => {
    useAppStore.getState().openTab({ name: "b.html", path: "/docs/b.html" }, htmlDoc("bbb"));
    useAppStore.getState().setTabContent("/docs/b.html", htmlDoc("bbb").replace("<p>intro</p>", "<p>intro</p>\n"));
    const tab = useAppStore.getState().tabs.find((t) => t.file.path === "/docs/b.html");
    expect(tab?.changedSections).toEqual([]);
  });
});
