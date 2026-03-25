import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FsNode } from "../../stores/useAppStore";

interface HeaderProps {
  onSearchClick?: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
  const folderPath = useAppStore((s) => s.folderPath);
  const activeTab = useAppStore((s) => s.tabs[s.activeTabIndex] ?? null);
  const selectedFile = activeTab?.file ?? null;
  const focusMode = useAppStore((s) => s.focusMode);
  const theme = useAppStore((s) => s.settings.theme);

  async function handleOpenFolder() {
    const selected = await open({ directory: true, multiple: false });
    if (!selected) return;

    const path = selected as string;
    const { setFolderPath, setSelectedFile, setFileContent, setTree } = useAppStore.getState();
    setFolderPath(path);
    setSelectedFile(null);
    setFileContent(null);

    const tree = await invoke<FsNode[]>("list_md_files", { dirPath: path });
    setTree(tree);
    await invoke("watch_folder", { dirPath: path });
  }

  function cycleTheme() {
    const current = useAppStore.getState().settings.theme;
    const next = current === "system" ? "light" : current === "light" ? "dark" : "system";
    useAppStore.getState().updateSettings({ theme: next });
  }

  function handleToggleFocus() {
    useAppStore.getState().toggleFocusMode();
  }

  function handleOpenSettings() {
    useAppStore.getState().setSettingsOpen(true);
  }

  const themeIcon = theme === "system" ? "Auto" : theme === "light" ? "Light" : "Dark";
  const folderName = folderPath ? folderPath.split("/").pop() : null;

  return (
    <header className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm shrink-0">
      <button
        onClick={handleOpenFolder}
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent-100 dark:bg-accent-900 hover:bg-accent-200 dark:hover:bg-accent-800 text-accent-700 dark:text-accent-200 transition-colors"
      >
        Open
      </button>

      <div className="flex items-center gap-1.5 min-w-0">
        {folderName ? (
          <span className="text-sm text-gray-400 dark:text-gray-500 truncate">{folderName}</span>
        ) : null}
        {selectedFile ? (
          <>
            {folderName ? <span className="text-gray-300 dark:text-gray-600">/</span> : null}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
              {selectedFile.name}
            </span>
          </>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {folderPath ? (
          <button
            onClick={onSearchClick}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Search (Cmd+K)"
          >
            Search
          </button>
        ) : null}
        <button
          onClick={handleToggleFocus}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            focusMode
              ? "bg-accent-200 dark:bg-accent-800 text-accent-800 dark:text-accent-100"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title="Toggle focus mode (F)"
        >
          Focus
        </button>
        <button
          onClick={cycleTheme}
          className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Cycle theme (T)"
        >
          {themeIcon}
        </button>
        <button
          onClick={handleOpenSettings}
          className="px-2 py-1.5 text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Settings (Cmd+,)"
        >
          &#9881;
        </button>
      </div>
    </header>
  );
}
