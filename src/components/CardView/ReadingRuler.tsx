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
        const relY = e.clientY - rect.top + container!.scrollTop;
        if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
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

  const lineH = 26;
  const top = y - lineH / 2;

  return (
    <div ref={containerRef} className="reading-ruler">
      {/* Highlight bar — contained within scroll area */}
      <div
        className="pointer-events-none absolute left-0 right-0"
        style={{
          top: `${top}px`,
          height: `${lineH}px`,
          background: "var(--vs-accent, oklch(0.65 0.14 75))",
          opacity: 0.12,
          zIndex: 15,
          borderRadius: "2px",
        }}
      />
    </div>
  );
}
