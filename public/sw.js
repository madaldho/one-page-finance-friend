// Service Worker untuk Keuangan Pribadi
const CACHE_VERSION = '4';
const CACHE_NAME = `keuangan-pribadi-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `keuangan-pribadi-dynamic-v${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Asset statis utama yang perlu di-cache - core app shell
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logokeuanganpay.webp',
  '/favicon.ico',
  '/favicon.webp',
  '/manifest.json',
  '/offline.html',
  '/assets/index.js',
  '/assets/index.css',
  '/placeholder.svg' // Placeholder untuk gambar yang gagal
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

// Instal service worker dan cache asset statis
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new version: ' + CACHE_NAME);
  
  // Gunakan waitUntil untuk menunda event sampai promise selesai
  event.waitUntil(
    // Buka cache statis dan tambahkan semua asset statis
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell dan static assets');
        return cache.addAll(STATIC_ASSETS)
          .then(() => {
            console.log('[Service Worker] Semua asset statis berhasil di-cache');
            // Gunakan skipWaiting untuk mengaktifkan service worker segera
            return self.skipWaiting();
          })
          .catch(error => {
            console.error('[Service Worker] Gagal caching asset statis:', error);
            // Jangan throw error di sini, supaya instalasi tetap bisa dilanjutkan
            // Namun berikan alert bahwa instalasi mungkin tidak lengkap
            return self.skipWaiting();
          });
      })
  );
});

// Aktivasi service worker dan bersihkan cache lama
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Aktivasi versi baru: ' + CACHE_NAME);
  
  const currentCaches = [CACHE_NAME, DYNAMIC_CACHE];
  
  event.waitUntil(
    // Hapus semua cache lama
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[Service Worker] Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Berhasil menghapus cache lama');
      // Klaim klien agar service worker aktif bisa langsung mengontrol halaman
      return self.clients.claim();
    })
    .then(() => {
      // Setelah aktivasi, beri tahu semua klien bahwa SW baru siap
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            message: 'Service worker baru telah diaktifkan',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// Nasłuchiwanie pesan dari klien
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Menerima pesan:', event.data);
  
  // Handle pesan untuk clear auth cache
  if (event.data && event.data.type === 'CLEAR_AUTH_CACHE') {
    clearAuthCache().then(() => {
      // Kirim konfirmasi kembali ke klien
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ cleared: true });
      }
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
  
  // Handler untuk memaksa update service worker
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    self.registration.update().then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ 
          type: 'UPDATE_CHECKED',
          version: CACHE_VERSION 
        });
      }
    });
  }
  
  // Handler untuk ping/pong (keep-alive)
  if (event.data && event.data.type === 'PING') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ 
        type: 'PONG', 
        timestamp: Date.now(),
        version: CACHE_VERSION
      });
    }
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
          console.log('[Service Worker] Menghapus dari cache:', request.url);
          await cache.delete(request);
        }
      }
    }
    
    console.log('[Service Worker] Cache profil berhasil dibersihkan');
    return true;
  } catch (error) {
    console.error('[Service Worker] Gagal membersihkan cache profil:', error);
    return false;
  }
}

// Fungsi untuk menghapus semua data pengguna
async function clearUserData(userId) {
  try {
    await clearAuthCache();
    await clearProfileCache(userId);
    
    console.log('[Service Worker] Semua data pengguna berhasil dibersihkan');
    return true;
  } catch (error) {
    console.error('[Service Worker] Gagal menghapus data pengguna:', error);
    return false;
  }
}

// Fungsi untuk membersihkan cache autentikasi
async function clearAuthCache() {
  try {
    const cacheKeys = await caches.keys();
    
    for (const cacheName of cacheKeys) {
      const cache = await caches.open(cacheName);
    const requests = await cache.keys();
      
      for (const request of requests) {
        if (AUTH_ROUTES.some(route => request.url.includes(route))) {
          console.log('[Service Worker] Menghapus item cache otentikasi:', request.url);
          await cache.delete(request);
        }
      }
    }
    
    console.log('[Service Worker] Cache otentikasi berhasil dibersihkan');
    return true;
  } catch (error) {
    console.error('[Service Worker] Gagal membersihkan cache otentikasi:', error);
    return false;
  }
}

