'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { getServerBase } from '@/lib/socket';

/** Deterministic ember specks (no Math.random -> no hydration mismatch). They
 * rise from the hearth glow and fade, concentrated toward the centre. */
const SPARKS: { left: number; size: number; dur: number; delay: number; drift: number }[] = [
  { left: 14, size: 3, dur: 9.5, delay: 0.0, drift: 16 },
  { left: 23, size: 2, dur: 11.0, delay: 2.4, drift: -14 },
  { left: 31, size: 4, dur: 8.5, delay: 1.1, drift: 24 },
  { left: 38, size: 2, dur: 12.5, delay: 4.0, drift: -8 },
  { left: 44, size: 3, dur: 10.0, delay: 0.6, drift: 10 },
  { left: 49, size: 5, dur: 9.0, delay: 3.2, drift: -18 },
  { left: 51, size: 2, dur: 13.0, delay: 1.8, drift: 20 },
  { left: 56, size: 3, dur: 8.0, delay: 5.1, drift: -10 },
  { left: 62, size: 4, dur: 11.5, delay: 2.0, drift: 14 },
  { left: 69, size: 2, dur: 10.5, delay: 0.3, drift: -22 },
  { left: 77, size: 3, dur: 9.2, delay: 3.8, drift: 12 },
  { left: 86, size: 2, dur: 12.0, delay: 1.5, drift: -16 },
  { left: 8, size: 2, dur: 12.8, delay: 2.9, drift: 18 },
  { left: 92, size: 3, dur: 10.8, delay: 4.6, drift: -12 },
];

/** Illustrative listener avatars (not a usage claim) — a warm, lived-in cluster. */
const FACES: { emoji: string; color: string }[] = [
  { emoji: '🎧', color: '#f4915b' },
  { emoji: '🎵', color: '#a7e5d3' },
  { emoji: '🌙', color: '#c8b8e0' },
  { emoji: '✨', color: '#a8c8e8' },
  { emoji: '🔥', color: '#e8b8c4' },
];

const STEPS = ['Create a room', 'Share the link', 'Listen in sync'];

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
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden px-base text-ink">
      {/* Atmospheric pastel gradient orbs — the brand's color moment (DESIGN.md). */}
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

      {/* Warm hearth glow pooling behind the wordmark — the focal point. */}
      <div
        aria-hidden="true"
        className="ember-glow pointer-events-none absolute left-1/2 top-1/2 z-0 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-[58%] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(244,145,91,0.42), rgba(244,197,168,0.22) 42%, transparent 68%)',
        }}
      />

      {/* Rising ember specks (reduced-motion: hidden). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className="ember-spark-float"
            style={
              {
                left: `${s.left}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                boxShadow: `0 0 ${s.size * 2}px ${s.size / 2}px rgba(244,145,91,0.6)`,
                '--dur': `${s.dur}s`,
                '--delay': `${s.delay}s`,
                '--drift': `${s.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Hero */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <span
          aria-hidden="true"
          className="ember-breathe mb-md block h-2.5 w-2.5 rounded-full bg-ember"
          style={{ boxShadow: '0 0 32px 10px rgba(244,145,91,0.5)' }}
        />
        <h1
          className="ember-rise font-display font-light leading-[0.95] tracking-tight text-ink"
          style={{ fontSize: 'clamp(4.5rem, 15vw, 11rem)' }}
        >
          Ember
        </h1>
        <p
          className="ember-rise mx-auto mt-md max-w-[46ch] font-sans text-title-sm text-body"
          style={{ animationDelay: '90ms' }}
        >
          A cosy room where you and your friends press play on the same song, at the same second.
        </p>
        <div
          className="ember-rise mt-xl flex flex-col items-center gap-md"
          style={{ animationDelay: '180ms' }}
        >
          <button
            type="button"
            onClick={createRoom}
            disabled={creating}
            data-testid="create-room"
            className="rounded-pill bg-primary px-xl py-md font-sans text-button text-on-primary shadow-soft transition hover:-translate-y-px hover:bg-primary-active hover:shadow-[0_12px_40px_rgba(12,10,9,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 active:translate-y-px disabled:opacity-60"
          >
            {creating ? 'Creating room…' : 'Create a room'}
          </button>

          {/* Illustrative listener cluster. */}
          <div className="flex items-center gap-sm">
            <div className="flex -space-x-2">
              {FACES.map((f, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="grid h-7 w-7 place-items-center rounded-full border border-white/70 text-[13px] shadow-soft"
                  style={{ backgroundColor: f.color }}
                >
                  {f.emoji}
                </span>
              ))}
            </div>
            <span className="font-sans text-caption text-muted">Bring your people.</span>
          </div>

          {error && (
            <p role="alert" className="font-sans text-body-sm text-error">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* How it works — a quiet one-line process, not feature cards. */}
      <footer className="ember-rise relative z-10 mx-auto flex w-full max-w-[760px] flex-wrap items-center justify-center gap-x-base gap-y-xs pb-xl pt-base font-sans text-caption-uppercase uppercase tracking-[0.14em] text-muted">
        {STEPS.map((step, i) => (
          <span key={step} className="flex items-center gap-x-sm">
            {i > 0 && <span aria-hidden="true" className="text-hairline-strong">&rarr;</span>}
            {step}
          </span>
        ))}
      </footer>
    </main>
  );
}
