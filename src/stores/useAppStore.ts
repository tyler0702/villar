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

type Theme = "light" | "dark" | "system";

interface AppState {
  folderPath: string | null;
  tree: FsNode[];
  selectedFile: FileEntry | null;
  fileContent: string | null;
  activeCardIndex: number;
  focusMode: boolean;
  theme: Theme;

  setFolderPath: (path: string | null) => void;
  setTree: (tree: FsNode[]) => void;
  setSelectedFile: (file: FileEntry | null) => void;
  setFileContent: (content: string | null) => void;
  setActiveCardIndex: (index: number) => void;
  toggleFocusMode: () => void;
  setTheme: (theme: Theme) => void;
}

export const useAppStore = create<AppState>((set) => ({
  folderPath: null,
  tree: [],
  selectedFile: null,
  fileContent: null,
  activeCardIndex: 0,
  focusMode: false,
  theme: "system",

  setFolderPath: (path) => set({ folderPath: path }),
  setTree: (tree) => set({ tree }),
  setSelectedFile: (file) => set({ selectedFile: file, activeCardIndex: 0 }),
  setFileContent: (content) => set({ fileContent: content }),
  setActiveCardIndex: (index) => set({ activeCardIndex: index }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setTheme: (theme) => set({ theme }),
}));
