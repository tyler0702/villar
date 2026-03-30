import { useState } from "react";
import { useUpdateCheck } from "../../hooks/useUpdateCheck";
import { useTranslation } from "../../i18n/useTranslation";

export function UpdateBanner() {
  const { hasUpdate, latestVersion, dismiss, skipVersion } = useUpdateCheck();
  const t = useTranslation();
  const [updating, setUpdating] = useState(false);

  if (!hasUpdate) return null;

  const message = t("update.available").replace("{version}", latestVersion);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      }
    } catch {
      // Fallback: open release page
      try {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(`https://github.com/tyler0702/villar/releases/latest`);
      } catch {
        window.open(`https://github.com/tyler0702/villar/releases/latest`, "_blank");
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-1.5 bg-accent-100 dark:bg-accent-900/60 text-accent-800 dark:text-accent-200 text-xs shrink-0">
      <span className="font-medium">{message}</span>
      <button
        onClick={handleUpdate}
        disabled={updating}
        className="px-2 py-0.5 rounded bg-accent-500 text-white text-[11px] font-medium hover:bg-accent-600 transition-colors disabled:opacity-50"
      >
        {updating ? t("update.updating") : t("update.download")}
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
