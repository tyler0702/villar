import { useEffect, useRef } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { useTranslation } from "../../i18n/useTranslation";

export function FindBar() {
  const t = useTranslation();
  const findQuery = useAppStore((s) => s.findQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!findQuery) return;

    // Use browser's built-in find & highlight via CSS custom highlight API or window.find
    // For simplicity, use the Selection + highlight approach
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();

    if (findQuery.length < 2) return;

    // Use window.find for native browser find
    // This works in WebKit (Tauri uses WebKit on macOS)
    try {
      (window as unknown as { find: (s: string) => boolean }).find(findQuery);
    } catch {
      // fallback: do nothing
    }
  }, [findQuery]);

  function handleClose() {
    useAppStore.getState().setFindOpen(false);
    useAppStore.getState().setFindQuery("");
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm shrink-0">
      <span className="text-[10px] text-gray-400">{t("find.label")}</span>
      <input
        ref={inputRef}
        type="text"
        value={findQuery}
        onChange={(e) => useAppStore.getState().setFindQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
          if (e.key === "Enter") {
            try {
              (window as unknown as { find: (s: string) => boolean }).find(findQuery);
            } catch { /* */ }
          }
        }}
        placeholder={t("find.placeholder")}
        className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none"
      />
      <span className="text-[10px] text-gray-400">{t("find.enterNext")}</span>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
      >
        &times;
      </button>
    </div>
  );
}
