import LoginPresenter from '../../mvp/login-presenter.js';

export default class LoginPage {
  async render() {
    return `
      <section class="login-container">
        <div class="login-card">
          <img src="./images/logo.png" alt="Logo Aplikasi" class="login-logo" />
          <h2 tabindex="0">Masuk ke Aplikasi</h2>

          <form id="login-form" class="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required placeholder="Masukkan email" />
            </div>

            <div class="form-group">
              <label for="password">Kata Sandi</label>
              <input type="password" id="password" name="password" required placeholder="Masukkan kata sandi" />
            </div>

            <button type="submit" class="login-btn">Masuk</button>
            <p id="login-message" class="login-message"></p>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('login-form');
    const message = document.getElementById('login-message');
    const presenter = new LoginPresenter(this);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      await presenter.login({ email, password });
    });
  }

  showMessage(text, isError = false) {
    const message = document.getElementById('login-message');
    message.textContent = text;
    message.className = `login-message ${isError ? 'error' : 'success'}`;
  }

  redirectToHome() {
    window.location.hash = '#/';
  }
}
