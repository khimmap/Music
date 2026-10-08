/**
 * Lightweight reaction/emote contracts shared between the Ember web client and
 * server. (3D throwing has been removed; the 2D room uses reaction buttons.)
 */

/** Emote/reaction kinds a listener can send. */
export type EmoteKind = 'wave' | 'clap' | 'fire' | 'heart' | 'laugh';

/** A listener sending a reaction. */
export interface EmoteEvent {
  /** Member id sending the reaction. */
  from: string;
  /** Which reaction. */
  kind: EmoteKind;
  /** Server-authoritative timestamp (epoch ms). */
  at: number;
}

/** Server-enforced cooldown (ms) between reactions from one member. */
export const EMOTE_COOLDOWN_MS = 1500;
