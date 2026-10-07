/**
 * Socket.io event names shared by the Ember web client and server.
 *
 * This is the single source of truth for event names — both sides import from
 * here so a typo can never desynchronise the client and server. Skeleton only;
 * payload types are added alongside each feature.
 */
export const SocketEvents = {
  /** Built-in Socket.io connection lifecycle events. */
  Connection: 'connection',
  Disconnect: 'disconnect',

  /** Room membership. */
  Join: 'join',
  Leave: 'leave',
  RoomJoin: 'room:join',
  RoomLeave: 'room:leave',
  RoomState: 'room:state',

  /** Seating (server-authoritative). */
  SeatAssign: 'seat:assign',

  /** Social interactions. */
  Chat: 'chat',
  Throw: 'throw',
  Emote: 'emote',

  /** Queue & playback sync. */
  QueueAdd: 'queue:add',
  QueueUpdate: 'queue:update',
  PlaybackSync: 'playback:sync',
} as const;

/** Union of every Socket.io event name declared above. */
export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
