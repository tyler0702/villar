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
  { id: "sf-pro", label: "SF Pro", value: '"SF Pro Display", "SF Pro Text", -apple-system, sans-serif', category: "sans" },
  { id: "helvetica", label: "Helvetica Neue", value: '"Helvetica Neue", Helvetica, Arial, sans-serif', category: "sans" },
  { id: "noto-sans", label: "Noto Sans", value: '"Noto Sans", "Noto Sans JP", sans-serif', category: "sans" },
  { id: "roboto", label: "Roboto", value: '"Roboto", "Helvetica Neue", Arial, sans-serif', category: "sans" },
  { id: "open-sans", label: "Open Sans", value: '"Open Sans", "Helvetica Neue", Arial, sans-serif', category: "sans" },
  { id: "lato", label: "Lato", value: '"Lato", "Helvetica Neue", Arial, sans-serif', category: "sans" },
  { id: "source-sans", label: "Source Sans 3", value: '"Source Sans 3", "Source Sans Pro", sans-serif', category: "sans" },
  { id: "nunito", label: "Nunito", value: '"Nunito", "Nunito Sans", sans-serif', category: "sans" },
  { id: "avenir", label: "Avenir", value: '"Avenir Next", Avenir, "Helvetica Neue", sans-serif', category: "sans" },
  { id: "futura", label: "Futura", value: 'Futura, "Trebuchet MS", sans-serif', category: "sans" },

  // Serif
  { id: "georgia", label: "Georgia", value: "Georgia, Cambria, serif", category: "serif" },
  { id: "times", label: "Times New Roman", value: '"Times New Roman", Times, serif', category: "serif" },
  { id: "charter", label: "Charter", value: "Charter, Georgia, serif", category: "serif" },
  { id: "noto-serif", label: "Noto Serif", value: '"Noto Serif", "Noto Serif JP", serif', category: "serif" },
  { id: "palatino", label: "Palatino", value: '"Palatino Linotype", Palatino, "Book Antiqua", serif', category: "serif" },
  { id: "garamond", label: "Garamond", value: 'Garamond, "EB Garamond", "Times New Roman", serif', category: "serif" },
  { id: "baskerville", label: "Baskerville", value: 'Baskerville, "Libre Baskerville", Georgia, serif', category: "serif" },
  { id: "merriweather", label: "Merriweather", value: '"Merriweather", Georgia, serif', category: "serif" },
  { id: "source-serif", label: "Source Serif 4", value: '"Source Serif 4", "Source Serif Pro", Georgia, serif', category: "serif" },
  { id: "literata", label: "Literata", value: '"Literata", Georgia, serif', category: "serif" },

  // Monospace
  { id: "mono", label: "System Mono", value: 'ui-monospace, "SF Mono", Menlo, monospace', category: "mono" },
  { id: "jetbrains", label: "JetBrains Mono", value: '"JetBrains Mono", "Fira Code", monospace', category: "mono" },
  { id: "fira-code", label: "Fira Code", value: '"Fira Code", "JetBrains Mono", monospace', category: "mono" },
  { id: "cascadia", label: "Cascadia Code", value: '"Cascadia Code", "Cascadia Mono", Consolas, monospace', category: "mono" },
  { id: "consolas", label: "Consolas", value: 'Consolas, "Courier New", monospace', category: "mono" },
  { id: "ibm-plex", label: "IBM Plex Mono", value: '"IBM Plex Mono", "Courier New", monospace', category: "mono" },
  { id: "source-code", label: "Source Code Pro", value: '"Source Code Pro", Menlo, monospace', category: "mono" },
];
