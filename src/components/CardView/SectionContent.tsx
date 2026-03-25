import { useMemo, useCallback, useState } from "react";
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
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
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

  return (
    <div
      onClick={handleClick}
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
