/**
 * Seat contracts shared between the Ember web client and server.
 *
 * Skeleton only — seats are fixed positions around the room that members are
 * assigned to when they join. The server is authoritative over assignments.
 */

/** A fixed seat in the 3D room. */
export interface Seat {
  /** Stable seat id. */
  id: string;
  /** Ordinal seat index (0..N-1) around the room. */
  index: number;
  /** World-space position in the 3D room [x, y, z]. */
  position: [number, number, number];
  /** Facing direction around the Y axis, in radians. */
  rotationY: number;
  /** Member id currently seated here, or null if empty. */
  occupantId: string | null;
}

/** Server → client contract assigning a member to a seat. */
export interface SeatAssignment {
  /** Seat being assigned. */
  seatId: string;
  /** Member assigned to the seat. */
  memberId: string;
}
