import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Server } from 'socket.io';
import { SocketEvents } from '@ember/shared';
import { serverConfig } from './config';

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  // Minimal CORS for the configured web origin.
  res.setHeader('Access-Control-Allow-Origin', serverConfig.clientOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

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

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('not found');
});

const io = new Server(httpServer, {
  cors: {
    origin: serverConfig.clientOrigin,
    methods: ['GET', 'POST'],
  },
});

io.on(SocketEvents.Connection, (socket) => {
  // Rooms, queue, and playback sync are not implemented yet (skeleton).
  socket.on(SocketEvents.Disconnect, () => {
    // Placeholder: cleanup room membership here later.
  });
});

httpServer.listen(serverConfig.port, () => {
  console.log(`Ember server listening on http://localhost:${serverConfig.port}`);
});
