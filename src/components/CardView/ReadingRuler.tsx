import { useEffect, useRef, useCallback } from "react";

export function ReadingRuler() {
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const handleMove = useCallback((e: MouseEvent) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const bar = barRef.current;
      // Use main element (outside zoom) as bounds
      const bounds = document.querySelector("[data-ruler-bounds]");
      if (!bar || !bounds) return;

      const rect = bounds.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom ||
          e.clientX < rect.left || e.clientX > rect.right) {
        bar.style.display = "none";
        return;
      }

      bar.style.display = "block";
      bar.style.top = `${e.clientY - 13}px`;
      bar.style.left = `${rect.left}px`;
      bar.style.width = `${rect.width}px`;
    });
  }, []);

  const handleLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (barRef.current) barRef.current.style.display = "none";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, [handleMove, handleLeave]);

  return (
    <div
      ref={barRef}
      className="reading-ruler"
      style={{
        display: "none",
        position: "fixed",
        height: "26px",
        background: "var(--vs-accent, oklch(0.65 0.14 75))",
        opacity: 0.12,
        zIndex: 15,
        borderRadius: "2px",
        pointerEvents: "none",
      }}
    />
  );
}
