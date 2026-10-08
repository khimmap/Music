'use client';

import { useRoom } from '@/stores/RoomProvider';

/**
 * Full-screen overlay shown to new visitors. Browsers block autoplay with
 * sound until a user gesture, so the first click unlocks audio and syncs the
 * viewer to the room. Hidden automatically in e2e stub mode.
 */
export function AutoplayGate() {
  const { audioUnlocked, unlockAudio } = useRoom();
  if (audioUnlocked) return null;

  return (
    <button
      type="button"
      onClick={unlockAudio}
      data-testid="autoplay-gate"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-sm bg-black/70 backdrop-blur-sm transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
    >
      <span className="font-display text-display-md text-on-dark">Click to listen together</span>
      <span className="font-sans text-body-sm text-on-dark-soft">
        Starts audio and syncs you to the room
      </span>
    </button>
  );
}
