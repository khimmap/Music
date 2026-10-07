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

  /** Room lifecycle (not implemented yet). */
  RoomJoin: 'room:join',
  RoomLeave: 'room:leave',
  RoomState: 'room:state',

  /** Queue & playback sync (not implemented yet). */
  QueueAdd: 'queue:add',
  QueueUpdate: 'queue:update',
  PlaybackSync: 'playback:sync',
} as const;

/** Union of every Socket.io event name declared above. */
export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
