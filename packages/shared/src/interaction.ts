/**
 * Playful interaction contracts shared between the Ember web client and server.
 *
 * Skeleton only — throwing props (tomato/trash) and emotes. All interactions
 * are rate-limited server-side; the cooldown constants below are the single
 * source of truth for both the optimistic client UI and the server guard.
 */

/** Throwable prop kinds. */
export type ThrowableKind = 'tomato' | 'trash';

/** Emote kinds a character can play. */
export type EmoteKind = 'wave' | 'clap' | 'dance' | 'laugh' | 'heart';

/** A member throwing a prop at another member. */
export interface ThrowEvent {
  /** Member id of the thrower. */
  from: string;
  /** Member id of the target. */
  to: string;
  /** What was thrown. */
  kind: ThrowableKind;
  /** Server-authoritative timestamp (epoch ms). */
  at: number;
}

/** A member playing an emote. */
export interface EmoteEvent {
  /** Member id playing the emote. */
  from: string;
  /** Which emote. */
  kind: EmoteKind;
  /** Server-authoritative timestamp (epoch ms). */
  at: number;
}

/** Server-enforced cooldowns, in milliseconds, to prevent spam. */
export const INTERACTION_COOLDOWNS = {
  /** Minimum time between throws from one member. */
  throw: 3000,
  /** Minimum time between emotes from one member. */
  emote: 1500,
} as const;
