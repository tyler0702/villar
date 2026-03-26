import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface FileMetaData {
  modified: number | null;
  created: number | null;
}

function formatDate(epochMs: number): string {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}`;
}

export function FileMeta({ filePath }: { filePath: string | null }) {
  const [meta, setMeta] = useState<FileMetaData | null>(null);

  useEffect(() => {
    if (!filePath) {
      setMeta(null);
      return;
    }
    invoke<FileMetaData>("get_file_meta", { filePath }).then(setMeta).catch(() => setMeta(null));
  }, [filePath]);

  if (!meta || (!meta.created && !meta.modified)) return null;

  return (
    <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500 select-none whitespace-nowrap">
      {meta.created ? <span>Created {formatDate(meta.created)}</span> : null}
      {meta.modified ? <span>Updated {formatDate(meta.modified)}</span> : null}
    </div>
  );
}
