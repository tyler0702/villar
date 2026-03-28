import { useCallback, useRef, useEffect, memo, useMemo, useState } from "react";
import type { ProcessedSection } from "../../hooks/useMarkdown";
import { useAppStore } from "../../stores/useAppStore";
import { TldrCard } from "./TldrCard";
import { SectionContent } from "./SectionContent";
import { FileMeta } from "./FileMeta";

interface CardViewProps {
  sections: ProcessedSection[];
}

const WIDTH_MAP = { narrow: "max-w-2xl", medium: "max-w-4xl", wide: "max-w-none" } as const;

const SectionCard = memo(function SectionCard({
  section,
  isActive,
  isFaded,
  fadeOpacity,
  isRead,
  isChanged,
  readingStyle,
  onClick,
  cardRef,
}: {
  section: ProcessedSection;
  isActive: boolean;
  isFaded: boolean;
  fadeOpacity: number;
  isRead: boolean;
  isChanged: boolean;
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
      className={`reading-root vs-card rounded-xl border bg-white dark:bg-surface-800 p-6 cursor-pointer transition-all duration-300 ${
        isChanged
          ? "ring-2 ring-amber-400/60 dark:ring-amber-500/40 border-amber-300 dark:border-amber-600"
          : isActive
            ? "vs-card-active border-accent-300 dark:border-accent-700 shadow-lg shadow-accent-200/30 dark:shadow-accent-900/20 ring-1 ring-accent-200/50 dark:ring-accent-800/50"
            : "border-gray-200/60 dark:border-gray-700/40 shadow-sm hover:shadow-md"
      } ${!isFaded ? "opacity-100" : ""}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {isChanged ? (
          <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 shrink-0 uppercase tracking-wider">Changed</span>
        ) : isRead ? (
          <span className="w-4 h-4 rounded-full bg-accent-200 dark:bg-accent-800 flex items-center justify-center text-[8px] text-accent-700 dark:text-accent-300 shrink-0">&#10003;</span>
        ) : null}
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
          {section.title}
        </h2>
      </div>
      {section.tldr ? <TldrCard tldr={section.tldr} /> : null}
      <SectionContent html={section.html} mermaidCodes={section.mermaidCodes} collapsed={section.collapsed} />
    </div>
  );
});

export function CardView({ sections }: CardViewProps) {
  const activeTab = useAppStore((s) => s.tabs[s.activeTabIndex] ?? null);
  const activeIndex = activeTab?.activeCardIndex ?? 0;
  const setActiveIndex = useAppStore((s) => s.setActiveCardIndex);
  const focusMode = useAppStore((s) => s.focusMode);
  const lineHeight = useAppStore((s) => s.settings.lineHeight);
  const paragraphSpacing = useAppStore((s) => s.settings.paragraphSpacing);
  const letterSpacing = useAppStore((s) => s.settings.letterSpacing);
  const contentWidth = useAppStore((s) => s.settings.contentWidth);
  const focusOpacity = useAppStore((s) => s.settings.focusOpacity);
  const selectedFilePath = activeTab?.file.path ?? "";
  const readSections = useAppStore((s) => s.readSections);
  const markSectionRead = useAppStore((s) => s.markSectionRead);
  const changedSections = activeTab?.changedSections ?? [];
  const activeCardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Auto-clear changed indicators after 5 seconds
  useEffect(() => {
    if (changedSections.length === 0 || !selectedFilePath) return;
    const timer = setTimeout(() => {
      useAppStore.getState().clearChangedSections(selectedFilePath);
    }, 5000);
    return () => clearTimeout(timer);
  }, [changedSections.length, selectedFilePath]);

  const prevIndexRef = useRef(activeIndex);
  const [slideDir, setSlideDir] = useState<"none" | "left" | "right">("none");

  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      setSlideDir(activeIndex > prevIndexRef.current ? "left" : "right");
      prevIndexRef.current = activeIndex;
      const timer = setTimeout(() => setSlideDir("none"), 350);
      return () => clearTimeout(timer);
    }
  }, [activeIndex]);

  const readingStyle = useMemo<React.CSSProperties>(() => ({
    "--reading-line-height": String(lineHeight / 100),
    "--reading-paragraph-spacing": `${paragraphSpacing / 100}em`,
    "--reading-letter-spacing": `${letterSpacing / 1000}em`,
  } as React.CSSProperties), [lineHeight, paragraphSpacing, letterSpacing]);

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
    const card = activeCardRef.current;
    const container = scrollRef.current;
    if (!card || !container) return;
    const cardTop = card.getBoundingClientRect().top;
    const containerTop = container.getBoundingClientRect().top;
    if (cardTop >= containerTop) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
      <div className="flex items-center shrink-0">
        <div className="flex-1 h-0.5 bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full bg-accent-400 dark:bg-accent-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="px-3 shrink-0">
          <FileMeta filePath={selectedFilePath || null} />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 overflow-x-hidden">
        <div className={`mx-auto ${WIDTH_MAP[contentWidth]} ${slideDir === "left" ? "card-slide-left" : slideDir === "right" ? "card-slide-right" : ""}`}>
          {sections.map((section, i) => (
            <div key={i} className="mb-5" {...(i === 0 ? { "data-onboarding": "card" } : undefined)}>
              <SectionCard
                section={section}
                isActive={i === activeIndex}
                isFaded={focusMode && i !== activeIndex}
                fadeOpacity={focusOpacity}
                isRead={readSections.has(`${selectedFilePath}:${i}`)}
                isChanged={changedSections.includes(i)}
                readingStyle={readingStyle}
                onClick={() => setActiveIndex(i)}
                cardRef={i === activeIndex ? activeCardRef : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      <div data-onboarding="nav" className="shrink-0">
        <div className="flex items-center justify-center gap-4 py-1 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm">
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

        {/* Card thumbnails */}
        {sections.length > 1 ? (
          <div className="flex items-center gap-1.5 py-1.5 px-4 border-t border-gray-100/60 dark:border-gray-800/60 overflow-x-auto">
            {sections.map((section, i) => {
              const isRead = readSections.has(`${selectedFilePath}:${i}`);
              return (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`px-2 py-0.5 text-[9px] rounded border shrink-0 transition-all truncate max-w-[100px] ${
                    i === activeIndex
                      ? "border-accent-400 bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-200 font-medium"
                      : isRead
                        ? "border-accent-200/50 dark:border-accent-800/50 text-gray-500 dark:text-gray-400 bg-accent-50/30 dark:bg-accent-950/20"
                        : "border-gray-200/60 dark:border-gray-700/40 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {section.title}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
