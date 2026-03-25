import { create } from "zustand";

export interface FileEntry {
  name: string;
  path: string;
}

type Theme = "light" | "dark" | "system";

interface AppState {
  folderPath: string | null;
  files: FileEntry[];
  selectedFile: FileEntry | null;
  fileContent: string | null;
  activeCardIndex: number;
  focusMode: boolean;
  theme: Theme;

  setFolderPath: (path: string | null) => void;
  setFiles: (files: FileEntry[]) => void;
  setSelectedFile: (file: FileEntry | null) => void;
  setFileContent: (content: string | null) => void;
  setActiveCardIndex: (index: number) => void;
  toggleFocusMode: () => void;
  setTheme: (theme: Theme) => void;
}

export const useAppStore = create<AppState>((set) => ({
  folderPath: null,
  files: [],
  selectedFile: null,
  fileContent: null,
  activeCardIndex: 0,
  focusMode: false,
  theme: "system",

  setFolderPath: (path) => set({ folderPath: path }),
  setFiles: (files) => set({ files }),
  setSelectedFile: (file) => set({ selectedFile: file, activeCardIndex: 0 }),
  setFileContent: (content) => set({ fileContent: content }),
  setActiveCardIndex: (index) => set({ activeCardIndex: index }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setTheme: (theme) => set({ theme }),
}));
