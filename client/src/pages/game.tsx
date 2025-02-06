import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GameBoard } from '@/components/game-board';
import { GameControls } from '@/components/game-controls';
import { ConnectionStatus } from '@/components/connection-status';
import { useGameStore } from '@/lib/websocket';

export default function Game() {
  const { connect, gameState, currentPlayer } = useGameStore();

  useEffect(() => {
    connect();
  }, []);

  const getGameStatus = () => {
    if (gameState?.winner) {
      return gameState.winner === currentPlayer ? 
        "🎉 You Won!" : "Game Over - You Lost";
    }

    if (gameState?.board.every(cell => cell !== null)) {
      return "Game Draw!";
    }

    return gameState?.currentTurn === currentPlayer ? 
      "🎮 Your Turn" : "Waiting for opponent...";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <ConnectionStatus />

      <h1 className="welcome-text mb-8">
        Tic Tac Toe Ultimate
      </h1>

      <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
        <CardContent className="flex flex-col items-center py-6">
          {gameState ? (
            <>
              <p className={`text-lg mb-6 font-semibold ${
                gameState.currentTurn === currentPlayer ? 
                'text-blue-400 animate-pulse' : 
                'text-gray-400'
              }`}>
                {getGameStatus()}
              </p>
              <GameBoard />
              <GameControls />
            </>
          ) : (
            <div className="animate-pulse text-gray-400">
              Loading game...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}