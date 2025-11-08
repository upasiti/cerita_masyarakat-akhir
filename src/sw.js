// sw.js
const CACHE_VERSION = 'v3.0.5';
const CACHE_NAME = `cerita-cache-${CACHE_VERSION}`;

self.skipWaiting();

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/app.css',
  '/manifest.json',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/logo.png',
];

// 🔑 Token user
let userToken = null;
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_TOKEN') {
    userToken = event.data.token;
    console.log('🔑 Token disimpan di Service Worker:', userToken);
  }
});

// ✅ INSTALL
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installed');
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
});

// ⚡ ACTIVATE
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// 🌐 FETCH STRATEGY — aman dari error clone
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const req = event.request;
  const url = new URL(req.url);
  const isAPI = url.origin.includes('story-api.dicoding.dev');

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const networkResponse = await fetch(req);
        // ⛑ clone hanya sekali dan langsung simpan
        const copy = networkResponse.clone();
        cache.put(req, copy);
        return networkResponse;
      } catch (err) {
        const cached = await cache.match(req);
        if (cached) return cached;

        if (isAPI) {
          console.warn('⚠️ Offline mode, data API tidak tersedia');
          return new Response(
            JSON.stringify({ error: true, message: 'Offline – data tidak tersedia' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }

        const fallback = await cache.match('/index.html');
        return fallback || Response.error();
      }
    })()
  );
});

// 🔔 PUSH NOTIFICATION
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Notifikasi', body: event.data.text() };
  }
  const title = data.title || 'Notifikasi Baru!';
  const options = {
    body: data.body || 'Ada pembaruan dari Cerita Masyarakat.',
    icon: '/images/icon-192.png',
    badge: '/images/icon-192.png',
    data: { url: data.url || '/' },
    actions: [{ action: 'open_url', title: 'Lihat Detail' }],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 🖱️ Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';
  if (event.action === 'open_url' || event.action === '') {
    event.waitUntil(clients.openWindow(targetUrl));
  }
});

// 🔁 BACKGROUND SYNC
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    console.log('📶 Menjalankan background sync...');
    event.waitUntil(syncPendingStories());
  }
});

// 📦 SYNC OFFLINE STORIES
async function syncPendingStories() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('pending-stories', 'readonly');
    const store = tx.objectStore('pending-stories');
    const stories = await new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
    });

    if (!stories || stories.length === 0) {
      console.log('📭 Tidak ada cerita pending untuk disinkronkan.');
      return;
    }

    for (const story of stories) {
      try {
        const formData = new FormData();
        formData.append('description', story.description);
        if (story.lat && story.lon) {
          formData.append('lat', story.lat);
          formData.append('lon', story.lon);
        }

        const blob = await fetch(story.photoUrl).then((r) => r.blob());
        formData.append('photo', blob, 'photo.jpg');

        const res = await fetch('https://story-api.dicoding.dev/v1/stories', {
          method: 'POST',
          headers: { Authorization: `Bearer ${userToken}` },
          body: formData,
        });

        if (!res.ok) throw new Error(`Upload gagal (${res.status})`);

        const delTx = db.transaction('pending-stories', 'readwrite');
        delTx.objectStore('pending-stories').delete(story.createdAt);

        console.log('✅ Cerita tersinkron:', story.description);
        self.registration.showNotification('Cerita berhasil disinkronkan!', {
          body:
            story.description.length > 60
              ? story.description.substring(0, 60) + '...'
              : story.description,
          icon: '/images/icon-192.png',
          badge: '/images/icon-192.png',
          data: { url: '/' },
        });
      } catch (err) {
        console.error('❌ Gagal upload cerita:', err.message);
      }
    }
  } catch (e) {
    console.error('❌ Gagal membuka IndexedDB:', e);
  }
}

// ⚙️ OPEN DB
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('story-sync-db', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-stories')) {
        db.createObjectStore('pending-stories', { keyPath: 'createdAt' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}
