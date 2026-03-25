import { memo } from "react";
import { useAppStore } from "../../stores/useAppStore";

const TabItem = memo(function TabItem({
  name,
  isActive,
  onClick,
  onClose,
}: {
  name: string;
  isActive: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-b-2 transition-colors shrink-0 ${
        isActive
          ? "border-accent-400 text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-surface-800/50"
          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
      }`}
    >
      <span className="truncate max-w-[120px]">{name.replace(/\.md$/, "")}</span>
      <button
        onClick={onClose}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-[10px] leading-none transition-opacity"
      >
        &times;
      </button>
    </div>
  );
});

export function TabBar() {
  const tabs = useAppStore((s) => s.tabs);
  const activeTabIndex = useAppStore((s) => s.activeTabIndex);

  if (tabs.length <= 1) return null;

  return (
    <div className="flex border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-surface-900/80 overflow-x-auto shrink-0">
      {tabs.map((tab, i) => (
        <TabItem
          key={tab.file.path}
          name={tab.file.name}
          isActive={i === activeTabIndex}
          onClick={() => useAppStore.getState().setActiveTab(i)}
          onClose={(e) => {
            e.stopPropagation();
            useAppStore.getState().closeTab(i);
          }}
        />
      ))}
    </div>
  );
}
