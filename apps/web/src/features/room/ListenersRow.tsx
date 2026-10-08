'use client';

import { useRoom } from './RoomProvider';
import { initials } from '@/lib/identity';

/** Row of listener avatars (emoji/initials). Reaction/bubble slots above each
 * avatar are left empty for part 2. */
export function ListenersRow() {
  const { members, listeners } = useRoom();
  return (
    <div className="pointer-events-auto flex items-center gap-sm">
      <div className="flex -space-x-2" data-testid="listeners-avatars">
        {members.slice(0, 12).map((m) => (
          <span
            key={m.id}
            title={m.name}
            className="relative grid h-9 w-9 place-items-center rounded-full border border-black/40 font-sans text-body-sm"
            style={{ backgroundColor: m.color, color: '#0c0a09' }}
          >
            <span aria-hidden="true">{m.emoji ?? initials(m.name)}</span>
            {/* part 2: reaction bubble slot anchored here */}
          </span>
        ))}
      </div>
      <span data-testid="listeners" className="font-sans text-caption tabular-nums text-on-dark-soft">
        {listeners} listening
      </span>
    </div>
  );
}
