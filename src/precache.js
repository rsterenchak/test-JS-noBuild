// The offline contract, in one place. This is the exact set of served-from-source
// files the browser must cache for every surface to work with no network — the app
// is used to log practice in a basement with no signal, so offline is the design
// point, not a fallback.
//
// sw.js imports this list to precache it on install; tests/precache.test.js walks
// main.js's static import graph and fails if any reachable module is missing here.
// That guard exists because a new surface added later without its module listed
// would break silently offline while working fine on the network — the exact
// precache-drift failure this app is warned about.
//
// Bump CACHE_NAME whenever any precached file changes so the service worker's
// activate handler evicts the stale copies and fetches the new ones.
export const CACHE_NAME = 'practice-log-v1';

export const PRECACHE_URLS = [
    // The app shell. './' and './index.html' are both listed so a navigation to
    // the scope root (the manifest start_url) resolves from cache too.
    './',
    './index.html',
    './manifest.webmanifest',
    './favicon.svg',
    './src/style.css',
    // Every ES module the app loads, starting from main.js and following its
    // imports. Keep this in sync with that import graph (the test enforces it).
    './src/main.js',
    './src/store.js',
    './src/session.js',
    './src/tagSheet.js',
    './src/neglect.js',
    './src/history.js',
    './src/pieceDetail.js',
];
