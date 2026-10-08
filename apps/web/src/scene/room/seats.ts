/**
 * Seat layout data for the room. Exported as plain data (not rendered avatars)
 * so the server/seat-assignment logic and the renderer agree on positions.
 */

export interface SeatTransform {
  id: string;
  /** World position [x, y, z]. */
  position: [number, number, number];
  /** Facing rotation around the Y axis (radians). */
  rotationY: number;
}

/**
 * Generate seats in a shallow curved arc facing the screen (which sits at -Z).
 * Count is clamped to 8..12 (room capacity rules live in @ember/shared).
 */
export function generateSeats(count = 10): SeatTransform[] {
  const n = Math.max(8, Math.min(12, count));
  const radius = 4.6;
  const spread = Math.PI * 0.72;
  const seats: SeatTransform[] = [];

  for (let i = 0; i < n; i += 1) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const angle = -spread / 2 + t * spread;
    const x = Math.sin(angle) * radius;
    const z = 1.4 + (1 - Math.cos(angle)) * radius * 0.5;
    // Face toward the screen/fire (-Z), turning slightly inward.
    const rotationY = Math.PI - angle * 0.5;
    seats.push({ id: `seat-${i}`, position: [x, 0, z], rotationY });
  }

  return seats;
}

/** Default seating used by the room (10 seats). */
export const SEATS: SeatTransform[] = generateSeats(10);
