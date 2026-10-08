'use client';

import { useEffect, useState } from 'react';
import { QualityProvider, useQuality } from '@/effects/quality/QualityProvider';
import { AmbientBackground } from '@/effects/AmbientBackground';
import { FilmGrain } from '@/effects/FilmGrain';
import { RoomProvider, useRoom } from './RoomProvider';
import { NowPlaying } from './NowPlaying';
import { ProgressWave } from './ProgressWave';
import { QueuePanel } from './QueuePanel';
import { ListenersRow } from './ListenersRow';
import { ReactionBar } from './ReactionBar';
import { ChatDrawer } from './ChatDrawer';
import { SettingsMenu } from './SettingsMenu';
import { Empty } from './states/Empty';
import { ClickToListen } from './states/ClickToListen';
import { Reconnecting } from './states/Reconnecting';

/** Entry: sets up the quality + room providers and renders the room. */
export function RoomScreen({ roomId }: { roomId: string }) {
  return (
    <QualityProvider>
      <RoomProvider roomId={roomId}>
        <RoomView />
      </RoomProvider>
    </QualityProvider>
  );
}

function InviteButton() {
  const { inviteLink } = useRoom();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button
      type="button"
      data-testid="invite"
      onClick={copy}
      className="rounded-pill border border-white/20 px-base py-xs font-sans text-button text-on-dark transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {copied ? 'Link copied' : 'Invite'}
    </button>
  );
}

function Controls() {
  const { playing, current, togglePlay, skip } = useRoom();
  const disabled = !current;
  return (
    <div className="flex items-center gap-base">
      <button
        type="button"
        data-testid="toggle-play"
        onClick={togglePlay}
        disabled={disabled}
        aria-label={playing ? 'Pause' : 'Play'}
        className="rounded-pill bg-on-primary px-lg py-sm font-sans text-button text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:translate-y-px disabled:opacity-40"
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        data-testid="skip"
        onClick={skip}
        disabled={disabled}
        aria-label="Skip to next track"
        className="rounded-pill border border-white/20 px-base py-sm font-sans text-button text-on-dark transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:translate-y-px disabled:opacity-40"
      >
        Skip
      </button>
    </div>
  );
}

function Toast({ text }: { text: string }) {
  return (
    <div
      role="status"
      data-testid="toast"
      className="pointer-events-none fixed bottom-[150px] left-base z-30 rounded-pill border border-white/10 bg-surface-dark-elevated px-base py-xs font-sans text-body-sm text-on-dark"
    >
      {text}
    </div>
  );
}

function RoomView() {
  const room = useRoom();
  const { tier } = useQuality();
  const [queueOpen, setQueueOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const state = room.current ? (room.playing ? 'playing' : 'paused') : 'idle';
  const showListen = !room.audioUnlocked;
  const showEmpty =
    room.audioUnlocked && !room.current && room.queue.length === 0 && room.connected;

  const trackTitle = room.current?.title ?? null;
  useEffect(() => {
    const previous = document.title;
    document.title = trackTitle ? `${trackTitle} · Ember` : 'Ember';
    return () => {
      document.title = previous;
    };
  }, [trackTitle]);

  return (
    <main
      data-testid="room-stage"
      data-tier={tier}
      data-palette={room.palette.dominant}
      className="relative min-h-[100dvh] w-full overflow-hidden bg-[#07060a] text-on-dark"
      style={{
        colorScheme: 'dark',
        filter: room.reconnecting ? 'saturate(0.35)' : 'none',
        transition: 'filter 0.6s ease',
      }}
    >
      <AmbientBackground palette={room.palette} />
      <FilmGrain />

      {/* Machine-readable playback state for e2e. */}
      <div className="sr-only" aria-hidden="true">
        <span data-testid="current-video">{room.current?.videoId ?? ''}</span>
        <span data-testid="playback-state">{state}</span>
        <span data-testid="position-sec">{Math.floor(room.positionSec)}</span>
      </div>

      <header className="relative z-30 flex items-center justify-between gap-base p-base">
        <span className="font-sans text-caption-uppercase uppercase tracking-[0.12em] text-on-dark-soft">
          Ember
        </span>
        <div className="flex items-center gap-sm">
          <InviteButton />
          <SettingsMenu />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-content flex-col items-center gap-lg px-base pb-[240px] pt-sm lg:pr-[380px]">
        <NowPlaying />
        <ProgressWave />
        <Controls />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-base p-base">
        <ListenersRow />
        <ReactionBar />
      </div>

      {/* One QueuePanel: a right column on desktop, a bottom sheet on mobile. */}
      {isDesktop ? (
        <aside className="pointer-events-none absolute right-base top-20 z-20 h-[calc(100dvh-220px)] w-[340px]">
          <QueuePanel />
        </aside>
      ) : (
        <>
          <button
            type="button"
            data-testid="queue-toggle"
            onClick={() => setQueueOpen((o) => !o)}
            aria-expanded={queueOpen}
            className="pointer-events-auto fixed right-base top-[72px] z-30 rounded-pill border border-white/15 bg-white/[0.04] px-base py-xs font-sans text-button text-on-dark transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {queueOpen ? 'Close queue' : 'Queue'}
          </button>
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
            <div
              className={`pointer-events-auto mx-auto h-[62dvh] w-full max-w-[560px] transition-transform duration-300 will-change-transform ${
                queueOpen ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <QueuePanel />
            </div>
          </div>
        </>
      )}

      <ChatDrawer />

      {room.toast && <Toast text={room.toast} />}
      {showEmpty && <Empty />}
      {showListen && <ClickToListen />}
      {room.reconnecting && <Reconnecting />}
    </main>
  );
}
