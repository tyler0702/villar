import { useState, useEffect, useRef } from "react";
import { parseFlowchart, checkLinear, type LinearSteps } from "../../plugins/mermaid-linear";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default" });

// Simple LRU cache
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
  const [mode, setMode] = useState<ViewMode>("step");
  const [linear, setLinear] = useState<LinearSteps | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = cacheGet(code);
    if (cached) {
      setLinear(cached.linear);
      setSvg(cached.svg);
      setMode(cached.linear ? "step" : "diagram");
      return;
    }

    // Parse and check linearity
    const flowchart = parseFlowchart(code);
    const linearResult = flowchart ? checkLinear(flowchart) : null;
    setLinear(linearResult);

    // Try rendering diagram with timeout
    const timeout = setTimeout(() => {
      setError(true);
    }, 1000);

    (async () => {
      try {
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        clearTimeout(timeout);
        setSvg(renderedSvg);
        cacheSet(code, { linear: linearResult, svg: renderedSvg });
        setMode(linearResult ? "step" : "diagram");
      } catch {
        clearTimeout(timeout);
        setSvg(null);
        cacheSet(code, { linear: linearResult, svg: null });
        if (!linearResult) {
          setError(true);
        }
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

  // Step UI
  if (mode === "step" && linear) {
    return (
      <div className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase">Steps</span>
          <button
            onClick={toggleMode}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Show diagram
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {linear.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-sm rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                {step}
              </span>
              {i < linear.steps.length - 1 && (
                <span className="text-gray-400 dark:text-gray-500">&rarr;</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Diagram view
  if (mode === "diagram" && svg) {
    return (
      <div className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase">Diagram</span>
          <button
            onClick={toggleMode}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {linear ? "Show steps" : "Show source"}
          </button>
        </div>
        <div
          ref={diagramRef}
          className="overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    );
  }

  // Raw text fallback
  return (
    <div className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase">
          {error ? "Could not render diagram" : "Mermaid"}
        </span>
        {(linear || svg) && (
          <button
            onClick={toggleMode}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {linear ? "Show steps" : "Show diagram"}
          </button>
        )}
      </div>
      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}
