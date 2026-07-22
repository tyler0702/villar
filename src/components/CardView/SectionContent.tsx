import { useMemo, useCallback, useState, useRef } from "react";
import { MERMAID_PLACEHOLDER, COLLAPSE_MARKER } from "../../hooks/useMarkdown";
import type { CollapsedBlock } from "../../plugins/remark-collapse";
import { MermaidBlock } from "./MermaidBlock";
import { useAppStore } from "../../stores/useAppStore";
import { resolveRelativePath, openMarkdownFileByPath } from "../../hooks/openMarkdownFile";

// Smooth-scroll to an element by id within the mounted document, with a brief flash.
function scrollToAnchor(id: string) {
  const el = id ? document.getElementById(id) : null;
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("anchor-flash");
  setTimeout(() => el.classList.remove("anchor-flash"), 1200);
  return true;
}

interface SectionContentProps {
  html: string;
  mermaidCodes: string[];
  collapsed: CollapsedBlock[];
}

function CollapsibleBlock({ block }: { block: CollapsedBlock }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="my-2">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="text-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer select-none py-1"
      >
        {open ? "\u25BE" : "\u25B8"} {block.label} — click to {open ? "collapse" : "expand"}
      </button>
      {open ? (
        <HtmlBlock html={block.html} />
      ) : null}
    </div>
  );
}

function HtmlBlock({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Image click → preview
    if (target.tagName === "IMG") {
      e.stopPropagation();
      const src = (target as HTMLImageElement).src;
      if (src) useAppStore.getState().setPreviewImage(src);
      return;
    }

    const anchor = target.closest("a") as HTMLAnchorElement | null;
    if (anchor) {
      const rawHref = anchor.getAttribute("href") ?? "";

      // 1. In-page anchor (#heading) → scroll within the document.
      //    All cards are mounted, so the target id resolves even across cards.
      if (rawHref.startsWith("#")) {
        e.preventDefault();
        e.stopPropagation();
        scrollToAnchor(decodeURIComponent(rawHref.slice(1)));
        return;
      }

      // 2. Link to another local Markdown file → open it inside villar.
      //    Skip anything with a URL scheme (http:, mailto:, tauri:, …).
      const hashIdx = rawHref.indexOf("#");
      const pathPart = decodeURIComponent(
        (hashIdx >= 0 ? rawHref.slice(0, hashIdx) : rawHref).split("?")[0]
      );
      const hash = hashIdx >= 0 ? decodeURIComponent(rawHref.slice(hashIdx + 1)) : "";
      const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(rawHref);
      if (!hasScheme && rawHref && /\.md$/i.test(pathPart)) {
        e.preventDefault();
        e.stopPropagation();
        const state = useAppStore.getState();
        const curPath = state.tabs[state.activeTabIndex]?.file.path;
        if (curPath) {
          const resolved = resolveRelativePath(curPath, pathPart);
          const ok = await openMarkdownFileByPath(resolved);
          // Best-effort: after the new document renders, jump to the anchor
          if (ok && hash) setTimeout(() => scrollToAnchor(hash), 500);
        }
        return;
      }

      // 3. Everything else → open in external browser
      if (anchor.href) {
        e.preventDefault();
        e.stopPropagation();
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        openUrl(anchor.href);
        return;
      }
    }

    const btn = target.closest("[data-copy]") as HTMLElement | null;
    if (!btn) return;

    e.stopPropagation();
    const pre = btn.closest("pre");
    const code = pre?.querySelector("code");
    if (code) {
      await navigator.clipboard.writeText(code.textContent ?? "");
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = "Copy"; }, 1500);
    }
  }, []);

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a") as HTMLAnchorElement | null;
    if (!anchor?.href || anchor.querySelector(".link-tooltip")) return;
    // No hostname tooltip for in-app links (anchors or local .md files)
    const raw = anchor.getAttribute("href") ?? "";
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
    if (raw.startsWith("#") || (!hasScheme && /\.md(#|\?|$)/i.test(raw))) return;
    try {
      const url = new URL(anchor.href);
      const tip = document.createElement("span");
      tip.className = "link-tooltip";
      tip.textContent = url.hostname;
      anchor.style.position = "relative";
      anchor.appendChild(tip);
      anchor.addEventListener("mouseleave", () => tip.remove(), { once: true });
    } catch { /* invalid URL */ }
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function SectionContent({ html, mermaidCodes, collapsed }: SectionContentProps) {
  const parts = useMemo(() => {
    const result: { type: "html" | "mermaid" | "collapsed"; content: string; index?: number }[] = [];
    const markerRegex = new RegExp(
      `<p>(?:${MERMAID_PLACEHOLDER}|${COLLAPSE_MARKER})(\\d+)</p>`,
      "g"
    );

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = markerRegex.exec(html)) !== null) {
      const before = html.slice(lastIndex, match.index);
      if (before.trim()) result.push({ type: "html", content: before });

      const idx = parseInt(match[1], 10);
      const marker = match[0];

      if (marker.includes(MERMAID_PLACEHOLDER)) {
        result.push({ type: "mermaid", content: mermaidCodes[idx] ?? "", index: idx });
      } else {
        result.push({ type: "collapsed", content: "", index: idx });
      }

      lastIndex = match.index + match[0].length;
    }

    const tail = html.slice(lastIndex);
    if (tail.trim()) result.push({ type: "html", content: tail });

    return result;
  }, [html, mermaidCodes, collapsed]);

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "mermaid") {
          return <MermaidBlock key={`m-${i}`} code={part.content} />;
        }
        if (part.type === "collapsed" && part.index != null && collapsed[part.index]) {
          return <CollapsibleBlock key={`c-${i}`} block={collapsed[part.index]} />;
        }
        return <HtmlBlock key={`h-${i}`} html={part.content} />;
      })}
    </>
  );
}
