'use client';

import { Canvas } from '@react-three/fiber';
import { ParallaxRig } from './camera/ParallaxRig';
import { RoomScene } from './room/RoomScene';

interface RoomCanvasProps {
  lite: boolean;
  reducedMotion: boolean;
  registerMount: (el: HTMLElement | null) => void;
}

/**
 * The 3D room canvas. Client-only (loaded via next/dynamic with ssr:false).
 * Lite mode lowers DPR, drops shadows, and thins out lights for low-end devices.
 */
export default function RoomCanvas({ lite, reducedMotion, registerMount }: RoomCanvasProps) {
  return (
    <Canvas
      shadows={!lite}
      dpr={lite ? 1 : [1, 2]}
      gl={{ antialias: !lite, powerPreference: 'high-performance' }}
      camera={{ position: [0, 3.1, 6.4], fov: 42 }}
      className="h-full w-full"
    >
      <color attach="background" args={['#07060a']} />
      <fog attach="fog" args={['#07060a', 11, 26]} />
      <ambientLight intensity={lite ? 0.5 : 0.3} color="#2a2f3a" />
      {!lite && <hemisphereLight intensity={0.14} color="#30364a" groundColor="#140b05" />}
      <RoomScene registerMount={registerMount} lite={lite} reducedMotion={reducedMotion} />
      <ParallaxRig reducedMotion={reducedMotion} />
    </Canvas>
  );
}
