import { useEffect, useCallback, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Header } from "./components/Header/Header";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { CardView } from "./components/CardView/CardView";
import { TabBar } from "./components/TabBar/TabBar";
import { FindBar } from "./components/FindBar/FindBar";
import { SearchPanel } from "./components/Search/SearchPanel";
import { SettingsPanel } from "./components/Settings/SettingsPanel";
import { useAppStore, useActiveTab, type FsNode } from "./stores/useAppStore";
import { useMarkdown } from "./hooks/useMarkdown";
import { useTheme } from "./hooks/useTheme";
import { useKeyboard } from "./hooks/useKeyboard";
import { useRestoreSession } from "./hooks/useRestoreSession";
import { useDragDrop } from "./hooks/useDragDrop";
import { useVscodeTheme } from "./hooks/useVscodeTheme";
import { useResizable } from "./hooks/useResizable";

function App() {
  useTheme();
  useRestoreSession();
  useDragDrop();
  useVscodeTheme();

  const activeTab = useActiveTab();
  const fileContent = activeTab?.content ?? null;
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const findOpen = useAppStore((s) => s.findOpen);
  const collapseListThreshold = useAppStore((s) => s.settings.collapseListThreshold);
  const collapseCodeThreshold = useAppStore((s) => s.settings.collapseCodeThreshold);
  const fontScale = useAppStore((s) => s.settings.fontScale);
  const sidebarWidth = useAppStore((s) => s.settings.sidebarWidth);
  const settingsWidth = useAppStore((s) => s.settings.settingsWidth);

  const activeFilePath = activeTab?.file.path ?? null;
  const collapseConfig = { listThreshold: collapseListThreshold, codeThreshold: collapseCodeThreshold };
  const sections = useMarkdown(fileContent, collapseConfig, activeFilePath);
  const [searchOpen, setSearchOpen] = useState(false);
  useKeyboard(sections.length, () => setSearchOpen(true));

  // File watcher
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
    const unlistenMenu = listen<string>("menu-action", (event) => {
      const action = event.payload;
      switch (action) {
        case "open_folder":
          document.querySelector<HTMLButtonElement>("[data-open-folder]")?.click();
          break;
        case "close_tab": {
          const { tabs, activeTabIndex, closeTab } = useAppStore.getState();
          if (tabs.length > 0) closeTab(activeTabIndex);
          break;
        }
        case "find":
          useAppStore.getState().setFindOpen(true);
          break;
        case "search":
          setSearchOpen(true);
          break;
        case "focus_mode":
          useAppStore.getState().toggleFocusMode();
          break;
        case "settings":
          useAppStore.getState().setSettingsOpen(true);
          break;
      }
    });
    return () => {
      unlistenFile.then((fn) => fn());
      unlistenTree.then((fn) => fn());
      unlistenMenu.then((fn) => fn());
    };
  }, [handleFileChanged]);

  const hasContent = sections.length > 0;
  const zoomStyle = { zoom: fontScale / 100 };

  const sidebarResize = useResizable(
    sidebarWidth,
    (w) => useAppStore.getState().updateSettings({ sidebarWidth: w }),
    120, 400, "left"
  );
  const settingsResize = useResizable(
    settingsWidth,
    (w) => useAppStore.getState().updateSettings({ settingsWidth: w }),
    200, 400, "right"
  );

  return (
    <div className="h-screen flex flex-col bg-surface-50 dark:bg-surface-900 text-gray-800 dark:text-gray-100 vs-bg vs-fg">
      <Header onSearchClick={() => setSearchOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <Sidebar sections={sections} style={{ ...zoomStyle, width: sidebarWidth }} />
        <div className="resize-handle" onMouseDown={sidebarResize} />

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden vs-canvas" style={zoomStyle}>
          <TabBar />
          {findOpen ? <FindBar /> : null}
          <main className="flex-1 overflow-hidden">
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
                    <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">Cmd+F</kbd> Find{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">F</kbd> Focus
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Right settings sidebar */}
        {settingsOpen ? (
          <>
            <div className="resize-handle" onMouseDown={settingsResize} />
            <SettingsPanel width={settingsWidth} />
          </>
        ) : null}
      </div>
      {searchOpen ? <SearchPanel onClose={() => setSearchOpen(false)} /> : null}
    </div>
  );
}

export default App;
