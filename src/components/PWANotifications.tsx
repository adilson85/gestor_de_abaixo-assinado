import React from 'react';
import { Download, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const PWANotifications: React.FC = () => {
  const { 
    isInstallable, 
    isInstalled, 
    isOnline, 
    updateAvailable, 
    installApp, 
    updateApp 
  } = usePWA();

  // Não mostrar nada se estiver instalado e não há atualizações
  if (isInstalled && !updateAvailable && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Notificação de instalação */}
      {isInstallable && !isInstalled && (
        <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
          <Download size={20} />
          <div className="flex-1">
            <p className="font-medium">Instalar App</p>
            <p className="text-sm opacity-90">Instale para acesso rápido</p>
          </div>
          <button
            onClick={installApp}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Instalar
          </button>
        </div>
      )}

      {/* Notificação de atualização */}
      {updateAvailable && (
        <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
          <RefreshCw size={20} />
          <div className="flex-1">
            <p className="font-medium">Atualização Disponível</p>
            <p className="text-sm opacity-90">Nova versão do app</p>
          </div>
          <button
            onClick={updateApp}
            className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Atualizar
          </button>
        </div>
      )}

      {/* Notificação de offline */}
      {!isOnline && (
        <div className="bg-orange-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
          <WifiOff size={20} />
          <div className="flex-1">
            <p className="font-medium">Modo Offline</p>
            <p className="text-sm opacity-90">Algumas funcionalidades podem estar limitadas</p>
          </div>
        </div>
      )}

      {/* Notificação de online */}
      {isOnline && isInstalled && (
        <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
          <Wifi size={20} />
          <div className="flex-1">
            <p className="font-medium">Conectado</p>
            <p className="text-sm opacity-90">Todas as funcionalidades disponíveis</p>
          </div>
        </div>
      )}
    </div>
  );
};
