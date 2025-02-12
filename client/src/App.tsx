import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Game from "@/pages/game";
import NotFound from "@/pages/not-found";
import { useEffect } from 'react';
import { useGameStore } from '@/lib/websocket';
import { GameBoard } from '@/components/game-board';
import { ConnectionStatus } from '@/components/connection-status';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Game} />
      <Route path="/game/:id" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { connect, gameState, connectionStatus } = useGameStore();

  useEffect(() => {
    connect();
  }, [connect]);

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <ConnectionStatus />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Impossible de se connecter au serveur</h1>
          <p className="text-gray-400">Veuillez vérifier votre connexion internet et réessayer.</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <ConnectionStatus />
        <div className="animate-pulse text-gray-400">Chargement du jeu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <ConnectionStatus />
      <GameBoard />
      {gameState.status === 'waiting' && (
        <div className="mt-4 text-gray-400">
          En attente d'un autre joueur...
          <div className="mt-2 text-sm">
            Partagez ce lien pour inviter un ami : 
            <br />
            <code className="bg-gray-800 px-2 py-1 rounded">
              {window.location.href}
            </code>
          </div>
        </div>
      )}
      {gameState.status === 'finished' && (
        <div className="mt-4 text-xl font-bold">
          {gameState.winner ? `${gameState.winner} a gagné !` : 'Match nul !'}
        </div>
      )}
    </div>
  );
}

export default App;
