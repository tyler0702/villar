import { useEffect } from "react";
import { useAppStore } from "../stores/useAppStore";

const PROPS = [
  "bg", "fg", "accent", "sidebar-bg", "sidebar-fg",
  "editor-bg", "editor-fg", "border", "selection",
  "heading", "link", "code-bg", "code-fg",
  "blockquote-border", "blockquote-fg",
  "table-border", "table-header-bg",
] as const;

export function useVscodeTheme() {
  const themeColors = useAppStore((s) => s.settings.vscodeTheme);

  useEffect(() => {
    const root = document.documentElement;

    if (!themeColors) {
      root.removeAttribute("data-vscode-theme");
      for (const p of PROPS) root.style.removeProperty(`--vs-${p}`);
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
    root.style.setProperty("--vs-heading", themeColors.headingColor);
    root.style.setProperty("--vs-link", themeColors.linkColor);
    root.style.setProperty("--vs-code-bg", themeColors.codeBg);
    root.style.setProperty("--vs-code-fg", themeColors.codeFg);
    root.style.setProperty("--vs-blockquote-border", themeColors.blockquoteBorder);
    root.style.setProperty("--vs-blockquote-fg", themeColors.blockquoteFg);
    root.style.setProperty("--vs-table-border", themeColors.tableBorder);
    root.style.setProperty("--vs-table-header-bg", themeColors.tableHeaderBg);
  }, [themeColors]);
}
