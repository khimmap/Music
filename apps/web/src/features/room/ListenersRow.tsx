'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  SocketEvents,
  type ChatMessage,
  type ReactionEvent,
  type ThrowEvent,
  type TypingEvent,
} from '@ember/shared';
import { useRoom } from './RoomProvider';
import { Odometer } from './Odometer';
import { initials } from '@/lib/identity';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SPRING, SPRING_SOFT, EASE_OUT } from '@/lib/motion';

const REACTION_GLYPH: Record<string, string> = {
  fire: '🔥',
  heart: '❤️',
  clap: '👏',
  laugh: '😂',
  wave: '👋',
};

interface Bubble {
  key: number;
  from: string;
  text: string;
}
interface Rising {
  key: number;
  from: string;
  kind: string;
}
interface Point {
  x: number;
  y: number;
}
interface Throw {
  key: number;
  from: Point;
  to: Point;
}

/** A tomato flying from thrower to target along an arc, spinning, then a small
 * splat of droplets at the target. Transform/opacity only; mounted only when
 * both avatars are on screen and motion is allowed. */
function TomatoThrow({ from, to, onDone }: { from: Point; to: Point; onDone: () => void }) {
  const [landed, setLanded] = useState(false);
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 90;

  useEffect(() => {
    if (!landed) return;
    const t = window.setTimeout(onDone, 520);
    return () => window.clearTimeout(t);
  }, [landed, onDone]);

  return (
    <>
      {!landed ? (
        <motion.span
          aria-hidden="true"
          data-testid="tomato-fly"
          className="absolute left-0 top-0 text-[20px] leading-none will-change-transform"
          initial={{ x: from.x, y: from.y, rotate: 0, opacity: 1 }}
          animate={{ x: [from.x, midX, to.x], y: [from.y, midY, to.y], rotate: [0, 270, 560] }}
          transition={{ duration: 0.52, ease: 'easeIn', times: [0, 0.5, 1] }}
          onAnimationComplete={() => setLanded(true)}
        >
          🍅
        </motion.span>
      ) : (
        Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          const d = 14 + (i % 3) * 6;
          return (
            <motion.span
              key={i}
              aria-hidden="true"
              className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full will-change-transform"
              style={{ backgroundColor: '#c0271f' }}
              initial={{ x: to.x, y: to.y, opacity: 0.9, scale: 1 }}
              animate={{ x: to.x + Math.cos(a) * d, y: to.y + Math.sin(a) * d, opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            />
          );
        })
      )}
    </>
  );
}

/**
 * Row of listener avatars with the avatar-anchored micro-interactions: a spark
 * on join (dim + shrink on leave), chat bubbles that launch up from the chat
 * zone and settle over the sender (max 3, fade after 5s), rising reactions (+ a
 * light wave on a burst), typing indicator, and the tomato throw — flying arc +
 * spin, splat droplets, avatar shake, 8s stain, a whole-screen shake + vibrate
 * when it lands on you.
 */
