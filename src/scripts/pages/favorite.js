// favorite.js
export default class FavoritePage {
  async render() {
    return `
      <section class="favorite-page">
        <h2>📚 Cerita Tersimpan</h2>
        <div id="favorites-container" class="favorites-list"></div>
      </section>
    `;
  }

  async afterRender() {
    const container = document.getElementById('favorites-container');
    if (!container) return;

    // === IndexedDB Setup ===
    const DB_NAME = 'story-favorites-db';
    const STORE_NAME = 'favorites';
    let db;

    const openDB = () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
          db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = (event) => {
          db = event.target.result;
          resolve(db);
        };
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });

    const getAllFavorites = () =>
      new Promise(async (resolve) => {
        const database = await openDB();
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });

    const deleteFavorite = async (id) => {
      const database = await openDB();
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => loadFavorites();
    };

    // === Render list favorit ===
    const loadFavorites = async () => {
      const favorites = await getAllFavorites();

      if (!favorites.length) {
        container.innerHTML = `
          <p class="no-favorites">Belum ada cerita yang disimpan 💾</p>
        `;
        return;
      }

      container.innerHTML = favorites
        .map(
          (fav) => `
          <article class="favorite-card" tabindex="0" data-id="${fav.id}">
            <img 
              src="${fav.photoUrl}" 
              alt="Gambar ${fav.name}" 
              class="favorite-image" 
              loading="lazy"
            />
            <h3>${fav.name}</h3>
            <p>${fav.description}</p>
            <p class="story-date">${new Date(fav.createdAt).toLocaleString('id-ID')}</p>
            <div class="favorite-actions">
              <button class="view-map" data-lat="${fav.lat}" data-lon="${fav.lon}">📍 Lihat Lokasi</button>
              <button class="remove-fav" data-id="${fav.id}">🗑️ Hapus</button>
            </div>
          </article>
        `
        )
        .join('');

      bindEvents();
    };

    const bindEvents = () => {
      // Tombol buka lokasi
      document.querySelectorAll('.view-map').forEach((btn) => {
        btn.addEventListener('click', () => {
          const lat = btn.dataset.lat;
          const lon = btn.dataset.lon;
          if (lat && lon) {
            window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
          } else {
            alert('Lokasi tidak tersedia untuk cerita ini.');
          }
        });
      });

      // Tombol hapus
      document.querySelectorAll('.remove-fav').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          await deleteFavorite(id);
        });
      });
    };

    // Jalankan
    await loadFavorites();
  }
}
