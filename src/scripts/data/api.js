import CONFIG from '../config.js';

const API = {
  async getStories(token) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Gagal memuat data cerita');
      return result.listStory || [];
    } catch (error) {
      console.error('Gagal memuat data cerita:', error);
      return [];
    }
  },

  async addStory({ description, photo, lat, lon, token }) {
    try {
      const formData = new FormData();
      formData.append('description', description);
      if (lat && lon) {
        formData.append('lat', lat);
        formData.append('lon', lon);
      }
      formData.append('photo', photo);

      const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal menambah cerita');
      return result;
    } catch (error) {
      console.error('Gagal menambah cerita:', error);
      return null;
    }
  },
};

export default API;