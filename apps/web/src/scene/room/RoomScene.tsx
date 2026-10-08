'use client';

import { Suspense } from 'react';
import { Fire } from '../effects/Fire';
import { Furniture } from './Furniture';
import { Screen } from './Screen';

interface RoomSceneProps {
  registerMount: (el: HTMLElement | null) => void;
  lite: boolean;
  reducedMotion: boolean;
}

/** Static room shell (floor, walls), screen, fire, and furniture. */
export function RoomScene({ registerMount, lite, reducedMotion }: RoomSceneProps) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[0, 4, -6.7]} receiveShadow>
        <planeGeometry args={[26, 11]} />
        <meshStandardMaterial color="#0c0a09" />
      </mesh>
      <mesh position={[-7, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 11]} />
        <meshStandardMaterial color="#0c0a09" />
      </mesh>
      <mesh position={[7, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 11]} />
        <meshStandardMaterial color="#0c0a09" />
      </mesh>

      <Screen registerMount={registerMount} lite={lite} />
      <Fire position={[0, 0, -2]} lite={lite} reducedMotion={reducedMotion} />

      <Suspense fallback={null}>
        <Furniture lite={lite} />
      </Suspense>
    </group>
  );
}
