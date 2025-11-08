import API from '../data/api.js';
import SessionManager from '../utils/session-manager.js';
import StoryDB from '../data/story-db.js';

export default class StoryModel {
  async getStories() {
    const token = SessionManager.getToken();
    if (!token) return [];
    return await API.getStories(token);
  }

  async addStory(formData) {
    const authHeader = SessionManager.getAuthHeader();
    const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: formData,
    });

    const data = await response.json();
    return data;
  }

  // 💾 IndexedDB manual save
saveFavorite(story) {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (!favorites.some(fav => fav.id === story.id)) {
    favorites.push(story);
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }
}


  async getFavorites() {
    return await StoryDB.getAllStories();
  }

  async deleteFavorite(id) {
    await StoryDB.deleteStory(id);
  }
}
