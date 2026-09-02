/* Lumina ClassRecord — service worker (offline support) */
const CACHE = "classrecord-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=10",
  "./app.js?v=10",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Fetch that can never return an empty 304 body: for same-origin files we
   re-request by URL with revalidation, so the response is always a full 200. */
function freshFetch(req) {
  if (req.url.indexOf(self.location.origin) === 0) {
    return fetch(req.url, { cache: "no-cache", credentials: "same-origin" });
  }
  return fetch(req);
}

/* Pages (navigations): network-first so updates always arrive when online;
   fall back to cache when offline. Static assets: cache-first. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") {
    e.respondWith(
      freshFetch(e.request).then((resp) => {
        if (resp && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put("./", clone));
          return resp;
        }
        return caches.match("./").then((r) => r || resp);
      }).catch(() => caches.match("./"))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return freshFetch(e.request).then((resp) => {
        if (resp && (resp.ok || resp.type === "opaque")) {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return resp;
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
