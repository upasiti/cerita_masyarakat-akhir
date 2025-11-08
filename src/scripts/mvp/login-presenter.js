import AuthModel from '../model/auth-model.js';
import SessionManager from '../utils/session-manager.js';

export default class LoginPresenter {
  constructor(view) {
    this.view = view;
  }

async login({ email, password }) {
  if (!email || !password) {
    this.view.showMessage('Email dan kata sandi wajib diisi.', true);
    return;
  }

  this.view.showMessage('Memproses login...');

  try {
    const tokenData = await AuthModel.login({ email, password });
    console.log('Hasil dari AuthModel.login():', tokenData); // 🔍 Tambahkan ini

    if (!tokenData || !tokenData.token) {
      throw new Error('Token tidak ditemukan di respons API');
    }

    SessionManager.saveSession(tokenData);
    this.view.showMessage('Login berhasil! Mengalihkan...');
    setTimeout(() => this.view.redirectToHome(), 1500);

  } catch (error) {
    console.error('Login error:', error);
    this.view.showMessage(`Login gagal: ${error.message}`, true);
  }
}

}
