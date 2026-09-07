const CLEANUP_VERSION = "serie-a-live-restore-v243";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key.startsWith("serie-a-live-"))
          .map(key => caches.delete(key))
      );
    } catch (_) {}

    try {
      await self.registration.unregister();
    } catch (_) {}

    try {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });
      for (const client of clients) {
        client.postMessage({ type: CLEANUP_VERSION });
      }
    } catch (_) {}
  })());
});

// Deliberately NO fetch handler.
// The app goes directly to the network, like the stable pre-V2.44 version.
