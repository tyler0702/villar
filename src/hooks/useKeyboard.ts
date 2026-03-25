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

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const { activeCardIndex, setActiveCardIndex, toggleFocusMode } =
        useAppStore.getState();

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          if (activeCardIndex > 0) setActiveCardIndex(activeCardIndex - 1);
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          if (activeCardIndex < sectionCount - 1) setActiveCardIndex(activeCardIndex + 1);
          break;
        case "f":
          toggleFocusMode();
          break;
        case "Home":
          e.preventDefault();
          setActiveCardIndex(0);
          break;
        case "End":
          e.preventDefault();
          if (sectionCount > 0) setActiveCardIndex(sectionCount - 1);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sectionCount]);
}
