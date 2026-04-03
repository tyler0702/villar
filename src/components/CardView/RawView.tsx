import { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../i18n/useTranslation";

interface RawViewProps {
  content: string;
  onScrollProgress?: (progress: number) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export function RawView({ content, onScrollProgress, scrollRef: externalRef }: RawViewProps) {
  const t = useTranslation();
  const [copied, setCopied] = useState(false);
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = externalRef ?? internalRef;

  useEffect(() => {
    const el = ref.current;
    if (!el || !onScrollProgress) return;
    function handleScroll() {
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      onScrollProgress!(max > 0 ? Math.round((scrollTop / max) * 100) : 0);
    }
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [ref, onScrollProgress]);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div ref={ref} className="flex-1 overflow-y-auto relative" style={{ background: "var(--vs-editor-bg)", color: "var(--vs-editor-fg)" }}>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 px-3 py-1 text-[11px] font-medium rounded-lg bg-gray-200/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-10"
      >
        {copied ? t("action.copied") : t("action.copyAll")}
      </button>
      <pre className="p-6 text-sm font-mono whitespace-pre-wrap break-words leading-relaxed m-0">
        {content}
      </pre>
    </div>
  );
}
