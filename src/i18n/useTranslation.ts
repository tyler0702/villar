import { useAppStore } from "../stores/useAppStore";
import { translations } from "./translations";

export function useTranslation() {
  const language = useAppStore((s) => s.settings.language);
  const dict = translations[language] ?? translations.en;
  const fallback = translations.en;

  return function t(key: string): string {
    return dict[key] ?? fallback[key] ?? key;
  };
}
