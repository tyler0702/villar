import { describe, it, expect } from "vitest";
import { injectIntoHead, resolveLocalResources } from "../CardView/OriginalHtmlView";

describe("injectIntoHead", () => {
  it("inserts right after the opening <head>", () => {
    const out = injectIntoHead('<html><head><style>a{}</style></head><body/></html>', "<meta x>");
    expect(out).toBe('<html><head><meta x><style>a{}</style></head><body/></html>');
  });

  it("inserts after <html> when there is no head", () => {
    const out = injectIntoHead('<html lang="ja"><body><p>x</p></body></html>', "<meta x>");
    expect(out).toBe('<html lang="ja"><meta x><body><p>x</p></body></html>');
  });

  it("prepends for bare fragments", () => {
    expect(injectIntoHead("<p>x</p>", "<meta x>")).toBe("<meta x><p>x</p>");
  });
});

describe("resolveLocalResources", () => {
  const base = "/docs/report.html";

  it("rewrites relative stylesheet, script and image paths to asset URLs", () => {
    const html =
      '<link rel="stylesheet" href="style.css"><script src="./app.js"></script><img alt="x" src="../img/a.png">';
    const out = resolveLocalResources(html, base);
    expect(out).toContain('href="asset://localhost//docs/style.css"');
    expect(out).toContain('src="asset://localhost//docs/app.js"');
    expect(out).toContain('src="asset://localhost//img/a.png"');
  });

  it("leaves absolute, data and anchor URLs untouched", () => {
    const html =
      '<script src="https://cdn.example.com/x.js"></script><img src="data:image/png;base64,AA">';
    expect(resolveLocalResources(html, base)).toBe(html);
  });

  it("does not rewrite <a> links — the click handler owns those", () => {
    const html = '<a href="notes.md">notes</a>';
    expect(resolveLocalResources(html, base)).toBe(html);
  });

  it("returns input unchanged without a base path", () => {
    const html = '<link href="style.css">';
    expect(resolveLocalResources(html, null)).toBe(html);
  });
});
