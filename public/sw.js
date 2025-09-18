// Service Worker simplificado - apenas para compatibilidade
// Remove funcionalidades offline que podem causar travamentos

const CACHE_NAME = 'gestor-simple-v1';

// Instalação simples
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Ativação simples - limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch simples - sempre vai para network (sem cache offline)
self.addEventListener('fetch', (event) => {
  // Apenas passa as requisições direto para a rede
  // Sem cache para evitar problemas de estado inconsistente
  event.respondWith(fetch(event.request));
});

// Message handler simples
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});