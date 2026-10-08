'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from 'three';

interface ParallaxRigProps {
  reducedMotion: boolean;
}

const BASE = { x: 0, y: 3.1, z: 6.4 };
const LOOK = { x: 0, y: 1.3, z: -3 };

/**
 * Fixed cinematic camera from behind/above the seats. Allows only a subtle
 * mouse-parallax nudge (no free orbit) so the screen iframe stays aligned.
 */
export function ParallaxRig({ reducedMotion }: ParallaxRigProps) {
  const { camera } = useThree();

  useFrame((state) => {
    if (reducedMotion) {
      camera.position.set(BASE.x, BASE.y, BASE.z);
    } else {
      const targetX = BASE.x + state.pointer.x * 0.45;
      const targetY = BASE.y + state.pointer.y * 0.28;
      camera.position.x = MathUtils.lerp(camera.position.x, targetX, 0.04);
      camera.position.y = MathUtils.lerp(camera.position.y, targetY, 0.04);
      camera.position.z = BASE.z;
    }
    camera.lookAt(LOOK.x, LOOK.y, LOOK.z);
  });

  return null;
}
