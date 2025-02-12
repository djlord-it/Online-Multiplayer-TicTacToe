import { HandlerEvent, HandlerContext } from "@netlify/functions";
import { GameState, GameMessage, Player } from '@shared/schema';
import { WebSocketManager } from '../../server/game_manager';

const wsManager = new WebSocketManager();

export const handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.headers.upgrade !== 'websocket') {
    return {
      statusCode: 400,
      body: 'Cette fonction ne gère que les connexions WebSocket',
    };
  }

  const { connectionId, disconnect } = context.websocket;

  if (event.body === null) {
    // Nouvelle connexion
    console.log('Nouvelle connexion WebSocket:', connectionId);
    wsManager.handleConnection(connectionId, context.websocket);
    return { statusCode: 200 };
  }

  try {
    const message = JSON.parse(event.body) as GameMessage;
    wsManager.handleMessage(connectionId, message);
    return { statusCode: 200 };
  } catch (error) {
    console.error('Erreur lors du traitement du message:', error);
    return { statusCode: 400, body: 'Message invalide' };
  }
}; 