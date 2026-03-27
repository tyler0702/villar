import { useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FsNode } from "../stores/useAppStore";

export function useFileWatcher() {
  const handleFileChanged = useCallback(async (path: string) => {
    const { tabs } = useAppStore.getState();
    const tab = tabs.find((t) => t.file.path === path);
    if (tab) {
      const content = await invoke<string>("read_file", { filePath: path });
      useAppStore.getState().setTabContent(path, content);
    }
  }, []);

  useEffect(() => {
    const unlistenFile = listen<{ path: string }>("file-changed", (event) => {
      handleFileChanged(event.payload.path);
    });
    const unlistenTree = listen<{ path: string }>("tree-changed", async (event) => {
      const tree = await invoke<FsNode[]>("list_md_files", { dirPath: event.payload.path });
      useAppStore.getState().setTree(tree);
    });
    return () => {
      unlistenFile.then((fn) => fn());
      unlistenTree.then((fn) => fn());
    };
  }, [handleFileChanged]);
}
