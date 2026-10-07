'use client';

import dynamic from 'next/dynamic';

/**
 * Temporary route to prove the 3D stack renders end-to-end. The Canvas is
 * client-only, so it is loaded with `ssr: false`. Remove this route once the
 * real room scene lands.
 */
const RoomCanvas = dynamic(() => import('@/scene/RoomCanvas'), { ssr: false });

export default function SceneTestPage() {
  return <RoomCanvas />;
}
