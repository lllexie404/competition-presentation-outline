const CACHE_NAME = 'yonsei-topik-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

// Install: 缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: 网络优先，缓存兜底，确保数据始终最新
self.addEventListener('fetch', (event) => {
  // 只缓存同源请求
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 缓存成功的响应
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 离线时从缓存读取
        return caches.match(event.request).then((cached) => {
          return cached || new Response('离线模式', { status: 503 });
        });
      })
  );
});