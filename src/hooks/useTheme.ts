import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../stores/useAppStore";
import { FONT_OPTIONS } from "../themes/fonts";
import { translations } from "../i18n/translations";

function hexLuminance(hex: string): number {
  const c = hex.replace("#", "");
  if (c.length < 6) return 0.5;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function useTheme() {
  const vscodeTheme = useAppStore((s) => s.settings.vscodeTheme);
  const fontFamily = useAppStore((s) => s.settings.fontFamily);
  const language = useAppStore((s) => s.settings.language);

  // Dark mode
  useEffect(() => {
    const root = document.documentElement;

    if (!vscodeTheme) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mq.matches);
      const handler = (e: MediaQueryListEvent) => root.classList.toggle("dark", e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    const isDark = hexLuminance(vscodeTheme.bg) < 0.5;
    root.classList.toggle("dark", isDark);
  }, [vscodeTheme]);

  // Font family
  useEffect(() => {
    const font = FONT_OPTIONS.find((f) => f.id === fontFamily);
    if (font) {
      document.documentElement.style.setProperty("--reading-font", font.value);
    }
    return () => {
      document.documentElement.style.removeProperty("--reading-font");
    };
  }, [fontFamily]);

  // Update menu bar when language changes
  useEffect(() => {
    const dict = translations[language] ?? translations.en;
    const labels: Record<string, string> = {};
    for (const [key, value] of Object.entries(dict)) {
      if (key.startsWith("menu.")) {
        labels[key] = value;
      }
    }
    invoke("update_menu", { labels }).catch(() => {});
  }, [language]);
}
