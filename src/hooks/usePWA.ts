import { useState, useEffect } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // PWA habilitado para instalação
    console.log('PWA: Inicializando funcionalidades PWA...');
    // Check if app is already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    
    setPwaState(prev => ({ ...prev, isInstalled }));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaState(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setPwaState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
    };

    // Listen for online/offline events
    const handleOnline = () => setPwaState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }));

    // Service Worker: registrar sempre
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('PWA: Service Worker registrado com sucesso:', registration);
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('PWA: Nova versão disponível');
                  setPwaState(prev => ({ ...prev, updateAvailable: true }));
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.error('PWA: Erro ao registrar Service Worker:', registrationError);
        });
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setPwaState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
      return true;
    }
    
    return false;
  };

  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  return {
    ...pwaState,
    installApp,
    updateApp,
  };
};
