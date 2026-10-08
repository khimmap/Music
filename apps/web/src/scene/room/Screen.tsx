'use client';

interface ScreenProps {
  lite: boolean;
}

/**
 * The big screen on the front wall: bezel + a dim glowing panel. The YouTube
 * IFrame player is a separate DOM layer aligned over this panel by
 * <ScreenProjector> (no video textures, no in-canvas iframe).
 */
export function Screen({ lite }: ScreenProps) {
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
    </group>
  );
}
