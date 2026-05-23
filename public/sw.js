// ChemTrack service worker — offline cache for app shell + previously visited screens.
const VERSION = "chemtrack-v1";
const CORE = ["/", "/dashboard", "/chemicals", "/equipment", "/usage", "/manifest.webmanifest", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(CORE).catch(() => undefined)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Skip API + server fn calls
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/__")) return;

  // NetworkFirst for HTML navigations
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone()).catch(() => undefined);
        return fresh;
      } catch {
        const cache = await caches.open(VERSION);
        return (await cache.match(req)) || (await cache.match("/dashboard")) || (await cache.match("/")) || Response.error();
      }
    })());
    return;
  }

  // StaleWhileRevalidate for assets
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req).then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone()).catch(() => undefined);
      return res;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});
