import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FileEntry } from "../../stores/useAppStore";
import { Outline } from "./Outline";
import { logFileOpened } from "../../hooks/useMetrics";
import type { ProcessedSection } from "../../hooks/useMarkdown";

interface SidebarProps {
  sections: ProcessedSection[];
}

export function Sidebar({ sections }: SidebarProps) {
  const { files, selectedFile, setSelectedFile, setFileContent } = useAppStore();
  const activeCardIndex = useAppStore((s) => s.activeCardIndex);
  const setActiveCardIndex = useAppStore((s) => s.setActiveCardIndex);

  async function handleFileClick(file: FileEntry) {
    setSelectedFile(file);
    logFileOpened(file.path);
    const content = await invoke<string>("read_file", { filePath: file.path });
    setFileContent(content);
  }

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto flex flex-col">
      <nav className="p-2 flex-1">
        {files.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 px-2 py-4 text-center">
            Open a folder to view files
          </p>
        )}
        {files.map((file) => (
          <button
            key={file.path}
            onClick={() => handleFileClick(file)}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-md truncate transition-colors ${
              selectedFile?.path === file.path
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {file.name}
          </button>
        ))}
      </nav>
      <Outline
        sections={sections}
        activeIndex={activeCardIndex}
        onSelect={setActiveCardIndex}
      />
    </aside>
  );
}
