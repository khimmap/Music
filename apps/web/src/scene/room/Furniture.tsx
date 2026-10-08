'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, type Object3D } from 'three';
import { SEATS } from './seats';

const CHAIR_URL = '/assets/room/loungeChair.glb';
const RUG_URL = '/assets/room/rugRounded.glb';
const LAMP_URL = '/assets/room/lampRoundFloor.glb';
const DOOR_URL = '/assets/room/doorwayOpen.glb';

useGLTF.preload(CHAIR_URL);
useGLTF.preload(RUG_URL);
useGLTF.preload(LAMP_URL);
useGLTF.preload(DOOR_URL);

interface ModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  shadows?: boolean;
}

function Model({ url, position, rotation, scale = 1, shadows = true }: ModelProps) {
  const { scene } = useGLTF(url);
  const object = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: Object3D) => {
      if (child instanceof Mesh) {
        child.castShadow = shadows;
        child.receiveShadow = shadows;
      }
    });
    return clone;
  }, [scene, shadows]);

  return <primitive object={object} position={position} rotation={rotation} scale={scale} />;
}

/** All GLB-based furniture: seats in the arc, rug, floor lamp, and door. */
export function Furniture({ lite }: { lite: boolean }) {
  const shadows = !lite;
  return (
    <group>
      <Model url={RUG_URL} position={[0, 0.02, -2]} scale={2.6} shadows={false} />
      {SEATS.map((seat) => (
        <Model
          key={seat.id}
          url={CHAIR_URL}
          position={seat.position}
          rotation={[0, seat.rotationY, 0]}
          scale={1}
          shadows={shadows}
        />
      ))}
      <Model url={LAMP_URL} position={[-5, 0, -3.4]} scale={1} shadows={shadows} />
      <Model url={DOOR_URL} position={[6.4, 0, 1.5]} rotation={[0, -Math.PI / 2, 0]} scale={1.3} shadows={shadows} />
    </group>
  );
}
