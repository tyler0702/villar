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
import { useTranslation } from "./i18n/useTranslation";

function App() {
  const t = useTranslation();
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

  // Split view
  const splitMode = useAppStore((s) => s.splitMode);
  const splitTab = useAppStore((s) => s.splitMode ? s.tabs[s.splitTabIndex] ?? null : null);
  const splitContent = splitTab?.content ?? null;
  const splitFilePath = splitTab?.file.path ?? null;
  const splitSections = useMarkdown(splitContent, collapseConfig, splitFilePath);
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
    return () => {
      unlistenFile.then((fn) => fn());
      unlistenTree.then((fn) => fn());
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
          <div className={`flex-1 overflow-hidden ${splitMode ? "flex" : ""}`}>
            <main className={`${splitMode ? "flex-1" : ""} h-full overflow-hidden`}>
              {hasContent ? (
                <CardView sections={sections} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-4">
                  <p className="text-lg font-light tracking-wide">{t("welcome.title")}</p>
                  <div className="text-xs space-y-1.5 text-center opacity-60">
                    <p>
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">&larr;</kbd>{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">&rarr;</kbd>{" "}
                      {t("welcome.navigate")}
                    </p>
                    <p>
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">Cmd+K</kbd> {t("welcome.search")}{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">Cmd+F</kbd> {t("welcome.find")}{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">F</kbd> {t("welcome.focus")}
                    </p>
                  </div>
                </div>
              )}
            </main>
            {splitMode && splitSections.length > 0 ? (
              <>
                <div className="w-px bg-gray-200/60 dark:bg-gray-700/60 vs-border shrink-0" />
                <div className="flex-1 h-full overflow-hidden">
                  <CardView sections={splitSections} />
                </div>
              </>
            ) : null}
          </div>
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
