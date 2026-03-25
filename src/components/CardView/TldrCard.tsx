import { useState } from "react";
import type { TldrData } from "../../plugins/remark-tldr";
import { useAppStore } from "../../stores/useAppStore";

interface TldrCardProps {
  tldr: TldrData;
}

export function TldrCard({ tldr }: TldrCardProps) {
  const defaultExpanded = useAppStore((s) => s.settings.tldrExpanded);
  const vscodeTheme = useAppStore((s) => s.settings.vscodeTheme);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const themed = vscodeTheme != null;
  const accentBg = themed ? { backgroundColor: vscodeTheme.accent + "15" } : undefined;
  const accentBorder = themed ? { borderColor: vscodeTheme.accent + "33" } : undefined;
  const accentText = themed ? { color: vscodeTheme.accent } : undefined;
  const fgText = themed ? { color: vscodeTheme.editorFg } : undefined;
  const fgMuted = themed ? { color: vscodeTheme.editorFg + "aa" } : undefined;
  const chipStyle = themed
    ? { backgroundColor: vscodeTheme.accent + "22", color: vscodeTheme.accent, borderColor: vscodeTheme.accent + "33" }
    : undefined;
  const dividerStyle = themed ? { borderColor: vscodeTheme.accent + "22" } : undefined;

  return (
    <div
      className={themed ? "mb-5 rounded-xl border p-4" : "mb-5 rounded-xl border border-accent-200/60 dark:border-accent-800/40 bg-accent-50 dark:bg-accent-950 p-4"}
      style={themed ? { ...accentBg, ...accentBorder } : undefined}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className={themed ? "flex items-center gap-2 text-sm font-semibold w-full text-left" : "flex items-center gap-2 text-sm font-semibold text-accent-700 dark:text-accent-300 w-full text-left"}
        style={accentText}
      >
        <span className="tracking-wide">TL;DR</span>
        <span className="text-[10px] opacity-60">{expanded ? "\u25B2" : "\u25BC"}</span>
      </button>
      {expanded ? (
        <div className="mt-3 space-y-2.5 text-sm" style={fgText}>
          {tldr.summary ? (
            <p className={themed ? "leading-relaxed" : "leading-relaxed text-gray-700 dark:text-gray-300"} style={fgText}>
              {tldr.summary}
            </p>
          ) : null}
          {tldr.points.length > 0 ? (
            <ul className={themed ? "list-disc list-inside space-y-0.5" : "list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400"} style={fgMuted}>
              {tldr.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          ) : null}
          {tldr.keywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tldr.keywords.map((kw, i) => (
                <span
                  key={i}
                  className={themed ? "px-2 py-0.5 text-[10px] font-medium rounded-full border tracking-wide" : "px-2 py-0.5 text-[10px] font-medium rounded-full bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-300 tracking-wide"}
                  style={chipStyle}
                >
                  {kw}
                </span>
              ))}
            </div>
          ) : null}
          {tldr.conclusion ? (
            <p
              className={themed ? "font-medium border-t pt-2" : "font-medium border-t border-accent-200/60 dark:border-accent-800/40 pt-2 text-gray-800 dark:text-gray-200"}
              style={themed ? { ...fgText, ...dividerStyle } : undefined}
            >
              {tldr.conclusion}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
