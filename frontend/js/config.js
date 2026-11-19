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

  var backendBaseUrl = injected || window.location.origin;
  var isLocalHost = /^(localhost|127\.0\.0\.1|::1)$/i.test(window.location.hostname);
  var frontendPathIndex = window.location.pathname.toLowerCase().indexOf("/frontend/");

  if (isLocalHost && frontendPathIndex !== -1) {
    var backendOrigin = new URL(backendBaseUrl, window.location.origin).origin;
    var projectPath = window.location.pathname.substring(0, frontendPathIndex);
    backendBaseUrl = `${backendOrigin}${projectPath}/backend`;
  } else if (!isLocalHost) {
    backendBaseUrl = window.location.origin;
  }

  // Hosting proxies API paths on the frontend origin; local XAMPP resolves the sibling backend folder.
  window.BASE_URL = backendBaseUrl.replace(/\/+$/, "");
  window.PROFILE_API_BASE = window.BASE_URL;
  window.AUTH_API_BASE = window.BASE_URL;
})();
