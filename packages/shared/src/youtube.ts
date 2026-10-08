/**
 * YouTube URL/ID parsing shared by the web client and server so both validate
 * input identically. Pure string/regex logic so this stays isomorphic (no DOM
 * or Node globals required).
 */

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extract an 11-character YouTube video id from a raw URL or a bare id.
 * Returns null when the input is not a recognisable YouTube video.
 */
export function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (VIDEO_ID_RE.test(trimmed)) return trimmed;

  if (/youtube\.com/i.test(trimmed)) {
    const watch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watch && watch[1]) return watch[1];
    const path = trimmed.match(/youtube\.com\/(?:embed|shorts|live|v)\/([a-zA-Z0-9_-]{11})/i);
    if (path && path[1]) return path[1];
  }

  if (/youtu\.be/i.test(trimmed)) {
    const short = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (short && short[1]) return short[1];
  }

  return null;
}
