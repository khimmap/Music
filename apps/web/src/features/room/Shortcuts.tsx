'use client';

import { useEffect, useState } from 'react';
import { useRoom } from './RoomProvider';

const REACTION_KEYS: Record<string, string> = { '1': 'fire', '2': 'heart', '3': 'clap', '4': 'laugh' };

function isTyping(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

/** Keyboard shortcuts (ignored while typing in inputs) + a `?` hint panel.
 * Space play/pause, N vote skip, 1-4 reactions. (Enter opens chat in ChatDrawer.) */
export function Shortcuts() {
  const { togglePlay, voteSkip, react } = useRoom();
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hint) {
        setHint(false);
        return;
      }
      if (isTyping() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'n' || e.key === 'N') {
        voteSkip();
      } else if (e.key === '?') {
        setHint((h) => !h);
      } else if (REACTION_KEYS[e.key]) {
        react(REACTION_KEYS[e.key]!);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, voteSkip, react, hint]);

  if (!hint) return null;
  return (
    <div
      role="dialog"
      aria-label="Keyboard shortcuts"
      data-testid="shortcut-hint"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm"
      onClick={() => setHint(false)}
    >
      <div
        className="pointer-events-auto w-[min(360px,90vw)] rounded-xl border border-white/10 bg-surface-dark-elevated p-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-display-sm text-on-dark">Shortcuts</h2>
        <dl className="mt-base grid grid-cols-[auto_1fr] gap-x-base gap-y-sm font-sans text-body-sm text-on-dark-soft">
          <dt className="text-on-dark">Space</dt>
          <dd>Play / pause</dd>
          <dt className="text-on-dark">N</dt>
          <dd>Vote to skip</dd>
          <dt className="text-on-dark">Enter</dt>
          <dd>Open chat</dd>
          <dt className="text-on-dark">1 to 4</dt>
          <dd>React (fire, love, clap, laugh)</dd>
          <dt className="text-on-dark">?</dt>
          <dd>Toggle this panel</dd>
        </dl>
      </div>
    </div>
  );
}
