import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../stores/useAppStore";

export function useMenuActions(onSearch: () => void) {
  useEffect(() => {
    const unlisten = listen<string>("menu-action", (event) => {
      const action = event.payload;
      switch (action) {
        case "open_folder":
          document.querySelector<HTMLButtonElement>("[data-open-folder]")?.click();
          break;
        case "close_tab": {
          const { tabs, activeTabIndex, closeTab } = useAppStore.getState();
          if (tabs.length > 0) closeTab(activeTabIndex);
          break;
        }
        case "find":
          useAppStore.getState().setFindOpen(true);
          break;
        case "search":
          onSearch();
          break;
        case "focus_mode":
          useAppStore.getState().toggleFocusMode();
          break;
        case "settings":
          { const s = useAppStore.getState(); s.setSettingsOpen(!s.settingsOpen); }
          break;
        case "zoom_in": {
          const s = useAppStore.getState().settings;
          useAppStore.getState().updateSettings({ fontScale: Math.min(150, s.fontScale + 10) });
          break;
        }
        case "zoom_out": {
          const s = useAppStore.getState().settings;
          useAppStore.getState().updateSettings({ fontScale: Math.max(50, s.fontScale - 10) });
          break;
        }
        case "zoom_reset":
          useAppStore.getState().updateSettings({ fontScale: 100 });
          break;
        case "prev_card": {
          const idx = useAppStore.getState().tabs[useAppStore.getState().activeTabIndex]?.activeCardIndex ?? 0;
          if (idx > 0) useAppStore.getState().navigateToCard(idx - 1);
          break;
        }
        case "next_card": {
          const idx = useAppStore.getState().tabs[useAppStore.getState().activeTabIndex]?.activeCardIndex ?? 0;
          useAppStore.getState().navigateToCard(idx + 1);
          break;
        }
        case "first_card":
          useAppStore.getState().navigateToCard(0);
          break;
        case "last_card":
          useAppStore.getState().navigateToCard(999);
          break;
        case "check_update":
          (async () => {
            try {
              const { check } = await import("@tauri-apps/plugin-updater");
              const update = await check();
              if (update) {
                await update.downloadAndInstall();
                const { relaunch } = await import("@tauri-apps/plugin-process");
                await relaunch();
              } else {
                const { message } = await import("@tauri-apps/plugin-dialog");
                await message("You are running the latest version.", { title: "villar", kind: "info" });
              }
            } catch {
              import("@tauri-apps/plugin-opener").then(m => m.openUrl("https://github.com/tyler0702/villar/releases/latest"));
            }
          })();
          break;
        case "about_villar":
          useAppStore.getState().setAboutOpen(true);
          break;
        case "open_website":
          import("@tauri-apps/plugin-opener").then(m => m.openUrl("https://tyler0702.github.io/villar/"));
          break;
        case "open_github":
          import("@tauri-apps/plugin-opener").then(m => m.openUrl("https://github.com/tyler0702/villar"));
          break;
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [onSearch]);
}
