'use client';

import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

interface ScreenProjectorProps {
  /** DOM element (the YouTube iframe host) to align over the 3D screen. */
  hostEl: HTMLElement | null;
  /** World-space center of the screen plane. */
  center: [number, number, number];
  /** Half the screen plane width (world units). */
  halfWidth: number;
  /** Half the screen plane height (world units). */
  halfHeight: number;
}

/**
 * Projects the 3D screen plane to 2D each frame and positions `hostEl` (a plain
 * DOM layer holding the YouTube iframe) exactly over it. This keeps the player
 * aligned to the screen as the camera parallax nudges, without mounting the
 * iframe inside the R3F tree (which conflicts with React/drei DOM management).
 */
export function ScreenProjector({ hostEl, center, halfWidth, halfHeight }: ScreenProjectorProps) {
  const { camera, size } = useThree();
  const c = useMemo(() => new Vector3(), []);
  const r = useMemo(() => new Vector3(), []);
  const t = useMemo(() => new Vector3(), []);

  useFrame(() => {
    if (!hostEl) return;
    c.set(center[0], center[1], center[2]).project(camera);
    r.set(center[0] + halfWidth, center[1], center[2]).project(camera);
    t.set(center[0], center[1] + halfHeight, center[2]).project(camera);

    const cx = (c.x * 0.5 + 0.5) * size.width;
    const cy = (-c.y * 0.5 + 0.5) * size.height;
    const w = Math.abs((r.x * 0.5 + 0.5) * size.width - cx) * 2;
    const h = Math.abs((-t.y * 0.5 + 0.5) * size.height - cy) * 2;

    hostEl.style.width = `${w}px`;
    hostEl.style.height = `${h}px`;
    hostEl.style.left = `${cx - w / 2}px`;
    hostEl.style.top = `${cy - h / 2}px`;
  });

  return null;
}
