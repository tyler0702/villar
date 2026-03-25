import { useState, useEffect, useRef } from "react";
import { parseFlowchart, checkLinear, type LinearSteps } from "../../plugins/mermaid-linear";
import { useAppStore } from "../../stores/useAppStore";

// Dynamic import — mermaid.js is ~1MB, only load when needed (bundle-dynamic-imports)
const mermaidPromise = import("mermaid").then((m) => {
  m.default.initialize({ startOnLoad: false, theme: "default" });
  return m.default;
});

// LRU cache — module-level (js-cache-function-results)
const cache = new Map<string, { linear: LinearSteps | null; svg: string | null }>();
const MAX_CACHE = 50;

function cacheGet(key: string) {
  const val = cache.get(key);
  if (val) {
    cache.delete(key);
    cache.set(key, val);
  }
  return val;
}

function cacheSet(key: string, val: { linear: LinearSteps | null; svg: string | null }) {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, val);
}

interface MermaidBlockProps {
  code: string;
}

type ViewMode = "step" | "diagram" | "raw";

export function MermaidBlock({ code }: MermaidBlockProps) {
  const mermaidDefault = useAppStore((s) => s.settings.mermaidDefault);
  const [mode, setMode] = useState<ViewMode>(mermaidDefault);
  const [linear, setLinear] = useState<LinearSteps | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = cacheGet(code);
    if (cached) {
      setLinear(cached.linear);
      setSvg(cached.svg);
      const defaultMode = cached.linear ? mermaidDefault : "diagram";
      setMode(cached.svg ? defaultMode : "raw");
      return;
    }

    const flowchart = parseFlowchart(code);
    const linearResult = flowchart ? checkLinear(flowchart) : null;
    setLinear(linearResult);

    const timeout = setTimeout(() => setError(true), 1000);

    (async () => {
      try {
        const mermaid = await mermaidPromise;
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        clearTimeout(timeout);
        setSvg(renderedSvg);
        cacheSet(code, { linear: linearResult, svg: renderedSvg });
        setMode(linearResult ? mermaidDefault : "diagram");
      } catch {
        clearTimeout(timeout);
        setSvg(null);
        cacheSet(code, { linear: linearResult, svg: null });
        if (!linearResult) setError(true);
      }
    })();

    return () => clearTimeout(timeout);
  }, [code]);

  const toggleMode = () => {
    if (mode === "step" && svg) setMode("diagram");
    else if (mode === "step" && !svg) setMode("raw");
    else if (mode === "diagram") setMode(linear ? "step" : "raw");
    else setMode(linear ? "step" : svg ? "diagram" : "raw");
  };

  const headerClass = "flex items-center justify-between mb-3";
  const labelClass = "text-[10px] font-semibold uppercase tracking-widest text-gray-400";
  const toggleClass = "text-[10px] text-accent-600 dark:text-accent-400 hover:underline font-medium";
  const wrapClass = "my-4 rounded-xl border p-4";

  if (mode === "step" && linear) {
    return (
      <div className={`${wrapClass} border-accent-200/40 dark:border-accent-800/30 bg-accent-50/50 dark:bg-accent-950/30`}>
        <div className={headerClass}>
          <span className={labelClass}>Steps</span>
          <button onClick={toggleMode} className={toggleClass}>Show diagram</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {linear.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-sm rounded-lg bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-200 font-medium">
                {step}
              </span>
              {i < linear.steps.length - 1 ? (
                <span className="text-gray-300 dark:text-gray-600">&rarr;</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "diagram" && svg) {
    return (
      <div className={`${wrapClass} border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-surface-800`}>
        <div className={headerClass}>
          <span className={labelClass}>Diagram</span>
          <button onClick={toggleMode} className={toggleClass}>
            {linear ? "Show steps" : "Show source"}
          </button>
        </div>
        <div ref={diagramRef} className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    );
  }

  return (
    <div className={`${wrapClass} border-gray-200/60 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-900`}>
      <div className={headerClass}>
        <span className={labelClass}>{error ? "Render failed" : "Mermaid"}</span>
        {linear || svg ? (
          <button onClick={toggleMode} className={toggleClass}>
            {linear ? "Show steps" : "Show diagram"}
          </button>
        ) : null}
      </div>
      <pre className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">{code}</pre>
    </div>
  );
}
