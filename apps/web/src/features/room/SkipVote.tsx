'use client';

import { useRoom } from './RoomProvider';

/** 👎 skip-vote button with a fuse ring: a spark advances per vote; majority
 * triggers the next track (server-side) and a burn transition. */
export function SkipVote() {
  const { voteSkip, voteState, current } = useRoom();
  const votes = voteState?.votes ?? 0;
  const needed = voteState?.needed ?? 1;
  const pct = needed > 0 ? Math.min(100, (votes / needed) * 100) : 0;

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
    </button>
  );
}
