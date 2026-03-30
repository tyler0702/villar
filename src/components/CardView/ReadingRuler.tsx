import { useEffect, useRef, useState } from "react";

export function ReadingRuler() {
  const [y, setY] = useState<number | null>(null);
  const rafRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    function handleMove(e: MouseEvent) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = container!.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        if (relY >= 0 && relY <= rect.height) {
          setY(relY);
        } else {
          setY(null);
        }
      });
    }

    function handleLeave() {
      cancelAnimationFrame(rafRef.current);
      setY(null);
    }

    container.addEventListener("mousemove", handleMove, { passive: true });
    container.addEventListener("mouseleave", handleLeave);
    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener("mousemove", handleMove);
      container.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  if (y === null) return <div ref={containerRef} className="reading-ruler" />;

  // Line height ~1.6em ≈ 25.6px at 16px base
  const lineH = 26;
  const top = y - lineH / 2;

  return (
    <div ref={containerRef} className="reading-ruler">
      {/* Dim above */}
      <div
        className="pointer-events-none fixed left-0 right-0"
        style={{
          top: 0,
          height: `${Math.max(0, top)}px`,
          background: "rgba(0,0,0,0.04)",
          zIndex: 15,
        }}
      />
      {/* Highlight bar */}
      <div
        className="pointer-events-none fixed left-0 right-0"
        style={{
          top: `${top}px`,
          height: `${lineH}px`,
          background: "var(--vs-accent, oklch(0.65 0.14 75))",
          opacity: 0.1,
          zIndex: 15,
        }}
      />
      {/* Dim below */}
      <div
        className="pointer-events-none fixed left-0 right-0 bottom-0"
        style={{
          top: `${top + lineH}px`,
          background: "rgba(0,0,0,0.04)",
          zIndex: 15,
        }}
      />
    </div>
  );
}
