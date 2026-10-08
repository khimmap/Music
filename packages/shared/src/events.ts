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

  /** Chat. */
  ChatSend: 'chat:send',

  /** Reactions. */
  Reaction: 'reaction:send',

  /** Typing indicator. */
  ChatTyping: 'chat:typing',

  /** Live cursors (client -> server {x,y}; server -> clients {id,x,y}). */
  CursorMove: 'cursor:move',

  /** Throw a prop at a listener (server validates cooldown + opt-out). */
  InteractionThrow: 'interaction:throw',

  /** Opt out of being targeted by throws. */
  MemberOptOut: 'member:optout',

  /** Skip-vote (client -> server); server broadcasts VoteState. */
  VoteSkip: 'vote:skip',
  VoteState: 'vote:state',

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
