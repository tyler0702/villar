import { useAppStore } from "../../stores/useAppStore";
import { useTranslation } from "../../i18n/useTranslation";

export function AboutDialog() {
  const close = () => useAppStore.getState().setAboutOpen(false);
  const t = useTranslation();

  const version = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "0.0.0";

  const openUrl = async (url: string) => {
    const { openUrl: open } = await import("@tauri-apps/plugin-opener");
    open(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={close}>
      <div
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 w-[320px] p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img src="/logo.png" alt="villar" className="w-16 h-16 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">villar</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t("about.version")} {version}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
          {t("about.desc")}
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => openUrl("https://tyler0702.github.io/villar/")}
            className="text-[11px] text-accent-600 dark:text-accent-400 hover:underline"
          >
            Website
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={() => openUrl("https://github.com/tyler0702/villar")}
            className="text-[11px] text-accent-600 dark:text-accent-400 hover:underline"
          >
            GitHub
          </button>
        </div>
        <button
          onClick={close}
          className="mt-5 px-6 py-1.5 text-xs font-medium rounded-lg bg-accent-100 dark:bg-accent-900 hover:bg-accent-200 dark:hover:bg-accent-800 text-accent-700 dark:text-accent-200 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
