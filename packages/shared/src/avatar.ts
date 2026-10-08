/**
 * How a listener is shown in the room: a simple icon avatar (emoji or initials)
 * with a brand-tinted color. No 3D / modular-character data anymore.
 */
export interface Avatar {
  /** Optional emoji glyph; when absent the UI falls back to initials of `name`. */
  emoji?: string;
  /** Display name. */
  name: string;
  /** Hex color used for the avatar bubble / initials. */
  color: string;
}
