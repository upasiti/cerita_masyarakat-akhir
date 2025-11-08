import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import LoginPage from '../pages/login/login-page.js';
import FavoritePage from '../pages/favorite.js';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/add-story': new AddStoryPage(),
  '/login': new LoginPage(),
  '/favorite': new FavoritePage(), // ✅ ubah jadi instance
};

// auth.js
export function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Anda harus login terlebih dahulu!');
    window.location.hash = '#/login';
    return false;
  }
  return true;
}

export default routes;
