import { invoke } from "@tauri-apps/api/core";

export async function logMetric(event: string, data: Record<string, unknown> = {}) {
  try {
    await invoke("write_log", { entry: { event, data } });
  } catch {
    // Silently fail - metrics should never break the app
  }
}

export function logFileOpened(filePath: string) {
  logMetric("file_opened", { path: filePath });
}

export function logTldrResult(sectionTitle: string, success: boolean) {
  logMetric("tldr_result", { section: sectionTitle, success });
}

export function logMermaidResult(success: boolean, mode: "step" | "diagram" | "fallback") {
  logMetric("mermaid_result", { success, mode });
}

export function logRenderTime(durationMs: number, fileSize: number) {
  logMetric("render_time", { durationMs, fileSize });
}
