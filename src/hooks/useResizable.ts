import { useCallback, useRef } from "react";

export function useResizable(
  currentWidth: number,
  onResize: (width: number) => void,
  min = 150,
  max = 500,
  side: "left" | "right" = "left"
) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = currentWidth;

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = side === "left"
          ? ev.clientX - startX.current
          : startX.current - ev.clientX;
        const next = Math.max(min, Math.min(max, startWidth.current + delta));
        onResize(next);
      };

      const onMouseUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [currentWidth, onResize, min, max, side]
  );

  return onMouseDown;
}
