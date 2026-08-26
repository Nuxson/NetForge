// sw.js — Service Worker для NetForge
const CACHE_NAME = 'netforge-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/utils.js',
  './js/storage.js',
  './js/ui.js',
  './js/modal.js',
  './js/autobackup.js',
  './js/app.js',
  // Внешние ресурсы (CDN)
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@300;400;600;800&display=swap'
];

// Установка Service Worker — кэшируем базовые ресурсы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[NetForge SW] Кэширование ресурсов');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Активируем SW сразу
  );
});

// Активация — удаляем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[NetForge SW] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов — стратегия Cache First
self.addEventListener('fetch', (event) => {
  // Игнорируем не-GET запросы (например, отправку форм)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Возвращаем из кэша, но в фоне обновляем его
        fetch(event.request).then((freshResponse) => {
          if (freshResponse && freshResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, freshResponse);
            });
          }
        }).catch(() => {
          // Нет сети — ничего не делаем, у нас есть кэш
        });
        return cachedResponse;
      }

      // Если в кэше нет — скачиваем и сохраняем
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});