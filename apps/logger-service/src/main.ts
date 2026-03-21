import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { consumeKafkaMessages } from './logger-consumer';

const port = process.env.PORT ? Number(process.env.PORT) : 6008;

const app = express();
app.get('/', (req, res) => {
  res.send({ message: 'Hello Logger API' });
});

const wsServer = new WebSocketServer({ noServer: true });

export const clients = new Set<WebSocket>();

wsServer.on('connection', (ws) => {
  console.log('New logger client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('Logger client disconnected');
    clients.delete(ws);
  });
});

const server = http.createServer(app);

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit('connection', ws, request);
  });
});

server.listen(process.env.PORT || 6008, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

// START KAFKA CONSUMER
consumeKafkaMessages();
