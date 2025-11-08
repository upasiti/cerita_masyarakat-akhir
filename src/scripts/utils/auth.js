export function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Anda harus login terlebih dahulu!');
    window.location.hash = '#/login';
    return false;
  }
  return true;
}
