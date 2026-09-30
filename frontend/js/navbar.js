// Memuat navbar dari components/navbar.html supaya file navbar terpisah.
fetch("components/navbar.html")
  .then(response => {
    if (!response.ok) throw new Error("Navbar tidak ditemukan");
    return response.text();
  })
  .then(html => {
    document.getElementById("navbar-container").innerHTML = html;
    setupNavbarButtons();
  })
  .catch(error => {
    console.error(error);
    document.getElementById("navbar-container").innerHTML =
      '<header class="navbar"><a class="brand" href="index.html"><span>MANGAN</span><span>yukkk</span></a></header>';
  });

function setupNavbarButtons() {
  document.getElementById("loginButton")?.addEventListener("click", showGoogleLogin);
  document.getElementById("savedButton")?.addEventListener("click", () => {
    alert("Fitur tempat tersimpan akan dibuat setelah fitur login dan database tersedia.");
  });
  document.getElementById("settingsButton")?.addEventListener("click", () => {
    alert("Pengaturan akan ditambahkan nanti.");
  });
}

function showGoogleLogin() {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="login-modal" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
      <h2 id="loginTitle">Masuk ke Mangan Yukkk</h2>
      <p>Login diperlukan untuk menyimpan tempat kuliner, memberi rating, dan menulis ulasan.</p>
      <button class="google-login" id="googleDemoButton"><span class="google-g">G</span> Lanjutkan dengan Google</button>
      <button class="close-modal" id="closeLogin">Batal</button>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector("#closeLogin").addEventListener("click", () => backdrop.remove());
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) backdrop.remove();
  });
  backdrop.querySelector("#googleDemoButton").addEventListener("click", () => {
    alert("Ini masih tombol contoh (UI). Login Google sungguhan perlu konfigurasi Google OAuth dan backend.");
    backdrop.remove();
  });
}
