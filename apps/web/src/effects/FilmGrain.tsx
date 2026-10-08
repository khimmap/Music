'use client';

import { useQuality } from './quality/QualityProvider';

// Static SVG noise (no canvas). Animated variant shifts via transform only.
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Film grain overlay (~4% opacity). Animated / static / off per quality tier;
 * forced off under reduced motion. Shimmer uses transform only. */
export function FilmGrain() {
  const { flags, reducedMotion } = useQuality();
  const mode = reducedMotion ? 'off' : flags.filmGrain;
  if (mode === 'off') return null;

  return (
    <div
      aria-hidden="true"
      data-testid="film-grain"
      data-mode={mode}
      className={`pointer-events-none fixed -inset-[6%] z-40 opacity-[0.04] mix-blend-soft-light ${
        mode === 'animated' ? 'ember-grain-animated' : ''
      }`}
      style={{ backgroundImage: NOISE, backgroundSize: '140px 140px' }}
    />
  );
}
