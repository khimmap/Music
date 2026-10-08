'use client';

import { isStubPlayer } from '@/lib/youtube';

/**
 * Tiny Web Audio note player for the landing avatars. No audio files: a single
 * shared AudioContext (created lazily on the first user gesture), soft triangle
 * voices on a C-major pentatonic, short attack + ~600ms decay, low master gain,
 * polyphony capped at 6. Sound only ever plays from a direct gesture.
 */

export const NOTE_ORDER = ['C', 'D', 'E', 'G', 'A'] as const;
export type Note = (typeof NOTE_ORDER)[number];

// C-major pentatonic, octave 4.
const FREQ: Record<Note, number> = { C: 261.63, D: 293.66, E: 329.63, G: 392.0, A: 440.0 };

const MAX_VOICES = 6;
const MASTER_GAIN = 0.08;

declare global {
  interface Window {
    __emberNotes?: string[];
    webkitAudioContext?: typeof AudioContext;
  }
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let voices = 0;

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Play one pentatonic note. In E2E mode the note name is recorded to
 * `window.__emberNotes` for assertions (and synthesis is skipped to stay
 * deterministic/headless-safe). */
export function playNote(note: Note): void {
  if (isStubPlayer()) {
    (window.__emberNotes ??= []).push(note);
    return;
  }
  try {
    const audio = ensureContext();
    if (!audio || !master || voices >= MAX_VOICES) return;
    voices += 1;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = FREQ[note];
    const t = audio.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(1, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + 0.62);
    osc.onended = () => {
      voices = Math.max(0, voices - 1);
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    /* audio unavailable (e.g. headless) — ignore */
  }
}
