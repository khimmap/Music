/** Client-side YouTube helpers. */

/**
 * True when the e2e stub player should replace the real IFrame player. Resolved
 * at runtime: either the `?e2e=1` query flag or the build-time env var.
 */
export function isStubPlayer(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_E2E_STUB_PLAYER === '1') return true;
  return new URLSearchParams(window.location.search).has('e2e');
}

/** Thumbnail URL for a video id (no API call needed). */
export function youTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Format seconds as m:ss. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
