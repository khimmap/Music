import { io, type Socket } from 'socket.io-client';

/**
 * Resolve the realtime server base URL (used for the socket and the room API).
 *
 * Priority:
 * 1. `NEXT_PUBLIC_SOCKET_URL` if set (e2e / custom deploys).
 * 2. localhost dev: the server on port 4000.
 * 3. A port-labelled forwarded host (e.g. VS Code dev tunnels
 *    `<id>-3000.<region>.devtunnels.ms` → `<id>-4000...`), so sharing works by
 *    forwarding both ports and opening the web (3000) URL.
 * 4. Fallback: same hostname, port 4000.
 */
function resolveServerBase(): string {
  const env = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (env) return env;
  if (typeof window === 'undefined') return 'http://localhost:4000';

  const { protocol, hostname, host } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:4000`;
  }
  if (host.includes('-3000.')) {
    return `${protocol}//${host.replace('-3000.', '-4000.')}`;
  }
  return `${protocol}//${hostname}:4000`;
}

/** Base URL of the realtime server + room API (resolved at call time, client-side). */
export function getServerBase(): string {
  return resolveServerBase();
}

/**
 * Create a fresh (disconnected) Socket.io client for one room session. The
 * caller connects and disconnects it; one socket per RoomProvider mount.
 */
export function createSocket(): Socket {
  return io(resolveServerBase(), { autoConnect: false });
}
