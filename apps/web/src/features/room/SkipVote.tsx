'use client';

import { useRoom } from './RoomProvider';

/** 👎 skip-vote button with a fuse ring: a spark advances per vote; majority
 * triggers the next track (server-side) and a burn transition. */
export function SkipVote() {
  const { voteSkip, voteState, current } = useRoom();
  const votes = voteState?.votes ?? 0;
  const needed = voteState?.needed ?? 1;
  const pct = needed > 0 ? Math.min(100, (votes / needed) * 100) : 0;
  // Position of the fuse "spark" on the ring (0% = top, clockwise).
  const angle = (pct / 100) * 2 * Math.PI;
  const r = 18;
  const sparkX = Math.sin(angle) * r;
  const sparkY = -Math.cos(angle) * r;

  return (
    <button
      type="button"
      data-testid="vote-skip"
      onClick={voteSkip}
      disabled={!current}
      aria-label={`Vote to skip (${votes} of ${needed})`}
      className="relative grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-body-md transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-40"
    >
      <span aria-hidden="true">👎</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-3px] rounded-full"
        style={{
          background: `conic-gradient(var(--color-ember) ${pct}%, transparent 0)`,
          WebkitMask:
            'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
        }}
      />
      {votes > 0 && (
        <span
          aria-hidden="true"
          data-testid="vote-spark"
          className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
          style={{
            transform: `translate(calc(-50% + ${sparkX}px), calc(-50% + ${sparkY}px))`,
            backgroundColor: 'var(--color-ember)',
            boxShadow: '0 0 6px 2px var(--color-ember)',
          }}
        />
      )}
    </button>
  );
}
