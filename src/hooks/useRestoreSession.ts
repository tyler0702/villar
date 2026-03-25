import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FsNode } from "../stores/useAppStore";

export function useRestoreSession() {
  const didRestore = useRef(false);

  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;

    const { folderPath, tabs, settings } = useAppStore.getState();
    if (!folderPath || !settings.restoreSession) return;

    (async () => {
      try {
        const tree = await invoke<FsNode[]>("list_md_files", { dirPath: folderPath });
        useAppStore.getState().setTree(tree);
        await invoke("watch_folder", { dirPath: folderPath });

        // Restore content for all open tabs
        for (const tab of tabs) {
          try {
            const content = await invoke<string>("read_file", { filePath: tab.file.path });
            useAppStore.getState().setTabContent(tab.file.path, content);
          } catch {
            // File may have been deleted
          }
        }
      } catch {
        useAppStore.getState().setFolderPath(null);
      }
    })();
  }, []);
}
