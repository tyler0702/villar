import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FsNode } from "../stores/useAppStore";

interface DragDropPayload {
  paths: string[];
  position: { x: number; y: number };
}

async function openFolder(path: string) {
  const { setFolderPath, setSelectedFile, setFileContent, setTree } = useAppStore.getState();
  setFolderPath(path);
  setSelectedFile(null);
  setFileContent(null);

  const tree = await invoke<FsNode[]>("list_md_files", { dirPath: path });
  setTree(tree);
  await invoke("watch_folder", { dirPath: path });
}

async function openFile(path: string) {
  const name = path.split("/").pop() ?? path;
  const file = { name, path };
  useAppStore.getState().setSelectedFile(file);
  const content = await invoke<string>("read_file", { filePath: path });
  useAppStore.getState().setFileContent(content);
}

export function useDragDrop() {
  useEffect(() => {
    const unlisten = listen<DragDropPayload>("tauri://drag-drop", async (event) => {
      const paths = event.payload.paths;
      if (!paths || paths.length === 0) return;

      const first = paths[0];

      // Check if it's a directory or a .md file
      try {
        // Try listing as directory first
        await invoke<FsNode[]>("list_md_files", { dirPath: first });
        await openFolder(first);
      } catch {
        // Not a directory — try as file
        if (first.endsWith(".md")) {
          // If no folder is open, open the parent folder
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
