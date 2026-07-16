import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useAppStore } from "../../stores/useAppStore";

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
const STEP = 1.25;

// Fullscreen lightbox for Mermaid diagrams — mounted OUTSIDE the zoom
// container (like ImagePreview) so position:fixed coordinates stay correct
// at non-100% font scale. Wheel / buttons zoom, drag pans, Esc closes.
export function MermaidPreview() {
  const svg = useAppStore((s) => s.previewMermaid);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const movedRef = useRef(false);
  const close = () => useAppStore.getState().setPreviewMermaid(null);
  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };
  const zoomIn = () => setScale((s) => Math.min(s * STEP, MAX_SCALE));
  const zoomOut = () => setScale((s) => Math.max(s / STEP, MIN_SCALE));

  useEffect(() => {
    if (!svg) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s * STEP, MAX_SCALE));
      else if (e.key === "-") setScale((s) => Math.max(s / STEP, MIN_SCALE));
      else if (e.key === "0") { setScale(1); setOffset({ x: 0, y: 0 }); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [svg]);

  // Native wheel listener — React's synthetic onWheel is passive, preventDefault would warn
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || !svg) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor)));
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [svg]);

  if (!svg) return null;

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    movedRef.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    if (movedRef.current) setOffset({ x: d.baseX + dx, y: d.baseY + dy });
  };
  const onPointerUp = () => { dragRef.current = null; };
  const onClick = () => {
    if (movedRef.current) { movedRef.current = false; return; }
    close();
  };

  const btnClass = "px-2 py-0.5 rounded hover:bg-white/20 cursor-pointer";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 cursor-grab active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        <div
          className="rounded-xl shadow-2xl p-6 max-w-[85vw] bg-white dark:bg-surface-800 vs-card"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <div
        className="absolute top-4 right-4 flex items-center gap-0.5 rounded-lg bg-black/70 text-white text-sm px-1.5 py-1 select-none"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={zoomOut} className={btnClass} title="Zoom out (-)">&minus;</button>
        <span className="w-12 text-center text-xs tabular-nums opacity-80">{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} className={btnClass} title="Zoom in (+)">+</button>
        <button onClick={reset} className={`${btnClass} text-xs`} title="Reset (0)">1:1</button>
        <button onClick={close} className={btnClass} title="Close (Esc)">&#x2715;</button>
      </div>
    </div>
  );
}
