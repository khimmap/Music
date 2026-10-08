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
import { SPRING, ENTER } from '@/lib/motion';

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

/**
 * Row of listener avatars with the avatar-anchored micro-interactions: chat
 * bubbles (max 3, fade after 5s), rising reactions (+ a light wave on a burst),
 * typing indicator, tomato stain + shake, and join/leave layout animation.
 */
export function ListenersRow() {
  const { members, listeners, socket, selfId, throwAt } = useRoom();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [rising, setRising] = useState<Rising[]>([]);
  const [typing, setTyping] = useState<Record<string, number>>({});
  const [stains, setStains] = useState<Record<string, boolean>>({});
  const [shaking, setShaking] = useState<Record<string, boolean>>({});
  const [wave, setWave] = useState(false);
  const [, tick] = useState(0);
  const keyRef = useRef(0);
  const reactionTimes = useRef<number[]>([]);

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
      if (e.to === selfId && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(120);
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
  }, [socket, selfId]);

  const now = Date.now();

  return (
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
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 flex-col-reverse items-center gap-1">
                  <AnimatePresence initial={false}>
                    {myBubbles.map((b) => (
                      <motion.div
                        key={b.key}
                        data-testid="chat-bubble"
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={ENTER}
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
  );
}
