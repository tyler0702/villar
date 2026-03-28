import type React from "react";
import { create } from "zustand";
import { createSettingsSlice, type SettingsSlice } from "./settingsSlice";
import { createTabSlice, type TabSlice } from "./tabSlice";

// Re-export types from slices for consumers
export type { Settings, ContentWidth, MermaidDefault, VscodeThemeColors } from "./settingsSlice";
export type { FileEntry, Tab } from "./tabSlice";

export interface FsNode {
  name: string;
  path: string;
  is_dir: boolean;
  children: FsNode[];
}

interface UiSlice {
  tree: FsNode[];
  focusMode: boolean;
  settingsOpen: boolean;
  aboutOpen: boolean;
  readSections: Set<string>;
  bookmarks: Set<string>;
  findOpen: boolean;
  findQuery: string;
  previewImage: string | null;
  cardScrollRef: React.RefObject<HTMLDivElement | null> | null;
  cardNavigated: boolean;

  setTree: (tree: FsNode[]) => void;
  toggleFocusMode: () => void;
  setSettingsOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  markSectionRead: (filePath: string, sectionIndex: number) => void;
  toggleBookmark: (filePath: string, sectionIndex: number) => void;
  setFindOpen: (open: boolean) => void;
  setFindQuery: (query: string) => void;
  setPreviewImage: (src: string | null) => void;
  setCardScrollRef: (ref: React.RefObject<HTMLDivElement | null> | null) => void;
  navigateToCard: (index: number) => void;
}

type AppState = UiSlice & TabSlice & SettingsSlice;

export const useAppStore = create<AppState>((...a) => ({
  // UI state
  tree: [],
  focusMode: false,
  settingsOpen: false,
  aboutOpen: false,
  readSections: new Set<string>(),
  bookmarks: (() => {
    try {
      const raw = localStorage.getItem("villar-bookmarks");
      return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    } catch { return new Set<string>(); }
  })(),
  findOpen: false,
  findQuery: "",
  previewImage: null,
  cardScrollRef: null,
  cardNavigated: false,

  setTree: (tree) => a[0]({ tree }),
  toggleFocusMode: () => a[0]((s) => ({ focusMode: !s.focusMode })),
  setSettingsOpen: (open) => a[0]({ settingsOpen: open }),
  setAboutOpen: (open) => a[0]({ aboutOpen: open }),
  markSectionRead: (filePath, sectionIndex) => {
    const key = `${filePath}:${sectionIndex}`;
    a[0]((s) => {
      const next = new Set(s.readSections);
      next.add(key);
      return { readSections: next };
    });
  },
  toggleBookmark: (filePath, sectionIndex) => {
    const key = `${filePath}:${sectionIndex}`;
    a[0]((s) => {
      const next = new Set(s.bookmarks);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem("villar-bookmarks", JSON.stringify([...next])); } catch { /* */ }
      return { bookmarks: next };
    });
  },
  setFindOpen: (open) => a[0]({ findOpen: open }),
  setFindQuery: (query) => a[0]({ findQuery: query }),
  setPreviewImage: (src) => a[0]({ previewImage: src }),
  setCardScrollRef: (ref) => a[0]({ cardScrollRef: ref }),
  navigateToCard: (index) => {
    a[0]({ cardNavigated: true });
    // Use the tab slice's setActiveCardIndex
    const state = a[1]() as AppState;
    state.setActiveCardIndex(index);
  },

  // Slices
  ...createTabSlice(...a),
  ...createSettingsSlice(...a),
}));

// --- Derived helpers ---

export function useActiveTab() {
  return useAppStore((s) => s.tabs[s.activeTabIndex] ?? null);
}

// Expose store for E2E tests
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__villarStore = useAppStore;
}
