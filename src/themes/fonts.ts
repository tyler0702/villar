export interface FontOption {
  id: string;
  label: string;
  value: string; // CSS font-family value
  category: "sans" | "serif" | "mono" | "jp" | "zh" | "ko" | "ar" | "intl";
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

  // Chinese
  { id: "pingfang-sc", label: "苹方 (PingFang SC)", value: '"PingFang SC", "Hiragino Sans GB", sans-serif', category: "zh" },
  { id: "pingfang-tc", label: "蘋方 (PingFang TC)", value: '"PingFang TC", "Hiragino Sans", sans-serif', category: "zh" },
  { id: "songti-sc", label: "宋体 (Songti SC)", value: '"Songti SC", "STSong", serif', category: "zh" },
  { id: "kaiti-sc", label: "楷体 (Kaiti SC)", value: '"Kaiti SC", "STKaiti", serif', category: "zh" },
  { id: "noto-sans-sc", label: "Noto Sans SC", value: '"Noto Sans SC", "PingFang SC", sans-serif', category: "zh" },

  // Korean
  { id: "apple-sd-gothic", label: "Apple SD Gothic Neo", value: '"Apple SD Gothic Neo", "Malgun Gothic", sans-serif', category: "ko" },
  { id: "nanum-gothic", label: "NanumGothic", value: '"NanumGothic", "Apple SD Gothic Neo", sans-serif', category: "ko" },
  { id: "nanum-myeongjo", label: "NanumMyeongjo", value: '"NanumMyeongjo", "Batang", serif', category: "ko" },
  { id: "noto-sans-kr", label: "Noto Sans KR", value: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif', category: "ko" },
  { id: "malgun-gothic", label: "Malgun Gothic", value: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif', category: "ko" },

  // Arabic / RTL
  { id: "geeza-pro", label: "Geeza Pro", value: '"Geeza Pro", "Tahoma", sans-serif', category: "ar" },
  { id: "noto-sans-arabic", label: "Noto Sans Arabic", value: '"Noto Sans Arabic", "Geeza Pro", sans-serif', category: "ar" },
  { id: "baghdad", label: "Baghdad", value: 'Baghdad, "Geeza Pro", serif', category: "ar" },
  { id: "noto-naskh", label: "Noto Naskh Arabic", value: '"Noto Naskh Arabic", "Geeza Pro", serif', category: "ar" },
  { id: "damascus", label: "Damascus", value: 'Damascus, "Geeza Pro", sans-serif', category: "ar" },

  // Thai / Vietnamese / Malay (Latin-based with extended characters)
  { id: "thonburi", label: "Thonburi", value: 'Thonburi, "Helvetica Neue", sans-serif', category: "intl" },
  { id: "noto-sans-thai", label: "Noto Sans Thai", value: '"Noto Sans Thai", Thonburi, sans-serif', category: "intl" },
  { id: "noto-serif-display", label: "Noto Serif Display", value: '"Noto Serif Display", Georgia, serif', category: "intl" },
  { id: "eb-garamond", label: "EB Garamond", value: '"EB Garamond", Garamond, serif', category: "intl" },
  { id: "fira-sans", label: "Fira Sans", value: '"Fira Sans", "Helvetica Neue", sans-serif', category: "intl" },
];
