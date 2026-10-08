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
import type { Socket } from 'socket.io-client';
import {
  FALLBACK_PALETTE,
  SocketEvents,
  type ChatMessage,
  type Member,
  type Palette,
  type PlaybackCurrent,
  type QueueItem,
  type ThrowResult,
  type VoteState,
} from '@ember/shared';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { usePlaybackSync } from '@/hooks/usePlaybackSync';
import { getIdentity } from '@/lib/identity';
import { isStubPlayer } from '@/lib/youtube';

declare global {
  interface Window {
    __emberForceReconnecting?: (on: boolean) => void;
    __emberChat?: (text: string) => void;
    __emberThrow?: (to: string) => Promise<ThrowResult>;
    __emberVoteSkip?: () => void;
    __emberSetOptOut?: (optOut: boolean) => void;
    __emberReact?: (kind: string) => void;
    __emberSelfId?: string | null;
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
  socket: Socket | null;
  selfId: string | null;
  voteState: VoteState | null;
  optedOut: boolean;
  registerPlayerMount: (el: HTMLElement | null) => void;
  unlockAudio: () => void;
  addToQueue: (input: string) => void;
  togglePlay: () => void;
  seekTo: (sec: number) => void;
  skip: () => void;
  sendChat: (text: string) => void;
  react: (kind: string) => void;
  throwAt: (to: string) => Promise<ThrowResult>;
  voteSkip: () => void;
  setOptOut: (optOut: boolean) => void;
  sendCursor: (x: number, y: number) => void;
  sendTyping: (typing: boolean) => void;
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
  const [selfId, setSelfId] = useState<string | null>(null);
  const [voteState, setVoteState] = useState<VoteState | null>(null);

  const endedRef = useRef<() => void>(() => {});
  const { controls } = useYouTubePlayer({ mountEl, onEnded: () => endedRef.current() });
  const sync = usePlaybackSync({ socket, serverNow, controls, audioUnlocked, selfName: name });
  endedRef.current = () => {
    const c = sync.current;
    if (c) sync.actions.reportEnded(c.videoId);
  };

  useEffect(() => {
    if (connected) {
      setEverConnected(true);
      setSelfId(socket?.id ?? null);
    }
  }, [connected, socket]);

  useEffect(() => {
    if (!socket) return;
    const onVote = (v: VoteState) => setVoteState(v);
    socket.on(SocketEvents.VoteState, onVote);
    return () => {
      socket.off(SocketEvents.VoteState, onVote);
    };
  }, [socket]);

  const interactions = useMemo(
    () => ({
      throwAt: (to: string): Promise<ThrowResult> =>
        new Promise((resolve) => {
          if (!socket) {
            resolve({ ok: false, reason: 'invalid' });
            return;
          }
          socket.emit(SocketEvents.InteractionThrow, { to }, (r: ThrowResult) => resolve(r));
        }),
      voteSkip: () => socket?.emit(SocketEvents.VoteSkip),
      setOptOut: (optOut: boolean) => socket?.emit(SocketEvents.MemberOptOut, { optOut }),
      sendCursor: (x: number, y: number) => socket?.volatile.emit(SocketEvents.CursorMove, { x, y }),
      sendTyping: (typing: boolean) => socket?.emit(SocketEvents.ChatTyping, { typing }),
    }),
    [socket],
  );

  const unlockAudio = useCallback(() => setAudioUnlocked(true), []);

  useEffect(() => {
    if (!isStubPlayer()) return;
    window.__emberForceReconnecting = (on: boolean) => setForcedReconnecting(on);
    window.__emberSeek = (sec: number) => sync.actions.seek(sec);
    window.__emberChat = (text: string) => sync.actions.sendChat(text);
    window.__emberReact = (kind: string) => sync.actions.react(kind);
    window.__emberThrow = (to: string) => interactions.throwAt(to);
    window.__emberVoteSkip = () => interactions.voteSkip();
    window.__emberSetOptOut = (optOut: boolean) => interactions.setOptOut(optOut);
    return () => {
      delete window.__emberForceReconnecting;
      delete window.__emberSeek;
      delete window.__emberChat;
      delete window.__emberReact;
      delete window.__emberThrow;
      delete window.__emberVoteSkip;
      delete window.__emberSetOptOut;
    };
  }, [sync.actions, interactions]);

  useEffect(() => {
    if (isStubPlayer()) window.__emberSelfId = selfId;
  }, [selfId]);

  const members = useMemo(() => sync.snapshot?.members ?? [], [sync.snapshot]);
  const optedOut = members.find((m) => m.id === selfId)?.optOut ?? false;

  const value = useMemo<RoomContextValue>(
    () => ({
      roomId,
      roomName: sync.snapshot?.name ?? 'Loading room',
      members,
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
      socket,
      selfId,
      voteState,
      optedOut,
      registerPlayerMount: setMountEl,
      unlockAudio,
      addToQueue: sync.actions.addToQueue,
      togglePlay: sync.actions.togglePlay,
      seekTo: sync.actions.seek,
      skip: sync.actions.skip,
      sendChat: sync.actions.sendChat,
      react: sync.actions.react,
      throwAt: interactions.throwAt,
      voteSkip: interactions.voteSkip,
      setOptOut: interactions.setOptOut,
      sendCursor: interactions.sendCursor,
      sendTyping: interactions.sendTyping,
    }),
    [
      roomId,
      sync,
      members,
      connected,
      forcedReconnecting,
      everConnected,
      audioUnlocked,
      socket,
      selfId,
      voteState,
      optedOut,
      interactions,
      unlockAudio,
    ],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