export function ListenersRow() {
  const { members, listeners, socket, selfId, throwAt } = useRoom();
  const reducedMotion = useReducedMotion();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [rising, setRising] = useState<Rising[]>([]);
  const [typing, setTyping] = useState<Record<string, number>>({});
  const [stains, setStains] = useState<Record<string, boolean>>({});
  const [shaking, setShaking] = useState<Record<string, boolean>>({});
  const [throws, setThrows] = useState<Throw[]>([]);
  const [wave, setWave] = useState(false);
  const [, tick] = useState(0);
  const keyRef = useRef(0);
  const reactionTimes = useRef<number[]>([]);
  const avatarEls = useRef<Map<string, HTMLElement>>(new Map());

  const center = (id: string): Point | null => {
    const el = avatarEls.current.get(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  // Expire typing indicators.
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onChat = (m: ChatMessage) => {
      const key = keyRef.current++;
      setBubbles((p) => [...p.slice(-20), { key, from: m.from, text: m.text }]);
      window.setTimeout(() => setBubbles((p) => p.filter((b) => b.key !== key)), 5000);
    };
    const onReaction = (e: ReactionEvent) => {
      const key = keyRef.current++;
      setRising((p) => [...p.slice(-40), { key, from: e.from, kind: e.kind }]);
      window.setTimeout(() => setRising((p) => p.filter((r) => r.key !== key)), 1600);
      const now = Date.now();
      reactionTimes.current = reactionTimes.current.filter((t) => now - t < 2000);
      reactionTimes.current.push(now);
      if (reactionTimes.current.length >= 5) {
        setWave(true);
        window.setTimeout(() => setWave(false), 900);
        reactionTimes.current = [];
      }
    };
    const onTyping = (e: TypingEvent) =>
      setTyping((p) => ({ ...p, [e.id]: e.typing ? Date.now() + 4000 : 0 }));
    const onThrow = (e: ThrowEvent) => {
      setStains((p) => ({ ...p, [e.to]: true }));
      setShaking((p) => ({ ...p, [e.to]: true }));
      window.setTimeout(() => setShaking((p) => ({ ...p, [e.to]: false })), 170);
      window.setTimeout(() => setStains((p) => ({ ...p, [e.to]: false })), 8000);
      // Flying tomato + droplets (needs both avatars on screen; skip if reduced).
      if (!reducedMotion) {
        const from = center(e.from);
        const to = center(e.to);
        if (from && to) {
          const key = keyRef.current++;
          setThrows((p) => [...p, { key, from, to }]);
        }
      }
      if (e.to === selfId) {
        // Whole-screen shake (handled by RoomView) + haptics.
        window.dispatchEvent(new CustomEvent('ember:hit'));
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(120);
      }
    };
    socket.on(SocketEvents.ChatSend, onChat);
    socket.on(SocketEvents.Reaction, onReaction);
    socket.on(SocketEvents.ChatTyping, onTyping);
    socket.on(SocketEvents.InteractionThrow, onThrow);
    return () => {
      socket.off(SocketEvents.ChatSend, onChat);
      socket.off(SocketEvents.Reaction, onReaction);
      socket.off(SocketEvents.ChatTyping, onTyping);
      socket.off(SocketEvents.InteractionThrow, onThrow);
    };
  }, [socket, selfId, reducedMotion]);

  const now = Date.now();

  return (
    <>
      <div className={`pointer-events-auto flex items-end gap-sm ${wave ? 'ember-wave' : ''}`}>
        <div className="flex items-end -space-x-2" data-testid="listeners-avatars">
          <AnimatePresence initial={false}>
            {members.slice(0, 12).map((m) => {
              const myBubbles = bubbles.filter((b) => b.from === m.id).slice(-3);
              const myRising = rising.filter((r) => r.from === m.id);
              const isTyping = (typing[m.id] ?? 0) > now;
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.4, x: -24 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={SPRING}
                  className="group relative"
                >
                  {/* Spark on join: a quick ember ring expanding behind the avatar. */}
                  {!reducedMotion && (
                    <motion.span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-full"
                      style={{ boxShadow: '0 0 18px 6px var(--color-ember)' }}
                      initial={{ opacity: 0.8, scale: 0.3 }}
                      animate={{ opacity: 0, scale: 2.4 }}
                      transition={{ duration: 0.7, ease: EASE_OUT }}
                    />
                  )}

                  <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 flex-col-reverse items-center gap-1">
                    <AnimatePresence initial={false}>
                      {myBubbles.map((b) => (
                        <motion.div
                          key={b.key}
                          data-testid="chat-bubble"
                          layout
                          // Launches up from the chat zone below, settles over the avatar.
                          initial={{ opacity: 0, y: 30, scale: 0.5 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={SPRING_SOFT}
                          className="max-w-[180px] truncate rounded-lg bg-surface-dark-elevated px-sm py-xs font-sans text-caption text-on-dark shadow-soft"
                        >
                          {b.text}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2">
                    <AnimatePresence>
                      {myRising.map((r) => (
                        <motion.span
                          key={r.key}
                          aria-hidden="true"
                          className="absolute text-body-md"
                          initial={{ opacity: 0, y: 0, scale: 0.6 }}
                          animate={{ opacity: 1, y: -56, x: (r.key % 5) * 6 - 12, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {REACTION_GLYPH[r.kind] ?? '✨'}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>

                  <span
                    ref={(el) => {
                      if (el) avatarEls.current.set(m.id, el);
                      else avatarEls.current.delete(m.id);
                    }}
                    className={`relative grid h-9 w-9 place-items-center rounded-full border border-black/40 font-sans text-body-sm ${shaking[m.id] ? 'ember-shake' : ''}`}
                    style={{
                      backgroundColor: m.color,
                      color: '#0c0a09',
                      boxShadow: `0 0 calc(12px * var(--ember-flicker, 1)) ${m.color}aa`,
                    }}
                    title={m.name}
                  >
                    <span aria-hidden="true">{m.emoji ?? initials(m.name)}</span>
                    {isTyping && (
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-surface-dark-elevated px-1 text-[9px] text-on-dark-soft">
                        …
                      </span>
                    )}
                    {stains[m.id] && (
                      <span
                        aria-hidden="true"
                        data-testid="tomato-stain"
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            'radial-gradient(circle at 40% 35%, rgba(192,39,31,0.8), rgba(122,26,20,0.6) 60%, transparent)',
                        }}
                      />
                    )}
                  </span>
                  {m.id !== selfId && (
                    <button
                      type="button"
                      data-testid={`throw-${m.id}`}
                      onClick={() => void throwAt(m.id)}
                      aria-label={`Throw a tomato at ${m.name}`}
                      className="pointer-events-auto absolute -top-2 left-1/2 hidden -translate-x-1/2 rounded-full bg-black/60 px-1 text-[11px] opacity-0 transition hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 group-hover:opacity-100 lg:block"
                    >
                      <span aria-hidden="true">🍅</span>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <span data-testid="listeners" className="font-sans text-caption text-on-dark-soft">
          <Odometer value={listeners} /> listening
        </span>
      </div>

      {/* Flying tomatoes + splats, in viewport-fixed coordinates. */}
      <div className="pointer-events-none fixed inset-0 z-[45]" aria-hidden="true">
        {throws.map((t) => (
          <TomatoThrow
            key={t.key}
            from={t.from}
            to={t.to}
            onDone={() => setThrows((p) => p.filter((x) => x.key !== t.key))}
          />
        ))}
      </div>
    </>
  );
}
