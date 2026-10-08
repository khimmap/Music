'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getServerBase } from '@/lib/socket';

export default function HomePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`${getServerBase()}/rooms`, { method: 'POST' });
      if (!res.ok) throw new Error('create failed');
      const data = (await res.json()) as { id: string };
      // Preserve any query flags (e.g. ?e2e=1) when entering the room.
      router.push(`/room/${data.id}${window.location.search}`);
    } catch {
      setError('Could not reach the room server. Make sure it is running.');
      setCreating(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-canvas px-base text-ink">
      <div className="w-full max-w-[52ch] text-center">
        <h1 className="font-display text-display-mega leading-none text-ink">Ember</h1>
        <p className="mx-auto mt-md font-sans text-body-md text-body">
          Start a room, share the link, and watch YouTube together in real time.
        </p>
        <div className="mt-xl flex flex-col items-center gap-sm">
          <button
            type="button"
            onClick={createRoom}
            disabled={creating}
            data-testid="create-room"
            className="rounded-pill bg-primary px-lg py-sm font-sans text-button text-on-primary transition hover:bg-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 active:translate-y-px disabled:opacity-60"
          >
            {creating ? 'Creating room…' : 'Create a room'}
          </button>
          {error && (
            <p role="alert" className="font-sans text-body-sm text-error">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
