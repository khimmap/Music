import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Server } from 'socket.io';
import {
  SocketEvents,
  parseYouTubeId,
  type ChatMessage,
  type ChatSendPayload,
  type PlaybackAction,
  type PlaybackSeekPayload,
  type QueueAddPayload,
  type ReactionSendPayload,
  type RoomJoinPayload,
} from '@ember/shared';
import { serverConfig } from './config';
import { getPalette } from './palette';
import {
  addMember,
  createRoom,
  enqueue,
  getRoom,
  makeQueueItem,
  next,
  pause,
  play,
  removeMember,
  reportEnded,
  seek,
  toSnapshot,
  toSyncPayload,
} from './rooms';

// --- HTTP server (health, room creation) ----------------------------------

function setCors(req: IncomingMessage, res: ServerResponse): void {
  // Reflect the request origin so the app works both locally and when shared
  // via a forwarded port / tunnel (falls back to the configured client origin).
  const origin = req.headers.origin ?? serverConfig.clientOrigin;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('ok');
    return;
  }

  if (req.method === 'POST' && req.url === '/rooms') {
    const room = createRoom();
    sendJson(res, 201, { id: room.id, name: room.name });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('not found');
});

// --- Socket.io (realtime room + playback sync) -----------------------------

const io = new Server(httpServer, {
  // Reflect the request origin so the app works both directly and behind a
  // same-origin proxy / forwarded port.
  cors: { origin: true, methods: ['GET', 'POST'] },
});

interface Session {
  roomId: string;
  name: string;
}
const sessions = new Map<string, Session>();

// In e2e mode we skip the oEmbed network call so tests stay fast and hermetic.
const E2E = process.env.E2E_STUB_PLAYER === '1';

interface TrackMeta {
  title: string;
  artist: string;
}

/** Best-effort YouTube title + author via oEmbed; falls back to the video id. */
async function fetchMeta(videoId: string): Promise<TrackMeta> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: controller.signal },
    );
    if (!res.ok) return { title: videoId, artist: '' };
    const data = (await res.json()) as { title?: unknown; author_name?: unknown };
    return {
      title: typeof data.title === 'string' ? data.title : videoId,
      artist: typeof data.author_name === 'string' ? data.author_name : '',
    };
  } catch {
    return { title: videoId, artist: '' };
  } finally {
    clearTimeout(timer);
  }
}

io.on(SocketEvents.Connection, (socket) => {
  const emitRoomState = (roomId: string): void => {
    const room = getRoom(roomId);
    if (room) io.to(roomId).emit(SocketEvents.RoomState, toSnapshot(room));
  };

  const emitSync = (
    roomId: string,
    action: PlaybackAction | null,
    actionPositionSec: number | null,
  ): void => {
    const room = getRoom(roomId);
    const session = sessions.get(socket.id);
    if (room) {
      io.to(roomId).emit(
        SocketEvents.PlaybackSync,
        toSyncPayload(room, session?.name ?? null, action, actionPositionSec),
      );
    }
  };

  // Clock-offset estimation via ack callback.
  socket.on(SocketEvents.TimeSync, (_clientSentMs: number, ack: (serverNowMs: number) => void) => {
    if (typeof ack === 'function') ack(Date.now());
  });

  socket.on(SocketEvents.RoomJoin, (payload: RoomJoinPayload) => {
    const room = getRoom(payload.roomId);
    if (!room) return;
    const name = payload.name || 'Guest';
    socket.join(room.id);
    addMember(room, {
      id: socket.id,
      name,
      color: payload.color || '#f4915b',
      emoji: payload.emoji,
    });
    sessions.set(socket.id, { roomId: room.id, name });
    emitRoomState(room.id);
  });

  socket.on(SocketEvents.ChatSend, (payload: ChatSendPayload) => {
    const session = sessions.get(socket.id);
    if (!session) return;
    const text = String(payload?.text ?? '').slice(0, 500).trim();
    if (!text) return;
    const message: ChatMessage = { from: socket.id, name: session.name, text, at: Date.now() };
    io.to(session.roomId).emit(SocketEvents.ChatSend, message);
  });

  socket.on(SocketEvents.Reaction, (payload: ReactionSendPayload) => {
    const session = sessions.get(socket.id);
    if (!session) return;
    io.to(session.roomId).emit(SocketEvents.Reaction, {
      from: socket.id,
      kind: String(payload?.kind ?? ''),
      at: Date.now(),
    });
  });

  socket.on(SocketEvents.QueueAdd, async (payload: QueueAddPayload) => {
    const session = sessions.get(socket.id);
    if (!session) return;
    const room = getRoom(session.roomId);
    if (!room) return;
    const videoId = parseYouTubeId(payload.input);
    if (!videoId) return;
    const startedEmpty = room.current === null;
    const [meta, palette] = await Promise.all([
      E2E ? Promise.resolve({ title: videoId, artist: '' }) : fetchMeta(videoId),
      getPalette(videoId),
    ]);
    enqueue(room, makeQueueItem(videoId, meta.title, meta.artist, session.name, palette));
    emitRoomState(room.id);
    if (startedEmpty && room.current) emitSync(room.id, 'add', null);
  });

  socket.on(SocketEvents.PlaybackPlay, () => {
    const session = sessions.get(socket.id);
    const room = session && getRoom(session.roomId);
    if (!room) return;
    play(room);
    emitSync(room.id, 'play', null);
  });

  socket.on(SocketEvents.PlaybackPause, () => {
    const session = sessions.get(socket.id);
    const room = session && getRoom(session.roomId);
    if (!room) return;
    pause(room);
    emitSync(room.id, 'pause', room.current?.pausedAtSec ?? null);
  });

  socket.on(SocketEvents.PlaybackSeek, (payload: PlaybackSeekPayload) => {
    const session = sessions.get(socket.id);
    const room = session && getRoom(session.roomId);
    if (!room) return;
    seek(room, payload.positionSec);
    emitSync(room.id, 'seek', payload.positionSec);
  });

  socket.on(SocketEvents.PlaybackNext, () => {
    const session = sessions.get(socket.id);
    const room = session && getRoom(session.roomId);
    if (!room) return;
    next(room);
    emitRoomState(room.id);
    emitSync(room.id, 'next', null);
  });

  socket.on(SocketEvents.PlaybackEnded, (payload: { videoId: string }) => {
    const session = sessions.get(socket.id);
    const room = session && getRoom(session.roomId);
    if (!room) return;
    if (reportEnded(room, payload.videoId)) {
      emitRoomState(room.id);
      emitSync(room.id, 'next', null);
    }
  });

  socket.on(SocketEvents.Disconnect, () => {
    const session = sessions.get(socket.id);
    if (session) {
      const room = getRoom(session.roomId);
      if (room) {
        removeMember(room, socket.id);
        emitRoomState(session.roomId);
      }
      sessions.delete(socket.id);
    }
  });
});

httpServer.listen(serverConfig.port, () => {
  console.log(`Ember server listening on http://localhost:${serverConfig.port}`);
});
