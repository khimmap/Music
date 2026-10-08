'use client';

import { useRoom } from './RoomProvider';

/** The hero: player frame (large radius, 1px light border, colored shadow) with
 * title, artist, and "picked by" below. */
export function NowPlaying() {
  const { current, palette, registerPlayerMount } = useRoom();

  return (
    <section className="flex w-full flex-col items-center gap-md">
      <div
        className="relative aspect-video w-full max-w-[880px] overflow-hidden rounded-xl"
        style={{
          border: `1px solid ${palette.vibrant}3a`,
          boxShadow: `0 40px 120px -40px ${palette.vibrant}80, inset 0 0 0 1px rgba(255,255,255,0.05)`,
          transition: 'box-shadow 1.5s ease, border-color 1.5s ease',
        }}
      >
        <div ref={registerPlayerMount} data-testid="player-mount" className="absolute inset-0 bg-black" />
        {!current && (
          <div className="absolute inset-0 grid place-items-center font-sans text-body-sm text-on-dark-soft">
            Nothing playing
          </div>
        )}
      </div>

      <div className="max-w-[880px] text-center">
        <h1
          data-testid="track-title"
          className="font-display text-display-xl leading-none tracking-tight text-on-dark md:text-display-mega"
          style={{ textWrap: 'balance' }}
        >
          {current?.title ?? 'Paste a link to begin'}
        </h1>
        {current && (
          <p className="mt-sm font-sans text-title-sm text-on-dark-soft">
            {current.artist ? `${current.artist} · ` : ''}
            <span>picked by {current.addedBy}</span>
          </p>
        )}
      </div>
    </section>
  );
}
