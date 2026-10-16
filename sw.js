const CACHE_NAME = 'jian-chat-v6';
const ASSETS = [
  './',
  './index.html',
  './assets/css/teams.css?v=6',
  './assets/js/app.js?v=6',
  './assets/img/jian_avatar.jpg?v=6',
  './assets/img/jian_face3.png?v=6',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // API 요청은 네트워크 우선
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ error: '오프라인 상태입니다.' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // HTML 문서는 네트워크 우선, 오프라인 시 캐시 폴백 (배포 즉시 반영)
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
          return res;
        })
        .catch(() => caches.match('./index.html') || caches.match(e.request))
    );
    return;
  }

  // 정적 자산(CSS/JS/이미지)은 캐시 우선, 네트워크 폴백
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request);
    })
  );
});
