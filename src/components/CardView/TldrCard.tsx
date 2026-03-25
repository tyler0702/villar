import { useState } from "react";
import type { TldrData } from "../../plugins/remark-tldr";

interface TldrCardProps {
  tldr: TldrData;
}

export function TldrCard({ tldr }: TldrCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 w-full text-left"
      >
        <span>TL;DR</span>
        <span className="text-xs">{expanded ? "\u25B2" : "\u25BC"}</span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {tldr.summary && (
            <p>{tldr.summary}</p>
          )}
          {tldr.points.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5">
              {tldr.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          )}
          {tldr.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tldr.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
          {tldr.conclusion && (
            <p className="font-medium border-t border-blue-200 dark:border-blue-800 pt-2">
              {tldr.conclusion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
