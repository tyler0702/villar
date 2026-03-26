import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../../stores/useAppStore";

interface SearchHit {
  file_name: string;
  file_path: string;
  line_number: number;
  line_text: string;
}

interface SearchPanelProps {
  onClose: () => void;
}

export function SearchPanel({ onClose }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const folderPath = useAppStore((s) => s.folderPath);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim() || !folderPath || composingRef.current) {
      if (!query.trim()) setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const hits = await invoke<SearchHit[]>("search_files", {
          dirPath: folderPath,
          query: query.trim(),
        });
        setResults(hits);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, folderPath]);

  async function handleSelect(hit: SearchHit) {
    const file = { name: hit.file_name, path: hit.file_path };
    const content = await invoke<string>("read_file", { filePath: hit.file_path });
    useAppStore.getState().openTab(file, content);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-gray-200/60 dark:border-gray-700/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/40">
          <span className="text-gray-400 text-sm">Search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={(e) => { composingRef.current = false; setQuery((e.target as HTMLInputElement).value); }}
            placeholder="Search in all files..."
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
          />
          {searching ? (
            <span className="text-[10px] text-gray-400 animate-pulse">Searching...</span>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 && query.trim() && !searching ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              No results
            </p>
          ) : null}
          {results.map((hit, i) => (
            <button
              key={`${hit.file_path}-${hit.line_number}-${i}`}
              onClick={() => handleSelect(hit)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-accent-600 dark:text-accent-400">
                  {hit.file_name.replace(/\.md$/, "")}
                </span>
                <span className="text-[10px] text-gray-400">L{hit.line_number}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {hit.line_text}
              </p>
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-gray-200/60 dark:border-gray-700/40 text-[10px] text-gray-400 flex gap-3">
          <span><kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-mono">Esc</kbd> Close</span>
          <span><kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-mono">Cmd+K</kbd> Open search</span>
        </div>
      </div>
    </div>
  );
}
