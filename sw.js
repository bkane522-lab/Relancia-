const CACHE_NAME = 'relancia-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Laisse passer toutes les requêtes réseau normalement (pas de cache agressif,
  // l'app a besoin de données toujours à jour)
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
