/**
 * Konfigurasi URL backend terpusat.
 * Nilai BACKEND_URL diinjeksi oleh Nginx saat runtime via window.__ENV__,
 * sehingga tidak ada URL yang hardcoded di source code.
 *
 * Di VPS: Nginx menyuntikkan env ke /js/env.js yang dimuat sebelum config.js
 * Di lokal (tanpa Docker): ganti nilai default di bawah sesuai path lokal.
 */
(function () {
  var injected =
    (window.__ENV__ && window.__ENV__.BACKEND_URL) ||
    "";

  // Fallback: baca dari meta tag <meta name="backend-url" content="...">
  if (!injected) {
    var meta = document.querySelector('meta[name="backend-url"]');
    if (meta) injected = meta.getAttribute("content");
  }

  // Fallback terakhir: origin yang sama (cocok jika frontend & backend satu domain)
  window.BASE_URL = injected || window.location.origin;
  window.PROFILE_API_BASE = window.BASE_URL;
  window.AUTH_API_BASE = window.BASE_URL;
})();
