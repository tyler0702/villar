import type { ProcessedSection } from "../../hooks/useMarkdown";

interface OutlineProps {
  sections: ProcessedSection[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function Outline({ sections, activeIndex, onSelect }: OutlineProps) {
  if (sections.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
      <p className="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        Outline
      </p>
      {sections.map((section, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`w-full text-left px-3 py-1 text-xs rounded-md truncate transition-colors ${
            i === activeIndex
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {section.title}
        </button>
      ))}
    </div>
  );
}
