const SessionManager = {
  saveSession({ token }) {
    
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    localStorage.setItem('token', cleanToken);
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getAuthHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : '';
  },

  clearSession() {
    localStorage.removeItem('token');
  },
};

export default SessionManager;
