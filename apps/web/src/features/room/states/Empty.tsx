'use client';

import { useReducedMotion } from '@/hooks/useReducedMotion';

/** Empty room: a single small breathing ember and an invitation to add a link. */
export function Empty() {
  const reduced = useReducedMotion();
  return (
    <div
      data-testid="room-empty"
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-base text-center"
    >
      <span
        aria-hidden="true"
        className={`h-4 w-4 rounded-full bg-ember ${reduced ? '' : 'ember-breathe'}`}
        style={{ boxShadow: '0 0 42px 10px rgba(244,145,91,0.55)' }}
      />
      <p className="font-sans text-title-sm text-on-dark-soft">
        Paste a YouTube link to light the fire
      </p>
    </div>
  );
}
