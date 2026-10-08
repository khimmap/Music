import { Vibrant } from 'node-vibrant/node';
import { FALLBACK_PALETTE, type Palette } from '@ember/shared';

const cache = new Map<string, Palette>();

// In e2e mode we derive a deterministic palette from the video id (no network),
// so two listeners always receive an identical, stable palette.
const E2E = process.env.E2E_STUB_PLAYER === '1';

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => {
    const color = lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function deterministicPalette(videoId: string): Palette {
  let hash = 0;
  for (const ch of videoId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  return {
    dominant: hslToHex(hue, 32, 24),
    vibrant: hslToHex(hue, 72, 56),
    muted: hslToHex((hue + 24) % 360, 24, 44),
    dark: hslToHex(hue, 44, 10),
    text: '#f5f3f0',
  };
}

async function extractPalette(videoId: string): Promise<Palette> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, {
      signal: controller.signal,
    });
    if (!res.ok) return FALLBACK_PALETTE;
    const buffer = Buffer.from(await res.arrayBuffer());
    const swatches = await Vibrant.from(buffer).getPalette();

    const present = Object.values(swatches).filter(
      (sw): sw is NonNullable<typeof sw> => sw != null,
    );
    if (present.length === 0) return FALLBACK_PALETTE;

    const dominant = present.reduce((a, b) => (b.population > a.population ? b : a)).hex;
    const vibrant = (swatches.Vibrant ?? swatches.LightVibrant ?? swatches.DarkVibrant)?.hex;
    const muted = (swatches.Muted ?? swatches.LightMuted)?.hex;
    const dark = (swatches.DarkMuted ?? swatches.DarkVibrant)?.hex;

    return {
      dominant,
      vibrant: vibrant ?? dominant,
      muted: muted ?? dominant,
      dark: dark ?? FALLBACK_PALETTE.dark,
      text: '#f5f3f0',
    };
  } catch {
    return FALLBACK_PALETTE;
  } finally {
    clearTimeout(timer);
  }
}

/** Palette for a video id, cached. Deterministic in e2e, extracted otherwise. */
export async function getPalette(videoId: string): Promise<Palette> {
  const cached = cache.get(videoId);
  if (cached) return cached;
  const palette = E2E ? deterministicPalette(videoId) : await extractPalette(videoId);
  cache.set(videoId, palette);
  return palette;
}
