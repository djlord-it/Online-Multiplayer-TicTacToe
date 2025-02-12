import { HandlerEvent } from "@netlify/functions";
import { GameState, GameMessage, Player } from '../../shared/schema';

// Déclarer le type correct pour le contexte WebSocket de Netlify
interface WebSocketContext {
  websocket: {
    send: (message: string) => void;
    connectionId: string;
  };
}

const games = new Map<string, GameState>();
const connections = new Map<string, WebSocketContext['websocket']>();
const playerGames = new Map<string, string>();

export const handler = async (event: HandlerEvent, context: WebSocketContext) => {
  // Gérer la déconnexion
  if (event.requestContext?.eventType === 'DISCONNECT') {
    const connectionId = event.requestContext.connectionId;
    handleDisconnection(connectionId);
    return { statusCode: 200 };
  }

  if (!context.websocket) {
    return {
      statusCode: 400,
      body: 'Cette fonction nécessite une connexion WebSocket',
    };
  }

  const { connectionId } = context.websocket;

  // Nouvelle connexion
  if (event.body === null) {
    console.log('Nouvelle connexion WebSocket:', connectionId);
    connections.set(connectionId, context.websocket);
    return { statusCode: 200 };
  }

  try {
    const message = JSON.parse(event.body) as GameMessage;
    console.log('Message reçu:', message);
    
    switch (message.type) {
      case 'Join':
        handleJoin(connectionId, message.game_id);
        break;
      case 'Move':
        handleMove(connectionId, message.position);
        break;
      case 'RequestReplay':
        handleReplayRequest(connectionId);
        break;
      case 'AcceptReplay':
        handleReplayAccept(connectionId);
        break;
    }

    return { statusCode: 200 };
  } catch (error) {
    console.error('Erreur lors du traitement du message:', error);
    const ws = connections.get(connectionId);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'Error',
        message: 'Message invalide'
      }));
    }
    return { statusCode: 400, body: 'Message invalide' };
  }
};

function handleDisconnection(connectionId: string) {
  const gameId = playerGames.get(connectionId);
  if (gameId) {
    const game = games.get(gameId);
    if (game) {
      if (game.player1?.id === connectionId) game.player1.connected = false;
      if (game.player2?.id === connectionId) game.player2.connected = false;
      broadcastGameState(gameId);
    }
  }
  connections.delete(connectionId);
  playerGames.delete(connectionId);
}

function handleJoin(connectionId: string, gameId: string = '') {
  let targetGameId = gameId;
  
  if (!targetGameId) {
    targetGameId = Math.random().toString(36).substring(2, 8);
    games.set(targetGameId, {
      id: targetGameId,
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      player1: { id: connectionId, symbol: 'X', connected: true },
      status: 'waiting'
    });
  } else {
    const game = games.get(targetGameId);
    if (game && !game.player2) {
      game.player2 = { id: connectionId, symbol: 'O', connected: true };
      game.status = 'playing';
    }
  }

  playerGames.set(connectionId, targetGameId);
  broadcastGameState(targetGameId);
}

function handleMove(connectionId: string, position: number) {
  const gameId = playerGames.get(connectionId);
  if (!gameId) return;

  const game = games.get(gameId);
  if (!game || game.winner || game.board[position] !== null) return;

  const player = game.player1?.id === connectionId ? game.player1 : game.player2;
  if (!player || game.currentPlayer !== player.symbol) return;

  game.board[position] = player.symbol;
  game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
  
  const winner = checkWinner(game.board);
  if (winner) {
    game.winner = winner;
    game.status = 'finished';
  } else if (!game.board.includes(null)) {
    game.status = 'draw';
  }

  broadcastGameState(gameId);
}

function handleReplayRequest(connectionId: string) {
  const gameId = playerGames.get(connectionId);
  if (!gameId) return;

  const game = games.get(gameId);
  if (!game) return;

  game.replayRequested = true;
  broadcastGameState(gameId);
}

function handleReplayAccept(connectionId: string) {
  const gameId = playerGames.get(connectionId);
  if (!gameId) return;

  const game = games.get(gameId);
  if (!game) return;

  game.board = Array(9).fill(null);
  game.currentPlayer = 'X';
  game.winner = null;
  game.status = 'playing';
  game.replayRequested = false;

  broadcastGameState(gameId);
}

function broadcastGameState(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  [game.player1, game.player2].forEach(player => {
    if (player) {
      const ws = connections.get(player.id);
      if (ws) {
        try {
          const message: GameMessage = {
            type: 'Update',
            game,
            player
          };
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Erreur lors de l\'envoi du message:', error);
        }
      }
    }
  });
}

function checkWinner(board: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // lignes
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonnes
    [0, 4, 8], [2, 4, 6] // diagonales
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
} 