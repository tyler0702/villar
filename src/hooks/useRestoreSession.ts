import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FsNode } from "../stores/useAppStore";

export function useRestoreSession() {
  const didRestore = useRef(false);

  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;

    const { folderPath, selectedFile, settings } = useAppStore.getState();
    if (!folderPath || !settings.restoreSession) return;

    (async () => {
      try {
        const tree = await invoke<FsNode[]>("list_md_files", { dirPath: folderPath });
        useAppStore.getState().setTree(tree);
        await invoke("watch_folder", { dirPath: folderPath });

        if (selectedFile) {
          const content = await invoke<string>("read_file", { filePath: selectedFile.path });
          useAppStore.getState().setFileContent(content);
        }
      } catch {
        // Folder may no longer exist — clear it
        useAppStore.getState().setFolderPath(null);
        useAppStore.getState().setSelectedFile(null);
      }
    })();
  }, []);
}
