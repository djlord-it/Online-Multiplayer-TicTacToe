import { create } from 'zustand';
import { GameState, GameMessage, Player } from '@shared/schema';

interface GameStore {
  socket: WebSocket | null;
  gameState: GameState | null;
  currentPlayer: Player | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  connect: () => void;
  makeMove: (position: number) => void;
  resetGame: () => void;
  requestReplay: () => void;
  acceptReplay: () => void;
}

const RECONNECT_DELAY = 2000;

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  currentPlayer: null,
  connectionStatus: 'disconnected',

  connect: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl;
    
    if (import.meta.env.PROD) {
      // En production, utiliser le même hôte que l'application
      wsUrl = `${protocol}//${window.location.host}/ws`;
    } else {
      // En développement, utiliser le port 8000
      const host = window.location.hostname + ':8000';
      wsUrl = `${protocol}//${host}/ws`;
    }

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      set({ socket, connectionStatus: 'connected' });
      const gameId = new URLSearchParams(window.location.search).get('g');
      socket.send(JSON.stringify({ type: 'Join', game_id: gameId || '' }));
    };

    socket.onclose = () => {
      set({ connectionStatus: 'disconnected' });
      setTimeout(() => {
        set({ connectionStatus: 'reconnecting' });
        get().connect();
      }, RECONNECT_DELAY);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as GameMessage;

      switch (message.type) {
        case 'Update':
          set({ 
            gameState: message.game,
            currentPlayer: message.player
          });
          break;

        case 'Error':
          console.error('Game error:', message.message);
          break;

        case 'ConnectionStatus':
          set({ connectionStatus: message.status });
          break;
      }
    };

    set({ socket });
  },

  makeMove: (position: number) => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'Move',
        position
      }));
    }
  },

  resetGame: () => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'Join',
        game_id: ''
      }));
    }
  },

  requestReplay: () => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'RequestReplay'
      }));
    }
  },

  acceptReplay: () => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'AcceptReplay'
      }));
    }
  }
}));