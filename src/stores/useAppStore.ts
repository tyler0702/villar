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

export type Theme = "light" | "dark" | "system";
export type ContentWidth = "narrow" | "medium" | "wide";
export type MermaidDefault = "step" | "diagram";

export interface Settings {
  theme: Theme;
  fontScale: number; // 50-150, 100 = default
  lineHeight: number; // 100-250, percent (100 = 1.0)
  contentWidth: ContentWidth;
  focusOpacity: number; // 10-50
  tldrExpanded: boolean;
  mermaidDefault: MermaidDefault;
  collapseListThreshold: number;
  collapseCodeThreshold: number;
  restoreSession: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  fontScale: 100,
  lineHeight: 165,
  contentWidth: "medium",
  focusOpacity: 30,
  tldrExpanded: true,
  mermaidDefault: "step",
  collapseListThreshold: 5,
  collapseCodeThreshold: 20,
  restoreSession: true,
};

// --- Persistence ---

const STORAGE_KEY = "villar-session";
const SETTINGS_KEY = "villar-settings";

interface PersistedSession {
  folderPath: string | null;
  selectedFilePath: string | null;
  selectedFileName: string | null;
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

const session = loadJson<PersistedSession>(STORAGE_KEY);
const savedSettings = loadJson<Settings>(SETTINGS_KEY);

// --- Store ---

interface AppState {
  folderPath: string | null;
  tree: FsNode[];
  selectedFile: FileEntry | null;
  fileContent: string | null;
  activeCardIndex: number;
  focusMode: boolean;
  settings: Settings;
  settingsOpen: boolean;
  readSections: Set<string>; // "filePath:sectionIndex"

  setFolderPath: (path: string | null) => void;
  setTree: (tree: FsNode[]) => void;
  setSelectedFile: (file: FileEntry | null) => void;
  setFileContent: (content: string | null) => void;
  setActiveCardIndex: (index: number) => void;
  toggleFocusMode: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setSettingsOpen: (open: boolean) => void;
  markSectionRead: (filePath: string, sectionIndex: number) => void;
}

const initialSettings: Settings = { ...DEFAULT_SETTINGS, ...savedSettings };

export const useAppStore = create<AppState>((set, get) => ({
  folderPath: session.folderPath ?? null,
  tree: [],
  selectedFile:
    session.selectedFilePath && session.selectedFileName
      ? { name: session.selectedFileName, path: session.selectedFilePath }
      : null,
  fileContent: null,
  activeCardIndex: 0,
  focusMode: false,
  settings: initialSettings,
  settingsOpen: false,
  readSections: new Set(),

  setFolderPath: (path) => {
    set({ folderPath: path });
    saveJson(STORAGE_KEY, { ...loadJson<PersistedSession>(STORAGE_KEY), folderPath: path });
  },
  setTree: (tree) => set({ tree }),
  setSelectedFile: (file) => {
    set({ selectedFile: file, activeCardIndex: 0 });
    saveJson(STORAGE_KEY, {
      ...loadJson<PersistedSession>(STORAGE_KEY),
      selectedFilePath: file?.path ?? null,
      selectedFileName: file?.name ?? null,
    });
  },
  setFileContent: (content) => set({ fileContent: content }),
  setActiveCardIndex: (index) => set({ activeCardIndex: index }),
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
}));
