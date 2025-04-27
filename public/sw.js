// Service Worker untuk Keuangan Pribadi PWA
const CACHE_NAME = 'keuangan-pribadi-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/splashscreen.html',
  '/logokeuanganpay.webp',
  '/favicon.ico',
  '/favicon.webp',
  '/manifest.json'
];

// Install event - mengcache aset
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache dibuka');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Fetch event - strategi cache-first
self.addEventListener('fetch', (event) => {
  // Jika url mengarah ke splashscreen, gunakan network-first strategy
  if (event.request.url.includes('splashscreen.html')) {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Untuk permintaan lainnya, gunakan cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - kembalikan response dari cache
        if (response) {
          return response;
        }

        // Clone request karena akan digunakan lebih dari sekali
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Cek respons valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response karena akan digunakan lebih dari sekali
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Tambahkan respons baru ke cache
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Activate event - hapus cache lama
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
}); 