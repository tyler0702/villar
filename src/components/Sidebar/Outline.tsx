import type { ProcessedSection } from "../../hooks/useMarkdown";
import { useAppStore } from "../../stores/useAppStore";

interface OutlineProps {
  docTitle: string | null;
  sections: ProcessedSection[];
  activeIndex: number;
  onSelect: (index: number) => void;
  filePath?: string;
}

function scrollToH2InRaw(title: string) {
  const scrollRef = useAppStore.getState().cardScrollRef;
  const container = scrollRef?.current;
  if (!container) return;
  // Try id-based lookup first (wt1 may add ids), then textContent match
  const headings = container.querySelectorAll("h2, [data-heading]");
  for (const h of headings) {
    if (h.textContent?.trim() === title.trim()) {
      h.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }
}

export function Outline({ docTitle, sections, activeIndex, onSelect, filePath }: OutlineProps) {
  const bookmarks = useAppStore((s) => s.bookmarks);
  const rawMode = useAppStore((s) => s.rawMode);
  if (sections.length === 0) return null;

  return (
    <div className="border-t border-gray-200/60 dark:border-gray-700/60 px-2 pt-2 pb-3 vs-border">
      <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        Outline
      </span>
      <div className="mt-1 space-y-0.5">
        {docTitle ? (
          <div className="px-3 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 truncate">
            {docTitle}
          </div>
        ) : null}
        {sections.map((section, i) => {
          const isBm = filePath ? bookmarks.has(`${filePath}:${i}`) : false;
          return (
          <div key={i}>
            <button
              onClick={() => rawMode ? scrollToH2InRaw(section.title) : onSelect(i)}
              className={`w-full text-left px-3 py-1 text-xs rounded-lg truncate transition-colors ${
                i === activeIndex
                  ? "bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-200 font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              style={{ paddingLeft: docTitle ? "20px" : undefined }}
            >
              {isBm ? <span className="text-accent-500 mr-1">{"\u{1F4CC}"}</span> : null}{section.title}
            </button>
            {i === activeIndex && section.subHeadings.length > 0 ? (
              <div className="ml-3 mt-0.5 space-y-0.5">
                {section.subHeadings.map((sub, j) => (
                  <div
                    key={j}
                    className="text-[10px] text-gray-400 dark:text-gray-500 truncate py-0.5"
                    style={{ paddingLeft: `${(sub.depth - 3) * 8 + (docTitle ? 20 : 12)}px` }}
                  >
                    {sub.title}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          );
        })}
      </div>
    </div>
  );
}
