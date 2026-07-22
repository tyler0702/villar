import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../stores/useAppStore";
import { logFileOpened } from "./useMetrics";

// Resolve a relative markdown link against the directory of the current file.
// Mirrors the path normalization used for images in useMarkdown.
export function resolveRelativePath(basePath: string, rel: string): string {
  const dir = basePath.substring(0, basePath.lastIndexOf("/"));
  const raw = rel.startsWith("/") ? rel : `${dir}/${rel}`;
  const parts = raw.split("/");
  const normalized: string[] = [];
  for (const p of parts) {
    if (p === ".") continue;
    if (p === ".." && normalized.length > 0) { normalized.pop(); continue; }
    normalized.push(p);
  }
  return normalized.join("/");
}

// Read a markdown file from disk and open (or focus) it as a tab inside villar.
// Returns true on success, false if the file could not be read.
export async function openMarkdownFileByPath(path: string): Promise<boolean> {
  try {
    const content = await invoke<string>("read_file", { filePath: path });
    const name = path.split("/").pop() ?? path;
    logFileOpened(path);
    useAppStore.getState().openTab({ name, path }, content);
    return true;
  } catch {
    return false;
  }
}
