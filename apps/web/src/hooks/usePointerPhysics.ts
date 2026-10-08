'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'motion/react';

/**
 * Pointer-driven micro-physics (magnetic pull + parallax tilt). Continuous
 * pointer values are held in Motion values, never React state, so nothing
 * re-renders per frame (per the design skill's magnetic rule). Pointer handlers
 * are rAF-throttled and read layout only from a rect cached on enter / resize —
 * never during render. Output is transform only. All of it collapses to a no-op
 * when `enabled` is false (low tier / reduced motion).
 */

const SPRING = { stiffness: 220, damping: 22, mass: 0.5 } as const;

interface MagneticResult {
  ref: (el: HTMLElement | null) => void;
  x: MotionValue<number>;
  y: MotionValue<number>;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerLeave: () => void;
}

/** Pulls an element a fraction of the way toward the cursor (max `radius` px). */
export function useMagnetic(enabled: boolean, strength = 0.35, radius = 14): MagneticResult {
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);
  const elRef = useRef<HTMLElement | null>(null);
  const rect = useRef<DOMRect | null>(null);
  const raf = useRef(0);
  const pending = useRef<{ cx: number; cy: number } | null>(null);

  const measure = () => {
    rect.current = elRef.current?.getBoundingClientRect() ?? null;
  };

  const ref = (el: HTMLElement | null) => {
    elRef.current = el;
    if (el) measure();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!enabled) return;
    pending.current = { cx: e.clientX, cy: e.clientY };
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const r = rect.current;
      const p = pending.current;
      if (!r || !p) return;
      const dx = p.cx - (r.left + r.width / 2);
      const dy = p.cy - (r.top + r.height / 2);
      x.set(Math.max(-radius, Math.min(radius, dx * strength)));
      y.set(Math.max(-radius, Math.min(radius, dy * strength)));
    });
  };

  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  useEffect(() => {
    if (!enabled) {
      x.set(0);
      y.set(0);
    }
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [enabled, x, y]);

  return { ref, x, y, onPointerMove, onPointerLeave };
}

interface TiltResult {
  ref: (el: HTMLElement | null) => void;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  /** Spotlight sprite offset (px, element-local) and visibility (0..1). */
  glowX: MotionValue<number>;
  glowY: MotionValue<number>;
  glow: MotionValue<number>;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerEnter: (e: React.PointerEvent) => void;
  onPointerLeave: () => void;
}

/** 3D parallax tilt toward the cursor + a cursor-following spotlight sprite. */
export function useTilt(enabled: boolean, maxDeg = 7): TiltResult {
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);
  const glowX = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
  const glowY = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
  const glow = useSpring(useMotionValue(0), { stiffness: 200, damping: 30 });
  const elRef = useRef<HTMLElement | null>(null);
  const rect = useRef<DOMRect | null>(null);
  const raf = useRef(0);
  const pending = useRef<{ cx: number; cy: number } | null>(null);

  const measure = () => {
    rect.current = elRef.current?.getBoundingClientRect() ?? null;
  };

  const ref = (el: HTMLElement | null) => {
    elRef.current = el;
    if (el) measure();
  };

  const apply = () => {
    raf.current = 0;
    const r = rect.current;
    const p = pending.current;
    if (!r || !p) return;
    const nx = (p.cx - r.left) / r.width - 0.5;
    const ny = (p.cy - r.top) / r.height - 0.5;
    rotateY.set(nx * maxDeg * 2);
    rotateX.set(-ny * maxDeg * 2);
    glowX.set(p.cx - r.left);
    glowY.set(p.cy - r.top);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!enabled) return;
    pending.current = { cx: e.clientX, cy: e.clientY };
    if (!raf.current) raf.current = requestAnimationFrame(apply);
  };

  const onPointerEnter = (e: React.PointerEvent) => {
    if (!enabled) return;
    measure();
    pending.current = { cx: e.clientX, cy: e.clientY };
    glow.set(1);
    apply();
  };

  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glow.set(0);
  };

  useEffect(() => {
    if (!enabled) {
      rotateX.set(0);
      rotateY.set(0);
      glow.set(0);
    }
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [enabled, rotateX, rotateY, glow]);

  return { ref, rotateX, rotateY, glowX, glowY, glow, onPointerMove, onPointerEnter, onPointerLeave };
}
