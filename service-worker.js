const CACHE = 'dice-castle-v1';
const ASSETS = [
  '.',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', evt =>
  evt.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  )
);

self.addEventListener('fetch', evt =>
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request))
  )
);
