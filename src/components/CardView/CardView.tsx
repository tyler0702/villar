import { useCallback, useRef, useEffect } from "react";
import type { ProcessedSection } from "../../hooks/useMarkdown";
import { useAppStore } from "../../stores/useAppStore";
import { TldrCard } from "./TldrCard";
import { SectionContent } from "./SectionContent";

interface CardViewProps {
  sections: ProcessedSection[];
}

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

  // Scroll active card into view when index changes
  useEffect(() => {
    activeCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeIndex]);

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {sections.map((section, i) => (
          <div
            key={i}
            ref={i === activeIndex ? activeCardRef : undefined}
            onClick={() => setActiveIndex(i)}
            className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 cursor-pointer transition-opacity duration-300 ${
              focusMode && i !== activeIndex ? "opacity-30" : "opacity-100"
            }`}
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              {section.title}
            </h2>
            {section.tldr && <TldrCard tldr={section.tldr} />}
            <SectionContent html={section.html} mermaidCodes={section.mermaidCodes} />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
          {activeIndex + 1} / {sections.length}
        </span>
        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === sections.length - 1}
          className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
