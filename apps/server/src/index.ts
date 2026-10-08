import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Server } from 'socket.io';
import {
  SocketEvents,
  parseYouTubeId,
  type PlaybackAction,
  type PlaybackSeekPayload,
  type QueueAddPayload,
  type RoomJoinPayload,
} from '@ember/shared';
import { serverConfig } from './config';
import {
  addListener,
  createRoom,
  enqueue,
  getRoom,
  makeQueueItem,
  next,
  pause,
  play,
  removeListener,
  reportEnded,
  seek,
  toSnapshot,
  toSyncPayload,
} from './rooms';

// --- HTTP server (health, room creation) ----------------------------------

function setCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', serverConfig.clientOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  setCors(res);

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
  cors: { origin: serverConfig.clientOrigin, methods: ['GET', 'POST'] },
});

interface Session {
  roomId: string;
  name: string;
}
const sessions = new Map<string, Session>();

// In e2e mode we skip the oEmbed network call so tests stay fast and hermetic.
const E2E = process.env.E2E_STUB_PLAYER === '1';

/** Best-effort YouTube title via oEmbed; falls back to the video id. */
async function fetchTitle(videoId: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: controller.signal },
    );
    if (!res.ok) return videoId;
    const data = (await res.json()) as { title?: unknown };
    return typeof data.title === 'string' ? data.title : videoId;
  } catch {
    return videoId;
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
    socket.join(room.id);
    addListener(room, socket.id);
    sessions.set(socket.id, { roomId: room.id, name: payload.name || 'Guest' });
    emitRoomState(room.id);
  });

  socket.on(SocketEvents.QueueAdd, async (payload: QueueAddPayload) => {
    const session = sessions.get(socket.id);
    if (!session) return;
    const room = getRoom(session.roomId);
    if (!room) return;
    const videoId = parseYouTubeId(payload.input);
    if (!videoId) return;
    const startedEmpty = room.current === null;
    const title = E2E ? videoId : await fetchTitle(videoId);
    enqueue(room, makeQueueItem(videoId, title, session.name));
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
        removeListener(room, socket.id);
        emitRoomState(session.roomId);
      }
      sessions.delete(socket.id);
    }
  });
});

httpServer.listen(serverConfig.port, () => {
  console.log(`Ember server listening on http://localhost:${serverConfig.port}`);
});
