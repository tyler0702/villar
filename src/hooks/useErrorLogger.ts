import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

function logError(entry: { type: string; timestamp: string; message: string; stack?: string; componentStack?: string }) {
  invoke("write_log", { entry }).catch(() => {});
}

export function useErrorLogger() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      logError({
        type: "error",
        timestamp: new Date().toISOString(),
        message: event.message,
        stack: event.error?.stack,
      });
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      logError({
        type: "error",
        timestamp: new Date().toISOString(),
        message: reason?.message ?? String(reason),
        stack: reason?.stack,
      });
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);
}

export { logError };
