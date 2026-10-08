'use client';

import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { useRoom } from './RoomProvider';
import { formatClock } from '@/lib/youtube';

const W = 1000;
const H = 40;
const MID = 20;
const AMP = 7;
const FREQ = 0.055;
const PATH = (() => {
  let d = `M 0 ${MID}`;
  for (let x = 0; x <= W; x += 8) d += ` L ${x} ${(MID + AMP * Math.sin(x * FREQ)).toFixed(2)}`;
  return d;
})();

/** Progress rendered as a waveform: played part filled with the track color;
 * hover thickens it and shows the time at the cursor. Click / arrow keys seek. */
export function ProgressWave() {
  const { positionSec, durationSec, seekTo, current, palette } = useRoom();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [hoverX, setHoverX] = useState(0);

  const disabled = !current || durationSec <= 0;
  const pct = durationSec > 0 ? Math.min(100, (positionSec / durationSec) * 100) : 0;

  const ratioAt = (clientX: number): number => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const onMove = (e: PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setHoverX(e.clientX - rect.left);
  };
  const onClick = (e: MouseEvent) => {
    if (!disabled) seekTo(ratioAt(e.clientX) * durationSec);
  };
  const onKey = (e: KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowLeft') {
      seekTo(Math.max(0, positionSec - 5));
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      seekTo(Math.min(durationSec, positionSec + 5));
      e.preventDefault();
    } else if (e.key === 'Home') {
      seekTo(0);
    } else if (e.key === 'End') {
      seekTo(durationSec);
    }
  };

  const hoverTime = ref.current ? ratioAt((ref.current.getBoundingClientRect().left ?? 0) + hoverX) * durationSec : 0;

  return (
    <div className="relative w-full max-w-[880px]">
      <div
        ref={ref}
        data-testid="progress"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.floor(durationSec)}
        aria-valuenow={Math.floor(positionSec)}
        aria-valuetext={formatClock(positionSec)}
        onPointerMove={onMove}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onClick={onClick}
        onKeyDown={onKey}
        className="relative h-10 w-full cursor-pointer select-none rounded-md outline-none transition-transform duration-200 will-change-transform focus-visible:ring-2 focus-visible:ring-white/60"
        style={{ transform: hover ? 'scaleY(1.5)' : 'scaleY(1)' }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path d={PATH} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
        </svg>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
        >
          <path
            d={PATH}
            fill="none"
            stroke={palette.vibrant}
            strokeWidth={2.5}
            style={{ transition: 'stroke 1.5s ease' }}
          />
        </svg>
      </div>
      {hover && !disabled && (
        <div
          className="pointer-events-none absolute -top-7 rounded-sm bg-surface-dark-elevated px-xs py-[2px] font-sans text-caption tabular-nums text-on-dark"
          style={{ left: `${hoverX}px`, transform: 'translateX(-50%)' }}
        >
          {formatClock(hoverTime)}
        </div>
      )}
    </div>
  );
}
