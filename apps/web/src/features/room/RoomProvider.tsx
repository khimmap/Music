'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  ChatMessage,
  Member,
  Palette,
  PlaybackCurrent,
  QueueItem,
} from '@ember/shared';
import { FALLBACK_PALETTE } from '@ember/shared';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { usePlaybackSync } from '@/hooks/usePlaybackSync';
import { getIdentity } from '@/lib/identity';
import { isStubPlayer } from '@/lib/youtube';

declare global {
  interface Window {
    /** e2e-only: force the reconnecting state for the states test. */
    __emberForceReconnecting?: (on: boolean) => void;
  }
}

interface RoomContextValue {
  roomId: string;
  roomName: string;
  members: Member[];
  listeners: number;
  queue: QueueItem[];
  current: PlaybackCurrent | null;
  palette: Palette;
  playing: boolean;
  positionSec: number;
  durationSec: number;
  messages: ChatMessage[];
  toast: string | null;
  connected: boolean;
  reconnecting: boolean;
  audioUnlocked: boolean;
  inviteLink: string;
  registerPlayerMount: (el: HTMLElement | null) => void;
  unlockAudio: () => void;
  addToQueue: (input: string) => void;
  togglePlay: () => void;
  seekTo: (sec: number) => void;
  skip: () => void;
  sendChat: (text: string) => void;
  react: (kind: string) => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used inside <RoomProvider>');
  return ctx;
}

export function RoomProvider({ roomId, children }: { roomId: string; children: ReactNode }) {
  const name = useMemo(() => getIdentity().name, []);
  const { socket, connected, serverNow } = useRoomSocket(roomId);

  const [mountEl, setMountEl] = useState<HTMLElement | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(() => isStubPlayer());
  const [forcedReconnecting, setForcedReconnecting] = useState(false);
  const [everConnected, setEverConnected] = useState(false);

  const endedRef = useRef<() => void>(() => {});
  const { controls } = useYouTubePlayer({ mountEl, onEnded: () => endedRef.current() });
  const sync = usePlaybackSync({ socket, serverNow, controls, audioUnlocked, selfName: name });
  endedRef.current = () => {
    const c = sync.current;
    if (c) sync.actions.reportEnded(c.videoId);
  };

  useEffect(() => {
    if (connected) setEverConnected(true);
  }, [connected]);

  useEffect(() => {
    if (!isStubPlayer()) return;
    window.__emberForceReconnecting = (on: boolean) => setForcedReconnecting(on);
    window.__emberSeek = (sec: number) => sync.actions.seek(sec);
    return () => {
      delete window.__emberForceReconnecting;
      delete window.__emberSeek;
    };
  }, [sync.actions]);

  const unlockAudio = useCallback(() => setAudioUnlocked(true), []);

  const value = useMemo<RoomContextValue>(
    () => ({
      roomId,
      roomName: sync.snapshot?.name ?? 'Loading room',
      members: sync.snapshot?.members ?? [],
      listeners: sync.snapshot?.listeners ?? 0,
      queue: sync.snapshot?.queue ?? [],
      current: sync.current,
      palette: sync.palette ?? FALLBACK_PALETTE,
      playing: sync.playing,
      positionSec: sync.positionSec,
      durationSec: sync.durationSec,
      messages: sync.messages,
      toast: sync.toast,
      connected,
      reconnecting: forcedReconnecting || (!connected && everConnected),
      audioUnlocked,
      inviteLink: typeof window !== 'undefined' ? window.location.href : '',
      registerPlayerMount: setMountEl,
      unlockAudio,
      addToQueue: sync.actions.addToQueue,
      togglePlay: sync.actions.togglePlay,
      seekTo: sync.actions.seek,
      skip: sync.actions.skip,
      sendChat: sync.actions.sendChat,
      react: sync.actions.react,
    }),
    [roomId, sync, connected, forcedReconnecting, everConnected, audioUnlocked, unlockAudio],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
