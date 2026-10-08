export type TimeState = 'morning' | 'day' | 'evening' | 'night';

export const TIME_STATES: TimeState[] = ['morning', 'day', 'evening', 'night'];

export function isTimeState(v: unknown): v is TimeState {
  return typeof v === 'string' && (TIME_STATES as string[]).includes(v);
}

/** Local hour -> time-of-day state. Mirrored by the inline no-flash script in
 * layout.tsx; keep the two in sync. */
export function hourToState(hour: number): TimeState {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 23) return 'evening';
  return 'night';
}

/** Small secondary tagline under the main one (none for `day`). */
export const TIME_TAGLINE: Record<TimeState, string | null> = {
  morning: 'Morning playlist, anyone?',
  day: null,
  evening: 'Golden hour. Pick a song.',
  night: 'Still up? Come sit by the fire.',
};

/** Hidden easter-egg line (also announced via aria-live). */
export const FIRE_TAGLINE = 'You found the fire.';
