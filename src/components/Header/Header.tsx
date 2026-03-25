import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FileEntry } from "../../stores/useAppStore";

export function Header() {
  const { folderPath, selectedFile, setFolderPath, setFiles, setSelectedFile, setFileContent } =
    useAppStore();
  const focusMode = useAppStore((s) => s.focusMode);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  async function handleOpenFolder() {
    const selected = await open({ directory: true, multiple: false });
    if (!selected) return;

    const path = selected as string;
    setFolderPath(path);
    setSelectedFile(null);
    setFileContent(null);

    const files = await invoke<FileEntry[]>("list_md_files", { dirPath: path });
    setFiles(files);

    // Start file watching
    await invoke("watch_folder", { dirPath: path });
  }

  function cycleTheme() {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  }

  const themeLabel = theme === "system" ? "Auto" : theme === "light" ? "Light" : "Dark";
  const folderName = folderPath ? folderPath.split("/").pop() : null;

  return (
    <header className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
      <button
        onClick={handleOpenFolder}
        className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
      >
        Open Folder
      </button>
      {folderName && (
        <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {folderName}
        </span>
      )}
      {selectedFile && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
          {selectedFile.name}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleFocusMode}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            focusMode
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          Focus
        </button>
        <button
          onClick={cycleTheme}
          className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
        >
          {themeLabel}
        </button>
      </div>
    </header>
  );
}
