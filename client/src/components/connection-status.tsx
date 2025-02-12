import { useGameStore } from '@/lib/websocket';

export function ConnectionStatus() {
  const { connectionStatus } = useGameStore();

  if (connectionStatus === 'connected') return null;

  return (
    <div className={`
      fixed top-4 right-4 p-3 rounded-lg shadow-lg
      ${connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'}
      text-white font-medium
    `}>
      {connectionStatus === 'disconnected' ? (
        'Déconnecté du serveur'
      ) : (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
          Tentative de reconnexion...
        </div>
      )}
    </div>
  );
}
