/**
 * Room & membership contracts shared between the Ember web client and server.
 */

/** Maximum number of members allowed in a single room. */
export const MAX_ROOM_USERS = 12;

/** A participant currently connected to a room, shown as an icon avatar. */
export interface Member {
  /** Stable per-connection id (the socket id). */
  id: string;
  /** Display name shown to other members. */
  name: string;
  /** Hex color for the avatar bubble / initials. */
  color: string;
  /** Optional emoji glyph; UI falls back to initials of `name` when absent. */
  emoji?: string;
  /** When true, this member has opted out of being targeted by throws. */
  optOut?: boolean;
}

/** A shared listening room. */
export interface Room {
  id: string;
  name: string;
  members: Member[];
  createdAt: number;
}

/** A chat message relayed through the room. */
export interface ChatMessage {
  /** Member id of the sender. */
  from: string;
  /** Sender display name. */
  name: string;
  /** Message text. */
  text: string;
  /** Epoch milliseconds. */
  at: number;
}
