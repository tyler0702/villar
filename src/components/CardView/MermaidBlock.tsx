import { useState, useEffect, useRef } from "react";
import { parseFlowchart, checkLinear, type LinearSteps } from "../../plugins/mermaid-linear";
import { useAppStore } from "../../stores/useAppStore";

// LRU cache — module-level
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

async function getMermaid(isDark: boolean, themeVars?: { bg: string; fg: string; accent: string; border: string }) {
  const m = await import("mermaid");
  if (themeVars) {
    m.default.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        primaryColor: themeVars.accent + "33",
        primaryTextColor: themeVars.fg,
        primaryBorderColor: themeVars.accent,
        lineColor: themeVars.fg + "88",
        secondaryColor: themeVars.border,
        tertiaryColor: themeVars.bg,
        background: themeVars.bg,
        mainBkg: themeVars.accent + "22",
        nodeBorder: themeVars.accent,
        clusterBkg: themeVars.border + "44",
        titleColor: themeVars.fg,
        edgeLabelBackground: themeVars.bg,
        nodeTextColor: themeVars.fg,
        actorTextColor: themeVars.fg,
        actorBkg: themeVars.accent + "22",
        actorBorder: themeVars.accent,
        signalColor: themeVars.fg,
        signalTextColor: themeVars.fg,
        labelBoxBkgColor: themeVars.bg,
        labelBoxBorderColor: themeVars.border,
        labelTextColor: themeVars.fg,
        loopTextColor: themeVars.fg,
        noteBkgColor: themeVars.accent + "22",
        noteTextColor: themeVars.fg,
        noteBorderColor: themeVars.accent + "66",
        classText: themeVars.fg,
      },
    });
  } else {
    m.default.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
    });
  }
  return m.default;
}

interface MermaidBlockProps {
  code: string;
}

type ViewMode = "step" | "diagram" | "raw";

export function MermaidBlock({ code }: MermaidBlockProps) {
  const mermaidDefault = useAppStore((s) => s.settings.mermaidDefault);
  const vscodeTheme = useAppStore((s) => s.settings.vscodeTheme);
  const [mode, setMode] = useState<ViewMode>(mermaidDefault);
  const [linear, setLinear] = useState<LinearSteps | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  // Build a cache key that includes theme so diagram re-renders on theme change
  const themeKey = vscodeTheme ? vscodeTheme.name : "default";

  useEffect(() => {
    const fullKey = `${themeKey}:${code}`;
    const cached = cacheGet(fullKey);
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
        const isDark = vscodeTheme ? false : document.documentElement.classList.contains("dark");
        const themeVars = vscodeTheme
          ? { bg: vscodeTheme.editorBg, fg: vscodeTheme.editorFg, accent: vscodeTheme.accent, border: vscodeTheme.border }
          : undefined;
        const mermaid = await getMermaid(isDark, themeVars);
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        clearTimeout(timeout);
        setSvg(renderedSvg);
        cacheSet(fullKey, { linear: linearResult, svg: renderedSvg });
        setMode(linearResult ? mermaidDefault : "diagram");
      } catch {
        clearTimeout(timeout);
        setSvg(null);
        cacheSet(fullKey, { linear: linearResult, svg: null });
        if (!linearResult) setError(true);
      }
    })();

    return () => clearTimeout(timeout);
  }, [code, themeKey]);

  const toggleMode = () => {
    if (mode === "step" && svg) setMode("diagram");
    else if (mode === "step" && !svg) setMode("raw");
    else if (mode === "diagram") setMode(linear ? "step" : "raw");
    else setMode(linear ? "step" : svg ? "diagram" : "raw");
  };

  const headerClass = "flex items-center justify-between mb-3";
  const labelClass = "text-[10px] font-semibold uppercase tracking-widest opacity-50";
  const toggleClass = "text-[10px] hover:underline font-medium vs-accent opacity-70 hover:opacity-100";
  const wrapClass = "my-4 rounded-xl border p-4 vs-card";

  if (mode === "step" && linear) {
    return (
      <div className={wrapClass}>
        <div className={headerClass}>
          <span className={labelClass}>Steps</span>
          <button onClick={toggleMode} className={toggleClass}>Show diagram</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {linear.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="px-3 py-1.5 text-sm rounded-lg font-medium"
                style={vscodeTheme ? {
                  backgroundColor: vscodeTheme.accent + "22",
                  color: vscodeTheme.editorFg,
                  border: `1px solid ${vscodeTheme.accent}44`,
                } : undefined}
              >
                {!vscodeTheme ? (
                  <span className="bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-200 px-3 py-1.5 -mx-3 -my-1.5 rounded-lg block">
                    {step}
                  </span>
                ) : step}
              </span>
              {i < linear.steps.length - 1 ? (
                <span className="opacity-30">&rarr;</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "diagram" && svg) {
    return (
      <div className={wrapClass}>
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
    <div className={wrapClass}>
      <div className={headerClass}>
        <span className={labelClass}>{error ? "Render failed" : "Mermaid"}</span>
        {linear || svg ? (
          <button onClick={toggleMode} className={toggleClass}>
            {linear ? "Show steps" : "Show diagram"}
          </button>
        ) : null}
      </div>
      <pre className="text-xs opacity-60 whitespace-pre-wrap overflow-x-auto">{code}</pre>
    </div>
  );
}
