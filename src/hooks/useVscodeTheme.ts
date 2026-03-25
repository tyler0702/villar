import { useEffect } from "react";
import { useAppStore, type VscodeThemeColors } from "../stores/useAppStore";

export function parseVscodeTheme(json: unknown): VscodeThemeColors | null {
  try {
    const obj = json as Record<string, unknown>;
    const name = (obj.name as string) || "Custom Theme";
    const colors = obj.colors as Record<string, string> | undefined;
    if (!colors) return null;

    return {
      name,
      bg: colors["editor.background"] || "#1e1e1e",
      fg: colors["editor.foreground"] || "#d4d4d4",
      accent: colors["focusBorder"] || colors["button.background"] || colors["progressBar.background"] || "#007acc",
      sidebarBg: colors["sideBar.background"] || colors["editor.background"] || "#252526",
      sidebarFg: colors["sideBar.foreground"] || colors["editor.foreground"] || "#cccccc",
      editorBg: colors["editor.background"] || "#1e1e1e",
      editorFg: colors["editor.foreground"] || "#d4d4d4",
      border: colors["sideBar.border"] || colors["panel.border"] || "#333333",
      selectionBg: colors["editor.selectionBackground"] || "#264f78",
    };
  } catch {
    return null;
  }
}

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
