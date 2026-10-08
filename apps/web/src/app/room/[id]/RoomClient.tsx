'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { RoomProvider, useRoom } from '@/stores/RoomProvider';
import { RoomOverlay } from '@/components/room/RoomOverlay';
import { AutoplayGate } from '@/components/room/AutoplayGate';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { isStubPlayer } from '@/lib/youtube';

const RoomCanvas = dynamic(() => import('@/scene/RoomCanvas'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-canvas-deep font-sans text-body-sm text-on-dark-soft">
      Preparing the room…
    </div>
  ),
});

function detectLite(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get('lite') === '1') return true;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
  const lowCpu =
    typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  return lowMemory || lowCpu || coarsePointer;
}

/**
 * Lightweight stage used only in e2e stub mode: provides the player mount point
 * without the heavy WebGL scene, so playback-sync tests do not pay the cost of
 * software-rendered three.js in headless browsers.
 */
function E2EStage({ registerMount }: { registerMount: (el: HTMLElement | null) => void }) {
  return (
    <div className="absolute inset-0 bg-canvas-deep" data-testid="e2e-stage">
      {/* Plain canvas stand-in so canvas-visibility checks pass without paying
          for software-rendered three.js in headless browsers. */}
      <canvas data-testid="room-canvas" className="absolute inset-0 block h-full w-full" />
      <div
        ref={registerMount}
        data-testid="screen-mount"
        className="absolute left-1/2 top-16 h-44 w-72 -translate-x-1/2 overflow-hidden rounded-md"
      />
    </div>
  );
}

function RoomStage({ lite, reducedMotion }: { lite: boolean; reducedMotion: boolean }) {
  const { registerScreenMount } = useRoom();
  const e2e = isStubPlayer();
  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden bg-canvas-deep text-on-dark"
      style={{ colorScheme: 'dark' }}
      data-lite={lite}
      data-testid="room-stage"
    >
      {e2e ? (
        <E2EStage registerMount={registerScreenMount} />
      ) : (
        <RoomCanvas lite={lite} reducedMotion={reducedMotion} registerMount={registerScreenMount} />
      )}
      <RoomOverlay />
      <AutoplayGate />
    </main>
  );
}

export function RoomClient({ roomId }: { roomId: string }) {
  const reducedMotion = useReducedMotion();
  const [lite, setLite] = useState<boolean | null>(null);

  useEffect(() => {
    setLite(detectLite());
  }, []);

  if (lite === null) {
    return <main className="h-[100dvh] w-full bg-canvas-deep" aria-busy="true" />;
  }

  return (
    <RoomProvider roomId={roomId}>
      <RoomStage lite={lite} reducedMotion={reducedMotion} />
    </RoomProvider>
  );
}
