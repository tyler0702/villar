import { useEffect, useCallback, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Header } from "./components/Header/Header";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { CardView } from "./components/CardView/CardView";
import { SearchPanel } from "./components/Search/SearchPanel";
import { SettingsPanel } from "./components/Settings/SettingsPanel";
import { useAppStore, type FsNode } from "./stores/useAppStore";
import { useMarkdown } from "./hooks/useMarkdown";
import { useTheme } from "./hooks/useTheme";
import { useKeyboard } from "./hooks/useKeyboard";
import { useRestoreSession } from "./hooks/useRestoreSession";
import { useDragDrop } from "./hooks/useDragDrop";

function App() {
  useTheme();
  useRestoreSession();
  useDragDrop();
  const fileContent = useAppStore((s) => s.fileContent);
  const setFileContent = useAppStore((s) => s.setFileContent);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const collapseListThreshold = useAppStore((s) => s.settings.collapseListThreshold);
  const collapseCodeThreshold = useAppStore((s) => s.settings.collapseCodeThreshold);
  const sections = useMarkdown(fileContent, {
    listThreshold: collapseListThreshold,
    codeThreshold: collapseCodeThreshold,
  });
  const [searchOpen, setSearchOpen] = useState(false);
  useKeyboard(sections.length, () => setSearchOpen(true));

  const handleFileChanged = useCallback(
    async (path: string) => {
      const current = useAppStore.getState().selectedFile;
      if (current && path === current.path) {
        const content = await invoke<string>("read_file", { filePath: current.path });
        setFileContent(content);
      }
    },
    [setFileContent]
  );

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

  const hasContent = sections.length > 0;
  const fontScale = useAppStore((s) => s.settings.fontScale);
  const zoomStyle = { zoom: fontScale / 100 };

  return (
    <div className="h-screen flex flex-col bg-surface-50 dark:bg-surface-900 text-gray-800 dark:text-gray-100">
      <Header onSearchClick={() => setSearchOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar sections={sections} style={zoomStyle} />
        <main className="flex-1 overflow-hidden" style={zoomStyle}>
          {hasContent ? (
            <CardView sections={sections} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-4">
              <p className="text-lg font-light tracking-wide">Open a folder, pick a file</p>
              <div className="text-xs space-y-1.5 text-center opacity-60">
                <p>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">&larr;</kbd>{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">&rarr;</kbd>{" "}
                  Navigate
                </p>
                <p>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">Cmd+K</kbd> Search{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">F</kbd> Focus{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">T</kbd> Theme
                </p>
              </div>
            </div>
          )}
        </main>
        {settingsOpen ? <SettingsPanel /> : null}
      </div>
      {searchOpen ? <SearchPanel onClose={() => setSearchOpen(false)} /> : null}
    </div>
  );
}

export default App;
