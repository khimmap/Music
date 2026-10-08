'use client';

import { useEffect, useRef } from 'react';
import { useQuality } from './quality/QualityProvider';
import { useRoom } from '@/features/room/RoomProvider';

interface Particle {
  x: number;
  y: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  seed: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Rising ember particles on a 2D canvas (count from `embersCount`). Buoyant
 * rise + pseudo-noise horizontal wind (summed incommensurate sines, not a plain
 * sine), random size, cooling color over life (bright orange -> dark red ->
 * fade) with a slight flicker, tinted by the track palette. Playing = steady
 * emission; paused = slows then stops; track change = brief burst.
 */
export function Embers() {
  const { flags, reducedMotion, visible } = useQuality();
  const { palette, playing, current } = useRoom();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const count = flags.embersCount;
  const enabled = count > 0 && !reducedMotion;

  const stateRef = useRef({ playing, tint: palette.vibrant, visible, videoId: current?.videoId ?? null, burst: 0 });
  stateRef.current.playing = playing;
  stateRef.current.tint = palette.vibrant;
  stateRef.current.visible = visible;
  // Detect track change -> schedule a burst.
  if (stateRef.current.videoId !== (current?.videoId ?? null)) {
    stateRef.current.videoId = current?.videoId ?? null;
    if (current) stateRef.current.burst = Math.min(count, 24);
  }

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, flags.dprCap);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const spawn = () => {
      particles.push({
        x: w * (0.4 + Math.random() * 0.2) + (Math.random() - 0.5) * 160,
        y: h * 0.72 + Math.random() * h * 0.12,
        vy: 14 + Math.random() * 26,
        size: 1 + Math.random() * 2.6,
        life: 0,
        maxLife: 2.4 + Math.random() * 3.2,
        seed: Math.random() * 1000,
      });
    };

    let raf = 0;
    let last = performance.now();
    let spawnAcc = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!stateRef.current.visible) return;

      // Emission: steady while playing, decaying when paused.
      const rate = stateRef.current.playing ? count / 2.6 : count / 14;
      spawnAcc += rate * dt;
      while (spawnAcc >= 1 && particles.length < count * 1.5) {
        spawn();
        spawnAcc -= 1;
      }
      while (stateRef.current.burst > 0 && particles.length < count * 2) {
        spawn();
        stateRef.current.burst -= 1;
      }

      ctx.clearRect(0, 0, w, h);
      const [tr, tg, tb] = hexToRgb(stateRef.current.tint);
      const t = now / 1000;
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i]!;
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const k = p.life / p.maxLife; // 0..1
        // pseudo-noise wind (summed incommensurate sines)
        const wind =
          Math.sin(t * 0.7 + p.seed) * 10 +
          Math.sin(t * 1.37 + p.seed * 1.9) * 6 +
          Math.sin(t * 2.3 + p.seed * 0.5) * 3;
        p.x += wind * dt;
        p.y -= p.vy * dt * (1 + k * 0.4); // buoyancy accelerates slightly
        // cool over life: hot orange -> red, tinted by palette
        const r = Math.round(255 * (1 - k * 0.1));
        const g = Math.round((150 + tg * 0.15) * (1 - k * 0.75));
        const b = Math.round((40 + tb * 0.15) * (1 - k));
        const flicker = 0.75 + Math.sin(t * 18 + p.seed) * 0.25;
        const alpha = (1 - k) * flicker * (0.5 + (tr / 255) * 0.3);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${Math.max(0, g)},${Math.max(0, b)},${alpha.toFixed(3)})`;
        ctx.arc(p.x, p.y, p.size * (1 - k * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [enabled, count, flags.dprCap]);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="embers"
      className="pointer-events-none fixed inset-0 -z-[5] h-full w-full"
    />
  );
}
