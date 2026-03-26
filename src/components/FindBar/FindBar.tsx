import { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore } from "../../stores/useAppStore";

export function FindBar() {
  const findQuery = useAppStore((s) => s.findQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doFind = useCallback((query: string, forward = true) => {
    if (!query || query.length < 1) {
      setMatchCount(null);
      return;
    }
    try {
      const found = (window as unknown as { find: (s: string, caseSensitive: boolean, backwards: boolean) => boolean })
        .find(query, false, !forward);
      setMatchCount(found ? -1 : 0); // -1 = found (count unknown), 0 = not found
    } catch {
      setMatchCount(null);
    }
  }, []);

  function handleClose() {
    useAppStore.getState().setFindOpen(false);
    useAppStore.getState().setFindQuery("");
    setMatchCount(null);
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      handleClose();
      return;
    }
    if (e.key === "Enter" && !composingRef.current) {
      e.preventDefault();
      doFind(findQuery, !e.shiftKey);
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm shrink-0">
      <span className="text-[10px] text-gray-400">Find</span>
      <input
        ref={inputRef}
        type="text"
        value={findQuery}
        onChange={(e) => {
          useAppStore.getState().setFindQuery(e.target.value);
          // Don't auto-search during IME composition
        }}
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={(e) => {
          composingRef.current = false;
          // Update with final composed value
          useAppStore.getState().setFindQuery((e.target as HTMLInputElement).value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search in document..."
        className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none"
      />
      <div className="flex items-center gap-1.5">
        {matchCount === 0 ? (
          <span className="text-[10px] text-red-400">No match</span>
        ) : matchCount === -1 ? (
          <span className="text-[10px] text-green-500">Found</span>
        ) : null}
        <span className="text-[10px] text-gray-400">Enter / Shift+Enter</span>
      </div>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
      >
        &times;
      </button>
    </div>
  );
}
