import { useEffect } from "react";
import { useAppStore } from "../stores/useAppStore";

export function useKeyboard(sectionCount: number) {
  const setActiveCardIndex = useAppStore((s) => s.setActiveCardIndex);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const { activeCardIndex } = useAppStore.getState();

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
        case "t":
          {
            const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
            setTheme(next);
          }
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
  }, [sectionCount, setActiveCardIndex, toggleFocusMode, theme, setTheme]);
}
