import { useCallback, useRef, useEffect, memo, useMemo, useState } from "react";
import type { ProcessedSection } from "../../hooks/useMarkdown";
import { useAppStore } from "../../stores/useAppStore";
import type { LineHeight } from "../../stores/useAppStore";
import { TldrCard } from "./TldrCard";
import { SectionContent } from "./SectionContent";

interface CardViewProps {
  sections: ProcessedSection[];
}

const WIDTH_MAP = { narrow: "max-w-2xl", medium: "max-w-4xl", wide: "max-w-none" } as const;
const LINE_HEIGHT_VAL: Record<LineHeight, string> = { tight: "1.4", normal: "1.65", relaxed: "2.0" };

const SectionCard = memo(function SectionCard({
  section,
  isActive,
  isFaded,
  fadeOpacity,
  isRead,
  readingStyle,
  onClick,
  cardRef,
}: {
  section: ProcessedSection;
  isActive: boolean;
  isFaded: boolean;
  fadeOpacity: number;
  isRead: boolean;
  readingStyle: React.CSSProperties;
  onClick: () => void;
  cardRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      style={{
        ...readingStyle,
        ...(isFaded ? { opacity: fadeOpacity / 100 } : undefined),
      }}
      className={`reading-root rounded-xl border bg-white dark:bg-surface-800 p-6 cursor-pointer transition-all duration-300 ${
        isActive
          ? "border-accent-300 dark:border-accent-700 shadow-lg shadow-accent-200/30 dark:shadow-accent-900/20 ring-1 ring-accent-200/50 dark:ring-accent-800/50"
          : "border-gray-200/60 dark:border-gray-700/40 shadow-sm hover:shadow-md"
      } ${!isFaded ? "opacity-100" : ""}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {isRead ? (
          <span className="w-4 h-4 rounded-full bg-accent-200 dark:bg-accent-800 flex items-center justify-center text-[8px] text-accent-700 dark:text-accent-300 shrink-0">&#10003;</span>
        ) : null}
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
          {section.title}
        </h2>
      </div>
      {section.tldr ? <TldrCard tldr={section.tldr} /> : null}
      <SectionContent html={section.html} mermaidCodes={section.mermaidCodes} />
    </div>
  );
});

export function CardView({ sections }: CardViewProps) {
  const activeIndex = useAppStore((s) => s.activeCardIndex);
  const setActiveIndex = useAppStore((s) => s.setActiveCardIndex);
  const focusMode = useAppStore((s) => s.focusMode);
  const lineHeight = useAppStore((s) => s.settings.lineHeight);
  const contentWidth = useAppStore((s) => s.settings.contentWidth);
  const focusOpacity = useAppStore((s) => s.settings.focusOpacity);
  const selectedFilePath = useAppStore((s) => s.selectedFile?.path ?? "");
  const readSections = useAppStore((s) => s.readSections);
  const markSectionRead = useAppStore((s) => s.markSectionRead);
  const activeCardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const readingStyle = useMemo<React.CSSProperties>(() => ({
    "--reading-line-height": LINE_HEIGHT_VAL[lineHeight],
  } as React.CSSProperties), [lineHeight]);

  useEffect(() => {
    if (selectedFilePath && sections.length > 0) {
      markSectionRead(selectedFilePath, activeIndex);
    }
  }, [activeIndex, selectedFilePath, sections.length, markSectionRead]);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < sections.length) setActiveIndex(index);
    },
    [sections.length, setActiveIndex]
  );

  useEffect(() => {
    activeCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeIndex]);

  // Track scroll position for progress bar
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function handleScroll() {
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      setScrollProgress(max > 0 ? Math.round((scrollTop / max) * 100) : 0);
    }
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  if (sections.length === 0) return null;

  const progress = scrollProgress;

  return (
    <div className="flex flex-col h-full">
      <div className="h-0.5 bg-gray-100 dark:bg-gray-800 shrink-0">
        <div
          className="h-full bg-accent-400 dark:bg-accent-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
        <div className={`mx-auto ${WIDTH_MAP[contentWidth]}`}>
          {sections.map((section, i) => (
            <div key={i} className="mb-5">
              <SectionCard
                section={section}
                isActive={i === activeIndex}
                isFaded={focusMode && i !== activeIndex}
                fadeOpacity={focusOpacity}
                isRead={readSections.has(`${selectedFilePath}:${i}`)}
                readingStyle={readingStyle}
                onClick={() => setActiveIndex(i)}
                cardRef={i === activeIndex ? activeCardRef : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-2.5 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm shrink-0">
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="px-3 py-1 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          &larr; Prev
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums font-medium">
          {activeIndex + 1} / {sections.length} &middot; {progress}%
        </span>
        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === sections.length - 1}
          className="px-3 py-1 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
