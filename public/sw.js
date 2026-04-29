// Service Worker — Gestione Mezzi PWA
// Cache-first for static assets, network-first for pages/API.

const CACHE_NAME = "mezzi-v4";

const PRECACHE_URLS = ["/", "/login"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Skip API routes, auth, and document uploads
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/")
  ) {
    return;
  }

  // Skip Next.js static chunks — Next.js handles versioning via content hashes in prod,
  // and in dev the filenames don't change so SW caching would serve stale bundles.
  if (url.pathname.startsWith("/_next/")) {
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith("/icon-") ||
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Pages: network-only (no cache) for fresh content in dev
  event.respondWith(fetch(request));
});
