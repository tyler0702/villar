import { memo, useRef, useState, useCallback } from "react";
import { useAppStore } from "../../stores/useAppStore";

interface TabBarProps {
  pane?: "left" | "right";
}

export function TabBar({ pane }: TabBarProps) {
  const tabs = useAppStore((s) => s.tabs);
  const activeTabIndex = useAppStore((s) => s.activeTabIndex);
  const splitMode = useAppStore((s) => s.splitMode);
  const splitTabIndex = useAppStore((s) => s.splitTabIndex);

  const [dragging, setDragging] = useState(-1);
  const [dropTarget, setDropTarget] = useState(-1);
  const dragStartX = useRef(0);
  const dragIndex = useRef(-1);

  if (tabs.length <= 1 && !splitMode) return null;

  const isRight = pane === "right";
  const currentActiveIndex = isRight ? splitTabIndex : activeTabIndex;

  function handleMouseDown(e: React.MouseEvent, i: number) {
    // Only left button, ignore close button
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-close]")) return;

    dragStartX.current = e.clientX;
    dragIndex.current = i;

    const onMouseMove = (ev: MouseEvent) => {
      if (Math.abs(ev.clientX - dragStartX.current) > 5) {
        setDragging(dragIndex.current);

        // Find which tab we're over
        const tabBar = (e.target as HTMLElement).closest("[data-tabbar]");
        if (!tabBar) return;
        const tabElements = tabBar.querySelectorAll("[data-tab-index]");
        for (const el of tabElements) {
          const rect = el.getBoundingClientRect();
          if (ev.clientX >= rect.left && ev.clientX <= rect.right) {
            const idx = parseInt(el.getAttribute("data-tab-index") ?? "-1", 10);
            setDropTarget(idx);
            break;
          }
        }
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      if (dragging >= 0 || Math.abs(0) > 0) {
        const from = dragIndex.current;
        const to = dropTarget;
        if (from >= 0 && to >= 0 && from !== to) {
          useAppStore.getState().reorderTab(from, to);
        }
      }
      setDragging(-1);
      setDropTarget(-1);
      dragIndex.current = -1;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
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
    if (isRight && i === splitTabIndex) {
      useAppStore.getState().toggleSplitMode();
    } else {
      useAppStore.getState().closeTab(i);
    }
  }

  return (
    <div
      data-tabbar
      className="flex border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-surface-900/80 overflow-x-auto shrink-0 vs-border"
    >
      {tabs.map((tab, i) => (
        <div
          key={tab.file.path}
          data-tab-index={i}
          onMouseDown={(e) => handleMouseDown(e, i)}
          onClick={() => handleTabClick(i)}
          className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-b-2 transition-colors shrink-0 select-none ${
            i === dropTarget && dragging >= 0
              ? "border-accent-400 bg-accent-50/30 dark:bg-accent-900/20"
              : i === currentActiveIndex
                ? "border-accent-400 text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-surface-800/50"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
          } ${dragging === i ? "opacity-50" : ""}`}
        >
          <span className="truncate max-w-[120px]">{tab.file.name.replace(/\.md$/, "")}</span>
          <button
            data-close
            onClick={(e) => handleClose(e, i)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-[10px] leading-none transition-opacity"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
