import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/websocket';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function GameControls() {
  const { gameState, currentPlayer, resetGame } = useGameStore();
  const { toast } = useToast();

  const copyGameLink = () => {
    // Only allow host player to share the link
    if (gameState?.hostPlayer !== currentPlayer) {
      toast({
        description: "Only the game creator can share the invite link.",
        duration: 3000,
        variant: "destructive"
      });
      return;
    }

    const url = `${window.location.origin}?g=${gameState?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        description: "Game invite link copied!",
        duration: 2000
      });
    });
  };

  return (
    <div className="flex gap-4 mt-6">
      <Button
        variant="outline"
        onClick={resetGame}
      >
        New Game
      </Button>

      {gameState?.id && (
        <Button
          variant="secondary"
          onClick={copyGameLink}
          disabled={gameState.hostPlayer !== currentPlayer}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Game
        </Button>
      )}
    </div>
  );
}