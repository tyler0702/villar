import { useMemo, useEffect, useRef } from "react";
import { MERMAID_PLACEHOLDER } from "../../hooks/useMarkdown";
import { MermaidBlock } from "./MermaidBlock";

interface SectionContentProps {
  html: string;
  mermaidCodes: string[];
}

function injectCopyButtons(container: HTMLElement) {
  const pres = container.querySelectorAll("pre");
  pres.forEach((pre) => {
    if (pre.querySelector(".code-copy-btn")) return;
    const btn = document.createElement("button");
    btn.className = "code-copy-btn";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      const code = pre.querySelector("code");
      if (code) {
        await navigator.clipboard.writeText(code.textContent ?? "");
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy"; }, 1500);
      }
    });
    pre.appendChild(btn);
  });
}

export function SectionContent({ html, mermaidCodes }: SectionContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const parts = useMemo(() => {
    if (mermaidCodes.length === 0) return [{ type: "html" as const, content: html }];

    const result: { type: "html" | "mermaid"; content: string }[] = [];
    let remaining = html;

    for (let i = 0; i < mermaidCodes.length; i++) {
      const placeholder = `<p>${MERMAID_PLACEHOLDER}${i}</p>`;
      const idx = remaining.indexOf(placeholder);
      if (idx === -1) continue;

      const before = remaining.slice(0, idx);
      if (before.trim()) result.push({ type: "html", content: before });
      result.push({ type: "mermaid", content: mermaidCodes[i] });
      remaining = remaining.slice(idx + placeholder.length);
    }

    if (remaining.trim()) result.push({ type: "html", content: remaining });
    return result;
  }, [html, mermaidCodes]);

  useEffect(() => {
    if (containerRef.current) {
      injectCopyButtons(containerRef.current);
    }
  }, [parts]);

  return (
    <div ref={containerRef}>
      {parts.map((part, i) =>
        part.type === "mermaid" ? (
          <MermaidBlock key={`m-${i}`} code={part.content} />
        ) : (
          <div
            key={`h-${i}`}
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: part.content }}
          />
        )
      )}
    </div>
  );
}
