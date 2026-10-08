/**
 * Reaction / throw / cursor / vote contracts shared between the Ember web
 * client and server.
 */

/** Emote/reaction kinds a listener can send. */
export type EmoteKind = 'wave' | 'clap' | 'fire' | 'heart' | 'laugh';

/** A listener sending a reaction (server broadcasts this with `from`). */
export interface ReactionEvent {
  from: string;
  kind: string;
  at: number;
}

/** Server-enforced cooldowns (ms). */
export const EMOTE_COOLDOWN_MS = 1500;
export const THROW_COOLDOWN_MS = 5000;

/** interaction:throw (client -> server). */
export interface ThrowPayload {
  /** Target member id. */
  to: string;
  /** Prop kind (currently always "tomato"). */
  kind?: string;
}

/** interaction:throw result (ack) + broadcast. */
export interface ThrowResult {
  ok: boolean;
  reason?: 'cooldown' | 'opted-out' | 'invalid';
}
export interface ThrowEvent {
  from: string;
  to: string;
  kind: string;
  at: number;
}

/** cursor:move (client -> server {x,y}); server -> clients adds `id`. */
export interface CursorPayload {
  /** Normalized viewport coordinates (0..1). */
  x: number;
  y: number;
}
export interface CursorEvent {
  id: string;
  x: number;
  y: number;
}

/** chat:typing (client -> server {typing}); server -> clients adds `id`. */
export interface TypingPayload {
  typing: boolean;
}
export interface TypingEvent {
  id: string;
  typing: boolean;
}

/** vote:state (server -> clients): skip-vote progress for the current track. */
export interface VoteState {
  videoId: string | null;
  votes: number;
  needed: number;
}
