'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useQuality } from './quality/QualityProvider';
import { useRoom } from '@/features/room/RoomProvider';
import { EASE_OUT } from '@/lib/motion';

// Soft noise mask so the dissolve has an irregular, burning edge.
const MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23b)'/%3E%3C/svg%3E\")";

function Ash({ color }: { color: string }) {
  return (
    <>
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute bottom-6 h-1 w-1 rounded-full"
          style={{ left: `${12 + i * 12}%`, backgroundColor: color }}
          initial={{ opacity: 0.9, y: 0 }}
          animate={{ opacity: 0, y: -120 - Math.random() * 80, x: (Math.random() - 0.5) * 60 }}
          transition={{ duration: 0.9 + Math.random() * 0.4, ease: EASE_OUT }}
        />
      ))}
    </>
  );
}

/**
 * On track change, dissolves the player frame per the `burnTransition` flag:
 * `crossfade` = plain fade; `webgl-simple` = noise-mask dissolve + glowing
 * orange edge; `webgl` = same plus a few rising ash particles. (Implemented
 * with a 2D/CSS overlay, not a second WebGL context, to keep one WebGL canvas.)
 */
export function BurnTransition() {
  const { flags, reducedMotion } = useQuality();
  const { current, palette } = useRoom();
  const [burning, setBurning] = useState(false);
  const prev = useRef<string | null>(current?.videoId ?? null);
  const mode = reducedMotion ? 'crossfade' : flags.burnTransition;

  useEffect(() => {
    const id = current?.videoId ?? null;
    if (id !== prev.current && prev.current !== null && id !== null) {
      setBurning(true);
      const timer = window.setTimeout(() => setBurning(false), 900);
      prev.current = id;
      return () => window.clearTimeout(timer);
    }
    prev.current = id;
  }, [current?.videoId]);

  const masked = mode !== 'crossfade';

  return (
    <div
      aria-hidden="true"
      data-testid="burn"
      data-mode={mode}
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
    >
      <AnimatePresence>
        {burning && (
          <motion.div
            key="burn"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            style={
              masked
                ? {
                    background: `radial-gradient(circle at 50% 60%, ${palette.vibrant}, #2a0f06 55%, #07060a)`,
                    boxShadow: `inset 0 0 60px ${palette.vibrant}`,
                    WebkitMaskImage: MASK,
                    maskImage: MASK,
                    WebkitMaskSize: 'cover',
                    maskSize: 'cover',
                  }
                : { background: '#07060a' }
            }
          />
        )}
      </AnimatePresence>
      {mode === 'webgl' && burning && <Ash color={palette.vibrant} />}
    </div>
  );
}
