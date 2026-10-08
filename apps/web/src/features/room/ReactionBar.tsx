'use client';

import { useRoom } from './RoomProvider';

const REACTIONS: { kind: string; glyph: string; label: string }[] = [
  { kind: 'fire', glyph: '🔥', label: 'Fire' },
  { kind: 'heart', glyph: '❤️', label: 'Love it' },
  { kind: 'clap', glyph: '👏', label: 'Clap' },
  { kind: 'laugh', glyph: '😂', label: 'Laugh' },
  { kind: 'wave', glyph: '👋', label: 'Wave' },
];

/** Reaction buttons. Buttons only for now; the flying-reaction animation is
 * wired in part 2 (the server already relays `reaction:send`). */
export function ReactionBar() {
  const { react } = useRoom();
  return (
    <div className="pointer-events-auto flex items-center gap-xs" data-testid="reaction-bar">
      {REACTIONS.map((r) => (
        <button
          key={r.kind}
          type="button"
          onClick={() => react(r.kind)}
          aria-label={r.label}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-body-md transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:translate-y-px"
        >
          <span aria-hidden="true">{r.glyph}</span>
        </button>
      ))}
    </div>
  );
}
