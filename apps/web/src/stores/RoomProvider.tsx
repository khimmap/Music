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
import {
  DRIFT_RESYNC_THRESHOLD_SEC,
  type PlaybackCurrent,
  type QueueItem,
} from '@ember/shared';
import { useRoomSync } from '@/hooks/useRoomSync';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { formatClock, getDisplayName, isStubPlayer } from '@/lib/youtube';

interface RoomContextValue {
  roomId: string;
  roomName: string;
  listeners: number;
  queue: QueueItem[];
  current: PlaybackCurrent | null;
  playing: boolean;
  positionSec: number;
  durationSec: number;
  audioUnlocked: boolean;
  toast: string | null;
  inviteLink: string;
  registerScreenMount: (el: HTMLElement | null) => void;
  addToQueue: (input: string) => void;
  togglePlay: () => void;
  seekTo: (sec: number) => void;
  skip: () => void;
  unlockAudio: () => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used inside <RoomProvider>');
  return ctx;
}

export function RoomProvider({ roomId, children }: { roomId: string; children: ReactNode }) {
  const name = useMemo(() => getDisplayName(), []);
  const { snapshot, lastSync, serverNow, actions } = useRoomSync(roomId, name);

  const [mountEl, setMountEl] = useState<HTMLElement | null>(null);
  const [current, setCurrent] = useState<PlaybackCurrent | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(() => isStubPlayer());
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const playing = current !== null && current.pausedAtSec === null;

  // Keep the latest values in refs for the drift loop + end callback.
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

  const { controls } = useYouTubePlayer({
    mountEl,
    onEnded: () => {
      const c = currentRef.current;
      if (c) actions.reportEnded(c.videoId);
    },
  });

  // Authoritative `current` comes from either room:state or playback:sync,
  // whichever arrives most recently (both reflect latest server state).
  useEffect(() => {
    if (snapshot) setCurrent(snapshot.current);
  }, [snapshot]);
  useEffect(() => {
    if (lastSync) setCurrent(lastSync.current);
  }, [lastSync]);

  // Reconcile the player with the authoritative state on every change:
  // load a new video, re-seek the same video to the server position, and apply
  // play/pause once audio is unlocked.
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

  // Drift correction + natural end detection + position readout.
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
        if (Math.abs(live - expected) > DRIFT_RESYNC_THRESHOLD_SEC) {
          controls.seek(expected);
        }
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
    if (!lastSync?.action || !lastSync.actorName) return;
    if (lastSync.actorName === name) return;
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
  }, [lastSync, name]);

  const unlockAudio = useCallback(() => {
    setAudioUnlocked(true);
    const c = currentRef.current;
    if (controls && c) {
      controls.load(c.videoId, expectedPosition(c), c.pausedAtSec === null);
      loadedVideoRef.current = c.videoId;
    }
  }, [controls, expectedPosition]);

  const togglePlay = useCallback(() => {
    if (playingRef.current) actions.pause();
    else actions.play();
  }, [actions]);

  // e2e-only: expose a seek hook (avoids driving the controlled range input).
  useEffect(() => {
    if (!isStubPlayer()) return;
    window.__emberSeek = (sec: number) => actions.seek(sec);
    return () => {
      delete window.__emberSeek;
    };
  }, [actions]);

  const value = useMemo<RoomContextValue>(
    () => ({
      roomId,
      roomName: snapshot?.name ?? 'Loading room',
      listeners: snapshot?.listeners ?? 0,
      queue: snapshot?.queue ?? [],
      current,
      playing,
      positionSec,
      durationSec,
      audioUnlocked,
      toast,
      inviteLink: typeof window !== 'undefined' ? window.location.href : '',
      registerScreenMount: setMountEl,
      addToQueue: actions.addToQueue,
      togglePlay,
      seekTo: actions.seek,
      skip: actions.skip,
      unlockAudio,
    }),
    [
      roomId,
      snapshot,
      current,
      playing,
      positionSec,
      durationSec,
      audioUnlocked,
      toast,
      actions,
      togglePlay,
      unlockAudio,
    ],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
