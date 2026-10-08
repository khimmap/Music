'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useQuality } from '@/effects/quality/QualityProvider';
import { useMagnetic } from '@/hooks/usePointerPhysics';
import { playNote, NOTE_ORDER, type Note } from '@/lib/audio';
import { isStubPlayer } from '@/lib/youtube';
import { EASE_OUT } from '@/lib/motion';

const FACES: { emoji: string; color: string }[] = [
  { emoji: '🎧', color: '#f4915b' },
  { emoji: '🎵', color: '#a7e5d3' },
  { emoji: '🌙', color: '#c8b8e0' },
  { emoji: '✨', color: '#a8c8e8' },
  { emoji: '🔥', color: '#e8b8c4' },
];

// Decorative fake requests (a couple in Vietnamese so it feels local).
const PHRASES = [
  'play Blinding Lights',
  'skip!',
  'turn it up',
  "this one's a banger",
  'who added this 😭',
  'bài này hay quá',
  'mở lại đi',
];

function Avatar({
  index,
  face,
  note,
  lean,
  bubble,
}: {
  index: number;
  face: { emoji: string; color: string };
  note: Note;
  lean: boolean;
  bubble: string | null;
}) {
  const { reducedMotion } = useQuality();
  const magnet = useMagnetic(lean, 0.5, 8);
  const [glow, setGlow] = useState(false);

  function play() {
    playNote(note);
    setGlow(true);
    window.setTimeout(() => setGlow(false), 480);
  }

  return (
    <motion.button
      ref={magnet.ref}
      type="button"
      data-testid={`avatar-${index}`}
      aria-label={`Play note ${note}`}
      onClick={play}
      onPointerMove={magnet.onPointerMove}
      onPointerLeave={magnet.onPointerLeave}
      style={{ x: magnet.x, y: magnet.y }}
      className="relative grid h-9 w-9 place-items-center rounded-full border border-white/70 text-[15px] shadow-soft transition-[box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/70"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full transition-opacity duration-300"
        style={{
          opacity: glow ? 1 : 0,
          boxShadow: '0 0 16px 4px rgba(244,145,91,0.75)',
          backgroundColor: face.color,
        }}
      />
      <span
        aria-hidden="true"
        className="relative grid h-9 w-9 place-items-center rounded-full"
        style={{
          backgroundColor: face.color,
          transform: glow && !reducedMotion ? 'scale(1.12)' : 'scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {face.emoji}
      </span>
      <AnimatePresence>
        {bubble && (
          <motion.span
            aria-hidden="true"
            data-testid="avatar-bubble"
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="absolute bottom-full left-1/2 mb-2 w-max max-w-[160px] -translate-x-1/2 whitespace-nowrap rounded-lg bg-surface-dark-elevated px-sm py-xs font-sans text-caption text-on-dark shadow-soft"
          >
            {bubble}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** The "Bring your people." avatar cluster: magnetic lean (tiltMagnetic),
 * randomized one-at-a-time speech bubbles (paused when hidden, off under reduced
 * motion), and a pentatonic note per avatar on click. */
export function AvatarStrip() {
  const { flags, reducedMotion, visible } = useQuality();
  const lean = flags.tiltMagnetic && !reducedMotion;
  const bubblesOn = !reducedMotion;
  const [bubble, setBubble] = useState<{ index: number; text: string } | null>(null);
  const [hovered, setHovered] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!bubblesOn || !visible) {
      setBubble(null);
      return;
    }
    let cancelled = false;
    const clear = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    // Deterministic, fast cadence under the E2E stub so tests aren't slow/flaky.
    const stub = isStubPlayer();
    const schedule = () => {
      const wait = stub ? 500 : 4000 + Math.random() * 3000;
      timers.current.push(
        window.setTimeout(() => {
          if (cancelled) return;
          const index = Math.floor(Math.random() * FACES.length);
          const text = PHRASES[Math.floor(Math.random() * PHRASES.length)]!;
          setBubble({ index, text });
          timers.current.push(
            window.setTimeout(() => {
              if (!cancelled) setBubble(null);
              schedule();
            }, stub ? 1500 : 2500),
          );
        }, wait),
      );
    };
    schedule();
    return () => {
      cancelled = true;
      clear();
    };
  }, [bubblesOn, visible]);

  return (
    <div
      className="flex items-center gap-sm"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div
        className="flex items-center transition-[gap] duration-300"
        style={{ gap: hovered && lean ? '2px' : '0px' }}
      >
        {FACES.map((face, i) => (
          <div key={i} className={i > 0 ? '-ml-2' : ''}>
            <Avatar
              index={i}
              face={face}
              note={NOTE_ORDER[i]!}
              lean={lean}
              bubble={bubble?.index === i ? bubble.text : null}
            />
          </div>
        ))}
      </div>
      <span className="l-muted font-sans text-caption">Bring your people.</span>
    </div>
  );
}
