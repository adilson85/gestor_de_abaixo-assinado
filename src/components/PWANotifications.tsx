import React from 'react';
import { Download, Wifi, WifiOff, RefreshCw, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const PWANotifications: React.FC = () => {
  const { isInstallable, isOnline, updateAvailable, installApp, updateApp } = usePWA();
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = React.useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = React.useState(false);

  React.useEffect(() => {
    if (isInstallable && !localStorage.getItem('install-banner-dismissed')) {
      setShowInstallBanner(true);
    }
  }, [isInstallable]);

  React.useEffect(() => {
    if (updateAvailable) {
      setShowUpdateBanner(true);
    }
  }, [updateAvailable]);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
    } else {
      setShowOfflineBanner(false);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setShowInstallBanner(false);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install-banner-dismissed', 'true');
  };

  const handleUpdate = () => {
    updateApp();
    setShowUpdateBanner(false);
  };

  const handleDismissUpdate = () => {
    setShowUpdateBanner(false);
  };

  return (
    <>
      {/* Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 z-50 shadow-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Download size={20} />
              <div>
                <p className="font-medium">Instalar App</p>
                <p className="text-sm text-blue-100">
                  Instale o app para acesso mais rápido e funcionalidades offline
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={handleDismissInstall}
                className="text-blue-100 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Banner */}
      {showUpdateBanner && (
        <div className="fixed top-0 left-0 right-0 bg-green-600 text-white p-4 z-50 shadow-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <RefreshCw size={20} />
              <div>
                <p className="font-medium">Atualização Disponível</p>
                <p className="text-sm text-green-100">
                  Uma nova versão do app está disponível
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdate}
                className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
              >
                Atualizar
              </button>
              <button
                onClick={handleDismissUpdate}
                className="text-green-100 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 bg-orange-600 text-white p-4 z-50 shadow-lg">
          <div className="flex items-center justify-center max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <WifiOff size={20} />
              <div>
                <p className="font-medium">Modo Offline</p>
                <p className="text-sm text-orange-100">
                  Você está offline. Algumas funcionalidades podem estar limitadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Indicator */}
      {isOnline && !showOfflineBanner && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-full shadow-lg z-40">
          <Wifi size={20} />
        </div>
      )}
    </>
  );
};
