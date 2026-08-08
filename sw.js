// Service worker for offline-first practice logging. Registered as a module
// worker from src/main.js so it can import the single precache list the app and
// this file share — no build step, the browser fetches both files directly.
//
// Strategy: cache-first. Offline is the design point (practice happens with no
// signal), so a precached copy is served whenever we have one, and the network is
// only consulted for requests we did not precache.
import { CACHE_NAME, PRECACHE_URLS } from './src/precache.js';

// On install, precache the whole app shell and every module it loads, then take
// over immediately rather than waiting for all tabs to close.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting()),
    );
});

// On activate, drop caches from previous revisions so a bumped CACHE_NAME frees
// the stale bytes instead of leaving them to accumulate, then claim open clients
// so the new worker controls the current page without a reload.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
            )
            .then(() => self.clients.claim()),
    );
});

// Cache-first for GET requests. Non-GET and cross-scheme requests fall straight
// through to the network untouched.
self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
