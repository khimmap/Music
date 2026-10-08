'use client';

import { useEffect } from 'react';
import { useQuality } from './quality/QualityProvider';

/**
 * Drives a global `--ember-flicker` CSS variable (0.6..1) with noise-driven
 * intensity (summed incommensurate sines, irregular like real fire), so the
 * ember glow + avatar halos flicker without per-element React re-renders.
 * Steady under reduced motion; paused when the tab is hidden.
 */
export function FireFlicker() {
  const { reducedMotion, visible } = useQuality();

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.style.setProperty('--ember-flicker', '0.9');
      return;
    }
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      const t = performance.now() / 1000;
      const n = (Math.sin(t * 7.1) + Math.sin(t * 11.3) + Math.sin(t * 3.7)) / 3;
      root.style.setProperty('--ember-flicker', (0.82 + n * 0.18).toFixed(3));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, visible]);

  return null;
}
