import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { WebSocketManager } from './game_manager';
import { GameMessage } from '@shared/schema';

const wsManager = new WebSocketManager();

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    const connectionId = Math.random().toString(36).substring(2);
    wsManager.handleConnection(connectionId, ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as GameMessage;
        wsManager.handleMessage(connectionId, message);
      } catch (err) {
        console.error('WebSocket message error:', err);
        ws.send(JSON.stringify({
          type: 'Error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      wsManager.handleDisconnection(connectionId);
    });
  });

  return httpServer;
}
