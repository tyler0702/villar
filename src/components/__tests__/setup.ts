import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Mock Tauri API core
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${path}`),
}));

// Mock useMetrics (calls invoke internally)
vi.mock("../../hooks/useMetrics", () => ({
  logMetric: vi.fn(),
  logFileOpened: vi.fn(),
  logTldrResult: vi.fn(),
  logMermaidResult: vi.fn(),
  logRenderTime: vi.fn(),
}));
