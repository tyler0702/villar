import { useAppStore } from "../../stores/useAppStore";
import { Outline } from "./Outline";
import { FileTree } from "./FileTree";
import type { ProcessedSection } from "../../hooks/useMarkdown";

interface SidebarProps {
  sections: ProcessedSection[];
  style?: React.CSSProperties;
}

export function Sidebar({ sections, style }: SidebarProps) {
  const tree = useAppStore((s) => s.tree);
  const activeTab = useAppStore((s) => s.tabs[s.activeTabIndex] ?? null);
  const selectedPath = activeTab?.file.path ?? null;
  const activeCardIndex = activeTab?.activeCardIndex ?? 0;
  const setActiveCardIndex = useAppStore((s) => s.setActiveCardIndex);

  return (
    <aside style={style} className="shrink-0 border-r border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-surface-800/60 backdrop-blur-sm overflow-y-auto flex flex-col vs-sidebar vs-border">
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Files
        </span>
      </div>
      <nav className="px-1.5 pb-2 flex-1">
        {tree.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 px-2 py-6 text-center">
            No folder open
          </p>
        ) : (
          <FileTree nodes={tree} selectedPath={selectedPath} />
        )}
      </nav>
      <Outline
        sections={sections}
        activeIndex={activeCardIndex}
        onSelect={setActiveCardIndex}
      />
    </aside>
  );
}
