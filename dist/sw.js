// Service Worker untuk Keuangan Pribadi
const CACHE_NAME = 'keuangan-pribadi-v1';
const OFFLINE_URL = '/offline.html';

// Asset statis utama yang perlu di-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logokeuanganpay.webp',
  '/favicon.ico',
  '/manifest.json',
  // Tambahan asset untuk meningkatkan performa
  '/assets/index.js',
  '/assets/index.css'
];

// Daftar rute API yang akan di-cache
const API_ROUTES = [
  '/api/categories',
  '/api/wallets',
  '/api/settings'
];

// Daftar rute autentikasi yang tidak boleh di-cache
const AUTH_ROUTES = [
  '/auth/v1/token',
  '/auth/v1/logout',
  '/auth/v1/user',
  'supabase.co/auth'
];

// Cache untuk data dinamis
const DYNAMIC_CACHE = 'keuangan-pribadi-dynamic-v1';

// Instal service worker dan cache asset statis
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell dan static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktivasi service worker dan bersihkan cache lama
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Nasłuchiwanie pesan dari klien
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_AUTH_CACHE') {
    clearAuthCache().then(() => {
      // Kirim konfirmasi kembali ke klien
      event.ports[0].postMessage({ cleared: true });
    });
  }
});

// Fungsi untuk membersihkan cache autentikasi
async function clearAuthCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    const authRequests = requests.filter(request => 
      AUTH_ROUTES.some(route => request.url.includes(route))
    );
    
    // Hapus semua permintaan autentikasi dari cache
    for (const request of authRequests) {
      await cache.delete(request);
    }
    
    console.log('Auth cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear auth cache:', error);
    return false;
  }
}

// Strategi caching yang dioptimalkan
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Jangan cache permintaan autentikasi
  if (AUTH_ROUTES.some(route => event.request.url.includes(route))) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Jika request ke domain yang sama
  if (url.origin === self.location.origin) {
    // Cache-first untuk asset statis
    if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2)$/)) {
      event.respondWith(cacheFirst(event.request));
      return;
    }
    
    // Stale-while-revalidate untuk API routes
    if (API_ROUTES.some(route => event.request.url.includes(route))) {
      event.respondWith(staleWhileRevalidate(event.request));
      return;
    }
  }
  
  // Network-first untuk permintaan lainnya
  event.respondWith(networkFirst(event.request));
});

// Strategi cache-first - untuk asset statis
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fallback jika offline
    return await caches.match(OFFLINE_URL);
  }
}

// Strategi stale-while-revalidate - untuk API routes
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(cache => cache.put(request, networkResponse.clone()));
      }
      return networkResponse.clone();
    })
    .catch(error => {
      console.error('Fetch failed:', error);
      return new Response('Network error', { status: 408 });
    });
  
  // Kembalikan respons dari cache jika ada, kemudian perbarui cache
  return cachedResponse || fetchPromise;
}

// Strategi network-first - untuk request dinamis lainnya
async function networkFirst(request) {
  try {
    // Coba ambil dari network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Hanya cache respons yang berhasil untuk request GET
      if (request.method === 'GET') {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
  } catch (error) {
    // Jika gagal, coba ambil dari cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Jika request adalah navigasi, kembalikan halaman offline
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    // Jika bukan navigasi dan tidak ada di cache, kembalikan error
    return new Response('Network error', { status: 408 });
  }
} 