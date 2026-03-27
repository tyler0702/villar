import { useUpdateCheck } from "../../hooks/useUpdateCheck";
import { useTranslation } from "../../i18n/useTranslation";

async function openUrl(url: string) {
  try {
    const { openUrl: open } = await import("@tauri-apps/plugin-opener");
    await open(url);
  } catch {
    window.open(url, "_blank");
  }
}

export function UpdateBanner() {
  const { hasUpdate, latestVersion, releaseUrl, dismiss, skipVersion } = useUpdateCheck();
  const t = useTranslation();

  if (!hasUpdate) return null;

  const message = t("update.available").replace("{version}", latestVersion);

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-1.5 bg-accent-100 dark:bg-accent-900/60 text-accent-800 dark:text-accent-200 text-xs shrink-0">
      <span className="font-medium">{message}</span>
      <button
        onClick={() => openUrl(releaseUrl)}
        className="px-2 py-0.5 rounded bg-accent-500 text-white text-[11px] font-medium hover:bg-accent-600 transition-colors"
      >
        {t("update.download")}
      </button>
      <button
        onClick={dismiss}
        className="px-2 py-0.5 rounded text-[11px] opacity-70 hover:opacity-100 transition-opacity"
      >
        {t("update.later")}
      </button>
      <button
        onClick={skipVersion}
        className="px-2 py-0.5 rounded text-[11px] opacity-50 hover:opacity-80 transition-opacity"
      >
        {t("update.skip")}
      </button>
    </div>
  );
}
