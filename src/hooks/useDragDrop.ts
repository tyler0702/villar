import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FsNode } from "../stores/useAppStore";

interface DragDropPayload {
  paths: string[];
  position: { x: number; y: number };
}

async function openFolder(path: string) {
  useAppStore.getState().setFolderPath(path);

  const tree = await invoke<FsNode[]>("list_md_files", { dirPath: path });
  useAppStore.getState().setTree(tree);
  await invoke("watch_folder", { dirPath: path });
}

async function openFile(path: string) {
  const name = path.split("/").pop() ?? path;
  const file = { name, path };
  const content = await invoke<string>("read_file", { filePath: path });
  useAppStore.getState().openTab(file, content);
}

export function useDragDrop() {
  useEffect(() => {
    const unlisten = listen<DragDropPayload>("tauri://drag-drop", async (event) => {
      const paths = event.payload.paths;
      if (!paths || paths.length === 0) return;

      const first = paths[0];

      try {
        await invoke<FsNode[]>("list_md_files", { dirPath: first });
        await openFolder(first);
      } catch {
        if (first.endsWith(".md")) {
          const folderPath = useAppStore.getState().folderPath;
          if (!folderPath) {
            const parentDir = first.substring(0, first.lastIndexOf("/"));
            if (parentDir) await openFolder(parentDir);
          }
          await openFile(first);
        }
      }
    });

    return () => { unlisten.then((fn) => fn()); };
  }, []);
}
