import { useRef, useState } from "react";
import { useAppStore } from "../../stores/useAppStore";

interface TabBarProps {
  pane: "left" | "right";
}

interface DragState {
  from: number;
  insertBefore: number;
  offsetX: number;
  tabWidth: number;
  translateX: number;
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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabIndex: number } | null>(null);

  const isRight = pane === "right";
  const currentActiveIndex = isRight ? splitTabIndex : activeTabIndex;

  // In non-split mode, right pane TabBar doesn't render
  if (!splitMode && isRight) return null;
  // Show TabBar only if there are tabs
  if (tabs.length === 0) return null;
  // Non-split left: show only if 2+ tabs
  if (!splitMode && !isRight && tabs.length <= 1) return null;

  function handleMouseDown(e: React.MouseEvent, i: number) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-close]")) return;
    e.preventDefault();

    const tabBar = (e.currentTarget as HTMLElement).closest("[data-tabbar]");
    if (!tabBar) return;

    const tabEls = tabBar.querySelectorAll<HTMLElement>("[data-tab-index]");
    const rects: DOMRect[] = [];
    tabEls.forEach((el) => rects.push(el.getBoundingClientRect()));
    tabRectsRef.current = rects;

    const tabRect = rects[i];
    if (!tabRect) return;
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

      const rects = tabRectsRef.current;
      let insertIdx = rects.length;
      for (let j = 0; j < rects.length; j++) {
        const mid = rects[j].left + rects[j].width / 2;
        if (ev.clientX < mid) {
          insertIdx = j;
          break;
        }
      }

      const next: DragState = { ...initial, translateX: dx, insertBefore: insertIdx };
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
        let to = d.insertBefore;
        if (to > d.from) to--;
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

  function handleContextMenu(e: React.MouseEvent, i: number) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabIndex: i });
  }

  function handleClose(e: React.MouseEvent, i: number) {
    e.stopPropagation();
    useAppStore.getState().closeTab(i);
    // If we closed the split tab, exit split
    if (splitMode && i === splitTabIndex) {
      useAppStore.getState().toggleSplitMode();
    }
  }

  function handleSplitRight(tabIndex: number) {
    setContextMenu(null);
    if (!splitMode) {
      useAppStore.getState().moveTabToSplit(tabIndex);
    } else {
      useAppStore.getState().setSplitTabIndex(tabIndex);
    }
  }

  function handleMoveToLeft(tabIndex: number) {
    setContextMenu(null);
    useAppStore.getState().setActiveTab(tabIndex);
  }

  function handleCloseOthers(tabIndex: number) {
    setContextMenu(null);
    const { tabs } = useAppStore.getState();
    // Close all except this one (iterate in reverse to keep indices stable)
    for (let i = tabs.length - 1; i >= 0; i--) {
      if (i !== tabIndex) {
        useAppStore.getState().closeTab(i);
      }
    }
  }

  function getTabStyle(i: number): React.CSSProperties | undefined {
    if (!dragState) return undefined;
    const { from, insertBefore, translateX, tabWidth } = dragState;

    if (i === from) {
      return {
        transform: `translateX(${translateX}px)`,
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        transition: "box-shadow 0.15s",
        position: "relative",
      };
    }

    const effectiveInsert = insertBefore > from ? insertBefore - 1 : insertBefore;
    let shift = 0;
    if (from < i && i <= effectiveInsert) shift = -tabWidth;
    else if (from > i && i >= effectiveInsert) shift = tabWidth;

    return shift !== 0
      ? { transform: `translateX(${shift}px)`, transition: "transform 0.15s ease" }
      : { transition: "transform 0.15s ease" };
  }

  // Highlight which tabs belong to this pane
  function isTabInThisPane(i: number): boolean {
    if (!splitMode) return true;
    if (isRight) return i === splitTabIndex;
    return i === activeTabIndex;
  }

  return (
    <>
      <div
        data-tabbar
        className="flex border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-surface-900/80 overflow-x-auto shrink-0 vs-border"
      >
        {tabs.map((tab, i) => {
          const isActiveInPane = i === currentActiveIndex;
          const dimmed = splitMode && !isTabInThisPane(i) && !isActiveInPane;
          return (
            <div
              key={tab.file.path}
              data-tab-index={i}
              onMouseDown={(e) => handleMouseDown(e, i)}
              onContextMenu={(e) => handleContextMenu(e, i)}
              style={getTabStyle(i)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs border-b-2 shrink-0 select-none ${
                dragState?.from === i ? "cursor-grabbing" : "cursor-grab"
              } ${
                isActiveInPane
                  ? "border-accent-400 text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-surface-800/50"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
              } ${dimmed ? "opacity-40" : ""}`}
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
          );
        })}
      </div>

      {/* Context menu */}
      {contextMenu ? (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        >
          <div
            className="absolute bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-gray-200/60 dark:border-gray-700/60 py-1 min-w-[160px] text-xs"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleSplitRight(contextMenu.tabIndex)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Open in Split Right
            </button>
            {splitMode && isRight ? (
              <button
                onClick={() => handleMoveToLeft(contextMenu.tabIndex)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Move to Left Pane
              </button>
            ) : null}
            <button
              onClick={() => handleCloseOthers(contextMenu.tabIndex)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Close Others
            </button>
            <button
              onClick={() => { setContextMenu(null); handleClose({ stopPropagation: () => {} } as React.MouseEvent, contextMenu.tabIndex); }}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-red-500"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
