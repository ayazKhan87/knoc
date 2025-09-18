const CACHE_NAME = 'piano-tiles-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.json',
    '/assets/audio.mp3',
    '/js/main.js',
    '/js/uiManager.js',
    '/js/gameEngine.js',
    '/js/audioEngine.js',
    '/js/visualEffects.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        ))
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request))
    );
});


