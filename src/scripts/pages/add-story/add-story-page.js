import StoryModel from '../../mvp/model.js';
import StoryView from '../../mvp/view.js';
import StoryPresenter from '../../mvp/presenter.js';
import Camera from '../../utils/camera.js';
import { checkAuth } from '../../utils/auth.js';
import { savePendingStory } from '../../data/sync-db.js'; // ✅ import tambahan

export default class AddStoryPage {
  constructor() {
    this.model = new StoryModel();
    this.view = new StoryView();
    this.presenter = new StoryPresenter(this.model, this.view);
    this.camera = new Camera();
    this.selectedLocation = null;
    this.map = null;
  }

  async render() {
    return `
      <section class="container">
        <a href="#main-content" class="skip-link">Skip to content</a>
        <h1 tabindex="0">Tambah Cerita Baru</h1>
        
        <form id="add-story-form" class="story-form">
          <div class="form-group">
            <label for="description">Deskripsi Cerita:</label>
            <textarea id="description" name="description" required aria-required="true" rows="4"></textarea>
            <span class="error-message" id="description-error"></span>
          </div>

          <div class="form-group">
            <label for="photo">Foto:</label>
            <input type="file" id="photo" name="photo" accept="image/*" required aria-required="true">
            <span class="error-message" id="photo-error"></span>
            
            <div class="camera-options">
              <button type="button" id="camera-btn" class="camera-btn">Ambil Foto dari Kamera</button>
              <video id="camera-preview" style="display:none" aria-label="Preview kamera"></video>
              <canvas id="camera-capture" style="display:none"></canvas>
              <button type="button" id="capture-btn" style="display:none" class="capture-btn">Ambil Foto</button>
            </div>

            <div id="image-preview" class="image-preview"></div>
          </div>

          <div class="form-group">
            <label>Pilih Lokasi di Peta:</label>
            <div id="location-map" class="location-map"></div>
            <p id="selected-location" class="location-info">Belum memilih lokasi</p>
          </div>

          <button type="submit" class="submit-btn">Tambah Cerita</button>
          <div id="form-message" class="form-message"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    if (!checkAuth()) return;
    await this.loadLeaflet();
    this.initMap();
    this.setupFormValidation();
    this.setupCamera();
  }

  loadLeaflet() {
    return new Promise((resolve) => {
      if (window.L) return resolve();

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

  initMap() {
    this.map = L.map('location-map').setView([-2.5489, 118.0149], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (e) => {
      this.selectedLocation = e.latlng;
      if (this.locationMarker) this.map.removeLayer(this.locationMarker);

      this.locationMarker = L.marker(e.latlng)
        .addTo(this.map)
        .bindPopup('Lokasi terpilih')
        .openPopup();

      document.getElementById('selected-location').textContent =
        `Lokasi terpilih: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
      document.getElementById('selected-location').style.color = '';
    });
  }

  setupFormValidation() {
    const form = document.getElementById('add-story-form');
    const descriptionInput = document.getElementById('description');
    const photoInput = document.getElementById('photo');

    descriptionInput.addEventListener('input', () => {
      this.validateField(descriptionInput, 'description-error', 'Deskripsi harus diisi');
    });

    photoInput.addEventListener('change', (e) => {
      this.validatePhoto(e.target);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (await this.validateForm()) {
        await this.submitForm();
      }
    });
  }

  validateField(input, errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (!input.value.trim()) {
      errorElement.textContent = message;
      input.setAttribute('aria-invalid', 'true');
      return false;
    } else {
      errorElement.textContent = '';
      input.setAttribute('aria-invalid', 'false');
      return true;
    }
  }

  validatePhoto(input) {
    const errorElement = document.getElementById('photo-error');
    if (!input.files || input.files.length === 0) {
      errorElement.textContent = 'Foto harus dipilih';
      input.setAttribute('aria-invalid', 'true');
      return false;
    } else {
      errorElement.textContent = '';
      input.setAttribute('aria-invalid', 'false');
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('image-preview').innerHTML = `
          <img src="${e.target.result}" alt="Preview foto" class="preview-image">
        `;
      };
      reader.readAsDataURL(file);
      return true;
    }
  }

  async validateForm() {
    const descriptionValid = this.validateField(
      document.getElementById('description'),
      'description-error',
      'Deskripsi harus diisi'
    );

    const photoValid = this.validatePhoto(document.getElementById('photo'));

    if (!this.selectedLocation) {
      document.getElementById('selected-location').style.color = 'red';
      return false;
    }

    return descriptionValid && photoValid;
  }

  setupCamera() {
    const cameraBtn = document.getElementById('camera-btn');
    const cameraPreview = document.getElementById('camera-preview');
    const captureBtn = document.getElementById('capture-btn');
    const photoInput = document.getElementById('photo');

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Batalkan Kamera';
    cancelBtn.type = 'button';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.style.display = 'none';
    cameraBtn.parentNode.insertBefore(cancelBtn, cameraPreview.nextSibling);

    cameraBtn.addEventListener('click', async () => {
      try {
        await this.camera.startCamera(cameraPreview);
        cameraPreview.style.display = 'block';
        captureBtn.style.display = 'block';
        cancelBtn.style.display = 'block';
        cameraBtn.style.display = 'none';
      } catch (error) {
        this.showMessage('Tidak dapat mengakses kamera: ' + error.message, 'error');
      }
    });

    captureBtn.addEventListener('click', async () => {
      try {
        const photoFile = await this.camera.capturePhoto(cameraPreview);
        if (photoFile instanceof File) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(photoFile);
          photoInput.files = dataTransfer.files;
          photoInput.dispatchEvent(new Event('change'));
        }

        this.camera.stopCamera();
        cameraPreview.style.display = 'none';
        captureBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        cameraBtn.style.display = 'block';
      } catch (err) {
        this.showMessage('Gagal mengambil foto: ' + err.message, 'error');
      }
    });

    cancelBtn.addEventListener('click', () => {
      this.camera.stopCamera();
      cameraPreview.style.display = 'none';
      captureBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      cameraBtn.style.display = 'block';
    });
  }

  async submitForm() {
    const form = document.getElementById('add-story-form');
    const submitBtn = form.querySelector('.submit-btn');
    const messageElement = document.getElementById('form-message');

    const token = localStorage.getItem('token');
    if (!token) {
      this.showMessage('Token tidak ditemukan. Silakan login ulang.', 'error');
      window.location.hash = '#/login';
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mengirim...';
      messageElement.textContent = '';

      const formData = new FormData();
      formData.append('description', document.getElementById('description').value);
      formData.append('photo', document.getElementById('photo').files[0]);
      if (this.selectedLocation) {
        formData.append('lat', this.selectedLocation.lat);
        formData.append('lon', this.selectedLocation.lng);
      }

      const result = await this.presenter.addStory(formData);

      if (result.success) {
        this.showMessage('Cerita berhasil ditambahkan!', 'success');
        form.reset();
        document.getElementById('image-preview').innerHTML = '';
        setTimeout(() => (window.location.hash = '#/'), 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.warn('📴 Offline: menyimpan cerita ke pending DB', error);

      const photoFile = document.getElementById('photo').files[0];
      const photoUrl = URL.createObjectURL(photoFile);

      const storyData = {
        description: document.getElementById('description').value,
        photoUrl,
        lat: this.selectedLocation?.lat,
        lon: this.selectedLocation?.lng,
        createdAt: new Date().toISOString(),
      };

      await savePendingStory(storyData);
      this.showMessage('📴 Offline: cerita disimpan dan akan dikirim saat online!', 'warning');

      // ✅ kirim token ke Service Worker agar bisa digunakan nanti
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_TOKEN',
          token: token,
        });
      }

      // ✅ daftarkan background sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register('sync-stories');
        console.log('📡 Cerita offline akan disinkronkan nanti.');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Tambah Cerita';
    }
  }

  showMessage(message, type) {
    const messageElement = document.getElementById('form-message');
    messageElement.textContent = message;
    messageElement.className = `form-message ${type}`;
  }
}
