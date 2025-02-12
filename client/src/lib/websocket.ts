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
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  currentPlayer: null,
  connectionStatus: 'disconnected',

  connect: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl;
    
    if (import.meta.env.PROD) {
      wsUrl = `${protocol}//${window.location.host}/.netlify/functions/websocket`;
    } else {
      const host = window.location.hostname + ':8000';
      wsUrl = `${protocol}//${host}/ws`;
    }

    console.log('Tentative de connexion à:', wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connecté');
      set({ socket, connectionStatus: 'connected' });
      reconnectAttempts = 0;
      const gameId = new URLSearchParams(window.location.search).get('g');
      socket.send(JSON.stringify({ type: 'Join', game_id: gameId || '' }));
    };

    socket.onclose = () => {
      console.log('WebSocket déconnecté');
      set({ connectionStatus: 'disconnected' });
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          console.log(`Tentative de reconnexion ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
          set({ connectionStatus: 'reconnecting' });
          reconnectAttempts++;
          get().connect();
        }, RECONNECT_DELAY);
      } else {
        console.error('Nombre maximum de tentatives de reconnexion atteint');
      }
    };

    socket.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as GameMessage;
        console.log('Message reçu:', message);

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
      } catch (error) {
        console.error('Erreur lors du traitement du message:', error);
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