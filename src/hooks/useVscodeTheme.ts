import { useEffect } from "react";
import { useAppStore } from "../stores/useAppStore";

export function useVscodeTheme() {
  const themeColors = useAppStore((s) => s.settings.vscodeTheme);

  useEffect(() => {
    const root = document.documentElement;

    if (!themeColors) {
      root.removeAttribute("data-vscode-theme");
      root.style.removeProperty("--vs-bg");
      root.style.removeProperty("--vs-fg");
      root.style.removeProperty("--vs-accent");
      root.style.removeProperty("--vs-sidebar-bg");
      root.style.removeProperty("--vs-sidebar-fg");
      root.style.removeProperty("--vs-editor-bg");
      root.style.removeProperty("--vs-editor-fg");
      root.style.removeProperty("--vs-border");
      root.style.removeProperty("--vs-selection");
      return;
    }

    root.setAttribute("data-vscode-theme", themeColors.name);
    root.style.setProperty("--vs-bg", themeColors.bg);
    root.style.setProperty("--vs-fg", themeColors.fg);
    root.style.setProperty("--vs-accent", themeColors.accent);
    root.style.setProperty("--vs-sidebar-bg", themeColors.sidebarBg);
    root.style.setProperty("--vs-sidebar-fg", themeColors.sidebarFg);
    root.style.setProperty("--vs-editor-bg", themeColors.editorBg);
    root.style.setProperty("--vs-editor-fg", themeColors.editorFg);
    root.style.setProperty("--vs-border", themeColors.border);
    root.style.setProperty("--vs-selection", themeColors.selectionBg);
  }, [themeColors]);
}