// Fungsi untuk memperbarui cache secara paksa
async function refreshCache(urls) {
  try {
    for (const url of urls) {
      const cacheKeys = await caches.keys();
      
      // Hapus dari semua cache
      for (const cacheName of cacheKeys) {
        const cache = await caches.open(cacheName);
        try {
          await cache.delete(new Request(url));
          console.log(`[Service Worker] Menghapus ${url} dari cache ${cacheName}`);
        } catch (err) {
          console.warn(`[Service Worker] Error menghapus ${url} dari cache:`, err);
        }
      }
      
      // Fetch ulang dengan no-cache untuk menyimpan di cache
      try {
        const response = await fetch(url, { 
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const cache = await caches.open(DYNAMIC_CACHE);
          await cache.put(new Request(url), response.clone());
          console.log(`[Service Worker] Berhasil menyegarkan cache untuk: ${url}`);
        } else {
          console.warn(`[Service Worker] Gagal menyegarkan cache untuk: ${url}, status: ${response.status}`);
        }
      } catch (fetchErr) {
        console.error(`[Service Worker] Network error saat menyegarkan: ${url}`, fetchErr);
      }
    }
    
    console.log('[Service Worker] Cache berhasil disegarkan');
    return true;
  } catch (error) {
    console.error('[Service Worker] Gagal menyegarkan cache:', error);
    return false;
  }
}

// Strategi caching yang dioptimalkan
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip permintaan non-HTTP dan permintaan non-GET
  if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
    return;
  }
  
  // Jangan cache permintaan autentikasi
  if (AUTH_ROUTES.some(route => event.request.url.includes(route))) {
    event.respondWith(networkOnly(event.request));
    return;
  }
  
  // Jika request ke domain yang sama atau ke Supabase
  if (url.origin === self.location.origin || event.request.url.includes('supabase.co')) {
    
    // Handle permintaan navigasi khusus
    if (event.request.mode === 'navigate') {
      // Untuk permintaan navigasi, gunakan strategi network-first
      event.respondWith(
        networkFirst(event.request).catch(() => {
          return caches.match(OFFLINE_URL);
        })
      );
      return;
    }
    
    // Gunakan NETWORK FIRST untuk data profil dan avatar
    if (PROFILE_ROUTES.some(route => event.request.url.includes(route))) {
      console.log('[SW] Menangani data profil dengan network-first:', event.request.url);
      event.respondWith(networkFirst(event.request));
      return;
    }
    
    // Cache-first untuk asset statis non-profil
    if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2|ico)$/)) {
      console.log('[SW] Menangani aset statis dengan cache-first:', event.request.url);
      event.respondWith(cacheFirst(event.request));
      return;
    }
    
    // Stale-while-revalidate untuk API routes
    if (API_ROUTES.some(route => event.request.url.includes(route))) {
      console.log('[SW] Menangani API dengan stale-while-revalidate:', event.request.url);
      event.respondWith(staleWhileRevalidate(event.request));
      return;
    }
  }
  
  // Network-first untuk permintaan lainnya
  console.log('[SW] Menangani request lain dengan network-first:', event.request.url);
  event.respondWith(networkFirst(event.request));
});

// Network-only strategi - untuk autentikasi dan permintaan yang tidak boleh di-cache
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('[Service Worker] Permintaan jaringan gagal:', error);
    
    // Jika permintaan navigasi, arahkan ke halaman offline
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    // Untuk permintaan lainnya, kembalikan error
    return new Response('Network error', { 
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Strategi cache-first - untuk asset statis
async function cacheFirst(request) {
  try {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
      // Jika ada di cache, gunakan versi cache
      console.log('[Service Worker] Menggunakan respons cache untuk:', request.url);
    return cachedResponse;
  }
    
    // Jika tidak ada di cache, coba ambil dari jaringan
    console.log('[Service Worker] Cache miss, fetching dari jaringan:', request.url);
    const networkResponse = await fetch(request);
    
    // Jika respons valid, simpan di cache
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Menyimpan respons jaringan ke cache:', request.url);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // Jika respons tidak valid, kembalikan respons tersebut
    return networkResponse;
  } catch (error) {
    // Fallback jika offline
    console.error('[Service Worker] Cache first gagal untuk:', request.url, error);
    
    // Jika request adalah navigasi, kembalikan halaman offline
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    // Handle fallback untuk gambar
    if (request.url.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
      return caches.match('/placeholder.svg');
    }
    
    // Fallback untuk request lainnya
    return new Response('Resource tidak tersedia offline', { 
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Strategi stale-while-revalidate - untuk API routes
async function staleWhileRevalidate(request) {
  // Periksa dari cache dulu
  const cachedResponse = await caches.match(request);
  
  // Lakukan fetch baru di background
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      // Jika respons valid, simpan di cache
      if (networkResponse && networkResponse.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(cache => {
          // Gunakan clone() karena response hanya bisa digunakan sekali
          cache.put(request, networkResponse.clone());
          console.log('[Service Worker] Memperbarui cache untuk:', request.url);
        });
      }
      return networkResponse.clone();
    })
    .catch(error => {
      console.error('[Service Worker] Fetch gagal:', error);
      // Jika fetch gagal, biarkan menggunakan cache
      return null;
    });
  
  // Kembalikan respons dari cache jika ada, kemudian perbarui cache
  return cachedResponse || fetchPromise || new Response('Network error', {
    status: 408,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Strategi network-first - untuk request dinamis lainnya
async function networkFirst(request) {
  try {
    // Coba ambil dari network
    console.log('[Service Worker] Mencoba fetch dari jaringan:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      // Hanya cache respons yang berhasil untuk request GET
      if (request.method === 'GET') {
        const cache = await caches.open(DYNAMIC_CACHE);
        try {
          // Clone response karena akan digunakan dua kali
          await cache.put(request, networkResponse.clone());
          console.log('[Service Worker] Berhasil menyimpan respons ke cache:', request.url);
        } catch (err) {
          console.error('[Service Worker] Error caching response:', err);
        }
      }
      return networkResponse;
    } else {
      // Kalau status code tidak ok, tetap gunakan network response
      console.warn('[Service Worker] Respons jaringan tidak ok:', networkResponse.status, request.url);
      return networkResponse;
    }
  } catch (error) {
    // Jika gagal, coba ambil dari cache
    console.log('[Service Worker] Network request gagal, menggunakan cache untuk:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Jika request adalah navigasi, kembalikan halaman offline
    if (request.mode === 'navigate') {
      console.log('[Service Worker] Mengembalikan halaman offline untuk navigasi');
      return caches.match(OFFLINE_URL);
    }
    
    // Jika bukan navigasi dan tidak ada di cache, kembalikan error
    return new Response('Network error. Tidak ada koneksi jaringan.', { 
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
} 