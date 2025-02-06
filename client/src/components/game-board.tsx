import { useGameStore } from '@/lib/websocket';
import { Player } from '@shared/schema';
import { motion } from 'framer-motion';

export function GameBoard() {
  const { gameState, currentPlayer, makeMove } = useGameStore();

  if (!gameState) return null;

  const handleCellClick = (index: number) => {
    if (!gameState.board[index] && gameState.currentTurn === currentPlayer && !gameState.winner) {
      makeMove(index);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 bg-gray-900/50 p-4 rounded-lg shadow-lg">
      {gameState.board.map((cell, index) => (
        <motion.button
          key={index}
          className={`
            w-24 h-24 flex items-center justify-center text-4xl font-bold
            rounded bg-gray-800/50 border border-gray-700
            ${!cell && gameState.currentTurn === currentPlayer ? 'hover:bg-gray-700/50 hover:border-blue-500 cursor-pointer' : ''}
            ${cell ? 'cursor-not-allowed' : ''}
          `}
          whileTap={{ scale: cell ? 1 : 0.95 }}
          onClick={() => handleCellClick(index)}
        >
          {cell && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cell === Player.X ? 'text-blue-400' : 'text-purple-400'}
            >
              {cell}
            </motion.span>
          )}
        </motion.button>
      ))}
    </div>
  );
}