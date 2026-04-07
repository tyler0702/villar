import { memo, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, type FsNode } from "../../stores/useAppStore";
import { logFileOpened } from "../../hooks/useMetrics";

interface FileTreeProps {
  nodes: FsNode[];
  selectedPath: string | null;
  depth?: number;
}

const FolderNode = memo(function FolderNode({
  node,
  selectedPath,
  depth,
}: {
  node: FsNode;
  selectedPath: string | null;
  depth: number;
}) {
  const [open, setOpen] = useState(depth === 0);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left flex items-center gap-1.5 px-2 py-1 text-sm rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="text-[10px] opacity-60 w-3 text-center shrink-0">
          {open ? "\u25BE" : "\u25B8"}
        </span>
        <span className="truncate">{node.name}</span>
      </button>
      {open ? (
        <FileTree nodes={node.children} selectedPath={selectedPath} depth={depth + 1} />
      ) : null}
    </div>
  );
});

const FileNode = memo(function FileNode({
  node,
  isSelected,
  depth,
}: {
  node: FsNode;
  isSelected: boolean;
  depth: number;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  async function handleClick() {
    const file = { name: node.name, path: node.path };
    logFileOpened(file.path);
    const content = await invoke<string>("read_file", { filePath: file.path });
    useAppStore.getState().openTab(file, content);
  }

  const handleContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
    const close = () => { setShowMenu(false); window.removeEventListener("click", close); };
    window.addEventListener("click", close);
  }, []);

  const copyName = useCallback(() => { navigator.clipboard.writeText(node.name); setShowMenu(false); }, [node.name]);
  const copyPath = useCallback(() => { navigator.clipboard.writeText(node.path); setShowMenu(false); }, [node.path]);

  return (
    <>
    <button
      onClick={handleClick}
      onContextMenu={handleContext}
      className={`w-full text-left flex items-center gap-1.5 px-2 py-1 text-sm rounded-lg truncate transition-colors ${
        isSelected
          ? "bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-200 font-medium"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <span className="text-[10px] opacity-40 w-3 text-center shrink-0">#</span>
      <span className="truncate">{node.name.replace(/\.md$/, "")}</span>
    </button>
    {showMenu ? (
      <div className="fixed z-50 bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 text-xs" style={{ left: menuPos.x, top: menuPos.y }}>
        <button onClick={copyName} className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Copy Filename</button>
        <button onClick={copyPath} className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Copy Path</button>
      </div>
    ) : null}
    </>
  );
});

export function FileTree({ nodes, selectedPath, depth = 0 }: FileTreeProps) {
  return (
    <>
      {nodes.map((node) =>
        node.is_dir ? (
          <FolderNode key={node.path} node={node} selectedPath={selectedPath} depth={depth} />
        ) : (
          <FileNode key={node.path} node={node} isSelected={node.path === selectedPath} depth={depth} />
        )
      )}
    </>
  );
}
