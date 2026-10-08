'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  DRIFT_RESYNC_THRESHOLD_SEC,
  FALLBACK_PALETTE,
  SocketEvents,
  type ChatMessage,
  type Palette,
  type PlaybackCurrent,
  type PlaybackSyncPayload,
  type RoomSnapshot,
} from '@ember/shared';
import type { EmberPlayerControls } from './useYouTubePlayer';
import { formatClock } from '@/lib/youtube';

interface Options {
  socket: Socket | null;
  serverNow: () => number;
  controls: EmberPlayerControls | null;
  audioUnlocked: boolean;
  /** The listener's own name, to skip self-toasts. */
  selfName: string;
}

export interface SyncActions {
  addToQueue(input: string): void;
  togglePlay(): void;
  seek(sec: number): void;
  skip(): void;
  reportEnded(videoId: string): void;
  sendChat(text: string): void;
  react(kind: string): void;
}

export interface PlaybackSync {
  snapshot: RoomSnapshot | null;
  current: PlaybackCurrent | null;
  palette: Palette;
  playing: boolean;
  positionSec: number;
  durationSec: number;
  messages: ChatMessage[];
  toast: string | null;
  actions: SyncActions;
}

export function usePlaybackSync({
  socket,
  serverNow,
  controls,
  audioUnlocked,
  selfName,
}: Options): PlaybackSync {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [lastSync, setLastSync] = useState<PlaybackSyncPayload | null>(null);
  const [current, setCurrent] = useState<PlaybackCurrent | null>(null);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const playing = current !== null && current.pausedAtSec === null;

  const currentRef = useRef<PlaybackCurrent | null>(null);
  const playingRef = useRef(false);
  const audioUnlockedRef = useRef(audioUnlocked);
  const loadedVideoRef = useRef<string | null>(null);
  const endedForRef = useRef<string | null>(null);
  currentRef.current = current;
  playingRef.current = playing;
  audioUnlockedRef.current = audioUnlocked;

  const expectedPosition = useCallback(
    (c: PlaybackCurrent | null): number => {
      if (!c) return 0;
      if (c.pausedAtSec !== null) return c.pausedAtSec;
      return Math.max(0, (serverNow() - c.startedAtServerMs) / 1000);
    },
    [serverNow],
  );

  // Subscribe to room + playback + chat events.
  useEffect(() => {
    if (!socket) return;
    const onState = (s: RoomSnapshot) => setSnapshot(s);
    const onSync = (p: PlaybackSyncPayload) => setLastSync(p);
    const onChat = (m: ChatMessage) => setMessages((prev) => [...prev.slice(-99), m]);
    socket.on(SocketEvents.RoomState, onState);
    socket.on(SocketEvents.PlaybackSync, onSync);
    socket.on(SocketEvents.ChatSend, onChat);
    return () => {
      socket.off(SocketEvents.RoomState, onState);
      socket.off(SocketEvents.PlaybackSync, onSync);
      socket.off(SocketEvents.ChatSend, onChat);
    };
  }, [socket]);

  useEffect(() => {
    if (snapshot) setCurrent(snapshot.current);
  }, [snapshot]);
  useEffect(() => {
    if (lastSync) setCurrent(lastSync.current);
  }, [lastSync]);

  const actions = useMemo<SyncActions>(
    () => ({
      addToQueue: (input) => socket?.emit(SocketEvents.QueueAdd, { input }),
      togglePlay: () =>
        socket?.emit(playingRef.current ? SocketEvents.PlaybackPause : SocketEvents.PlaybackPlay),
      seek: (sec) => socket?.emit(SocketEvents.PlaybackSeek, { positionSec: sec }),
      skip: () => socket?.emit(SocketEvents.PlaybackNext),
      reportEnded: (videoId) => socket?.emit(SocketEvents.PlaybackEnded, { videoId }),
      sendChat: (text) => socket?.emit(SocketEvents.ChatSend, { text }),
      react: (kind) => socket?.emit(SocketEvents.Reaction, { kind }),
    }),
    [socket],
  );

  // Reconcile the player with the authoritative state.
  useEffect(() => {
    if (!controls || !current) return;
    const expected = expectedPosition(current);
    if (loadedVideoRef.current !== current.videoId) {
      loadedVideoRef.current = current.videoId;
      endedForRef.current = null;
      controls.load(current.videoId, expected, playing && audioUnlocked);
      return;
    }
    if (Math.abs(controls.getTime() - expected) > DRIFT_RESYNC_THRESHOLD_SEC) {
      controls.seek(expected);
    }
    if (audioUnlocked) {
      if (playing) controls.play();
      else controls.pause();
    }
  }, [controls, current, playing, audioUnlocked, expectedPosition]);

  // Drift correction + natural-end detection + position readout.
  useEffect(() => {
    if (!controls) return;
    const tick = () => {
      const c = currentRef.current;
      if (!c) {
        setPositionSec(0);
        setDurationSec(0);
        return;
      }
      const expected = expectedPosition(c);
      const unlocked = audioUnlockedRef.current;
      const live = unlocked && loadedVideoRef.current === c.videoId ? controls.getTime() : expected;
      setPositionSec(live);
      setDurationSec(controls.getDuration());
      if (unlocked && playingRef.current && loadedVideoRef.current === c.videoId) {
        if (Math.abs(live - expected) > DRIFT_RESYNC_THRESHOLD_SEC) controls.seek(expected);
        const dur = controls.getDuration();
        if (dur > 0 && live >= dur - 0.4 && endedForRef.current !== c.videoId) {
          endedForRef.current = c.videoId;
          actions.reportEnded(c.videoId);
        }
      }
    };
    const id = window.setInterval(tick, 1000);
    tick();
    return () => window.clearInterval(id);
  }, [controls, expectedPosition, actions]);

  // Activity toast for other people's actions.
  useEffect(() => {
    if (!lastSync?.action || !lastSync.actorName || lastSync.actorName === selfName) return;
    const phrase: Record<string, string> = {
      play: 'resumed playback',
      pause: 'paused',
      seek: `skipped to ${formatClock(lastSync.actionPositionSec ?? 0)}`,
      next: 'skipped to the next track',
      add: 'added a track',
    };
    const text = phrase[lastSync.action];
    if (!text) return;
    setToast(`${lastSync.actorName} ${text}`);
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [lastSync, selfName]);

  return {
    snapshot,
    current,
    palette: current?.palette ?? FALLBACK_PALETTE,
    playing,
    positionSec,
    durationSec,
    messages,
    toast,
    actions,
  };
}
