// Service Worker untuk Keuangan Pribadi
const CACHE_NAME = 'keuangan-pribadi-v2';
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

// Daftar jalur yang berisi data profil atau avatar
const PROFILE_ROUTES = [
  '/profiles',
  '/avatar',
  '/storage/v1/object/public/avatars',
  'user_metadata',
  'user_settings'
];

// Cache untuk data dinamis
const DYNAMIC_CACHE = 'keuangan-pribadi-dynamic-v2';

// Instal service worker dan cache asset statis
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new cache: ' + CACHE_NAME);
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
  console.log('[Service Worker] Aktivasi versi baru dan pembersihan cache');
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
    }).then(() => {
      // Klaim klien langsung untuk update cepat
      return self.clients.claim();
    })
  );
});

// Nasłuchiwanie pesan dari klien
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Menerima pesan:', event.data);
  
  if (event.data && event.data.type === 'CLEAR_AUTH_CACHE') {
    clearAuthCache().then(() => {
      // Kirim konfirmasi kembali ke klien
      event.ports[0].postMessage({ cleared: true });
    });
  }
  
  // Handler baru untuk membersihkan cache profil
  if (event.data && event.data.type === 'CLEAR_PROFILE_CACHE') {
    clearProfileCache(event.data.userId).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ cleared: true });
      }
    });
  }
  
  // Handler untuk menghapus semua data user
  if (event.data && event.data.type === 'CLEAR_ALL_USER_DATA') {
    clearUserData(event.data.userId).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ cleared: true });
      }
    });
  }
  
  // Force refresh cache
  if (event.data && event.data.type === 'REFRESH_CACHE') {
    const urls = event.data.urls || [];
    refreshCache(urls).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ refreshed: true });
      }
    });
  }
});

// Fungsi untuk membersihkan cache profil
async function clearProfileCache(userId) {
  try {
    const caches = await self.caches.keys();
    
    for (const cacheName of caches) {
      const cache = await self.caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        // Hapus semua request yang berkaitan dengan profil atau avatar
        if (PROFILE_ROUTES.some(route => request.url.includes(route))) {
          console.log('Deleting from cache:', request.url);
          await cache.delete(request);
        }
      }
    }
    
    console.log('Profile cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear profile cache:', error);
    return false;
  }
}

// Fungsi untuk menghapus semua data pengguna
async function clearUserData(userId) {
  try {
    await clearAuthCache();
    await clearProfileCache(userId);
    
    console.log('All user data cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear user data:', error);
    return false;
  }
}

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

// Fungsi untuk memperbarui cache secara paksa
async function refreshCache(urls) {
  try {
    for (const url of urls) {
      const cacheKeys = await caches.keys();
      
      for (const cacheName of cacheKeys) {
        const cache = await caches.open(cacheName);
        await cache.delete(new Request(url));
      }
      
      // Fetch ulang untuk menyimpan di cache
      const response = await fetch(url, { cache: 'reload' });
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(new Request(url), response);
      }
    }
    
    console.log('Cache refreshed successfully');
    return true;
  } catch (error) {
    console.error('Failed to refresh cache:', error);
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
  if (url.origin === self.location.origin || event.request.url.includes('supabase.co')) {
    
    // Gunakan NETWORK FIRST untuk data profil dan avatar
    if (PROFILE_ROUTES.some(route => event.request.url.includes(route))) {
      console.log('[SW] Handling profile data with network-first:', event.request.url);
      event.respondWith(networkFirst(event.request));
      return;
    }
    
    // Cache-first untuk asset statis non-profil
    if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2)$/)) {
      console.log('[SW] Handling static asset with cache-first:', event.request.url);
      event.respondWith(cacheFirst(event.request));
      return;
    }
    
    // Stale-while-revalidate untuk API routes
    if (API_ROUTES.some(route => event.request.url.includes(route))) {
      console.log('[SW] Handling API with stale-while-revalidate:', event.request.url);
      event.respondWith(staleWhileRevalidate(event.request));
      return;
    }
  }
  
  // Network-first untuk permintaan lainnya
  console.log('[SW] Handling other request with network-first:', event.request.url);
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
        try {
          await cache.put(request, networkResponse.clone());
        } catch (err) {
          console.error('Error caching response:', err);
        }
      }
      return networkResponse;
    } else {
      // Kalau status code tidak ok, tetap gunakan network response
      return networkResponse;
    }
  } catch (error) {
    // Jika gagal, coba ambil dari cache
    console.log('Network request failed, using cache for:', request.url);
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