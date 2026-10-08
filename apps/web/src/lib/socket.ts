import { io, type Socket } from 'socket.io-client';

/** URL of the Ember realtime server. */
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

/**
 * Create a fresh (disconnected) Socket.io client for one room session. The
 * caller connects and disconnects it; one socket per RoomProvider mount.
 */
export function createSocket(): Socket {
  return io(SOCKET_URL, { autoConnect: false });
}
