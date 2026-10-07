'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

/**
 * Placeholder 3D scene that proves the three + @react-three/fiber + drei stack
 * renders in the browser. This is NOT the real room — just a camera, lights,
 * and a glowing "fire" cube. Replace it with the cozy room (big screen, central
 * fire, seats, door) following the 3D build order in CLAUDE.md.
 */
function FireGlowPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#f4915b" emissive="#e2552b" emissiveIntensity={0.6} />
    </mesh>
  );
}

export default function RoomCanvas() {
  return (
    <div className="relative h-screen w-full">
      <Canvas camera={{ position: [3, 2, 4], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[2, 3, 2]} intensity={30} color="#ffb27a" />
        <FireGlowPlaceholder />
        <OrbitControls enablePan={false} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-xl">
        <span className="font-display text-display-sm text-ink">Ember — 3D ready</span>
      </div>
    </div>
  );
}
