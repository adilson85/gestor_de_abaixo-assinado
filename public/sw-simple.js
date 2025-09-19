// Service Worker simplificado para evitar interferência com drag and drop
console.log('Service Worker simplificado carregado');

// Apenas registrar o SW sem interceptar requisições
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado (versão simplificada)');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativado (versão simplificada)');
  event.waitUntil(self.clients.claim());
});

// Não interceptar nenhuma requisição para evitar interferência

