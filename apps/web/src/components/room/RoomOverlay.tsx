'use client';

import { useRoom } from '@/stores/RoomProvider';
import { TopBar } from './TopBar';
import { QueuePanel } from './QueuePanel';
import { PlayerControls } from './PlayerControls';

/** The 2D overlay UI layered over the 3D room (DOM, not rendered in 3D). */
export function RoomOverlay() {
  const { toast, current, playing, positionSec } = useRoom();
  const state = current ? (playing ? 'playing' : 'paused') : 'idle';

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col"
      style={{
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      {/* Machine-readable playback state for e2e. */}
      <div className="sr-only" aria-hidden="true">
        <span data-testid="current-video">{current?.videoId ?? ''}</span>
        <span data-testid="playback-state">{state}</span>
        <span data-testid="position-sec">{Math.floor(positionSec)}</span>
      </div>

      <TopBar />

      <div className="flex min-h-0 flex-1 justify-end p-base">
        <QueuePanel />
      </div>

      <div className="p-base">
        <PlayerControls />
      </div>

      {toast && (
        <div
          role="status"
          data-testid="toast"
          className="pointer-events-none absolute bottom-base left-base rounded-pill border border-white/10 bg-surface-dark-elevated px-base py-xs font-sans text-body-sm text-on-dark"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
