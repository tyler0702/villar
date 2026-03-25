import { create } from "zustand";

export interface FsNode {
  name: string;
  path: string;
  is_dir: boolean;
  children: FsNode[];
}

export interface FileEntry {
  name: string;
  path: string;
}

export interface Tab {
  file: FileEntry;
  content: string | null;
  activeCardIndex: number;
  scrollTop: number;
}

export type ContentWidth = "narrow" | "medium" | "wide";
export type MermaidDefault = "step" | "diagram";

export interface Settings {
  fontScale: number;
  lineHeight: number;
  contentWidth: ContentWidth;
  focusOpacity: number;
  tldrExpanded: boolean;
  mermaidDefault: MermaidDefault;
  collapseListThreshold: number;
  collapseCodeThreshold: number;
  restoreSession: boolean;
  sidebarWidth: number;
  settingsWidth: number;
  vscodeTheme: VscodeThemeColors | null;
}

export interface VscodeThemeColors {
  name: string;
  bg: string;
  fg: string;
  accent: string;
  sidebarBg: string;
  sidebarFg: string;
  editorBg: string;
  editorFg: string;
  border: string;
  selectionBg: string;
}

const DEFAULT_SETTINGS: Settings = {
  fontScale: 100,
  lineHeight: 165,
  contentWidth: "medium",
  focusOpacity: 30,
  tldrExpanded: true,
  mermaidDefault: "step",
  collapseListThreshold: 5,
  collapseCodeThreshold: 20,
  restoreSession: true,
  sidebarWidth: 224,
  settingsWidth: 256,
  vscodeTheme: null,
};

// --- Persistence ---

const STORAGE_KEY = "villar-session";
const SETTINGS_KEY = "villar-settings";

interface PersistedSession {
  folderPath: string | null;
  openTabs: { name: string; path: string }[];
  activeTabPath: string | null;
}

function loadJson<T>(key: string): Partial<T> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

function persistSession(state: AppState) {
  saveJson(STORAGE_KEY, {
    folderPath: state.folderPath,
    openTabs: state.tabs.map((t) => ({ name: t.file.name, path: t.file.path })),
    activeTabPath: state.tabs[state.activeTabIndex]?.file.path ?? null,
  } satisfies PersistedSession);
}

const session = loadJson<PersistedSession>(STORAGE_KEY);
const savedSettings = loadJson<Settings>(SETTINGS_KEY);

// --- Store ---

interface AppState {
  folderPath: string | null;
  tree: FsNode[];
  tabs: Tab[];
  activeTabIndex: number;
  focusMode: boolean;
  settings: Settings;
  settingsOpen: boolean;
  readSections: Set<string>;
  findOpen: boolean;
  findQuery: string;

  setFolderPath: (path: string | null) => void;
  setTree: (tree: FsNode[]) => void;
  openTab: (file: FileEntry, content: string | null) => void;
  closeTab: (index: number) => void;
  setActiveTab: (index: number) => void;
  setTabContent: (path: string, content: string) => void;
  setActiveCardIndex: (index: number) => void;
  setTabScrollTop: (scrollTop: number) => void;
  toggleFocusMode: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setSettingsOpen: (open: boolean) => void;
  markSectionRead: (filePath: string, sectionIndex: number) => void;
  setFindOpen: (open: boolean) => void;
  setFindQuery: (query: string) => void;
}

const initialSettings: Settings = { ...DEFAULT_SETTINGS, ...savedSettings };

// Restore tabs from session
const restoredTabs: Tab[] = (session.openTabs ?? []).map((t) => ({
  file: { name: t.name, path: t.path },
  content: null,
  activeCardIndex: 0,
  scrollTop: 0,
}));
const restoredActiveIndex = session.activeTabPath
  ? Math.max(0, restoredTabs.findIndex((t) => t.file.path === session.activeTabPath))
  : 0;

export const useAppStore = create<AppState>((set, get) => ({
  folderPath: session.folderPath ?? null,
  tree: [],
  tabs: restoredTabs,
  activeTabIndex: restoredActiveIndex,
  focusMode: false,
  settings: initialSettings,
  settingsOpen: false,
  readSections: new Set(),
  findOpen: false,
  findQuery: "",

  setFolderPath: (path) => {
    set({ folderPath: path, tabs: [], activeTabIndex: 0 });
    persistSession(get());
  },
  setTree: (tree) => set({ tree }),

  openTab: (file, content) => {
    const { tabs } = get();
    const existing = tabs.findIndex((t) => t.file.path === file.path);
    if (existing >= 0) {
      // Already open — switch to it and update content
      const updated = [...tabs];
      if (content !== null) updated[existing] = { ...updated[existing], content };
      set({ tabs: updated, activeTabIndex: existing });
    } else {
      // New tab
      const newTab: Tab = { file, content, activeCardIndex: 0, scrollTop: 0 };
      set({ tabs: [...tabs, newTab], activeTabIndex: tabs.length });
    }
    persistSession(get());
  },

  closeTab: (index) => {
    const { tabs, activeTabIndex } = get();
    if (tabs.length <= 0) return;
    const next = tabs.filter((_, i) => i !== index);
    let nextActive = activeTabIndex;
    if (index < activeTabIndex) nextActive--;
    else if (index === activeTabIndex) nextActive = Math.min(activeTabIndex, next.length - 1);
    set({ tabs: next, activeTabIndex: Math.max(0, nextActive) });
    persistSession(get());
  },

  setActiveTab: (index) => {
    set({ activeTabIndex: index });
    persistSession(get());
  },

  setTabContent: (path, content) => {
    const { tabs } = get();
    const updated = tabs.map((t) =>
      t.file.path === path ? { ...t, content } : t
    );
    set({ tabs: updated });
  },

  setActiveCardIndex: (index) => {
    const { tabs, activeTabIndex } = get();
    const updated = [...tabs];
    if (updated[activeTabIndex]) {
      updated[activeTabIndex] = { ...updated[activeTabIndex], activeCardIndex: index };
      set({ tabs: updated });
    }
  },

  setTabScrollTop: (scrollTop) => {
    const { tabs, activeTabIndex } = get();
    const updated = [...tabs];
    if (updated[activeTabIndex]) {
      updated[activeTabIndex] = { ...updated[activeTabIndex], scrollTop };
      set({ tabs: updated });
    }
  },

  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    saveJson(SETTINGS_KEY, next);
  },
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  markSectionRead: (filePath, sectionIndex) => {
    const key = `${filePath}:${sectionIndex}`;
    set((s) => {
      const next = new Set(s.readSections);
      next.add(key);
      return { readSections: next };
    });
  },
  setFindOpen: (open) => set({ findOpen: open }),
  setFindQuery: (query) => set({ findQuery: query }),
}));

// --- Derived helpers ---

export function useActiveTab(): Tab | null {
  return useAppStore((s) => s.tabs[s.activeTabIndex] ?? null);
}
