// Service Worker para PWA - Gestor de Abaixo-Assinados
const BUILD_ID = '20250918-001'; // Incrementar a cada build
const CACHE_NAME = `gestor-abaixo-assinados-${BUILD_ID}`;

// Cachear apenas assets estáticos com hash (não HTML de navegação)
const urlsToCache = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon.svg'
  // Não incluir HTML de páginas ou bundles sem hash
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando versão', BUILD_ID);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto para assets estáticos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Notificar clientes sobre nova versão disponível
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              buildId: BUILD_ID
            });
          });
        });
      })
      .catch((error) => {
        console.log('Service Worker: Erro ao cachear recursos:', error);
      })
  );
  // Não usar skipWaiting() - aguardar confirmação do usuário
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando versão', BUILD_ID);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remover todos os caches que não sejam da versão atual
          if (cacheName.startsWith('gestor-abaixo-assinados-') && cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Notificação já está no install - removido duplicação
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Não interceptar mutações (POST/PUT/PATCH/DELETE)
  if (request.method !== 'GET') {
    return; // Deixa passar direto para a rede
  }

  // 2. APIs Supabase - Network Only (nunca cachear)
  if (url.hostname.includes('supabase.co') || request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. Navegação HTML - Network First sem cache
  if (request.mode === 'navigate') {
    event.respondWith(
      // Network first com timeout usando AbortController
      (async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch(request, { 
            signal: controller.signal 
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          // Fallback offline simples
          return new Response(
            '<!DOCTYPE html><html><body><h1>Offline</h1><p>Verifique sua conexão e tente novamente.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      })()
    );
    return;
  }

  // 4. Assets estáticos com hash - Cache First
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.includes('/assets/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then((response) => {
            // Cachear apenas respostas válidas
            if (response && response.status === 200 && response.type === 'basic') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // 5. Outras requisições - Network Only
  // Deixa passar direto para a rede sem interceptar
});

// Mensagens do Service Worker
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data && data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Recebeu confirmação para atualizar, ativando versão', BUILD_ID);
    self.skipWaiting();
  }
  
  if (data && data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION_INFO',
      buildId: BUILD_ID,
      cacheName: CACHE_NAME
    });
  }
});

// Listener duplicado removido - notificação já está no install principal
// Referência OFFLINE_PAGE removida - usando fallback inline

// Notificações push (opcional)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push recebido');
  // Implementar notificações push se necessário
});
