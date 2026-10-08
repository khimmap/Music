'use client';

import { useState } from 'react';
import { useQuality } from '@/effects/quality/QualityProvider';
import type { QualityMode } from '@/effects/quality/detect';
import { useRoom } from './RoomProvider';

const MODES: QualityMode[] = ['auto', 'high', 'medium', 'low'];

/** Graphics settings (⚙): Auto / High / Medium / Low, persisted to localStorage. */
export function SettingsMenu() {
  const { mode, setMode, tier } = useQuality();
  const { optedOut, setOptOut } = useRoom();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Graphics settings"
        aria-expanded={open}
        data-testid="quality-menu"
        data-tier={tier}
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-on-dark transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span aria-hidden="true">⚙</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 flex w-44 flex-col gap-[2px] rounded-lg border border-white/10 bg-surface-dark-elevated p-xs"
        >
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="menuitemradio"
              aria-checked={mode === m}
              data-testid={`quality-${m}`}
              onClick={() => {
                setMode(m);
                setOpen(false);
              }}
              className={`flex items-center justify-between rounded-md px-sm py-xs font-sans text-body-sm capitalize transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                mode === m ? 'text-on-dark' : 'text-on-dark-soft'
              }`}
            >
              {m}
              {mode === m && <span aria-hidden="true">·</span>}
            </button>
          ))}
          <p className="px-sm pt-xs font-sans text-caption text-on-dark-soft">
            Active tier: {tier}
          </p>
          <label className="mt-xs flex cursor-pointer items-center justify-between rounded-md px-sm py-xs font-sans text-body-sm text-on-dark-soft hover:bg-white/10">
            <span>Shield from throws</span>
            <input
              type="checkbox"
              data-testid="opt-out"
              checked={optedOut}
              onChange={(e) => setOptOut(e.target.checked)}
              className="h-4 w-4 cursor-pointer"
              style={{ accentColor: 'var(--color-ember)' }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
