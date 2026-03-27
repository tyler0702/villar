import { en } from "./locales/en";
import { ja } from "./locales/ja";
import { zhTW } from "./locales/zh-TW";
import { zhCN } from "./locales/zh-CN";
import { ko } from "./locales/ko";
import { ar } from "./locales/ar";
import { es } from "./locales/es";
import { de } from "./locales/de";
import { ms } from "./locales/ms";
import { vi } from "./locales/vi";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "\u65E5\u672C\u8A9E" },
  { code: "zh-TW", label: "\u7E41\u9AD4\u4E2D\u6587" },
  { code: "zh-CN", label: "\u7B80\u4F53\u4E2D\u6587" },
  { code: "ko", label: "\uD55C\uAD6D\uC5B4" },
  { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
  { code: "es", label: "Espa\u00F1ol" },
  { code: "de", label: "Deutsch" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "vi", label: "Ti\u1EBFng Vi\u1EC7t" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export type TranslationDict = { [key: string]: string };

export const translations: Record<string, TranslationDict> = {
  en,
  ja,
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  ko,
  ar,
  es,
  de,
  ms,
  vi,
};
