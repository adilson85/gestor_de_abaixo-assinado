// Service Worker para PWA - Gestor de Abaixo-Assinados
const CACHE_NAME = 'gestor-abaixo-assinados-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/petitions',
  '/settings',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Erro ao cachear recursos:', error);
      })
  );
  self.skipWaiting(); // Ativa imediatamente
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim()); // Assume controle imediatamente
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  // Estratégia: Network First para API, Cache First para assets
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) {
    // Para APIs, sempre buscar da rede primeiro
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Se a rede funcionar, cachear a resposta
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se a rede falhar, tentar do cache
          return caches.match(event.request);
        })
    );
  } else {
    // Para assets estáticos, cache first
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((response) => {
            // Cachear apenas se for uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return response;
          });
        })
    );
  }
});

// Mensagens do Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Recebeu SKIP_WAITING, ativando...');
    self.skipWaiting();
  }
});

// Notificações push (opcional)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push recebido');
  // Implementar notificações push se necessário
});
