import { useEffect, useRef } from "react";
import { useAppStore } from "../stores/useAppStore";

export function useKeyboard(sectionCount: number, onSearch?: () => void) {
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K — search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onSearchRef.current?.();
        return;
      }

      // Cmd+F — find in document
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        const { findOpen, setFindOpen } = useAppStore.getState();
        setFindOpen(!findOpen);
        return;
      }

      // Cmd+W — close tab
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault();
        const { tabs, activeTabIndex, closeTab } = useAppStore.getState();
        if (tabs.length > 0) closeTab(activeTabIndex);
        return;
      }

      // Cmd+, — settings
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        const { settingsOpen, setSettingsOpen } = useAppStore.getState();
        setSettingsOpen(!settingsOpen);
        return;
      }

      // Cmd+= / Cmd+- — font scale
      if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        const { settings, updateSettings } = useAppStore.getState();
        updateSettings({ fontScale: Math.min(150, settings.fontScale + 10) });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        const { settings, updateSettings } = useAppStore.getState();
        updateSettings({ fontScale: Math.max(50, settings.fontScale - 10) });
        return;
      }
      // Cmd+0 — reset font scale
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        useAppStore.getState().updateSettings({ fontScale: 100 });
        return;
      }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const state = useAppStore.getState();
      const activeTab = state.tabs[state.activeTabIndex];
      const activeCardIndex = activeTab?.activeCardIndex ?? 0;
      const { navigateToCard, toggleFocusMode } = state;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          if (activeCardIndex > 0) navigateToCard(activeCardIndex - 1);
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          if (activeCardIndex < sectionCount - 1) navigateToCard(activeCardIndex + 1);
          break;
        case " ": {
          e.preventDefault();
          const el = state.cardScrollRef?.current;
          if (el) {
            const amount = el.clientHeight * 0.8;
            el.scrollBy({ top: e.shiftKey ? -amount : amount, behavior: "smooth" });
          }
          break;
        }
        case "f":
          toggleFocusMode();
          break;
        case "Home":
          e.preventDefault();
          navigateToCard(0);
          break;
        case "End":
          e.preventDefault();
          if (sectionCount > 0) navigateToCard(sectionCount - 1);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sectionCount]);
}
