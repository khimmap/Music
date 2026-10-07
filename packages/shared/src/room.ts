/**
 * Room & membership contracts shared between the Ember web client and server.
 *
 * Skeleton only — fields will grow as the realtime room features are built.
 */

/** A participant currently connected to an Ember listening room. */
export interface Member {
  /** Stable per-connection id (assigned by the server). */
  id: string;
  /** Display name shown to other members. */
  name: string;
  /** Epoch milliseconds when the member joined the room. */
  joinedAt: number;
}

/** Maximum number of members allowed in a single room. */
export const MAX_ROOM_USERS = 12;

/** A shared listening room — the "radio station" a group listens to together. */
export interface Room {
  /** Unique room id used for joining and routing socket events. */
  id: string;
  /** Human-friendly room name. */
  name: string;
  /** Members currently present in the room. */
  members: Member[];
  /** Epoch milliseconds when the room was created. */
  createdAt: number;
}
