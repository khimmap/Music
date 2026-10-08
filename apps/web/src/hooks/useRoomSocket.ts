'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { SocketEvents } from '@ember/shared';
import { createSocket } from '@/lib/socket';
import { getIdentity } from '@/lib/identity';

const OFFSET_SAMPLES = 5;

export interface RoomSocket {
  socket: Socket | null;
  connected: boolean;
  /** Estimated server clock (ms). */
  serverNow(): number;
}

/**
 * Owns the Socket.io connection for a room: connects, joins (with the listener's
 * identity), and estimates the server clock offset (median of a few ping/pongs).
 */
export function useRoomSocket(roomId: string): RoomSocket {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const offsetRef = useRef(0);

  const estimateOffset = useCallback((s: Socket) => {
    const samples: number[] = [];
    const sample = () => {
      const sentAt = Date.now();
      s.emit(SocketEvents.TimeSync, sentAt, (serverNowMs: number) => {
        const receivedAt = Date.now();
        samples.push(serverNowMs + (receivedAt - sentAt) / 2 - receivedAt);
        if (samples.length < OFFSET_SAMPLES) sample();
        else {
          const sorted = [...samples].sort((a, b) => a - b);
          offsetRef.current = sorted[Math.floor(sorted.length / 2)] ?? 0;
        }
      });
    };
    sample();
  }, []);

  useEffect(() => {
    const identity = getIdentity();
    const s = createSocket();
    setSocket(s);

    const onConnect = () => {
      setConnected(true);
      estimateOffset(s);
      s.emit(SocketEvents.RoomJoin, {
        roomId,
        name: identity.name,
        color: identity.color,
        emoji: identity.emoji,
      });
    };
    const onFocus = () => {
      if (s.connected) estimateOffset(s);
    };

    s.on('connect', onConnect);
    s.on('disconnect', () => setConnected(false));
    window.addEventListener('focus', onFocus);
    s.connect();

    return () => {
      window.removeEventListener('focus', onFocus);
      s.off();
      s.disconnect();
      setSocket(null);
    };
  }, [roomId, estimateOffset]);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  return { socket, connected, serverNow };
}
