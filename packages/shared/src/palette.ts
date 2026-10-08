/**
 * Color palette extracted from a track's YouTube thumbnail (server-side) and
 * sent with the queue item + current track. Drives the ambient background and
 * the player glow.
 */
export interface Palette {
  /** Most populous color. */
  dominant: string;
  /** Saturated, lively color. */
  vibrant: string;
  /** Desaturated color. */
  muted: string;
  /** Dark color for depth / edges. */
  dark: string;
  /** Readable foreground color against the dark room (WCAG AA checked). */
  text: string;
}

/** Neutral fallback palette (used before extraction or on failure). */
export const FALLBACK_PALETTE: Palette = {
  dominant: '#2a2622',
  vibrant: '#f4915b',
  muted: '#777169',
  dark: '#0c0a09',
  text: '#f5f3f0',
};
