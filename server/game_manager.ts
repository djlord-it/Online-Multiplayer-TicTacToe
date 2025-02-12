import { WebSocket } from 'ws';
import { GameState, GameMessage, Player } from '@shared/schema';

export class WebSocketManager {
  private connections: Map<string, any> = new Map();
  private games: Map<string, GameState> = new Map();
  private playerGames: Map<string, string> = new Map();

  handleConnection(connectionId: string, ws: any) {
    this.connections.set(connectionId, ws);
  }

  handleDisconnection(connectionId: string) {
    const gameId = this.playerGames.get(connectionId);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        // Marquer le joueur comme déconnecté
        if (game.player1?.id === connectionId) game.player1.connected = false;
        if (game.player2?.id === connectionId) game.player2.connected = false;
        this.broadcastGameState(gameId);
      }
    }
    this.connections.delete(connectionId);
    this.playerGames.delete(connectionId);
  }

  handleMessage(connectionId: string, message: GameMessage) {
    switch (message.type) {
      case 'Join':
        this.handleJoin(connectionId, message.game_id);
        break;
      case 'Move':
        this.handleMove(connectionId, message.position);
        break;
      case 'RequestReplay':
        this.handleReplayRequest(connectionId);
        break;
      case 'AcceptReplay':
        this.handleReplayAccept(connectionId);
        break;
    }
  }

  private handleJoin(connectionId: string, gameId: string = '') {
    let targetGameId = gameId;
    
    if (!targetGameId) {
      // Créer une nouvelle partie
      targetGameId = Math.random().toString(36).substring(2, 8);
      this.games.set(targetGameId, {
        id: targetGameId,
        board: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null,
        player1: { id: connectionId, symbol: 'X', connected: true },
        status: 'waiting'
      });
    } else {
      // Rejoindre une partie existante
      const game = this.games.get(targetGameId);
      if (game && !game.player2) {
        game.player2 = { id: connectionId, symbol: 'O', connected: true };
        game.status = 'playing';
      }
    }

    this.playerGames.set(connectionId, targetGameId);
    this.broadcastGameState(targetGameId);
  }

  private handleMove(connectionId: string, position: number) {
    const gameId = this.playerGames.get(connectionId);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game || game.winner || game.board[position] !== null) return;

    const player = game.player1?.id === connectionId ? game.player1 : game.player2;
    if (!player || game.currentPlayer !== player.symbol) return;

    game.board[position] = player.symbol;
    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
    
    // Vérifier s'il y a un gagnant
    const winner = this.checkWinner(game.board);
    if (winner) {
      game.winner = winner;
      game.status = 'finished';
    } else if (!game.board.includes(null)) {
      game.status = 'draw';
    }

    this.broadcastGameState(gameId);
  }

  private handleReplayRequest(connectionId: string) {
    const gameId = this.playerGames.get(connectionId);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.replayRequested = true;
    this.broadcastGameState(gameId);
  }

  private handleReplayAccept(connectionId: string) {
    const gameId = this.playerGames.get(connectionId);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.board = Array(9).fill(null);
    game.currentPlayer = 'X';
    game.winner = null;
    game.status = 'playing';
    game.replayRequested = false;

    this.broadcastGameState(gameId);
  }

  private broadcastGameState(gameId: string) {
    const game = this.games.get(gameId);
    if (!game) return;

    [game.player1, game.player2].forEach(player => {
      if (player) {
        const ws = this.connections.get(player.id);
        if (ws) {
          const message: GameMessage = {
            type: 'Update',
            game,
            player
          };
          ws.send(JSON.stringify(message));
        }
      }
    });
  }

  private checkWinner(board: (string | null)[]): string | null {
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
}