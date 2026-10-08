'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getServerBase } from '@/lib/socket';
import { useQuality } from '@/effects/quality/QualityProvider';
import { EmberDot, type Lights } from './EmberDot';
import { AvatarStrip } from './AvatarStrip';
import { StepsLine } from './StepsLine';
import { LandingParticles } from './LandingParticles';
import { isTimeState, TIME_TAGLINE, FIRE_TAGLINE, type TimeState } from './timeOfDay';

const CREATE_TIMEOUT_MS = 6000;

export function Landing() {
  const router = useRouter();
  const { reducedMotion } = useQuality();
  const [time, setTime] = useState<TimeState>('day');
  const [fire, setFire] = useState(false); // easter-egg night override
  const [lights, setLights] = useState<Lights>('on');
  const [error, setError] = useState<string | null>(null);
  const [joinValue, setJoinValue] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const creatingRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const stokeTimes = useRef<number[]>([]);

  // Read the time set before paint by the inline script (no flash).
  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-time');
    if (isTimeState(attr)) setTime(attr);
  }, []);

  // Effective theme (easter egg forces night) reflected on <html> for CSS.
  const theme: TimeState = fire ? 'night' : time;
  const skipThemeWrite = useRef(true);
  useEffect(() => {
    // The inline script already set data-time for first paint; only override it
    // on later changes (loaded time / easter-egg fire) to avoid a flash.
    if (skipThemeWrite.current) {
      skipThemeWrite.current = false;
      return;
    }
    document.documentElement.setAttribute('data-time', theme);
  }, [theme]);

  // Expose the lights state for tests.
  useEffect(() => {
    document.body.setAttribute('data-lights', lights);
    return () => document.body.removeAttribute('data-lights');
  }, [lights]);

  const onStoke = useCallback(() => {
    const now = Date.now();
    stokeTimes.current = stokeTimes.current.filter((t) => now - t < 6000);
    stokeTimes.current.push(now);
    if (stokeTimes.current.length >= 5) {
      stokeTimes.current = [];
      setFire((f) => !f);
    }
  }, []);
  const onHold = useCallback(() => setFire(true), []);

  const createRoom = useCallback(async () => {
    if (creatingRef.current) return; // prevent double-submit
    creatingRef.current = true;
    setError(null);
    setLights('dimming');

    const handoff = new Promise<void>((resolve) =>
      window.setTimeout(resolve, reducedMotion ? 250 : 1100),
    );
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CREATE_TIMEOUT_MS);

    try {
      const created = fetch(`${getServerBase()}/rooms`, {
        method: 'POST',
        signal: controller.signal,
      }).then(async (res) => {
        if (!res.ok) throw new Error('create failed');
        return (await res.json()) as { id: string };
      });
      const [data] = await Promise.all([created, handoff]);
      window.clearTimeout(timeout);
      setLights('out');
      // Hold fully dark for a beat (and let the DOM reflect it) before handing
      // off to the room, so there is no flash between the two.
      await new Promise((resolve) => window.setTimeout(resolve, 160));
      const go = () => router.push(`/room/${data.id}${window.location.search}`);
      const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
      if (typeof doc.startViewTransition === 'function') doc.startViewTransition(go);
      else go();
    } catch {
      window.clearTimeout(timeout);
      setLights('on');
      setError("Couldn't create the room. Try again.");
      creatingRef.current = false;
    }
  }, [reducedMotion, router]);

  const joinRoom = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setJoinError(null);
      const raw = joinValue.trim();
      const match = raw.match(/room\/([a-zA-Z0-9]+)/);
      const id = match ? match[1]! : /^[a-zA-Z0-9]{4,}$/.test(raw) ? raw : null;
      if (!id) {
        setJoinError('Enter a room code or an invite link.');
        return;
      }
      setJoining(true);
      try {
        const res = await fetch(`${getServerBase()}/rooms/${id}`);
        if (!res.ok) throw new Error('not found');
        const go = () => router.push(`/room/${id}${window.location.search}`);
        const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
        if (typeof doc.startViewTransition === 'function') doc.startViewTransition(go);
        else go();
      } catch {
        setJoinError('Room not found. Check the code or link.');
        setJoining(false);
      }
    },
    [joinValue, router],
  );

  const creating = lights !== 'on';
  const tagline = fire ? FIRE_TAGLINE : TIME_TAGLINE[time];

  return (
    <main
      data-landing=""
      data-testid="landing"
      className="landing relative flex min-h-[100dvh] flex-col overflow-hidden px-base"
    >
      {/* Atmosphere: pastel orbs + a warm hearth glow (fade out on lights-out). */}
      <div aria-hidden="true" className="landing-atmos pointer-events-none absolute inset-0 z-0">
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
        <div className="ember-glow landing-hearth absolute left-1/2 top-1/2 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-[58%] rounded-full" />
      </div>

      <LandingParticles time={theme} bursting={lights !== 'on'} originRef={titleRef} />

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <EmberDot lights={lights} onStoke={onStoke} onHold={onHold} />

        <div className="landing-dim flex flex-col items-center">
          <h1
            ref={titleRef}
            className="l-ink ember-rise font-display font-light leading-[0.95] tracking-tight"
            style={{ fontSize: 'clamp(4.5rem, 15vw, 11rem)' }}
          >
            Ember
          </h1>
          <p
            className="l-body ember-rise mx-auto mt-md max-w-[46ch] font-sans text-title-sm"
            style={{ animationDelay: '90ms' }}
          >
            A cosy room where you and your friends press play on the same song, at the same second.
          </p>
          {tagline && (
            <p
              data-testid="time-tagline"
              className="l-muted ember-rise mt-xs font-sans text-caption"
              style={{ animationDelay: '140ms' }}
            >
              {tagline}
            </p>
          )}

          <div
            className="ember-rise mt-xl flex flex-col items-center gap-md"
            style={{ animationDelay: '200ms' }}
          >
            <button
              type="button"
              onClick={createRoom}
              disabled={creating}
              data-testid="create-room"
              className="landing-cta rounded-pill px-xl py-md font-sans text-button shadow-soft transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 active:translate-y-px disabled:opacity-70"
            >
              {creating ? 'Lighting the room…' : 'Create a room'}
            </button>

            <form
              onSubmit={joinRoom}
              data-testid="join-form"
              className="flex w-full max-w-[320px] items-center gap-xs"
            >
              <input
                type="text"
                value={joinValue}
                onChange={(e) => {
                  setJoinValue(e.target.value);
                  setJoinError(null);
                }}
                data-testid="join-input"
                aria-label="Room code or invite link"
                autoComplete="off"
                spellCheck={false}
                placeholder="Have a code? Paste it to join"
                className="l-field min-w-0 flex-1 rounded-pill px-base py-xs font-sans text-body-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ember/50"
              />
              <button
                type="submit"
                data-testid="join-room"
                disabled={joining}
                className="l-join-btn rounded-pill px-base py-xs font-sans text-button transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/50 disabled:opacity-60"
              >
                {joining ? 'Joining…' : 'Join'}
              </button>
            </form>
            {joinError && (
              <p role="alert" data-testid="join-error" className="font-sans text-body-sm text-error">
                {joinError}
              </p>
            )}

            <AvatarStrip />

            {error && (
              <p role="alert" data-testid="create-error" className="font-sans text-body-sm text-error">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="landing-dim relative z-10">
        <StepsLine />
      </div>

      <p className="sr-only" aria-live="polite" data-testid="fire-announce">
        {fire ? FIRE_TAGLINE : ''}
      </p>
    </main>
  );
}
