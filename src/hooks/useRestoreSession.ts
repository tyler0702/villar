import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FsNode } from "../stores/useAppStore";

const TREE_TIMEOUT_MS = 15000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

export function useRestoreSession() {
  const didRestore = useRef(false);

  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;

    const { folderPath, tabs, settings } = useAppStore.getState();
    if (!folderPath || !settings.restoreSession) return;

    (async () => {
      // Scanning a folder can stall inside the OS (a stuck network mount, an
      // iCloud placeholder the file provider never downloads). Give up on the
      // tree instead of leaving the window blank forever, and open the tabs
      // either way so the user still has their documents.
      try {
        const tree = await withTimeout(
          invoke<FsNode[]>("list_md_files", { dirPath: folderPath }),
          TREE_TIMEOUT_MS
        );
        useAppStore.getState().setTree(tree);
        await invoke("watch_folder", { dirPath: folderPath });
      } catch {
        useAppStore.getState().setFolderPath(null);
      }

      // Restore content for all open tabs
      for (const tab of tabs) {
        try {
          const content = await invoke<string>("read_file", { filePath: tab.file.path });
          useAppStore.getState().setTabContent(tab.file.path, content);
        } catch {
          // File may have been deleted
        }
      }
    })();
  }, []);
}
