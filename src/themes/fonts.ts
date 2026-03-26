export interface FontOption {
  id: string;
  label: string;
  value: string; // CSS font-family value
  category: "sans" | "serif" | "mono" | "jp";
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

  // Japanese
  { id: "noto-sans-jp", label: "Noto Sans JP", value: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "noto-serif-jp", label: "Noto Serif JP", value: '"Noto Serif JP", "Hiragino Mincho ProN", serif', category: "jp" },
  { id: "biz-udpgothic", label: "BIZ UDPGothic", value: '"BIZ UDPGothic", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "biz-udpmincho", label: "BIZ UDPMincho", value: '"BIZ UDPMincho", "Hiragino Mincho ProN", serif', category: "jp" },
  { id: "mplus-1p", label: "M PLUS 1p", value: '"M PLUS 1p", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "mplus-rounded-1c", label: "M PLUS Rounded 1c", value: '"M PLUS Rounded 1c", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "kosugi-maru", label: "Kosugi Maru", value: '"Kosugi Maru", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "sawarabi-gothic", label: "Sawarabi Gothic", value: '"Sawarabi Gothic", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "sawarabi-mincho", label: "Sawarabi Mincho", value: '"Sawarabi Mincho", "Hiragino Mincho ProN", serif', category: "jp" },
  { id: "zen-kaku-gothic-new", label: "Zen Kaku Gothic New", value: '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "zen-maru-gothic", label: "Zen Maru Gothic", value: '"Zen Maru Gothic", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "zen-old-mincho", label: "Zen Old Mincho", value: '"Zen Old Mincho", "Hiragino Mincho ProN", serif', category: "jp" },
  { id: "shippori-mincho", label: "Shippori Mincho", value: '"Shippori Mincho", "Hiragino Mincho ProN", serif', category: "jp" },
  { id: "klee-one", label: "Klee One", value: '"Klee One", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "murecho", label: "Murecho", value: '"Murecho", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
];
