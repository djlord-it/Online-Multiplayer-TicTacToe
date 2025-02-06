import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, GameMessage } from '@shared/schema';

export class GameManager {
  private games: Map<string, GameState>;
  private connections: Map<string, Map<Player, WebSocket>>;

  constructor() {
    this.games = new Map();
    this.connections = new Map();
  }

  createGame(): string {
    const id = uuidv4().slice(0, 8); // Shorter game ID
    this.games.set(id, {
      id,
      board: Array(9).fill(null),
      currentTurn: Player.X,
      winner: null,
      players: [],
      hostPlayer: Player.X // X is always the host when creating a new game
    });
    this.connections.set(id, new Map());
    return id;
  }

  joinGame(gameId: string, ws: WebSocket): Player | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    const connections = this.connections.get(gameId)!;
    let assignedPlayer: Player | null = null;

    if (!connections.has(Player.X)) {
      connections.set(Player.X, ws);
      assignedPlayer = Player.X;
      game.players.push(Player.X);
      game.hostPlayer = Player.X; // First player is the host
    } else if (!connections.has(Player.O)) {
      connections.set(Player.O, ws);
      assignedPlayer = Player.O;
      game.players.push(Player.O);
    }

    return assignedPlayer;
  }

  getCurrentPlayer(gameId: string, ws: WebSocket): Player | null {
    const connections = this.connections.get(gameId);
    if (!connections) return null;

    for (const [player, connection] of connections) {
      if (connection === ws) {
        return player;
      }
    }
    return null;
  }

  makeMove(gameId: string, position: number, player: Player): boolean {
    const game = this.games.get(gameId);
    if (!game || game.currentTurn !== player || game.winner) return false;

    if (position < 0 || position >= 9 || game.board[position]) return false;

    game.board[position] = player;
    this.checkWinner(game);
    game.currentTurn = player === Player.X ? Player.O : Player.X;
    return true;
  }

  broadcastGameState(gameId: string) {
    const game = this.games.get(gameId);
    const connections = this.connections.get(gameId);
    if (!game || !connections) return;

    connections.forEach((ws, player) => {
      if (ws.readyState === WebSocket.OPEN) {
        const message: GameMessage = {
          type: 'Update',
          game,
          player
        };
        ws.send(JSON.stringify(message));
      }
    });
  }

  private checkWinner(game: GameState) {
    const winningCombos = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];

    for (const combo of winningCombos) {
      const [a,b,c] = combo;
      if (game.board[a] && 
          game.board[a] === game.board[b] && 
          game.board[b] === game.board[c]) {
        game.winner = game.board[a];
        return;
      }
    }

    if (game.board.every(cell => cell !== null)) {
      game.winner = null; // Draw
    }
  }

  handleDisconnect(gameId: string, ws: WebSocket) {
    const connections = this.connections.get(gameId);
    if (!connections) return;

    connections.forEach((conn, player) => {
      if (conn === ws) {
        connections.delete(player);
      }
    });
  }
}

export const gameManager = new GameManager();