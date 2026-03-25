import type { ProcessedSection } from "../../hooks/useMarkdown";

interface OutlineProps {
  sections: ProcessedSection[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function Outline({ sections, activeIndex, onSelect }: OutlineProps) {
  if (sections.length === 0) return null;

  return (
    <div className="border-t border-gray-200/60 dark:border-gray-700/60 px-2 pt-2 pb-3">
      <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        Outline
      </span>
      <div className="mt-1 space-y-0.5">
        {sections.map((section, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-full text-left px-3 py-1 text-xs rounded-lg truncate transition-colors ${
              i === activeIndex
                ? "bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-200 font-medium"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>
    </div>
  );
}
