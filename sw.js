const CACHE_NAME = "adsea-desk-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./foto/Logo.png",
  "./assets/css/theme.css",
  "./assets/js/supabase.js",
  "./assets/js/auth.js",
  "./assets/js/app.js",
  "./assets/js/admin.js",
  "./assets/js/real-presence.js",
  "./assets/js/webrtc-control.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(res => res || caches.match("./")))
  );
});
