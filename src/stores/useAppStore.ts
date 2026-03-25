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

const STORAGE_KEY = "villar-session";

interface PersistedSession {
  folderPath: string | null;
  selectedFilePath: string | null;
  selectedFileName: string | null;
  theme: Theme;
}

function loadSession(): Partial<PersistedSession> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSession(s: PersistedSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

const session = loadSession();

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
  folderPath: session.folderPath ?? null,
  tree: [],
  selectedFile:
    session.selectedFilePath && session.selectedFileName
      ? { name: session.selectedFileName, path: session.selectedFilePath }
      : null,
  fileContent: null,
  activeCardIndex: 0,
  focusMode: false,
  theme: session.theme ?? "system",

  setFolderPath: (path) => {
    set({ folderPath: path });
    const s = loadSession();
    saveSession({ ...s, folderPath: path } as PersistedSession);
  },
  setTree: (tree) => set({ tree }),
  setSelectedFile: (file) => {
    set({ selectedFile: file, activeCardIndex: 0 });
    const s = loadSession();
    saveSession({
      ...s,
      selectedFilePath: file?.path ?? null,
      selectedFileName: file?.name ?? null,
    } as PersistedSession);
  },
  setFileContent: (content) => set({ fileContent: content }),
  setActiveCardIndex: (index) => set({ activeCardIndex: index }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setTheme: (theme) => {
    set({ theme });
    const s = loadSession();
    saveSession({ ...s, theme } as PersistedSession);
  },
}));
