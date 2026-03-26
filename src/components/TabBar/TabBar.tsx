import { useRef, useState, useCallback } from "react";
import { useAppStore } from "../../stores/useAppStore";

interface TabBarProps {
  pane?: "left" | "right";
}

interface DragState {
  from: number;
  insertBefore: number; // index where the tab would be inserted
  offsetX: number; // cursor offset from tab left edge
  tabWidth: number; // width of the dragged tab
  translateX: number; // current translateX for the dragged tab
}

export function TabBar({ pane }: TabBarProps) {
  const tabs = useAppStore((s) => s.tabs);
  const activeTabIndex = useAppStore((s) => s.activeTabIndex);
  const splitMode = useAppStore((s) => s.splitMode);
  const splitTabIndex = useAppStore((s) => s.splitTabIndex);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const didDrag = useRef(false);
  const tabRectsRef = useRef<DOMRect[]>([]);

  if (tabs.length <= 1 && !splitMode) return null;

  const isRight = pane === "right";
  const currentActiveIndex = isRight ? splitTabIndex : activeTabIndex;

  function handleMouseDown(e: React.MouseEvent, i: number) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-close]")) return;
    e.preventDefault();

    const tabBar = (e.currentTarget as HTMLElement).closest("[data-tabbar]");
    if (!tabBar) return;

    // Snapshot all tab positions
    const tabEls = tabBar.querySelectorAll<HTMLElement>("[data-tab-index]");
    const rects: DOMRect[] = [];
    tabEls.forEach((el) => rects.push(el.getBoundingClientRect()));
    tabRectsRef.current = rects;

    const tabRect = rects[i];
    const offsetX = e.clientX - tabRect.left;

    didDrag.current = false;
    const startX = e.clientX;

    const initial: DragState = {
      from: i,
      insertBefore: i,
      offsetX,
      tabWidth: tabRect.width,
      translateX: 0,
    };
    dragRef.current = initial;

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      if (!didDrag.current && Math.abs(dx) < 4) return;
      didDrag.current = true;

      // Compute where to insert based on cursor position
      const rects = tabRectsRef.current;
      let insertIdx = rects.length;
      for (let j = 0; j < rects.length; j++) {
        const mid = rects[j].left + rects[j].width / 2;
        if (ev.clientX < mid) {
          insertIdx = j;
          break;
        }
      }

      // Adjust: if inserting after the source, the effective index stays the same
      // because the source will be removed first
      const next: DragState = {
        ...initial,
        translateX: dx,
        insertBefore: insertIdx,
      };
      dragRef.current = next;
      setDragState({ ...next });
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      const d = dragRef.current;
      if (didDrag.current && d) {
        // Convert insertBefore to reorder target
        let to = d.insertBefore;
        if (to > d.from) to--; // adjust for removal
        if (d.from !== to && to >= 0) {
          useAppStore.getState().reorderTab(d.from, to);
        }
      } else {
        // Click
        if (isRight) {
          useAppStore.getState().setSplitTabIndex(i);
        } else {
          useAppStore.getState().setActiveTab(i);
        }
      }

      dragRef.current = null;
      setDragState(null);
      didDrag.current = false;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }

  function handleClose(e: React.MouseEvent, i: number) {
    e.stopPropagation();
    if (isRight && i === splitTabIndex) {
      useAppStore.getState().toggleSplitMode();
    } else {
      useAppStore.getState().closeTab(i);
    }
  }

  // Compute visual shifts for each tab during drag
  function getTabStyle(i: number): React.CSSProperties | undefined {
    if (!dragState) return undefined;
    const { from, insertBefore, translateX, tabWidth } = dragState;

    if (i === from) {
      // The dragged tab: follow cursor, elevate
      return {
        transform: `translateX(${translateX}px)`,
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        transition: "box-shadow 0.15s",
        position: "relative",
      };
    }

    // Other tabs: shift to make room
    const effectiveInsert = insertBefore > from ? insertBefore - 1 : insertBefore;
    let shift = 0;
    if (from < i && i <= effectiveInsert) {
      // Tab needs to shift left to fill the gap
      shift = -tabWidth;
    } else if (from > i && i >= effectiveInsert) {
      // Tab needs to shift right to make room
      shift = tabWidth;
    }

    if (shift !== 0) {
      return {
        transform: `translateX(${shift}px)`,
        transition: "transform 0.15s ease",
      };
    }
    return { transition: "transform 0.15s ease" };
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
          style={getTabStyle(i)}
          className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs border-b-2 shrink-0 select-none ${
            dragState?.from === i ? "cursor-grabbing" : "cursor-grab"
          } ${
            i === currentActiveIndex
              ? "border-accent-400 text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-surface-800/50"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
          }`}
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
