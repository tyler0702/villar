import { useEffect } from "react";
import { useAppStore } from "../stores/useAppStore";

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

  useEffect(() => {
    const root = document.documentElement;

    if (!vscodeTheme) {
      // No theme selected — use system preference
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mq.matches);
      const handler = (e: MediaQueryListEvent) => root.classList.toggle("dark", e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    // Auto-detect dark/light from background color luminance
    const isDark = hexLuminance(vscodeTheme.bg) < 0.5;
    root.classList.toggle("dark", isDark);
  }, [vscodeTheme]);
}
