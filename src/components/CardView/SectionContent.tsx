import { useMemo, useCallback, useState, useRef } from "react";
import { MERMAID_PLACEHOLDER, COLLAPSE_MARKER } from "../../hooks/useMarkdown";
import type { CollapsedBlock } from "../../plugins/remark-collapse";
import { MermaidBlock } from "./MermaidBlock";

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

    // Open links in external browser
    const anchor = target.closest("a") as HTMLAnchorElement | null;
    if (anchor?.href) {
      e.preventDefault();
      e.stopPropagation();
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      openUrl(anchor.href);
      return;
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
