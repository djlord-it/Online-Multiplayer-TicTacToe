import { useGameStore } from '@/lib/websocket';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const connectionStatus = useGameStore(state => state.connectionStatus);
  
  return (
    <div className={cn(
      "fixed top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors",
      connectionStatus === 'connected' ? 'bg-green-500/10 text-green-500' :
      connectionStatus === 'reconnecting' ? 'bg-yellow-500/10 text-yellow-500' :
      'bg-red-500/10 text-red-500'
    )}>
      {connectionStatus === 'connected' ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Connected</span>
        </>
      ) : connectionStatus === 'reconnecting' ? (
        <>
          <Wifi className="w-4 h-4 animate-pulse" />
          <span>Reconnecting...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Disconnected</span>
        </>
      )}
    </div>
  );
}
