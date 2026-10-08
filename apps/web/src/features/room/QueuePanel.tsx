'use client';

import { useState, type FormEvent } from 'react';
import { parseYouTubeId } from '@ember/shared';
import { useRoom } from './RoomProvider';
import { useQuality } from '@/effects/quality/QualityProvider';
import { youTubeThumbnail } from '@/lib/youtube';

const GLASS: Record<string, string> = {
  full: 'bg-white/[0.04] backdrop-blur-xl',
  light: 'bg-white/[0.03] backdrop-blur-md',
  solid: 'bg-surface-dark-elevated',
};

/** Frosted-glass queue column: paste a link, see the upcoming tracks. */
export function QueuePanel() {
  const { queue, addToQueue } = useRoom();
  const { flags } = useQuality();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!parseYouTubeId(value)) {
      setError('Paste a valid YouTube link or video id.');
      return;
    }
    addToQueue(value.trim());
    setValue('');
    setError(null);
  }

  return (
    <section
      className={`pointer-events-auto flex h-full w-full flex-col gap-base rounded-xl border border-white/10 p-base ${GLASS[flags.glassBlur] ?? GLASS.solid}`}
    >
      <h2 className="font-display text-display-sm text-on-dark">Up next</h2>
      <form onSubmit={submit} className="flex flex-col gap-xs">
        <label htmlFor="yt-url" className="font-sans text-caption text-on-dark-soft">
          Add a YouTube link
        </label>
        <div className="flex gap-xs">
          <input
            id="yt-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            data-testid="add-input"
            placeholder="https://youtu.be/…"
            className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/30 px-sm py-xs font-sans text-body-sm text-on-dark placeholder:text-on-dark-soft focus:border-on-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          />
          <button
            type="submit"
            data-testid="add-submit"
            className="rounded-pill bg-on-primary px-base py-xs font-sans text-button text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:translate-y-px"
          >
            Add
          </button>
        </div>
        {error && (
          <p role="alert" className="font-sans text-caption text-[#f6a9a4]">
            {error}
          </p>
        )}
      </form>

      <ul data-testid="queue-list" className="flex min-h-0 flex-1 flex-col gap-xs overflow-y-auto">
        {queue.length === 0 ? (
          <li className="rounded-lg border border-dashed border-white/10 p-base font-sans text-body-sm text-on-dark-soft">
            Nothing queued yet. Paste a link to get the room going.
          </li>
        ) : (
          queue.map((item) => (
            <li key={item.id} className="flex items-center gap-sm rounded-lg bg-white/[0.03] p-xs">
              {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail */}
              <img
                src={youTubeThumbnail(item.youtubeVideoId)}
                alt=""
                width={64}
                height={36}
                loading="lazy"
                className="h-9 w-16 shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-sans text-body-sm text-on-dark" title={item.title}>
                  {item.title}
                </p>
                <p className="truncate font-sans text-caption text-on-dark-soft">
                  {item.artist ? `${item.artist} · ` : ''}
                  {item.addedBy}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
