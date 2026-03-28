import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ProcessedSection } from "../../hooks/useMarkdown";
import { useTranslation } from "../../i18n/useTranslation";

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

function isJapanese(text: string): boolean {
  const sample = text.slice(0, 200);
  let cjk = 0;
  for (const ch of sample) {
    const code = ch.codePointAt(0) ?? 0;
    // Hiragana, Katakana, CJK Unified Ideographs
    if ((code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF) || (code >= 0x4E00 && code <= 0x9FFF)) {
      cjk++;
    }
  }
  return cjk / Math.max(sample.length, 1) > 0.1;
}

function estimateReadTime(sections: ProcessedSection[]): number {
  const allText = sections.map((s) => {
    // Strip HTML tags from html content for word/char count
    const textFromHtml = s.html.replace(/<[^>]+>/g, "");
    return textFromHtml;
  }).join(" ");

  if (isJapanese(allText)) {
    // Japanese: ~500 chars/min
    return Math.max(1, Math.ceil(allText.length / 500));
  }
  // English: ~200 words/min
  const words = allText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function FileMeta({ filePath, sections }: { filePath: string | null; sections?: ProcessedSection[] }) {
  const [meta, setMeta] = useState<FileMetaData | null>(null);
  const t = useTranslation();

  useEffect(() => {
    if (!filePath) {
      setMeta(null);
      return;
    }
    invoke<FileMetaData>("get_file_meta", { filePath }).then(setMeta).catch(() => setMeta(null));
  }, [filePath]);

  const readTime = useMemo(() => {
    if (!sections || sections.length === 0) return null;
    return estimateReadTime(sections);
  }, [sections]);

  if (!meta && !readTime) return null;

  return (
    <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500 select-none whitespace-nowrap">
      {readTime ? <span>{t("meta.readTime").replace("{min}", String(readTime))}</span> : null}
      {meta?.created ? <span>Created {formatDate(meta.created)}</span> : null}
      {meta?.modified ? <span>Updated {formatDate(meta.modified)}</span> : null}
    </div>
  );
}
