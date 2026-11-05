// Minimal service worker so the app can be installed. It does not cache anything:
// every request goes to the network, so updates show up immediately.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
