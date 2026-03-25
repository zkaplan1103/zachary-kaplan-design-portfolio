import type { BezelBounds } from '@/hooks/useBezel'

/** Convert a percentage of screen width to px */
export const pctW = (b: BezelBounds, pct: number): number => b.width * (pct / 100)

/** Convert a percentage of screen height to px */
export const pctH = (b: BezelBounds, pct: number): number => b.height * (pct / 100)

/** Distance from top of screen area in px */
export const fromTop = (b: BezelBounds, pct: number): number => b.height * (pct / 100)

/** Distance from bottom of screen area in px (returns px from top) */
export const fromBottom = (b: BezelBounds, pct: number): number => b.height * (1 - pct / 100)

/**
 * Returns the left offset to horizontally center an element of given width
 * within the bezel screen area.
 */
export const centerX = (b: BezelBounds, elementWidth: number): number =>
  (b.width - elementWidth) / 2

/**
 * Fluid font size clamped between minPx and maxPx,
 * scaled proportionally to screen width.
 */
export const fluidFont = (
  b: BezelBounds,
  minPx: number,
  maxPx: number,
  scaleFactor = 0.05,
): number => Math.min(maxPx, Math.max(minPx, b.width * scaleFactor))
