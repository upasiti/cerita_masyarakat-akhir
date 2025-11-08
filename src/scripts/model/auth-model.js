const AuthModel = {
  async login({ email, password }) {
    const response = await fetch('https://story-api.dicoding.dev/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.message || 'Login gagal, periksa email dan password.');
    }

    return {
      token: result.loginResult?.token,
      name: result.loginResult?.name,
      email: result.loginResult?.email,
    };
  },
};

export default AuthModel;
