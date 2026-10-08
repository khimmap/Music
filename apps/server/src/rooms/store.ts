import { randomUUID } from 'node:crypto';
import type {
  Member,
  Palette,
  PlaybackAction,
  PlaybackCurrent,
  PlaybackSyncPayload,
  QueueItem,
  RoomSnapshot,
} from '@ember/shared';

/** Internal, mutable room state (never sent to clients directly). */
interface RoomState {
  id: string;
  name: string;
  queue: QueueItem[];
  current: PlaybackCurrent | null;
  /** Connected members keyed by socket id. */
  members: Map<string, Member>;
}

const rooms = new Map<string, RoomState>();

const ADJECTIVES = ['Cozy', 'Amber', 'Velvet', 'Midnight', 'Golden', 'Quiet', 'Mellow', 'Hazy'];
const NOUNS = ['Lounge', 'Hearth', 'Parlour', 'Den', 'Studio', 'Loft', 'Nook', 'Haven'];

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)] ?? list[0] ?? '';
}

function shortId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8);
}

function now(): number {
  return Date.now();
}

export function createRoom(): RoomState {
  const room: RoomState = {
    id: shortId(),
    name: `${pick(ADJECTIVES)} ${pick(NOUNS)}`,
    queue: [],
    current: null,
    members: new Map(),
  };
  rooms.set(room.id, room);
  return room;
}

export function getRoom(id: string): RoomState | undefined {
  return rooms.get(id);
}

export function addMember(room: RoomState, member: Member): void {
  room.members.set(member.id, member);
}

export function removeMember(room: RoomState, socketId: string): void {
  room.members.delete(socketId);
}

/** Promote the next queued item to `current` and start it playing. */
function promoteNext(room: RoomState): void {
  const next = room.queue.shift();
  room.current = next
    ? {
        videoId: next.youtubeVideoId,
        title: next.title,
        artist: next.artist,
        startedAtServerMs: now(),
        pausedAtSec: null,
        palette: next.palette,
        addedBy: next.addedBy,
      }
    : null;
}

/** Build a queue item from a validated video id. */
export function makeQueueItem(
  videoId: string,
  title: string,
  artist: string,
  addedBy: string,
  palette: Palette,
): QueueItem {
  return {
    id: shortId(),
    youtubeVideoId: videoId,
    title,
    artist,
    durationSeconds: 0,
    addedBy,
    addedAt: now(),
    palette,
  };
}

/** Add an item to the queue; auto-start if nothing is playing. */
export function enqueue(room: RoomState, item: QueueItem): void {
  room.queue.push(item);
  if (room.current === null) {
    promoteNext(room);
  }
}

export function play(room: RoomState): void {
  if (room.current === null) {
    promoteNext(room);
    return;
  }
  if (room.current.pausedAtSec !== null) {
    room.current.startedAtServerMs = now() - room.current.pausedAtSec * 1000;
    room.current.pausedAtSec = null;
  }
}

export function pause(room: RoomState): void {
  if (room.current && room.current.pausedAtSec === null) {
    const pos = (now() - room.current.startedAtServerMs) / 1000;
    room.current.pausedAtSec = Math.max(0, pos);
  }
}

export function seek(room: RoomState, positionSec: number): void {
  if (!room.current) return;
  const pos = Math.max(0, positionSec);
  if (room.current.pausedAtSec === null) {
    room.current.startedAtServerMs = now() - pos * 1000;
  } else {
    room.current.pausedAtSec = pos;
  }
}

export function next(room: RoomState): void {
  promoteNext(room);
}

/** Advance only if the ended video is still the current one (ignore stale reports). */
export function reportEnded(room: RoomState, videoId: string): boolean {
  if (room.current && room.current.videoId === videoId) {
    promoteNext(room);
    return true;
  }
  return false;
}

export function toSnapshot(room: RoomState): RoomSnapshot {
  const members = [...room.members.values()];
  return {
    id: room.id,
    name: room.name,
    listeners: members.length,
    members,
    queue: room.queue,
    current: room.current,
  };
}

export function toSyncPayload(
  room: RoomState,
  actorName: string | null,
  action: PlaybackAction | null,
  actionPositionSec: number | null,
): PlaybackSyncPayload {
  return {
    current: room.current,
    serverNowMs: now(),
    actorName,
    action,
    actionPositionSec,
  };
}
