'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useQuality } from '@/effects/quality/QualityProvider';
import { EASE_OUT } from '@/lib/motion';

export type Lights = 'on' | 'dimming' | 'out';

interface Spark {
  key: number;
  dx: number;
  dy: number;
}

/**
 * The warm ember dot above the title. A real button (Enter/Space to stoke).
 * When `tiltMagnetic` is on it drifts toward the cursor like a firefly (heavily
 * damped, small radius, noise-wandering back home when the pointer is idle) —
 * Motion values only, transform only. Click/tap/Enter stokes it (glow + sparks).
 * Press-and-hold ~1.5s triggers night mode. During lights-out its glow swells
 * into the room's ambient light.
 */
export function EmberDot({
  lights,
  onStoke,
  onHold,
}: {
  lights: Lights;
  onStoke: () => void;
  onHold: () => void;
}) {
  const { flags, reducedMotion } = useQuality();
  const follow = flags.tiltMagnetic && !reducedMotion;
  const sparksOn = flags.embersCount > 0 && !reducedMotion;

  const x = useSpring(useMotionValue(0), { stiffness: 42, damping: 20, mass: 1.3 });
  const y = useSpring(useMotionValue(0), { stiffness: 42, damping: 20, mass: 1.3 });
  const glow = useSpring(useMotionValue(1), { stiffness: 120, damping: 16 });

  const btnRef = useRef<HTMLButtonElement>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparkKey = useRef(0);
  const holdTimer = useRef(0);
  const heldFired = useRef(false);

  // Firefly follow (transform only).
  useEffect(() => {
    if (!follow) {
      x.set(0);
      y.set(0);
      return;
    }
    const RADIUS = 22;
    let pointer = { x: 0, y: 0 };
    let lastMove = 0;
    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      lastMove = performance.now();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      // home = visual centre minus the transform currently applied.
      const homeX = rect.left + rect.width / 2 - x.get();
      const homeY = rect.top + rect.height / 2 - y.get();
      if (lastMove === 0 || now - lastMove > 2000) {
        // Idle: gentle noise-based wander around home.
        const t = now / 1000;
        x.set((Math.sin(t * 0.6) * 0.5 + Math.sin(t * 1.13) * 0.2) * RADIUS);
        y.set((Math.cos(t * 0.5) * 0.5 + Math.sin(t * 0.91) * 0.2) * RADIUS);
      } else {
        const dx = pointer.x - homeX;
        const dy = pointer.y - homeY;
        const d = Math.hypot(dx, dy) || 1;
        const pull = Math.min(RADIUS, d * 0.18);
        x.set((dx / d) * pull);
        y.set((dy / d) * pull);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [follow, x, y]);

  // Lights-out: swell the glow into the room's ambient light. No swell under
  // reduced motion (the dim crossfade carries the transition instead).
  useEffect(() => {
    if (reducedMotion) {
      glow.set(1);
      return;
    }
    if (lights === 'out') glow.set(7);
    else if (lights === 'dimming') glow.set(2.6);
    else glow.set(1);
  }, [lights, glow, reducedMotion]);

  function burstSparks() {
    if (!sparksOn) return;
    const n = 3 + Math.floor(Math.random() * 4);
    const made: Spark[] = Array.from({ length: n }, () => {
      const a = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 18;
      return { key: sparkKey.current++, dx: Math.cos(a) * dist, dy: Math.sin(a) * dist };
    });
    setSparks((p) => [...p, ...made]);
    const keys = new Set(made.map((m) => m.key));
    window.setTimeout(() => setSparks((p) => p.filter((s) => !keys.has(s.key))), 600);
  }

  function stoke() {
    if (heldFired.current) {
      heldFired.current = false;
      return;
    }
    glow.set(1.8);
    window.setTimeout(() => glow.set(lights === 'on' ? 1 : 2.6), 420);
    burstSparks();
    onStoke();
  }

  function onPointerDown() {
    heldFired.current = false;
    glow.set(2.2); // grows gradually under the heavy damping
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      heldFired.current = true;
      onHold();
    }, 1500);
  }
  function endHold() {
    window.clearTimeout(holdTimer.current);
    if (!heldFired.current && lights === 'on') glow.set(1);
  }

  return (
    <motion.button
      ref={btnRef}
      type="button"
      data-testid="ember-dot"
      aria-label="Stoke the ember"
      onClick={stoke}
      onPointerDown={onPointerDown}
      onPointerUp={endHold}
      onPointerLeave={endHold}
      onPointerCancel={endHold}
      style={{ x, y }}
      className="relative mb-md grid h-9 w-8 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/70"
    >
      {/* Glow (scales via spring). Transform/opacity only. */}
      <motion.span
        aria-hidden="true"
        style={{ scale: glow }}
        className="pointer-events-none absolute h-8 w-8 rounded-full"
      >
        <span
          className="block h-full w-full rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(244,145,91,0.9), rgba(244,145,91,0) 70%)' }}
        />
      </motion.span>
      {/* Ember flame — drawn with clip-path + gradients (not an icon/emoji). */}
      <span aria-hidden="true" className="ember-flame relative block">
        <span className="ember-flame-outer" />
        <span className="ember-flame-inner" />
      </span>
      {/* Stoke sparks. */}
      {sparks.map((s) => (
        <motion.span
          key={s.key}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-ember"
          initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
          animate={{ x: s.dx, y: s.dy, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        />
      ))}
    </motion.button>
  );
}
