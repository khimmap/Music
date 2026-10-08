export type Tier = 'high' | 'medium' | 'low';
export type QualityMode = 'auto' | Tier;

/** All graphics feature flags. Part 2 plugs new effects into these. */
export interface QualityFlags {
  background: 'webgl' | 'webgl-half' | 'css';
  embersCount: number;
  burnTransition: 'webgl' | 'webgl-simple' | 'crossfade';
  filmGrain: 'animated' | 'static' | 'off';
  liveCursors: 'trail' | 'no-trail' | 'off';
  glassBlur: 'full' | 'light' | 'solid';
  tiltMagnetic: boolean;
  dprCap: number;
}

export const FLAGS_BY_TIER: Record<Tier, QualityFlags> = {
  high: {
    background: 'webgl',
    embersCount: 60,
    burnTransition: 'webgl',
    filmGrain: 'animated',
    liveCursors: 'trail',
    glassBlur: 'full',
    tiltMagnetic: true,
    dprCap: 2,
  },
  medium: {
    background: 'webgl-half',
    embersCount: 25,
    burnTransition: 'webgl-simple',
    filmGrain: 'static',
    liveCursors: 'no-trail',
    glassBlur: 'light',
    tiltMagnetic: true,
    dprCap: 1.5,
  },
  low: {
    background: 'css',
    embersCount: 0,
    burnTransition: 'crossfade',
    filmGrain: 'off',
    liveCursors: 'off',
    glassBlur: 'solid',
    tiltMagnetic: false,
    dprCap: 1,
  },
};

export const TIER_ORDER: Tier[] = ['low', 'medium', 'high'];

/** Lower a tier by one step (never below low). */
export function lowerTier(tier: Tier): Tier {
  const i = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.max(0, i - 1)] ?? 'low';
}

export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Quality from the `?quality=` query param, if present and valid. */
export function queryQuality(): QualityMode | null {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search).get('quality');
  return q === 'high' || q === 'medium' || q === 'low' || q === 'auto' ? q : null;
}

/** Initial auto-detected tier from device capabilities. */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'medium';
  if (!hasWebGL()) return 'low';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (mobile || cores <= 4 || memory <= 4) return 'medium';
  if (cores >= 8 && memory >= 8) return 'high';
  return 'medium';
}
