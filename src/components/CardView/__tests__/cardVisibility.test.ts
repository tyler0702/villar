import { describe, expect, it } from "vitest";
import {
  isCardVerticallyVisible,
  shouldScrollOnDirectActivation,
} from "../cardVisibility";

// Container viewport: top=0, bottom=800 (mimics scrollable area)
const container = { top: 0, bottom: 800 };

describe("isCardVerticallyVisible", () => {
  it("returns true when card is fully inside the container", () => {
    expect(isCardVerticallyVisible({ top: 100, bottom: 400 }, container)).toBe(true);
  });

  it("returns true when card overlaps the top edge (user has scrolled past the start)", () => {
    expect(isCardVerticallyVisible({ top: -200, bottom: 300 }, container)).toBe(true);
  });

  it("returns true when card overlaps the bottom edge (next card peeking from below)", () => {
    expect(isCardVerticallyVisible({ top: 600, bottom: 1200 }, container)).toBe(true);
  });

  it("returns true when card spans the entire container (taller than viewport)", () => {
    expect(isCardVerticallyVisible({ top: -500, bottom: 1500 }, container)).toBe(true);
  });

  it("returns false when card is completely above the container", () => {
    expect(isCardVerticallyVisible({ top: -400, bottom: -100 }, container)).toBe(false);
  });

  it("returns false when card is completely below the container", () => {
    expect(isCardVerticallyVisible({ top: 900, bottom: 1500 }, container)).toBe(false);
  });

  it("returns false when card bottom exactly meets container top (touching but not overlapping)", () => {
    expect(isCardVerticallyVisible({ top: -200, bottom: 0 }, container)).toBe(false);
  });

  it("returns false when card top exactly meets container bottom (touching but not overlapping)", () => {
    expect(isCardVerticallyVisible({ top: 800, bottom: 1000 }, container)).toBe(false);
  });
});

describe("shouldScrollOnDirectActivation", () => {
  it("does not scroll when the card is partially visible at the bottom (Tyler's scroll-first case)", () => {
    // The original bug: next card peeking from below + click → unwanted scroll to top.
    expect(shouldScrollOnDirectActivation({ top: 600, bottom: 1200 }, container)).toBe(false);
  });

  it("does not scroll when the card top is hidden above (user is reading mid-card)", () => {
    // The originally-requested behavior for big cards.
    expect(shouldScrollOnDirectActivation({ top: -200, bottom: 600 }, container)).toBe(false);
  });

  it("does not scroll when the card is fully inside the viewport", () => {
    expect(shouldScrollOnDirectActivation({ top: 100, bottom: 400 }, container)).toBe(false);
  });

  it("does not scroll for a big card that fills more than the viewport", () => {
    expect(shouldScrollOnDirectActivation({ top: -300, bottom: 1500 }, container)).toBe(false);
  });

  it("scrolls when the card is fully out of view (programmatic activation guard)", () => {
    expect(shouldScrollOnDirectActivation({ top: 900, bottom: 1500 }, container)).toBe(true);
    expect(shouldScrollOnDirectActivation({ top: -500, bottom: -100 }, container)).toBe(true);
  });
});
