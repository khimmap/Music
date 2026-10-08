import { isStubPlayer } from '@/lib/youtube';

declare global {
  interface Window {
    /** e2e-only: force a measured FPS value to exercise auto-downgrade. */
    __emberSimulateFps?: number;
  }
}

export interface FpsMonitor {
  start(): void;
  stop(): void;
}

/**
 * Calls `onLow` once when the average FPS stays below 45 for ~3 seconds.
 * In e2e mode, `window.__emberSimulateFps` overrides the measured value.
 */
export function createFpsMonitor(onLow: () => void): FpsMonitor {
  let raf = 0;
  let frames = 0;
  let windowStart = performance.now();
  let lowSince = 0;
  let running = false;

  const tick = (t: number) => {
    frames += 1;
    const elapsed = t - windowStart;
    if (elapsed >= 1000) {
      let fps = (frames * 1000) / elapsed;
      if (isStubPlayer() && typeof window.__emberSimulateFps === 'number') {
        fps = window.__emberSimulateFps;
      }
      frames = 0;
      windowStart = t;
      if (fps < 45) {
        if (lowSince === 0) lowSince = t;
        else if (t - lowSince >= 3000) {
          lowSince = 0;
          onLow();
        }
      } else {
        lowSince = 0;
      }
    }
    if (running) raf = requestAnimationFrame(tick);
  };

  return {
    start() {
      if (running) return;
      running = true;
      frames = 0;
      windowStart = performance.now();
      lowSince = 0;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
