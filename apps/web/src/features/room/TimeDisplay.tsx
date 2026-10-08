'use client';

import { useRoom } from './RoomProvider';
import { Odometer } from './Odometer';
import { formatClock } from '@/lib/youtube';

/**
 * Elapsed / total time under the progress wave. The elapsed clock rolls like an
 * odometer per character (so only the digit that changes moves); the total is
 * static. Hidden until a track is playing.
 */
export function TimeDisplay() {
  const { current, positionSec, durationSec } = useRoom();
  if (!current) return null;
  const elapsed = formatClock(positionSec);
  const total = durationSec > 0 ? formatClock(durationSec) : null;

  return (
    <div
      data-testid="time-display"
      className="flex w-full max-w-[880px] items-center justify-between font-sans text-caption tabular-nums text-on-dark-soft"
    >
      <span className="flex" data-testid="time-elapsed" aria-label={`Elapsed ${elapsed}`}>
        {elapsed.split('').map((ch, i) => (
          <Odometer key={`${elapsed.length}-${i}`} value={ch} />
        ))}
      </span>
      {total && <span aria-hidden="true">{total}</span>}
    </div>
  );
}
