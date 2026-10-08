'use client';

import { Html } from '@react-three/drei';

interface ScreenProps {
  /** Registers the DOM element the YouTube player mounts into. */
  registerMount: (el: HTMLElement | null) => void;
  lite: boolean;
}

/**
 * The big screen on the front wall. The YouTube IFrame player is mounted as a
 * real DOM element via drei <Html transform> aligned to this anchor (no video
 * textures).
 */
export function Screen({ registerMount, lite }: ScreenProps) {
  return (
    <group position={[0, 2.4, -6]}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[6.7, 3.95, 0.12]} />
        <meshStandardMaterial color="#07080a" />
      </mesh>
      <mesh>
        <planeGeometry args={[6, 3.375]} />
        <meshStandardMaterial color="#0b0f13" emissive="#15242e" emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      {!lite && <pointLight position={[0, 0, 1.8]} color="#9fc7e8" intensity={6} distance={9} decay={2} />}
      <Html transform position={[0, 0, 0.03]} distanceFactor={3.05}>
        <div
          ref={registerMount}
          data-testid="screen-mount"
          style={{ width: '512px', height: '288px', background: '#05070a', overflow: 'hidden' }}
        />
      </Html>
    </group>
  );
}
