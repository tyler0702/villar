import { useCallback, useRef, useEffect, memo } from "react";
import type { ProcessedSection } from "../../hooks/useMarkdown";
import { useAppStore } from "../../stores/useAppStore";
import { TldrCard } from "./TldrCard";
import { SectionContent } from "./SectionContent";

interface CardViewProps {
  sections: ProcessedSection[];
}

const FONT_SIZE_MAP = { sm: "prose-sm", base: "prose-base", lg: "prose-lg" } as const;
const LINE_HEIGHT_MAP = { tight: "leading-snug", normal: "leading-normal", relaxed: "leading-relaxed" } as const;
const WIDTH_MAP = { narrow: "max-w-2xl", medium: "max-w-4xl", wide: "max-w-none" } as const;

const SectionCard = memo(function SectionCard({
  section,
  isActive,
  isFaded,
  fadeOpacity,
  isRead,
  onClick,
  cardRef,
}: {
  section: ProcessedSection;
  isActive: boolean;
  isFaded: boolean;
  fadeOpacity: number;
  isRead: boolean;
  onClick: () => void;
  cardRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      style={isFaded ? { opacity: fadeOpacity / 100 } : undefined}
      className={`rounded-xl border bg-white dark:bg-surface-800 p-6 cursor-pointer transition-all duration-300 ${
        isActive
          ? "border-accent-300 dark:border-accent-700 shadow-lg shadow-accent-200/30 dark:shadow-accent-900/20 ring-1 ring-accent-200/50 dark:ring-accent-800/50"
          : "border-gray-200/60 dark:border-gray-700/40 shadow-sm hover:shadow-md"
      } ${!isFaded ? "opacity-100" : ""}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {isRead ? (
          <span className="w-4 h-4 rounded-full bg-accent-200 dark:bg-accent-800 flex items-center justify-center text-[8px] text-accent-700 dark:text-accent-300">&#10003;</span>
        ) : null}
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
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
  const settings = useAppStore((s) => s.settings);
  const selectedFilePath = useAppStore((s) => s.selectedFile?.path ?? "");
  const readSections = useAppStore((s) => s.readSections);
  const markSectionRead = useAppStore((s) => s.markSectionRead);
  const activeCardRef = useRef<HTMLDivElement>(null);

  // Mark section as read when navigated to
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

  if (sections.length === 0) return null;

  const progress = Math.round(((activeIndex + 1) / sections.length) * 100);
  const proseClass = `prose dark:prose-invert ${FONT_SIZE_MAP[settings.fontSize]} ${LINE_HEIGHT_MAP[settings.lineHeight]} max-w-none`;

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100 dark:bg-gray-800 shrink-0">
        <div
          className="h-full bg-accent-400 dark:bg-accent-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={`flex-1 overflow-y-auto px-8 py-6 space-y-5 ${proseClass}`}>
        <div className={`mx-auto ${WIDTH_MAP[settings.contentWidth]}`}>
          {sections.map((section, i) => (
            <div key={i} className="mb-5">
              <SectionCard
                section={section}
                isActive={i === activeIndex}
                isFaded={focusMode && i !== activeIndex}
                fadeOpacity={settings.focusOpacity}
                isRead={readSections.has(`${selectedFilePath}:${i}`)}
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
