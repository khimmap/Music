'use client';

/** Thin status line shown while the socket is reconnecting (the room glow is
 * desaturated by the parent). Playback resyncs automatically on reconnect. */
export function Reconnecting() {
  return (
    <div
      role="status"
      data-testid="reconnecting"
      className="pointer-events-none absolute left-1/2 top-base z-40 -translate-x-1/2 rounded-pill border border-white/10 bg-surface-dark-elevated/90 px-base py-xs font-sans text-caption text-on-dark-soft backdrop-blur"
    >
      Reconnecting…
    </div>
  );
}
