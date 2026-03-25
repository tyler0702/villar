export interface FontOption {
  id: string;
  label: string;
  value: string; // CSS font-family value
  category: "sans" | "serif" | "mono";
}

export const FONT_OPTIONS: FontOption[] = [
  // Sans-serif
  { id: "system", label: "System Default", value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', category: "sans" },
  { id: "inter", label: "Inter", value: '"Inter", "Helvetica Neue", Arial, sans-serif', category: "sans" },
  { id: "sf-pro", label: "SF Pro", value: '"SF Pro Display", -apple-system, sans-serif', category: "sans" },
  { id: "helvetica", label: "Helvetica Neue", value: '"Helvetica Neue", Helvetica, Arial, sans-serif', category: "sans" },
  { id: "noto-sans", label: "Noto Sans", value: '"Noto Sans", "Noto Sans JP", sans-serif', category: "sans" },

  // Serif
  { id: "georgia", label: "Georgia", value: "Georgia, Cambria, serif", category: "serif" },
  { id: "times", label: "Times New Roman", value: '"Times New Roman", Times, serif', category: "serif" },
  { id: "charter", label: "Charter", value: "Charter, Georgia, serif", category: "serif" },
  { id: "noto-serif", label: "Noto Serif", value: '"Noto Serif", "Noto Serif JP", serif', category: "serif" },

  // Monospace
  { id: "mono", label: "System Mono", value: 'ui-monospace, "SF Mono", Menlo, monospace', category: "mono" },
  { id: "jetbrains", label: "JetBrains Mono", value: '"JetBrains Mono", "Fira Code", monospace', category: "mono" },
];
