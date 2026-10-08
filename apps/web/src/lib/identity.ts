/** The current listener's display identity (icon avatar), stable per tab. */
export interface Identity {
  name: string;
  color: string;
  emoji: string;
}

const NAMES = ['Minh', 'Rin', 'Avery', 'Noa', 'Kai', 'Suki', 'Theo', 'Juno', 'Remy', 'Lux'];
const COLORS = ['#f4915b', '#a7e5d3', '#c8b8e0', '#a8c8e8', '#e8b8c4', '#ffd27a'];
const EMOJIS = ['🔥', '🎧', '🌙', '✨', '🎵', '🫧', '🌊', '🍃', '⭐', '🪩'];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)] ?? list[0]!;
}

function freshIdentity(): Identity {
  return {
    name: `${pick(NAMES)} ${10 + Math.floor(Math.random() * 89)}`,
    color: pick(COLORS),
    emoji: pick(EMOJIS),
  };
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

/** Read (or create + persist) the current listener's identity. Any field
 * missing from an older cached identity (e.g. one saved before avatars had an
 * emoji) is backfilled so the avatar never falls back to bare initials. */
export function getIdentity(): Identity {
  if (typeof window === 'undefined') return { name: 'Guest', color: '#f4915b', emoji: '🔥' };
  const raw = window.sessionStorage.getItem('ember:identity');
  let identity = freshIdentity();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<Identity>;
      identity = {
        name: str(parsed.name) ?? identity.name,
        color: str(parsed.color) ?? identity.color,
        emoji: str(parsed.emoji) ?? identity.emoji,
      };
    } catch {
      /* corrupt value — keep the fresh identity */
    }
  }
  window.sessionStorage.setItem('ember:identity', JSON.stringify(identity));
  return identity;
}

/** First two initials for the avatar fallback. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase();
}
