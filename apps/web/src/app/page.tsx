'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getServerBase } from '@/lib/socket';

export default function HomePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`${getServerBase()}/rooms`, { method: 'POST' });
      if (!res.ok) throw new Error('create failed');
      const data = (await res.json()) as { id: string };
      // Preserve any query flags (e.g. ?e2e=1) when entering the room.
      const go = () => router.push(`/room/${data.id}${window.location.search}`);
      const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
      if (typeof doc.startViewTransition === 'function') doc.startViewTransition(go);
      else go();
    } catch {
      setError('Could not reach the room server. Make sure it is running.');
      setCreating(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-base text-ink">
      {/* Atmospheric pastel gradient orbs drifting behind the content — the
          brand's only color moment (DESIGN.md). Decorative, reduced-motion safe. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <span
          className="ember-orb ember-orb-1"
          style={{ background: 'radial-gradient(circle, var(--color-gradient-mint), transparent 70%)' }}
        />
        <span
          className="ember-orb ember-orb-2"
          style={{ background: 'radial-gradient(circle, var(--color-gradient-peach), transparent 70%)' }}
        />
        <span
          className="ember-orb ember-orb-3"
          style={{ background: 'radial-gradient(circle, var(--color-gradient-lavender), transparent 70%)' }}
        />
        <span
          className="ember-orb ember-orb-4"
          style={{ background: 'radial-gradient(circle, var(--color-gradient-sky), transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[52ch] text-center">
        <span
          aria-hidden="true"
          className="ember-breathe mx-auto mb-lg block h-2 w-2 rounded-full bg-ember"
          style={{ boxShadow: '0 0 28px 8px rgba(244,145,91,0.45)' }}
        />
        <h1 className="ember-rise font-display text-display-mega leading-none text-ink">Ember</h1>
        <p
          className="ember-rise mx-auto mt-md font-sans text-body-md text-body"
          style={{ animationDelay: '90ms' }}
        >
          Start a room, share the link, and watch YouTube together in real time.
        </p>
        <div
          className="ember-rise mt-xl flex flex-col items-center gap-sm"
          style={{ animationDelay: '180ms' }}
        >
          <button
            type="button"
            onClick={createRoom}
            disabled={creating}
            data-testid="create-room"
            className="rounded-pill bg-primary px-lg py-sm font-sans text-button text-on-primary shadow-soft transition hover:bg-primary-active hover:shadow-[0_8px_30px_rgba(12,10,9,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 active:translate-y-px disabled:opacity-60"
          >
            {creating ? 'Creating room…' : 'Create a room'}
          </button>
          {error && (
            <p role="alert" className="font-sans text-body-sm text-error">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
