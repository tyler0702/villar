import { memo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FileEntry } from "../../stores/useAppStore";
import { Outline } from "./Outline";
import { logFileOpened } from "../../hooks/useMetrics";
import type { ProcessedSection } from "../../hooks/useMarkdown";

interface SidebarProps {
  sections: ProcessedSection[];
}

const FileItem = memo(function FileItem({
  file,
  isSelected,
  onClick,
}: {
  file: FileEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-sm rounded-lg truncate transition-colors ${
        isSelected
          ? "bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-200 font-medium"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {file.name}
    </button>
  );
});

export function Sidebar({ sections }: SidebarProps) {
  const files = useAppStore((s) => s.files);
  const selectedPath = useAppStore((s) => s.selectedFile?.path ?? null);
  const activeCardIndex = useAppStore((s) => s.activeCardIndex);
  const setActiveCardIndex = useAppStore((s) => s.setActiveCardIndex);

  async function handleFileClick(file: FileEntry) {
    useAppStore.getState().setSelectedFile(file);
    logFileOpened(file.path);
    const content = await invoke<string>("read_file", { filePath: file.path });
    useAppStore.getState().setFileContent(content);
  }

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-surface-800/60 backdrop-blur-sm overflow-y-auto flex flex-col">
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Files
        </span>
      </div>
      <nav className="px-2 pb-2 flex-1">
        {files.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 px-2 py-6 text-center">
            No folder open
          </p>
        ) : (
          files.map((file) => (
            <FileItem
              key={file.path}
              file={file}
              isSelected={file.path === selectedPath}
              onClick={() => handleFileClick(file)}
            />
          ))
        )}
      </nav>
      <Outline
        sections={sections}
        activeIndex={activeCardIndex}
        onSelect={setActiveCardIndex}
      />
    </aside>
  );
}
