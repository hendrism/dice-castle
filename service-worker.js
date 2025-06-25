const CACHE = 'dice-castle-v1';
const ASSETS = [
  '.',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json'
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
