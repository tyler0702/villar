import { useState } from "react";
import "./App.css";
import { Header } from "./components/Header/Header";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { CardView } from "./components/CardView/CardView";
import { TabBar } from "./components/TabBar/TabBar";
import { FindBar } from "./components/FindBar/FindBar";
import { SearchPanel } from "./components/Search/SearchPanel";
import { SettingsPanel } from "./components/Settings/SettingsPanel";
import { useAppStore, useActiveTab } from "./stores/useAppStore";
import { useMarkdown } from "./hooks/useMarkdown";
import { useTheme } from "./hooks/useTheme";
import { useKeyboard } from "./hooks/useKeyboard";
import { useRestoreSession } from "./hooks/useRestoreSession";
import { useDragDrop } from "./hooks/useDragDrop";
import { useVscodeTheme } from "./hooks/useVscodeTheme";
import { useResizable } from "./hooks/useResizable";
import { useFileWatcher } from "./hooks/useFileWatcher";
import { useMenuActions } from "./hooks/useMenuActions";
import { useTranslation } from "./i18n/useTranslation";
import { UpdateBanner } from "./components/UpdateBanner/UpdateBanner";
import { ImagePreview } from "./components/CardView/ImagePreview";
import { OnboardingOverlay } from "./components/Onboarding/OnboardingOverlay";
import { AboutDialog } from "./components/AboutDialog/AboutDialog";
import { useOnboarding } from "./hooks/useOnboarding";

function App() {
  const t = useTranslation();
  useTheme();
  useRestoreSession();
  useDragDrop();
  useVscodeTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const onboarding = useOnboarding();

  const activeTab = useActiveTab();
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const aboutOpen = useAppStore((s) => s.aboutOpen);
  const findOpen = useAppStore((s) => s.findOpen);
  const fontScale = useAppStore((s) => s.settings.fontScale);
  const sidebarWidth = useAppStore((s) => s.settings.sidebarWidth);
  const settingsWidth = useAppStore((s) => s.settings.settingsWidth);
  const collapseList = useAppStore((s) => s.settings.collapseListThreshold);
  const collapseCode = useAppStore((s) => s.settings.collapseCodeThreshold);
  const sections = useMarkdown(activeTab?.content ?? null, { listThreshold: collapseList, codeThreshold: collapseCode }, activeTab?.file.path ?? null);

  useKeyboard(sections.length, () => setSearchOpen(true));
  useFileWatcher();
  useMenuActions(() => setSearchOpen(true));

  const zoomStyle = { zoom: fontScale / 100 };
  const sidebarResize = useResizable(sidebarWidth, (w) => useAppStore.getState().updateSettings({ sidebarWidth: w }), 120, 400, "left");
  const settingsResize = useResizable(settingsWidth, (w) => useAppStore.getState().updateSettings({ settingsWidth: w }), 200, 400, "right");
  return (
    <div className="h-screen flex flex-col bg-surface-50 dark:bg-surface-900 text-gray-800 dark:text-gray-100 vs-bg vs-fg">
      <Header onSearchClick={() => setSearchOpen(true)} />
      <UpdateBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar sections={sections} style={{ ...zoomStyle, width: sidebarWidth }} />
        <div className="resize-handle" onMouseDown={sidebarResize} />
        <div className="flex-1 flex flex-col overflow-hidden vs-canvas" style={zoomStyle}>
          <TabBar />
          {findOpen ? <FindBar /> : null}
          <main className="flex-1 overflow-hidden">
            {sections.length > 0 ? (
              <CardView sections={sections} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-4">
                <p className="text-lg font-light tracking-wide">{t("welcome.message")}</p>
                <div className="text-xs space-y-1.5 text-center opacity-60">
                  <p><kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">&larr;</kbd>{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">&rarr;</kbd> Navigate</p>
                  <p><kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">Cmd+K</kbd> Search{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">Cmd+F</kbd> Find{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">F</kbd> Focus</p>
                </div>
              </div>
            )}
          </main>
        </div>
        {settingsOpen ? (<><div className="resize-handle" onMouseDown={settingsResize} /><SettingsPanel width={settingsWidth} onRestartTutorial={onboarding.restart} /></>) : null}
      </div>
      {searchOpen ? <SearchPanel onClose={() => setSearchOpen(false)} /> : null}
      {aboutOpen ? <AboutDialog /> : null}
      <ImagePreview />
      {onboarding.visible ? (
        <OnboardingOverlay
          step={onboarding.step}
          totalSteps={onboarding.totalSteps}
          onNext={onboarding.next}
          onPrev={onboarding.prev}
          onSkip={onboarding.skip}
        />
      ) : null}
    </div>
  );
}

export default App;
