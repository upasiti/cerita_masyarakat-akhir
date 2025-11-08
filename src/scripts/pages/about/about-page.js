export default class AboutPage {
  async render() {
    return `
      <section class="container">
        <a href="#main-content" class="skip-link">Skip to content</a>
        <h1 tabindex="0">Tentang Aplikasi</h1>
        
        <article class="about-content">
          <h2>Cerita Masyarakat</h2>
          <p>Aplikasi ini dibuat untuk berbagi cerita dan pengalaman masyarakat dari berbagai lokasi di Indonesia.</p>
          
          <h3>Fitur Utama:</h3>
          <ul>
            <li>📖 Membaca cerita dari berbagai daerah</li>
            <li>🗺️ Melihat lokasi cerita di peta interaktif</li>
            <li>📝 Menambahkan cerita baru dengan foto</li>
            <li>📷 Mengambil foto langsung dari kamera</li>
            <li>🎯 Multiple layer peta (Street dan Satellite)</li>
          </ul>
          
          <h3>Teknologi yang Digunakan:</h3>
          <ul>
            <li>JavaScript ES6+</li>
            <li>Leaflet.js untuk peta</li>
            <li>MVP Architecture</li>
            <li>Webpack</li>
            <li>Dicoding Story API</li>
          </ul>
        </article>
      </section>
    `;
  }

  async afterRender() {
    // Setup accessibility
    const headings = document.querySelectorAll('h2, h3');
    headings.forEach((heading, index) => {
      heading.setAttribute('tabindex', '0');
    });
  }
}