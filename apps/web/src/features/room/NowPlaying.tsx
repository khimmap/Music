'use client';

import { useEffect, useState } from 'react';
import { useRoom } from './RoomProvider';
import { BurnTransition } from '@/effects/BurnTransition';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SCRAMBLE = '▚▞░▒▓/\\<>|=+';

/** Decode effect: scrambles characters settling into the real title on change.
 * (EB Garamond has no variable-weight axis, so the weight-transition part of
 * the brief is intentionally skipped.) */
function useDecoded(target: string): string {
  const reduced = useReducedMotion();
  const [out, setOut] = useState(target);
  useEffect(() => {
    if (reduced || !target) {
      setOut(target);
      return;
    }
    let frame = 0;
    const total = 14;
    const id = window.setInterval(() => {
      frame += 1;
      const reveal = Math.floor((frame / total) * target.length);
      let s = '';
      for (let i = 0; i < target.length; i += 1) {
        const ch = target[i] ?? '';
        s += i < reveal || ch === ' ' ? ch : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
      }
      setOut(s);
      if (frame >= total) {
        setOut(target);
        window.clearInterval(id);
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [target, reduced]);
  return out;
}

export function NowPlaying() {
  const { current, palette, registerPlayerMount } = useRoom();
  const title = current?.title ?? 'Paste a link to begin';
  const decoded = useDecoded(title);

  return (
    <section className="flex w-full flex-col items-center gap-md">
      <div
        className="relative aspect-video w-full max-w-[880px] overflow-hidden rounded-xl"
        style={{
          border: `1px solid ${palette.vibrant}3a`,
          boxShadow: `0 40px 120px -40px ${palette.vibrant}80, inset 0 0 0 1px rgba(255,255,255,0.05)`,
          transition: 'box-shadow 1.5s ease, border-color 1.5s ease',
        }}
      >
        <div ref={registerPlayerMount} data-testid="player-mount" className="absolute inset-0 bg-black" />
        {!current && (
          <div className="absolute inset-0 grid place-items-center font-sans text-body-sm text-on-dark-soft">
            Nothing playing
          </div>
        )}
        <BurnTransition />
      </div>

      <div className="max-w-[880px] text-center">
        <h1
          data-testid="track-title"
          className="font-display text-display-xl leading-none tracking-tight text-on-dark md:text-display-mega"
          style={{ textWrap: 'balance' }}
        >
          {decoded}
        </h1>
        {current && (
          <p className="mt-sm font-sans text-title-sm text-on-dark-soft">
            {current.artist ? `${current.artist} · ` : ''}
            <span>picked by {current.addedBy}</span>
          </p>
        )}
      </div>
    </section>
  );
}
