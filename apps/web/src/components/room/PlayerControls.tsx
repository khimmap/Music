'use client';

import { useRoom } from '@/stores/RoomProvider';
import { formatClock } from '@/lib/youtube';

export function PlayerControls() {
  const { playing, current, positionSec, durationSec, togglePlay, skip, seekTo } = useRoom();
  const hasVideo = current !== null;
  const max = Math.max(1, Math.floor(durationSec));

  return (
    <div className="pointer-events-auto mx-auto flex w-full max-w-[640px] items-center gap-base rounded-xl border border-white/10 bg-surface-dark-elevated px-base py-sm">
      <button
        type="button"
        onClick={togglePlay}
        disabled={!hasVideo}
        data-testid="toggle-play"
        aria-label={playing ? 'Pause' : 'Play'}
        className="rounded-pill bg-on-primary px-base py-xs font-sans text-button text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:translate-y-px disabled:opacity-40"
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        onClick={skip}
        disabled={!hasVideo}
        data-testid="skip"
        aria-label="Skip to next track"
        className="rounded-pill border border-white/20 px-base py-xs font-sans text-button text-on-dark transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:translate-y-px disabled:opacity-40"
      >
        Skip
      </button>
      <span className="font-sans text-caption tabular-nums text-on-dark-soft">
        {formatClock(positionSec)}
      </span>
      <input
        type="range"
        min={0}
        max={max}
        value={Math.min(max, Math.floor(positionSec))}
        onChange={(event) => seekTo(Number(event.target.value))}
        disabled={!hasVideo || durationSec <= 0}
        data-testid="seek"
        aria-label="Seek"
        className="h-1.5 flex-1 cursor-pointer disabled:cursor-default"
        style={{ accentColor: '#f5f5f5' }}
      />
      <span className="font-sans text-caption tabular-nums text-on-dark-soft">
        {durationSec > 0 ? formatClock(durationSec) : '0:00'}
      </span>
    </div>
  );
}
