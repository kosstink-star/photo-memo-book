const CACHE_NAME = 'photo-memo-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  // Vite 빌드 시 해시가 포함되지만, PWA 오프라인 지원의 기본 뼈대 역할
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (e) => {
  // 캐시 우선, 없으면 네트워크 폴백 (네트워크 요청 차단 방지용 뼈대)
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
