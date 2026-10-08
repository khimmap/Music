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

/** Read (or create + persist) the current listener's identity. */
export function getIdentity(): Identity {
  if (typeof window === 'undefined') return { name: 'Guest', color: '#f4915b', emoji: '🔥' };
  const raw = window.sessionStorage.getItem('ember:identity');
  if (raw) {
    try {
      return JSON.parse(raw) as Identity;
    } catch {
      /* fall through and regenerate */
    }
  }
  const identity: Identity = {
    name: `${pick(NAMES)} ${10 + Math.floor(Math.random() * 89)}`,
    color: pick(COLORS),
    emoji: pick(EMOJIS),
  };
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
