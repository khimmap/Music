'use client';

import { Billboard, Html } from '@react-three/drei';

interface ChatBubbleProps {
  /** Message text to show above the character. */
  text: string;
  /** World-space anchor (usually just above a character's head). */
  position?: [number, number, number];
}

/**
 * Skeleton chat bubble that floats above a character's head. Uses drei
 * <Billboard> so it always faces the camera and <Html> to render DOM text in 3D
 * space. Lifetime/queueing and real styling are added later. Must be rendered
 * inside a <Canvas>.
 */
export function ChatBubble({ text, position = [0, 1.6, 0] }: ChatBubbleProps) {
  return (
    <Billboard position={position}>
      <Html center distanceFactor={8}>
        <div className="pointer-events-none rounded-lg bg-surface-card px-sm py-xs text-caption text-ink shadow-soft">
          {text}
        </div>
      </Html>
    </Billboard>
  );
}
