// CSS imports
import '../styles/styles.css';
import App from './pages/app';
import './utils/push-notification.js';
import { getAllPendingStories, deletePendingStory } from './data/sync-db.js'; // ✅ Tambah delete
import { openSyncDB } from './data/sync-db.js';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  await app.renderPage();
  renderPendingStories(); // ✅ tampilkan cerita offline pertama kali

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    renderPendingStories();
  });

  // === Registrasi Service Worker + Push Notification ===
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker terdaftar:', registration);

      if (!registration.active) {
        console.log('⏳ Menunggu Service Worker aktif...');
        await new Promise((resolve) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('🔥 Service Worker sudah aktif');
                resolve();
              }
            });
          });
        });
      } else {
        console.log('🔥 Service Worker sudah aktif');
      }

      if ('SyncManager' in window) {
        try {
          await registration.sync.register('sync-stories');
          console.log('📡 Background Sync: sync-stories terdaftar');
        } catch (err) {
          console.error('🚫 Gagal mendaftarkan Background Sync:', err);
        }
      } else {
        console.warn('⚠️ Browser tidak mendukung Background Sync');
      }

      await initPush(registration);
    } catch (error) {
      console.error('🚫 Gagal mendaftarkan Service Worker atau Push Notification:', error);
    }
  }

  // === Handle tombol install PWA ===
  let deferredPrompt;
  const installButton = document.getElementById('install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.hidden = false;
    console.log('📲 Install prompt tersedia');
  });

  installButton.addEventListener('click', async () => {
    installButton.hidden = true;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`💡 User memilih: ${outcome}`);
      deferredPrompt = null;
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ Aplikasi telah diinstal');
    installButton.hidden = true;
    alert('🎉 Terima kasih! Cerita Masyarakat berhasil diinstal.');
  });

  // ✅ Saat online kembali, sinkronkan cerita offline
  window.addEventListener('online', async () => {
    console.log('🌐 Kembali online, mulai sinkronisasi cerita...');
    await syncPendingStories();
  });
});

// === Inisialisasi Push Notification ===
async function initPush(registration) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('🚫 Izin notifikasi ditolak oleh user');
    return;
  }

  console.log('🔔 Notifikasi diizinkan oleh user');

  const vapidPublicKey = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });

    console.log('✅ Push Subscription berhasil dibuat:', subscription);

  } catch (error) {
    console.error('🚫 Gagal membuat Push Subscription:', error);
  }
}

// === Helper: konversi VAPID key ===
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ✅ Tampilkan cerita offline
async function renderPendingStories() {
  try {
    const container = document.getElementById('storyList');
    if (!container) return;

    const pendingStories = await getAllPendingStories();
    const existingPending = container.querySelectorAll('.story-item.pending');
    existingPending.forEach((el) => el.remove());

    pendingStories.forEach((story) => {
      const item = document.createElement('div');
      item.classList.add('story-item', 'pending');
      item.style.opacity = '0.7';
      item.innerHTML = `
        <h3>${story.name} (Offline)</h3>
        <p>${story.description}</p>
        ${story.photo ? `<img src="${story.photo}" alt="photo" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-top:8px;" />` : ''}
        <small>⏳ Menunggu sinkronisasi...</small>
      `;
      container.prepend(item);
    });
  } catch (error) {
    console.error('❌ Gagal menampilkan cerita offline:', error);
  }
}

// ✅ Sinkronisasi otomatis ketika online
async function syncPendingStories() {
  try {
    const pendingStories = await getAllPendingStories();
    if (pendingStories.length === 0) {
      console.log('✅ Tidak ada cerita pending untuk disinkronkan.');
      return;
    }

    console.log(`📤 Sinkronisasi ${pendingStories.length} cerita...`);

    for (const story of pendingStories) {
      try {
        const formData = new FormData();
        formData.append('description', story.description);
        if (story.photo) {
          const res = await fetch(story.photo);
          const blob = await res.blob();
          formData.append('photo', blob, 'offline-photo.jpg');
        }

        const token = localStorage.getItem('authToken');
        const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        console.log(`✅ Cerita "${story.description}" berhasil disinkronkan.`);
        await deletePendingStory(story.createdAt);

        // Hapus dari tampilan
        const el = document.querySelector(`.story-item.pending h3:contains("${story.name}")`);
        if (el && el.parentElement) el.parentElement.remove();

      } catch (err) {
        console.error('🚫 Gagal mengirim cerita:', err);
      }
    }

    await renderPendingStories(); // refresh tampilan
  } catch (error) {
    console.error('⚠️ Gagal sinkronisasi cerita offline:', error);
  }
}
