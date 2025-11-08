import routes, { checkAuth } from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { transitionTo } from '../utils/transitions.js';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._setupAccessibility();
    this._updateAuthNav();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    this.#drawerButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.#navigationDrawer.classList.toggle('open');
      }
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  _setupAccessibility() {
    // Skip to content functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const mainContent = document.querySelector('#main-content');
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
      });
    }

    // Keyboard navigation for drawer
    this.#navigationDrawer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.focus();
      }
    });
  }

   async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    
    const protectedRoutes = ['/add-story']; 
    if (protectedRoutes.includes(url) && !checkAuth()) return;



if (page) {
  if (document.startViewTransition) {
    document.startViewTransition(async () => {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
    });
  } else {
    await transitionTo(async () => {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
    }, this.#content);
  }

  const mainHeading = this.#content.querySelector('h1');
  if (mainHeading && mainHeading.hasAttribute('tabindex')) {
    mainHeading.focus();
  }
  this._updateAuthNav();
}


  }

    _updateAuthNav() {
    const navAuth = document.querySelector('#nav-auth');
    if (!navAuth) return;

    const isLoggedIn = checkAuth();
    if (isLoggedIn) {
      navAuth.innerHTML = `<button id="logout-btn" class="logout-btn">Logout</button>`;

      const logoutBtn = document.querySelector('#logout-btn');
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken'); // sesuaikan dengan nama token yang kamu pakai
        window.location.hash = '#/login';
        this._updateAuthNav(); // perbarui kembali tombol jadi Login
      });
    } else {
      navAuth.innerHTML = `<a href="#/login">Login</a>`;
    }
  }

}





export default App;
