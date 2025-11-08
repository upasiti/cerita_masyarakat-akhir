export default class StoryView {
  bindElements() {
    this.loadingElement = document.getElementById('loading');
    this.container = document.getElementById('stories-container');
    this.modal = document.getElementById('detailModal');
    this.modalContent = document.getElementById('modal-content');
    this.closeBtn = document.getElementById('closeModal');
  }

  showLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'block';
    }
  }

  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
  }

  displayStories(stories) {
    if (!this.container) return;

    if (!stories.length) {
      this.container.innerHTML = `
        <p class="no-stories" tabindex="0">Tidak ada cerita yang tersedia.</p>
      `;
      return;
    }

    this.container.innerHTML = stories
      .map(
        (story) => `
      <article class="story-card" tabindex="0" data-id="${story.id}">
        <img 
          src="${story.photoUrl}" 
          alt="Gambar cerita ${story.name}" 
          class="story-image" 
          loading="lazy"
        />
        <h3 class="story-name">${story.name}</h3>
        <p class="story-description">${story.description}</p>
        <p class="story-date">${new Date(story.createdAt).toLocaleString('id-ID')}</p>
        <div class="story-actions">
          <button class="detail-button" data-id="${story.id}" aria-label="Lihat detail cerita ${story.name}">
            📖 Lihat Detail
          </button>
          <button class="save-fav" data-id="${story.id}" aria-label="Simpan cerita ${story.name}">
            💾 Simpan Story
          </button>
        </div>
      </article>
    `
      )
      .join('');

    // aktifkan penyimpanan favorit
    this.bindSaveFavorite(stories);
  }

  bindAddStoryForm(handler) {
    const form = document.querySelector('#addStoryForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      handler(formData);
    });
  }

  bindDetailButton(stories, onMapFocus) {
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modal-content');
    const closeModal = document.getElementById('closeModal');

    if (!modal || !modalContent) {
      console.warn('⚠️ Elemen modal belum ditemukan di DOM.');
      return;
    }

    document.querySelectorAll('.detail-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const story = stories.find((s) => s.id === id);
        if (!story) return;

        modalContent.innerHTML = `
          <div class="modal-content-wrapper">
            <span id="closeModalInner" class="close-button">&times;</span>
            <img src="${story.photoUrl}" alt="${story.name}" class="modal-image" />
            <h3>${story.name}</h3>
            <p class="modal-description">${story.description}</p>
            ${
              story.lat && story.lon
                ? `<button 
                    id="focusMapBtn" 
                    class="focus-map-btn" 
                    data-lat="${story.lat}" 
                    data-lon="${story.lon}">
                    📍 Lihat Lokasi di Peta
                   </button>`
                : '<p><em>Tidak ada lokasi</em></p>'
            }
          </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const closeInner = document.getElementById('closeModalInner');
        if (closeInner) {
          closeInner.addEventListener('click', () => this.hideModal());
        }

        const focusBtn = document.getElementById('focusMapBtn');
        if (focusBtn) {
          focusBtn.addEventListener('click', () => {
            const lat = parseFloat(focusBtn.dataset.lat);
            const lon = parseFloat(focusBtn.dataset.lon);
            this.hideModal();

            const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
            window.open(mapsUrl, '_blank');
          });
        }
      });
    });

    if (closeModal) {
      closeModal.addEventListener('click', () => this.hideModal());
    }

    window.addEventListener('click', (e) => {
      if (e.target === modal) this.hideModal();
    });
  }

  // 🆕 Simpan cerita ke IndexedDB
  bindSaveFavorite(stories) {
    document.querySelectorAll('.save-fav').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const story = stories.find((s) => s.id === id);
        if (!story) return;

        const DB_NAME = 'story-favorites-db';
        const STORE_NAME = 'favorites';

        const openDB = () =>
          new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
              }
            };
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
          });

        const saveToDB = async (data) => {
          const db = await openDB();
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(data);
          return new Promise((resolve) => {
            tx.oncomplete = () => resolve(true);
          });
        };

        await saveToDB(story);
        alert('✅ Cerita disimpan ke favorit!');
      });
    });
  }

  hideModal() {
    const modal = document.getElementById('detailModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}
