import { useState } from "react";
import type { TldrData } from "../../plugins/remark-tldr";
import { useAppStore } from "../../stores/useAppStore";

interface TldrCardProps {
  tldr: TldrData;
}

export function TldrCard({ tldr }: TldrCardProps) {
  const defaultExpanded = useAppStore((s) => s.settings.tldrExpanded);
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-5 rounded-xl border border-accent-200/60 dark:border-accent-800/40 bg-accent-50 dark:bg-accent-950 p-4">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 text-sm font-semibold text-accent-700 dark:text-accent-300 w-full text-left"
      >
        <span className="tracking-wide">TL;DR</span>
        <span className="text-[10px] opacity-60">{expanded ? "\u25B2" : "\u25BC"}</span>
      </button>
      {expanded ? (
        <div className="mt-3 space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
          {tldr.summary ? <p className="leading-relaxed">{tldr.summary}</p> : null}
          {tldr.points.length > 0 ? (
            <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
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
                  className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-300 tracking-wide"
                >
                  {kw}
                </span>
              ))}
            </div>
          ) : null}
          {tldr.conclusion ? (
            <p className="font-medium border-t border-accent-200/60 dark:border-accent-800/40 pt-2 text-gray-800 dark:text-gray-200">
              {tldr.conclusion}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
