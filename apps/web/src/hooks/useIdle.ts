'use client';

import { useEffect, useState } from 'react';

/** True after `ms` of no pointer/keyboard activity (used to fade idle chrome). */
export function useIdle(ms = 4000): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer = 0;
    const reset = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), ms);
    };
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [ms]);

  return idle;
}
