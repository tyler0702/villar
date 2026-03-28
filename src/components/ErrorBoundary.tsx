import React from "react";
import { logError } from "../hooks/useErrorLogger";
import { useTranslation } from "../i18n/useTranslation";

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends React.Component<
  { children: React.ReactNode; fallback: (error: Error, reset: () => void) => React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError({
      type: "error",
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, () => this.setState({ hasError: false, error: null }));
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const t = useTranslation();
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 text-gray-800 dark:text-gray-100 p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">{t("error.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("error.desc")}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
          >
            {t("error.reload")}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t("error.retry")}
          </button>
        </div>
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {t("error.details")} {showDetails ? "\u25B4" : "\u25BE"}
        </button>
        {showDetails ? (
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-[11px] text-left overflow-auto max-h-48 text-red-600 dark:text-red-400">
            {error.message}
            {"\n\n"}
            {error.stack}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryInner fallback={(error, reset) => <ErrorFallback error={error} onReset={reset} />}>
      {children}
    </ErrorBoundaryInner>
  );
}
