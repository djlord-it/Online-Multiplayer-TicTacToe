import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { gameManager } from './game_manager';
import { GameMessage } from '@shared/schema';

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let currentGameId: string | null = null;

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as GameMessage;

        switch (message.type) {
          case 'Join': {
            currentGameId = message.game_id || gameManager.createGame();
            const player = gameManager.joinGame(currentGameId, ws);
            
            if (player) {
              ws.send(JSON.stringify({ 
                type: 'ConnectionStatus', 
                status: 'connected' 
              }));
              gameManager.broadcastGameState(currentGameId);
            } else {
              ws.send(JSON.stringify({
                type: 'Error',
                message: 'Game is full or invalid'
              }));
            }
            break;
          }

          case 'Move': {
            if (!currentGameId) {
              ws.send(JSON.stringify({
                type: 'Error',
                message: 'Not in a game'
              }));
              return;
            }

            const moveResult = gameManager.makeMove(
              currentGameId, 
              message.position,
              gameManager.getCurrentPlayer(currentGameId, ws)
            );

            if (moveResult) {
              gameManager.broadcastGameState(currentGameId);
            } else {
              ws.send(JSON.stringify({
                type: 'Error',
                message: 'Invalid move'
              }));
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
        ws.send(JSON.stringify({
          type: 'Error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      if (currentGameId) {
        gameManager.handleDisconnect(currentGameId, ws);
        gameManager.broadcastGameState(currentGameId);
      }
    });
  });

  return httpServer;
}
