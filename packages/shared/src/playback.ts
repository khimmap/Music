/**
 * Playback & sync contracts shared between the Ember web client and server.
 *
 * The server is authoritative over playback. It stores `PlaybackCurrent` and
 * broadcasts it with its own clock reading; clients estimate the server clock
 * (see TimeSync) and compute the expected position locally.
 */
import type { QueueItem } from './queue';
import type { Palette } from './palette';
import type { Member } from './room';

/** The track currently playing in a room (server-authoritative). */
export interface PlaybackCurrent {
  /** YouTube video id. */
  videoId: string;
  /** Track title. */
  title: string;
  /** Track author / channel ("artist"). */
  artist: string;
  /** Server-clock ms that corresponds to playback position 0 seconds. */
  startedAtServerMs: number;
  /** When paused, the frozen position in seconds; null while playing. */
  pausedAtSec: number | null;
  /** Colors extracted from the track thumbnail. */
  palette: Palette;
  /** Display name of whoever added the track. */
  addedBy: string;
}

/** Full room state, sent on join and whenever the queue/listeners change. */
export interface RoomSnapshot {
  id: string;
  name: string;
  /** Listener count (= members.length). */
  listeners: number;
  /** Connected members, shown as icon avatars. */
  members: Member[];
  queue: QueueItem[];
  current: PlaybackCurrent | null;
}

/** What changed, used for activity toasts ("Minh skipped to 2:14"). */
export type PlaybackAction = 'play' | 'pause' | 'seek' | 'next' | 'add';

/** Broadcast on every playback change (server → clients). */
export interface PlaybackSyncPayload {
  current: PlaybackCurrent | null;
  /** Server clock at broadcast time (ms). */
  serverNowMs: number;
  /** Display name of whoever triggered the change, or null. */
  actorName: string | null;
  /** Which action triggered the change, or null. */
  action: PlaybackAction | null;
  /** Position (seconds) relevant to the action, for toast copy. */
  actionPositionSec: number | null;
}

/** queue:add payload (client → server). */
export interface QueueAddPayload {
  /** Raw YouTube URL or id; validated server-side. */
  input: string;
}

/** playback:seek payload (client → server). */
export interface PlaybackSeekPayload {
  positionSec: number;
}

/** room:join payload (client → server). */
export interface RoomJoinPayload {
  roomId: string;
  /** Display name of the joining member. */
  name: string;
  /** Avatar color (hex). */
  color: string;
  /** Optional avatar emoji. */
  emoji?: string;
}

/** chat:send payload (client → server). */
export interface ChatSendPayload {
  text: string;
}

/** reaction:send payload (client → server). */
export interface ReactionSendPayload {
  kind: string;
}

/** Drift (seconds) beyond which the client silently re-seeks to the server position. */
export const DRIFT_RESYNC_THRESHOLD_SEC = 1.5;
