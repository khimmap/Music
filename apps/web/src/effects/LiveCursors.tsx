'use client';

import { useEffect, useRef, useState } from 'react';
import { SocketEvents, type CursorEvent } from '@ember/shared';
import { useQuality } from './quality/QualityProvider';
import { useRoom } from '@/features/room/RoomProvider';

interface Cursor {
  x: number;
  y: number;
  at: number;
}

/**
 * Other listeners' cursors (name + color), sent ~20/s (throttled) as normalized
 * viewport coordinates, smoothed on receive (CSS transform transition), with a
 * soft trail on `trail`. Hidden after 3s idle. Off when `liveCursors === 'off'`.
 */
export function LiveCursors() {
  const { flags, visible } = useQuality();
  const { socket, members, selfId, sendCursor } = useRoom();
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const lastSent = useRef(0);
  const mode = flags.liveCursors;

  useEffect(() => {
    if (mode === 'off' || !socket) return;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastSent.current < 50 || !visible) return;
      lastSent.current = now;
      sendCursor(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    };
    const onCursor = (c: CursorEvent) => {
      setCursors((prev) => ({ ...prev, [c.id]: { x: c.x, y: c.y, at: Date.now() } }));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    socket.on(SocketEvents.CursorMove, onCursor);
    const prune = window.setInterval(() => {
      const cutoff = Date.now() - 3000;
      setCursors((prev) => {
        const next: Record<string, Cursor> = {};
        for (const [id, c] of Object.entries(prev)) if (c.at >= cutoff) next[id] = c;
        return next;
      });
    }, 1000);
    return () => {
      window.removeEventListener('pointermove', onMove);
      socket.off(SocketEvents.CursorMove, onCursor);
      window.clearInterval(prune);
    };
  }, [mode, socket, sendCursor, visible]);

  if (mode === 'off') return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-hidden="true">
      {Object.entries(cursors).map(([id, c]) => {
        if (id === selfId) return null;
        const member = members.find((m) => m.id === id);
        const color = member?.color ?? '#f4915b';
        return (
          <div
            key={id}
            data-testid="live-cursor"
            className="absolute left-0 top-0 will-change-transform"
            style={{ transform: `translate3d(${c.x * vw}px, ${c.y * vh}px, 0)`, transition: 'transform 90ms linear' }}
          >
            {mode === 'trail' && (
              <span
                className="absolute h-4 w-4 rounded-full opacity-40 blur-[6px]"
                style={{ backgroundColor: color }}
              />
            )}
            <span className="absolute h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span
              className="absolute left-3 top-2 whitespace-nowrap rounded-pill px-xs py-[1px] font-sans text-[11px] text-ink"
              style={{ backgroundColor: color }}
            >
              {member?.name ?? 'Guest'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
