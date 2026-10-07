import { io, type Socket } from 'socket.io-client';

/**
 * Socket.io client for the Ember realtime server.
 *
 * Initialization only — this client is intentionally not wired into any
 * component or hook yet. `autoConnect: false` keeps it idle until a future
 * hook (apps/web/src/hooks) calls `socket.connect()`.
 */
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});
