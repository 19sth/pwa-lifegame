/* Service worker for lifegame.
   Network-first so updates show up, with a cache fallback so the app opens offline. */

const CACHE = "lifegame-v1";
const INDEX = "/pwa-lifegame/index.html";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") {
            return caches.match(INDEX).then(
              (index) => index || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
            );
          }
          return new Response("", { status: 504, headers: { "Content-Type": "text/plain" } });
        })
      )
  );
});
