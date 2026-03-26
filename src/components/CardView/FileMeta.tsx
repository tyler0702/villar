import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface FileMetaData {
  modified: string | null;
  created: string | null;
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
    <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500 select-none">
      {meta.created ? <span>Created: {meta.created}</span> : null}
      {meta.modified ? <span>Updated: {meta.modified}</span> : null}
    </div>
  );
}
