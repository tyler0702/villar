import { memo, useRef, useState } from "react";
import { useAppStore } from "../../stores/useAppStore";

const TabItem = memo(function TabItem({
  name,
  isActive,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
  onClick,
  onClose,
}: {
  name: string;
  isActive: boolean;
  index: number;
  onDragStart: (i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (i: number) => void;
  isDragOver: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      onClick={onClick}
      className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-b-2 transition-colors shrink-0 ${
        isDragOver ? "border-accent-400 bg-accent-50/30 dark:bg-accent-900/20" :
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

interface TabBarProps {
  pane?: "left" | "right";
}

export function TabBar({ pane }: TabBarProps) {
  const tabs = useAppStore((s) => s.tabs);
  const activeTabIndex = useAppStore((s) => s.activeTabIndex);
  const splitMode = useAppStore((s) => s.splitMode);
  const splitTabIndex = useAppStore((s) => s.splitTabIndex);
  const dragFrom = useRef(-1);
  const [dragOverIndex, setDragOverIndex] = useState(-1);

  if (tabs.length <= 1 && !splitMode) return null;

  // In split mode, determine which tabs belong to which pane
  const isRight = pane === "right";
  const currentActiveIndex = isRight ? splitTabIndex : activeTabIndex;

  function handleDragStart(i: number) {
    dragFrom.current = i;
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDragOverIndex(i);
  }

  function handleDrop(to: number) {
    const from = dragFrom.current;
    setDragOverIndex(-1);
    if (from >= 0 && from !== to) {
      useAppStore.getState().reorderTab(from, to);
    }
    dragFrom.current = -1;
  }

  function handleTabClick(i: number) {
    if (isRight) {
      useAppStore.getState().setSplitTabIndex(i);
    } else {
      useAppStore.getState().setActiveTab(i);
    }
  }

  function handleClose(e: React.MouseEvent, i: number) {
    e.stopPropagation();
    if (isRight) {
      // Close from split — just unsplit if it's the split tab
      if (i === splitTabIndex) {
        useAppStore.getState().toggleSplitMode();
      } else {
        useAppStore.getState().closeTab(i);
      }
    } else {
      useAppStore.getState().closeTab(i);
    }
  }

  return (
    <div
      className="flex border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-surface-900/80 overflow-x-auto shrink-0 vs-border"
      onDragLeave={() => setDragOverIndex(-1)}
    >
      {tabs.map((tab, i) => (
        <TabItem
          key={tab.file.path}
          name={tab.file.name}
          isActive={i === currentActiveIndex}
          index={i}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragOver={i === dragOverIndex}
          onClick={() => handleTabClick(i)}
          onClose={(e) => handleClose(e, i)}
        />
      ))}
    </div>
  );
}
