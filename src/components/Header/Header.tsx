import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppStore, type FsNode } from "../../stores/useAppStore";
import { WindowControls } from "./WindowControls";

interface HeaderProps {
  onSearchClick?: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
  const folderPath = useAppStore((s) => s.folderPath);
  const activeTab = useAppStore((s) => s.tabs[s.activeTabIndex] ?? null);
  const selectedFile = activeTab?.file ?? null;
  const focusMode = useAppStore((s) => s.focusMode);

  async function handleOpenFolder() {
    const selected = await open({ directory: true, multiple: false });
    if (!selected) return;

    const path = selected as string;
    useAppStore.getState().setFolderPath(path);

    const tree = await invoke<FsNode[]>("list_md_files", { dirPath: path });
    useAppStore.getState().setTree(tree);
    await invoke("watch_folder", { dirPath: path });
  }

  function handleDragStart(e: React.MouseEvent) {
    // Only drag from the header itself, not from buttons
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    getCurrentWindow().startDragging();
  }

  const folderName = folderPath ? folderPath.split("/").pop() : null;

  return (
    <header
      onMouseDown={handleDragStart}
      className="vs-header flex items-center gap-3 pl-4 pr-5 py-2.5 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm shrink-0 select-none cursor-default"
    >
      <WindowControls />

      <button
        onClick={handleOpenFolder}
        className="vs-header-accent px-3 py-1.5 text-sm font-medium rounded-lg bg-accent-100 dark:bg-accent-900 hover:bg-accent-200 dark:hover:bg-accent-800 text-accent-700 dark:text-accent-200 transition-colors"
      >
        Open
      </button>

      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {folderName ? (
          <span className="text-sm opacity-50 truncate">{folderName}</span>
        ) : null}
        {selectedFile ? (
          <>
            {folderName ? <span className="opacity-30">/</span> : null}
            <span className="text-sm font-medium truncate">
              {selectedFile.name}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        {folderPath ? (
          <button
            onClick={onSearchClick}
            className="px-3 py-1.5 text-xs font-medium rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 transition-all"
            title="Search (Cmd+K)"
          >
            Search
          </button>
        ) : null}
        <button
          onClick={() => useAppStore.getState().toggleFocusMode()}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            focusMode
              ? "vs-header-accent bg-accent-200 dark:bg-accent-800 text-accent-800 dark:text-accent-100"
              : "opacity-60 hover:opacity-100 hover:bg-white/10"
          }`}
          title="Toggle focus mode (F)"
        >
          Focus
        </button>
        <button
          onClick={() => useAppStore.getState().setSettingsOpen(true)}
          className="px-2 py-1.5 text-[20px] leading-none opacity-50 hover:opacity-100 hover:bg-white/10 rounded-lg transition-all"
          title="Settings (Cmd+,)"
        >
          &#9881;
        </button>
      </div>
    </header>
  );
}
