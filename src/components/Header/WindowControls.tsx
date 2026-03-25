import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";

export function WindowControls() {
  const [hovered, setHovered] = useState(false);
  const win = getCurrentWindow();

  return (
    <div
      className="flex items-center gap-2 shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => win.close()}
        className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 transition-all flex items-center justify-center"
        title="Close"
      >
        {hovered ? <span className="text-[8px] leading-none text-black/60 font-bold">&times;</span> : null}
      </button>
      <button
        onClick={() => win.minimize()}
        className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 transition-all flex items-center justify-center"
        title="Minimize"
      >
        {hovered ? <span className="text-[8px] leading-none text-black/60 font-bold">&minus;</span> : null}
      </button>
      <button
        onClick={() => win.toggleMaximize()}
        className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 transition-all flex items-center justify-center"
        title="Maximize"
      >
        {hovered ? <span className="text-[7px] leading-none text-black/60 font-bold">&#9634;</span> : null}
      </button>
    </div>
  );
}
