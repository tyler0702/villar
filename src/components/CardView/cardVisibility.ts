/**
 * Visibility helpers for direct card-click activation in CardView.
 *
 * Scroll-first readers (who navigate by scrolling rather than clicking) used to
 * be jolted when accidentally clicking a partially-visible card below the fold:
 * the click would call setActiveCardIndex, and the useEffect that watches
 * activeIndex would scrollIntoView the card to viewport top.
 *
 * The rule is now: a direct click should never auto-scroll when any part of
 * the clicked card is on screen. This module exposes the rectangle-overlap
 * predicate as a pure function so it can be unit tested in isolation.
 */
export type RectLike = Pick<DOMRect, "top" | "bottom">;

/**
 * Returns true when the card rectangle and the container rectangle overlap
 * vertically by at least one pixel. This means the card is partially or fully
 * visible inside the scroll container.
 */
export function isCardVerticallyVisible(card: RectLike, container: RectLike): boolean {
  return card.bottom > container.top && card.top < container.bottom;
}

/**
 * Direct-click activation should scroll only when the card is fully out of
 * the container's viewport. In practice this almost never fires (you have to
 * see a card to click it) — the guard exists for programmatic activeIndex
 * changes that happen to bypass navigateToCard.
 */
export function shouldScrollOnDirectActivation(
  card: RectLike,
  container: RectLike
): boolean {
  return !isCardVerticallyVisible(card, container);
}
