// sw.js — Service Worker для NetForge (Исправленная версия)
const CACHE_NAME = 'netforge-cache-v1';

// Убрали cdn.tailwindcss.com из списка, так как он блокирует CORS-запросы.
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
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@300;400;600;800&display=swap'
];

// Установка: кэшируем ресурсы безопасно
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[NetForge SW] Начало кэширования...');
        // Кэшируем файлы по отдельности. Если один падает (CORS), просто предупреждаем и идем дальше.
        return Promise.all(
          ASSETS_TO_CACHE.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[NetForge SW] Пропуск файла (CORS/Сеть): ${url}`);
            })
          )
        );
      })
      .then(() => {
        console.log('[NetForge SW] Кэширование завершено');
        return self.skipWaiting();
      })
  );
});

// Активация: удаляем старые кэши
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

// Перехват запросов (Cache First, Network Fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Игнорируем cdn.tailwindcss.com, пусть браузер сам его кэширует
  if (event.request.url.includes('cdn.tailwindcss.com')) {
    return;
  }

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
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Если нет сети и нет в кэше
        return new Response('<h1>Офлайн режим NetForge</h1>', { headers: { 'Content-Type': 'text/html' } });
      });
    })
  );
});