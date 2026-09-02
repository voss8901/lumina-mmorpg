/* Lumina ClassRecord — self-destructing service worker.
   The old offline component caused blank pages, so this version
   removes itself and all stored caches, then reloads the app. */
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: "window" }); })
      .then(function (cs) { cs.forEach(function (c) { c.navigate(c.url); }); })
  );
});
/* No fetch handler: this worker never touches the network again. */
