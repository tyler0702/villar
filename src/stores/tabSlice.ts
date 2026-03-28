import type { StateCreator } from "zustand";
import { saveJson, loadJson } from "./settingsSlice";

export interface FileEntry {
  name: string;
  path: string;
}

export interface Tab {
  file: FileEntry;
  content: string | null;
  previousContent: string | null;
  changedSections: number[];
  activeCardIndex: number;
  scrollTop: number;
}

const STORAGE_KEY = "villar-session";

interface PersistedSession {
  folderPath: string | null;
  openTabs: { name: string; path: string; activeCardIndex?: number }[];
  activeTabPath: string | null;
}

const session = loadJson<PersistedSession>(STORAGE_KEY);

export const restoredTabs: Tab[] = (session.openTabs ?? []).map((t) => ({
  file: { name: t.name, path: t.path },
  content: null,
  previousContent: null,
  changedSections: [],
  activeCardIndex: t.activeCardIndex ?? 0,
  scrollTop: 0,
}));

export const restoredActiveIndex = session.activeTabPath
  ? Math.max(0, restoredTabs.findIndex((t) => t.file.path === session.activeTabPath))
  : 0;

export const restoredFolderPath = session.folderPath ?? null;

function persistSession(state: TabSlice) {
  saveJson(STORAGE_KEY, {
    folderPath: state.folderPath,
    openTabs: state.tabs.map((t) => ({ name: t.file.name, path: t.file.path, activeCardIndex: t.activeCardIndex })),
    activeTabPath: state.tabs[state.activeTabIndex]?.file.path ?? null,
  } satisfies PersistedSession);
}

// --- Diff detection ---

function splitByH2(text: string): string[] {
  const lines = text.split("\n");
  const sections: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (/^## /.test(line) && current.length > 0) {
      sections.push(current.join("\n"));
      current = [];
    }
    current.push(line);
  }
  if (current.length > 0) sections.push(current.join("\n"));
  return sections;
}

function detectChangedSections(oldContent: string | null, newContent: string): number[] {
  if (!oldContent) return [];
  if (oldContent === newContent) return [];
  const oldSections = splitByH2(oldContent);
  const newSections = splitByH2(newContent);
  const changed: number[] = [];
  const maxLen = Math.max(oldSections.length, newSections.length);
  for (let i = 0; i < maxLen; i++) {
    if ((oldSections[i] ?? "") !== (newSections[i] ?? "")) changed.push(i);
  }
  return changed;
}

// --- Slice ---

export interface TabSlice {
  folderPath: string | null;
  tabs: Tab[];
  activeTabIndex: number;

  setFolderPath: (path: string | null) => void;
  openTab: (file: FileEntry, content: string | null) => void;
  closeTab: (index: number) => void;
  setActiveTab: (index: number) => void;
  setTabContent: (path: string, content: string) => void;
  setActiveCardIndex: (index: number) => void;
  setTabScrollTop: (scrollTop: number) => void;
  clearChangedSections: (path: string) => void;
  reorderTab: (from: number, to: number) => void;
}

export const createTabSlice: StateCreator<TabSlice> = (set, get) => ({
  folderPath: restoredFolderPath,
  tabs: restoredTabs,
  activeTabIndex: restoredActiveIndex,

  setFolderPath: (path) => {
    set({ folderPath: path, tabs: [], activeTabIndex: 0 });
    persistSession(get());
  },

  openTab: (file, content) => {
    const { tabs } = get();
    const existing = tabs.findIndex((t) => t.file.path === file.path);
    if (existing >= 0) {
      const updated = [...tabs];
      if (content !== null) updated[existing] = { ...updated[existing], content };
      set({ tabs: updated, activeTabIndex: existing });
    } else {
      const newTab: Tab = { file, content, previousContent: null, changedSections: [], activeCardIndex: 0, scrollTop: 0 };
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
    const updated = tabs.map((t) => {
      if (t.file.path !== path) return t;
      const changed = detectChangedSections(t.content, content);
      return { ...t, previousContent: t.content, content, changedSections: changed };
    });
    set({ tabs: updated });
  },

  setActiveCardIndex: (index) => {
    const { tabs, activeTabIndex } = get();
    const updated = [...tabs];
    if (updated[activeTabIndex]) {
      updated[activeTabIndex] = { ...updated[activeTabIndex], activeCardIndex: index };
      set({ tabs: updated });
      persistSession({ ...get(), tabs: updated });
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

  clearChangedSections: (path) => {
    const { tabs } = get();
    const updated = tabs.map((t) =>
      t.file.path === path ? { ...t, changedSections: [] } : t
    );
    set({ tabs: updated });
  },

  reorderTab: (from, to) => {
    const { tabs, activeTabIndex } = get();
    if (from === to || from < 0 || to < 0 || from >= tabs.length || to >= tabs.length) return;
    const updated = [...tabs];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    let newActive = activeTabIndex;
    if (from === activeTabIndex) newActive = to;
    else if (from < activeTabIndex && to >= activeTabIndex) newActive--;
    else if (from > activeTabIndex && to <= activeTabIndex) newActive++;
    set({ tabs: updated, activeTabIndex: newActive });
    persistSession(get());
  },
});
