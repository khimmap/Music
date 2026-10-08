import type { Transition } from 'motion/react';

/**
 * Shared motion presets. Realism: heavy, well-damped springs (no visible
 * overshoot on large elements), ease-out entrances, slightly faster ease-in
 * exits. Animate only transform / opacity / filter.
 */

/** Well-damped spring for large elements (no overshoot). */
export const SPRING: Transition = { type: 'spring', stiffness: 120, damping: 30, mass: 1 };

/** Softer spring for small controls. */
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 90, damping: 22, mass: 1 };

/** Ease-out curve for entrances. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Slightly faster ease-in curve for exits. */
export const EASE_IN = [0.6, 0, 0.9, 1] as const;

export const ENTER: Transition = { duration: 0.5, ease: EASE_OUT };
export const EXIT: Transition = { duration: 0.28, ease: EASE_IN };

/** Palette cross-fade duration on track change (ms). */
export const PALETTE_FADE_MS = 1500;
