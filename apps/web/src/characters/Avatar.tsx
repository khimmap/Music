'use client';

import type { AvatarConfig } from '@ember/shared';

interface AvatarProps {
  /** Modular character description (body/hair/outfit/accessory + colors). */
  config?: AvatarConfig;
  /** World-space position in the room. */
  position?: [number, number, number];
}

/**
 * Skeleton avatar. Renders a placeholder capsule where a modular low-poly/chibi
 * character will be assembled from parts (see packages/shared/src/avatar.ts and
 * the modular GLBs logged in public/assets/LICENSES.md). Must be rendered inside
 * a <Canvas>.
 */
export function Avatar({ position = [0, 0, 0] }: AvatarProps) {
  return (
    <mesh position={position} castShadow>
      <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
      <meshStandardMaterial color="#c8b8e0" />
    </mesh>
  );
}
