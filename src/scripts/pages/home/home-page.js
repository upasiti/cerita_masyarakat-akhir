import StoryModel from '../../mvp/model.js';
import StoryView from '../../mvp/view.js';
import StoryPresenter from '../../mvp/presenter.js';

export default class HomePage {
  constructor() {
    this.model = new StoryModel();
    this.view = new StoryView();
    this.presenter = new StoryPresenter(this.model, this.view);
  }

  async render() {
    return `
      <section class="container">
        <a href="#main-content" class="skip-link">Skip to content</a>
        <h1 tabindex="0">Cerita Masyarakat</h1>
        <div id="loading" class="loading" style="display: none;">Memuat data...</div>
        
        <div class="content-layout">
          <aside class="stories-sidebar">
            <h2 tabindex="0">Daftar Cerita</h2>
            <div id="stories-container" class="stories-container"></div>
          </aside>
          
          <main class="map-container">
            <h2 tabindex="0">Peta Lokasi</h2>
            <div id="map" class="map"></div>
          </main>
        </div>

        <!-- 🔽 Popup Detail -->
        <div id="detailModal" class="modal" style="display:none;">
          <div class="modal-content-wrapper">
            <span id="closeModal" class="close-button" aria-label="Tutup popup">&times;</span>
            <div id="modal-content"></div>
          </div>
        </div>
        <!-- 🔼 Akhir modal -->

        <div class="floating-action">
          <a href="#/add-story" class="fab" aria-label="Tambah cerita baru">+</a>
        </div>
      </section>
    `;
  }

async afterRender() {
  await this.loadLeaflet();
  this.view.bindElements();
  await this.presenter.init();

  // ✅ Pastikan binding tombol detail setelah DOM siap
  setTimeout(() => {
    const storyCards = document.querySelectorAll('.detail-button');
    if (storyCards.length > 0 && this.presenter.stories?.length) {
      this.view.bindDetailButton(this.presenter.stories, (lat, lon) => {
        if (this.presenter.map && lat && lon) {
          this.presenter.map.setView([lat, lon], 14);
          const targetMarker = this.presenter.markers.find(
            (m) =>
              m.getLatLng().lat === lat &&
              m.getLatLng().lng === lon
          );
          if (targetMarker) targetMarker.openPopup();
        }
      });
    } else {
      console.warn('⚠️ Tidak ditemukan tombol detail di DOM.');
    }
  }, 500); // delay 0.5 detik agar elemen sudah muncul

  this.setupInteractions();
}


  loadLeaflet() {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  setupInteractions() {
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('.story-card')) {
        const storyId = e.target.closest('.story-card').dataset.id;
        const marker = this.presenter.markers.find(
          (m) => m._popup && m._popup._content.includes(`"${storyId}"`)
        );
        if (marker) marker.openPopup();
      }
    });
  }
}
