/**
 * Socket.io event names shared by the Ember web client and server.
 *
 * Single source of truth: both sides import these so a typo can never
 * desynchronise client and server. One naming convention only —
 * `namespace:action` (the Socket.io built-in `connection`/`disconnect`
 * lifecycle events are the sole exception, since their names are fixed).
 */
export const SocketEvents = {
  /** Socket.io built-in lifecycle (names fixed by the library). */
  Connection: 'connection',
  Disconnect: 'disconnect',

  /** Room membership. */
  RoomJoin: 'room:join',
  RoomLeave: 'room:leave',
  RoomState: 'room:state',

  /** Seating (server-authoritative). */
  SeatAssign: 'seat:assign',

  /** Chat. */
  ChatSend: 'chat:send',

  /** Playful interactions. */
  InteractionThrow: 'interaction:throw',
  InteractionEmote: 'interaction:emote',

  /** Queue. */
  QueueAdd: 'queue:add',

  /** Playback control (client → server) and sync (server → clients). */
  PlaybackPlay: 'playback:play',
  PlaybackPause: 'playback:pause',
  PlaybackSeek: 'playback:seek',
  PlaybackNext: 'playback:next',
  PlaybackEnded: 'playback:ended',
  PlaybackSync: 'playback:sync',

  /** Clock-offset estimation (used with a Socket.io ack callback). */
  TimeSync: 'time:sync',
} as const;

/** Union of every Socket.io event name declared above. */
export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
