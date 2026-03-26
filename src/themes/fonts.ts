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

  // Japanese — macOS preinstalled + commonly installed
  { id: "hiragino-kaku", label: "ヒラギノ角ゴ", value: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif', category: "jp" },
  { id: "hiragino-sans", label: "ヒラギノ Sans", value: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "hiragino-mincho", label: "ヒラギノ明朝", value: '"Hiragino Mincho ProN", "YuMincho", serif', category: "jp" },
  { id: "yu-gothic", label: "游ゴシック", value: '"YuGothic", "Yu Gothic", "Hiragino Sans", sans-serif', category: "jp" },
  { id: "yu-mincho", label: "游明朝", value: '"YuMincho", "Yu Mincho", "Hiragino Mincho ProN", serif', category: "jp" },
  { id: "osaka", label: "Osaka", value: 'Osaka, "Hiragino Kaku Gothic ProN", sans-serif', category: "jp" },
  { id: "tsukushi-a-round", label: "筑紫A丸ゴシック", value: '"Tsukushi A Round Gothic", "Hiragino Sans", sans-serif', category: "jp" },
  { id: "tsukushi-b-round", label: "筑紫B丸ゴシック", value: '"Tsukushi B Round Gothic", "Hiragino Sans", sans-serif', category: "jp" },
  { id: "klee", label: "クレー", value: '"Klee", "Hiragino Sans", sans-serif', category: "jp" },
  { id: "toppan-bunkyu-gothic", label: "凸版文久ゴシック", value: '"Toppan Bunkyu Gothic", "Hiragino Sans", sans-serif', category: "jp" },
  { id: "toppan-bunkyu-mincho", label: "凸版文久明朝", value: '"Toppan Bunkyu Mincho", "Hiragino Mincho ProN", serif', category: "jp" },
  { id: "noto-sans-jp", label: "Noto Sans JP", value: '"Noto Sans JP", "Hiragino Sans", sans-serif', category: "jp" },
  { id: "noto-serif-jp", label: "Noto Serif JP", value: '"Noto Serif JP", "Hiragino Mincho ProN", serif', category: "jp" },
  { id: "biz-udpgothic", label: "BIZ UDPGothic", value: '"BIZ UDPGothic", "Hiragino Sans", sans-serif', category: "jp" },
  { id: "mplus-1p", label: "M PLUS 1p", value: '"M PLUS 1p", "Hiragino Sans", sans-serif', category: "jp" },
];
