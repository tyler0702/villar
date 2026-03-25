import { useCallback, useRef, useEffect, memo } from "react";
import type { ProcessedSection } from "../../hooks/useMarkdown";
import { useAppStore } from "../../stores/useAppStore";
import { TldrCard } from "./TldrCard";
import { SectionContent } from "./SectionContent";

interface CardViewProps {
  sections: ProcessedSection[];
}

// Extracted card component — memo prevents re-render when only activeIndex changes
const SectionCard = memo(function SectionCard({
  section,
  isActive,
  isFaded,
  onClick,
  cardRef,
}: {
  section: ProcessedSection;
  isActive: boolean;
  isFaded: boolean;
  onClick: () => void;
  cardRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`rounded-xl border bg-white dark:bg-surface-800 p-6 cursor-pointer transition-all duration-300 ${
        isActive
          ? "border-accent-300 dark:border-accent-700 shadow-lg shadow-accent-200/30 dark:shadow-accent-900/20 ring-1 ring-accent-200/50 dark:ring-accent-800/50"
          : "border-gray-200/60 dark:border-gray-700/40 shadow-sm hover:shadow-md"
      } ${isFaded ? "opacity-30" : "opacity-100"}`}
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 tracking-tight">
        {section.title}
      </h2>
      {section.tldr ? <TldrCard tldr={section.tldr} /> : null}
      <SectionContent html={section.html} mermaidCodes={section.mermaidCodes} />
    </div>
  );
});

export function CardView({ sections }: CardViewProps) {
  const activeIndex = useAppStore((s) => s.activeCardIndex);
  const setActiveIndex = useAppStore((s) => s.setActiveCardIndex);
  const focusMode = useAppStore((s) => s.focusMode);
  const activeCardRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < sections.length) {
        setActiveIndex(index);
      }
    },
    [sections.length, setActiveIndex]
  );

  useEffect(() => {
    activeCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeIndex]);

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {sections.map((section, i) => (
          <SectionCard
            key={i}
            section={section}
            isActive={i === activeIndex}
            isFaded={focusMode && i !== activeIndex}
            onClick={() => setActiveIndex(i)}
            cardRef={i === activeIndex ? activeCardRef : undefined}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 py-2.5 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm shrink-0">
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="px-3 py-1 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          title="Previous (Arrow Left)"
        >
          &larr; Prev
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums font-medium">
          {activeIndex + 1} / {sections.length}
        </span>
        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === sections.length - 1}
          className="px-3 py-1 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          title="Next (Arrow Right)"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
