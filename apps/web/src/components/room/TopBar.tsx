'use client';

import { useState } from 'react';
import { useRoom } from '@/stores/RoomProvider';

export function TopBar() {
  const { roomName, listeners, inviteLink } = useRoom();
  const [copied, setCopied] = useState(false);

  async function invite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <header className="pointer-events-auto flex items-center justify-between gap-base p-base">
      <div className="flex items-baseline gap-sm">
        <h1 className="font-display text-display-sm text-on-dark" data-testid="room-name">
          {roomName}
        </h1>
        <span className="font-sans text-caption text-on-dark-soft" data-testid="listeners">
          {listeners} listening
        </span>
      </div>
      <button
        type="button"
        onClick={invite}
        data-testid="invite"
        className="rounded-pill border border-white/20 px-base py-xs font-sans text-button text-on-dark transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:translate-y-px"
      >
        {copied ? 'Link copied' : 'Invite'}
      </button>
    </header>
  );
}
