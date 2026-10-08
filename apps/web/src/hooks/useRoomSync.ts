'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  SocketEvents,
  type PlaybackSyncPayload,
  type RoomSnapshot,
} from '@ember/shared';
import { createSocket } from '@/lib/socket';

/** Playback actions a client can request (all server-authoritative). */
export interface SyncActions {
  addToQueue(input: string): void;
  play(): void;
  pause(): void;
  seek(sec: number): void;
  skip(): void;
  reportEnded(videoId: string): void;
}

export interface RoomSync {
  snapshot: RoomSnapshot | null;
  lastSync: PlaybackSyncPayload | null;
  /** Estimated server clock (ms). */
  serverNow(): number;
  connected: boolean;
  actions: SyncActions;
}

const OFFSET_SAMPLES = 5;

/**
 * Connects to the room, estimates the server clock offset (median of a few
 * ping/pong samples), and tracks authoritative room + playback state.
 */
export function useRoomSync(roomId: string, name: string): RoomSync {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [lastSync, setLastSync] = useState<PlaybackSyncPayload | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const offsetRef = useRef(0);

  const estimateOffset = useCallback((socket: Socket) => {
    const samples: number[] = [];
    const sample = () => {
      const sentAt = Date.now();
      socket.emit(SocketEvents.TimeSync, sentAt, (serverNowMs: number) => {
        const receivedAt = Date.now();
        const rtt = receivedAt - sentAt;
        samples.push(serverNowMs + rtt / 2 - receivedAt);
        if (samples.length < OFFSET_SAMPLES) {
          sample();
        } else {
          const sorted = [...samples].sort((a, b) => a - b);
          offsetRef.current = sorted[Math.floor(sorted.length / 2)] ?? 0;
        }
      });
    };
    sample();
  }, []);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      estimateOffset(socket);
      socket.emit(SocketEvents.RoomJoin, { roomId, name });
    };
    const onFocus = () => {
      if (socket.connected) estimateOffset(socket);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', () => setConnected(false));
    socket.on(SocketEvents.RoomState, (state: RoomSnapshot) => setSnapshot(state));
    socket.on(SocketEvents.PlaybackSync, (payload: PlaybackSyncPayload) => setLastSync(payload));
    window.addEventListener('focus', onFocus);

    socket.connect();

    return () => {
      window.removeEventListener('focus', onFocus);
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, name, estimateOffset]);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  const actions = useMemo<SyncActions>(
    () => ({
      addToQueue: (input) => socketRef.current?.emit(SocketEvents.QueueAdd, { input }),
      play: () => socketRef.current?.emit(SocketEvents.PlaybackPlay),
      pause: () => socketRef.current?.emit(SocketEvents.PlaybackPause),
      seek: (sec) => socketRef.current?.emit(SocketEvents.PlaybackSeek, { positionSec: sec }),
      skip: () => socketRef.current?.emit(SocketEvents.PlaybackNext),
      reportEnded: (videoId) => socketRef.current?.emit(SocketEvents.PlaybackEnded, { videoId }),
    }),
    [],
  );

  return { snapshot, lastSync, serverNow, connected, actions };
}
