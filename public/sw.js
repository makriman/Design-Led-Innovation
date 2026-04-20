const OFFLINE_CACHE = "inspire-offline-v1";
const OFFLINE_PAGE = "/offline-dot-game.html";
const OFFLINE_ASSETS = [OFFLINE_PAGE, "/offline-dot-game.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll(OFFLINE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("inspire-offline-") && key !== OFFLINE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const fresh = await fetch(request);
  if (fresh && fresh.ok) {
    const cache = await caches.open(OFFLINE_CACHE);
    cache.put(request, fresh.clone());
  }
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (!isSameOrigin(url)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cachedOfflinePage = await caches.match(OFFLINE_PAGE);
          if (cachedOfflinePage) {
            return cachedOfflinePage;
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      })()
    );
    return;
  }

  if (OFFLINE_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
