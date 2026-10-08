'use client';

import { useRoom } from '../RoomProvider';
import { initials } from '@/lib/identity';

/** First-visit gate: a blurred backdrop with a large round play button that
 * unlocks audio and syncs the viewer; listener avatars shown below. */
export function ClickToListen() {
  const { unlockAudio, members, palette } = useRoom();
  return (
    <div
      data-testid="click-to-listen"
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-lg bg-black/60 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={unlockAudio}
        data-testid="listen-cta"
        aria-label="Listen together"
        className="grid h-24 w-24 place-items-center rounded-full text-ink transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 active:scale-[0.97]"
        style={{ backgroundColor: palette.vibrant, boxShadow: `0 0 90px -10px ${palette.vibrant}` }}
      >
        <span aria-hidden="true" className="ml-1 text-[34px] leading-none">
          ▶
        </span>
      </button>
      <p className="font-display text-display-sm text-on-dark">Listen together</p>
      {members.length > 0 && (
        <div className="flex -space-x-2">
          {members.slice(0, 8).map((m) => (
            <span
              key={m.id}
              className="grid h-8 w-8 place-items-center rounded-full border border-black/40 text-caption"
              style={{ backgroundColor: m.color, color: '#0c0a09' }}
            >
              <span aria-hidden="true">{m.emoji ?? initials(m.name)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
