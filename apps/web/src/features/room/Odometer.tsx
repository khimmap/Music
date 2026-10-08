'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Rolls to a new value like an odometer (single value in the DOM at a time, so
 * text content stays clean). Static under reduced motion.
 */
export function Odometer({ value }: { value: number | string }) {
  const reduced = useReducedMotion();
  if (reduced) return <span className="tabular-nums">{value}</span>;
  return (
    <span className="inline-flex overflow-hidden align-baseline tabular-nums">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: '0.55em', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-0.55em', opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
