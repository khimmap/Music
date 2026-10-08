'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useQuality } from '@/effects/quality/QualityProvider';
import type { TimeState } from './timeOfDay';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  seed: number;
}

/**
 * The single landing particle canvas (reuses the Embers physics: buoyant rise,
 * summed-sine noise wind, cooling warm colour, flicker). Draws a few ambient
 * embers at night, and bursts a batch out of the title's box when the
 * lights-out transition begins. Count from `embersCount` (0 at low = no canvas);
 * off under reduced motion; paused when the tab is hidden.
 */
export function LandingParticles({
  time,
  bursting,
  originRef,
}: {
  time: TimeState;
  bursting: boolean;
  originRef: RefObject<HTMLElement | null>;
}) {
  const { flags, reducedMotion, visible } = useQuality();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const count = flags.embersCount;
  const enabled = count > 0 && !reducedMotion;

  const stateRef = useRef({
    visible,
    ambient: time === 'night',
    burstQueue: 0,
    burstRect: null as DOMRect | null,
  });
  stateRef.current.visible = visible;
  stateRef.current.ambient = time === 'night';

  const prevBurst = useRef(false);
  if (bursting && !prevBurst.current) {
    stateRef.current.burstQueue = Math.min(count, 48);
    stateRef.current.burstRect = originRef.current?.getBoundingClientRect() ?? null;
  }
  prevBurst.current = bursting;

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
    const spawnAmbient = () => {
      particles.push({
        x: w * (0.3 + Math.random() * 0.4),
        y: h * 0.86 + Math.random() * h * 0.1,
        vx: 0,
        vy: 10 + Math.random() * 18,
        size: 1 + Math.random() * 2,
        life: 0,
        maxLife: 3 + Math.random() * 3,
        seed: Math.random() * 1000,
      });
    };
    const spawnBurst = (rect: DOMRect) => {
      particles.push({
        x: rect.left + Math.random() * rect.width,
        y: rect.top + rect.height * (0.3 + Math.random() * 0.6),
        vx: (Math.random() - 0.5) * 30,
        vy: 30 + Math.random() * 60,
        size: 1.5 + Math.random() * 2.8,
        life: 0,
        maxLife: 1.6 + Math.random() * 1.8,
        seed: Math.random() * 1000,
      });
    };

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!stateRef.current.visible) return;

      if (stateRef.current.ambient) {
        acc += (count / 10) * dt;
        while (acc >= 1 && particles.length < count) {
          spawnAmbient();
          acc -= 1;
        }
      }
      const rect = stateRef.current.burstRect;
      while (stateRef.current.burstQueue > 0 && rect && particles.length < count * 2) {
        spawnBurst(rect);
        stateRef.current.burstQueue -= 1;
      }

      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i]!;
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const k = p.life / p.maxLife;
        const wind =
          Math.sin(t * 0.7 + p.seed) * 9 +
          Math.sin(t * 1.37 + p.seed * 1.9) * 5 +
          Math.sin(t * 2.3 + p.seed * 0.5) * 3;
        p.x += (p.vx + wind) * dt;
        p.y -= p.vy * dt * (1 + k * 0.5);
        // Warm ember colour cooling over life (orange -> red), with flicker.
        const r = Math.round(255 * (1 - k * 0.1));
        const g = Math.round(150 * (1 - k * 0.7));
        const b = Math.round(70 * (1 - k));
        const flicker = 0.75 + Math.sin(t * 18 + p.seed) * 0.25;
        const alpha = (1 - k) * flicker * 0.75;
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
      data-testid="landing-embers"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 h-full w-full"
    />
  );
}
