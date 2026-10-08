'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, PointLight } from 'three';

interface FireProps {
  position?: [number, number, number];
  /** Lite mode dims the light and skips the extra flame mesh. */
  lite: boolean;
  /** When true, the glow holds steady instead of pulsing. */
  reducedMotion: boolean;
}

/**
 * Procedural campfire: the room's only warm light source. The glow pulses on a
 * gentle placeholder rhythm (audio-reactive comes later). Honors reduced motion.
 */
export function Fire({ position = [0, 0, -2], lite, reducedMotion }: FireProps) {
  const light = useRef<PointLight>(null);
  const core = useRef<Mesh>(null);
  const baseIntensity = lite ? 16 : 26;

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 3) * 0.1 + Math.sin(t * 7.3) * 0.04;
    if (light.current) light.current.intensity = baseIntensity * pulse;
    if (core.current) core.current.scale.setScalar(0.92 + (pulse - 1) * 0.8);
  });

  return (
    <group position={position}>
      <pointLight
        ref={light}
        color="#ff9a4d"
        intensity={baseIntensity}
        distance={18}
        decay={2}
        position={[0, 0.7, 0]}
        castShadow={!lite}
      />
      <mesh ref={core} position={[0, 0.28, 0]}>
        <coneGeometry args={[0.22, 0.6, 8]} />
        <meshStandardMaterial color="#ffc38a" emissive="#ff6a1a" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      {!lite && (
        <mesh position={[0, 0.16, 0]}>
          <coneGeometry args={[0.12, 0.34, 8]} />
          <meshStandardMaterial color="#ffe3b0" emissive="#ffb648" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      )}
      <mesh rotation={[Math.PI / 2, 0, 0.6]} position={[0, 0.05, 0]} castShadow={!lite}>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
        <meshStandardMaterial color="#3a2a1d" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, -0.5]} position={[0, 0.05, 0]} castShadow={!lite}>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
        <meshStandardMaterial color="#2c1f15" />
      </mesh>
    </group>
  );
}
