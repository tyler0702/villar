import type { StateCreator } from "zustand";

export type ContentWidth = "narrow" | "medium" | "wide";
export type MermaidDefault = "step" | "diagram";

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
  headingColor: string;
  linkColor: string;
  codeBg: string;
  codeFg: string;
  blockquoteBorder: string;
  blockquoteFg: string;
  tableBorder: string;
  tableHeaderBg: string;
}

export interface Settings {
  language: string;
  fontFamily: string;
  fontScale: number;
  lineHeight: number;
  paragraphSpacing: number;
  letterSpacing: number;
  contentWidth: ContentWidth;
  focusOpacity: number;
  tldrExpanded: boolean;
  mermaidDefault: MermaidDefault;
  collapseListThreshold: number;
  collapseCodeThreshold: number;
  speedRead: boolean;
  restoreSession: boolean;
  sidebarWidth: number;
  settingsWidth: number;
  vscodeTheme: VscodeThemeColors | null;
}

export const DEFAULT_SETTINGS: Settings = {
  language: "en",
  fontFamily: "system",
  fontScale: 100,
  lineHeight: 165,
  paragraphSpacing: 150,
  letterSpacing: 0,
  contentWidth: "medium",
  focusOpacity: 30,
  tldrExpanded: true,
  mermaidDefault: "step",
  collapseListThreshold: 5,
  collapseCodeThreshold: 20,
  speedRead: false,
  restoreSession: true,
  sidebarWidth: 224,
  settingsWidth: 256,
  vscodeTheme: null,
};

export const SETTINGS_KEY = "villar-settings";

export function loadJson<T>(key: string): Partial<T> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

export interface SettingsSlice {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
  settings: { ...DEFAULT_SETTINGS, ...loadJson<Settings>(SETTINGS_KEY) },
  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    saveJson(SETTINGS_KEY, next);
  },
});
