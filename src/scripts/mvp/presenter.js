import StoryModel from './model.js';
import StoryView from './view.js';

class StoryPresenter {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.map = null;
    this.markers = [];
  }

  async init() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sesi login telah berakhir. Silakan login kembali.');
      window.location.hash = '#/login';
      return;
    }

    // 🔄 Urutan diperbaiki
    const stories = await this.showStories(); // ambil data stories
    this.initMap(); // inisialisasi peta
    this.updateMapMarkers(stories); // tampilkan marker di peta
  }

  async showStories() {
    try {
      this.view.showLoading();
      const stories = await this.model.getStories();
      this.view.displayStories(stories);

      // ✅ Simpan data di presenter agar bisa diakses ulang
      this.stories = stories;

      // ✅ Aktifkan event tombol detail + callback fokus ke peta
      this.view.bindDetailButton(stories, (lat, lon) => {
        if (this.map && lat && lon) {
          // Fokus ke lokasi di peta
          this.map.setView([lat, lon], 15);

          // Tambah marker sementara (atau fokuskan marker yang sudah ada)
          const marker = L.marker([lat, lon]).addTo(this.map);
          marker.bindPopup("Lokasi Cerita").openPopup();

          // Bisa ditambah efek animasi zoom
          setTimeout(() => this.map.flyTo([lat, lon], 15, { duration: 1.5 }), 100);
        } else {
          console.warn("❌ Peta belum siap atau koordinat tidak valid");
        }
      });

      // 🆕 Tambahan fitur: tombol "Simpan Story"
      this.view.bindSaveFavorite(stories, async (story) => {
        try {
          await this.model.saveFavorite(story);
          alert(`Story "${story.name}" telah disimpan ke favorit!`);
        } catch (error) {
          console.error("Gagal menyimpan story:", error);
          alert("❌ Terjadi kesalahan saat menyimpan story.");
        }
      });

      return stories;
    } catch (error) {
      console.error(error);
      this.view.showError(error.message);
      return [];
    } finally {
      this.view.hideLoading();
    }
  }

  initMap() {
    if (!document.getElementById('map')) return;

    this.map = L.map('map').setView([-2.5489, 118.0149], 5);

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      attribution: '© Google Satellite',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    streetLayer.addTo(this.map);

    L.control.layers({
      "Street Map": streetLayer,
      "Satellite": satelliteLayer
    }).addTo(this.map);
  }

  updateMapMarkers(stories) {
    if (!this.map) return;

    // Hapus marker lama
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Tambahkan marker baru
    stories.forEach(story => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon])
          .addTo(this.map)
          .bindPopup(`
            <div class="popup-content">
              <img src="${story.photoUrl}" alt="${story.description}" 
                   style="width: 100px; height: 100px; object-fit: cover;">
              <h4>${story.name}</h4>
              <p>${story.description}</p>
            </div>
          `);
        this.markers.push(marker);
      }
    });
  }

  async addStory(formData) {
    try {
      const result = await this.model.addStory(formData);

      if (result.error === false) {
        const stories = await this.showStories();
        this.updateMapMarkers(stories);
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message || 'Gagal menambahkan cerita');
      }
    } catch (error) {
      console.error('Gagal menambahkan cerita:', error);
      return { success: false, message: error.message };
    }
  }

  async handleAddStory(formData) {
    try {
      this.view.showLoading();
      const response = await this.model.addStory(formData);
      if (response.error === false) {
        this.view.showMessage('Cerita berhasil ditambahkan!');
        const stories = await this.showStories(); // reload daftar cerita
        this.updateMapMarkers(stories); // 🔄 perbarui marker di peta
      } else {
        this.view.showError(response.message);
      }
    } catch (error) {
      this.view.showError('Gagal menambahkan cerita!');
    } finally {
      this.view.hideLoading();
    }
  }
}

export default StoryPresenter;
