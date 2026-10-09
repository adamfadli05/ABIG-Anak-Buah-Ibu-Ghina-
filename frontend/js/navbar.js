document.addEventListener("DOMContentLoaded", function () {
  // 1. AMBIL DATA USER DARI LOCALSTORAGE
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const isLoggedIn = !!user; // true jika user ada, false jika tidak

  // Siapkan tampilan foto profil / ikon profil
  let profileContentHTML = `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 12a4.2 4.2 0 1 0 0-8.4A4.2 4.2 0 0 0 12 12Zm0 2c-4.1 0-7.4 2.1-7.4 4.7V21h14.8v-2.3c0-2.6-3.3-4.7-7.4-4.7Z" />
    </svg>
  `;

  // Jika user login dan punya foto profil Google, gunakan gambarnya
  // Jika user login dan punya foto profil, gunakan gambar + fallback jika error
  if (isLoggedIn && user.foto_profil) {
    profileContentHTML = `
      <img src="${user.foto_profil}" alt="${user.nama || 'Profil'}" 
           style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; display: block;" 
           onerror="this.onerror=null; this.outerHTML='<svg viewBox=\\'0 0 24 24\\' width=\\'22\\' height=\\'22\\' fill=\\'currentColor\\'><path d=\\'M12 12a4.2 4.2 0 1 0 0-8.4A4.2 4.2 0 0 0 12 12Zm0 2c-4.1 0-7.4 2.1-7.4 4.7V21h14.8v-2.3c0-2.6-3.3-4.7-7.4-4.7Z\\'/></svg>';" />
    `;
  }

  // Siapkan tombol Logout (Hanya tampil jika user sedang login)
  const logoutButtonHTML = isLoggedIn ? `
    <a href="#" class="nav-icon-link" id="btnLogout" title="Keluar">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M16 17l5-5-5-5v3H9v4h7v3zm-11-14h10v2H5v14h10v2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z"/>
      </svg>
    </a>
  ` : '';

  // 2. SUNTIKKAN HTML NAVBAR
  const navbarHTML = `
    <header class="navbar">
      <a class="brand" href="index.html" aria-label="Mangan Yukkk beranda">
        <span>MANGAN</span>
        <span>yukkk</span>
      </a>

      <nav class="nav-actions" aria-label="Menu pengguna">
        <div class="nav-dropdown-wrapper">
          <!-- Tombol Toggle Slider/Filter -->
          <button type="button" class="nav-icon-btn" id="navMenuToggle" aria-label="Buka menu" aria-expanded="false">
            <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="8" x2="20" y2="8"></line>
              <line x1="4" y1="16" x2="20" y2="16"></line>
              <circle cx="9" cy="8" r="2" fill="currentColor"></circle>
              <circle cx="15" cy="16" r="2" fill="currentColor"></circle>
            </svg>
          </button>

          <!-- Dropdown Menu Ke Samping (Horizontal) -->
          <div class="nav-dropdown-horizontal" id="navDropdownMenu">
            
            <!-- Ikon Tersimpan (Bookmark) -->
            <a href="#" class="nav-icon-link" id="savedButton" title="Kuliner Tersimpan">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M6 3.5h12v17l-6-4-6 4z" />
              </svg>
            </a>

            <!-- Ikon / Foto Profil -->
            <a href="#" class="nav-icon-link" id="profileButton" title="${isLoggedIn ? (user.nama || 'Profil') : 'Masuk / Profil'}">
              ${profileContentHTML}
            </a>

            <!-- Ikon Logout (Tampil jika sudah login) -->
            ${logoutButtonHTML}

          </div>
        </div>
      </nav>
    </header>
  `;

  // 3. MASUKKAN KE DALAM WADAH DI INDEX.HTML
  const navbarContainer = document.getElementById("navbar-container");
  if (navbarContainer) {
    navbarContainer.innerHTML = navbarHTML;
  }

  // 4. JALANKAN LOGIKA TOMBOL & INTERAKSI
  const navMenuToggle = document.getElementById("navMenuToggle");
  const navDropdownMenu = document.getElementById("navDropdownMenu");
  const savedButton = document.getElementById("savedButton");
  const profileButton = document.getElementById("profileButton");
  const btnLogout = document.getElementById("btnLogout");

  // Logika Buka/Tutup Menu Menyamping
  if (navMenuToggle && navDropdownMenu) {
    navMenuToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      navDropdownMenu.classList.toggle("show");
    });
  }

  // Menutup menu jika klik di luar
  document.addEventListener("click", function (event) {
    if (navDropdownMenu && !navDropdownMenu.contains(event.target) && navMenuToggle && !navMenuToggle.contains(event.target)) {
      navDropdownMenu.classList.remove("show");
    }
  });

  // Logika Klik Ikon Tersimpan
  if (savedButton) {
    savedButton.addEventListener("click", function (event) {
      event.preventDefault();
      if (!isLoggedIn) {
        window.location.href = "login.html";
      } else {
        window.location.href = "saved.html";
      }
    });
  }

  // Logika Klik Ikon Profil
  if (profileButton) {
    profileButton.addEventListener("click", function (event) {
      event.preventDefault();
      if (!isLoggedIn) {
        window.location.href = "login.html";
      } else {
        window.location.href = "profile.html";
      }
    });
  }

  // 5. LOGIKA KLIK TOMBOL LOGOUT
  if (btnLogout) {
    btnLogout.addEventListener("click", async function (event) {
      event.preventDefault();
      
      try {
        // Kirim permintaan logout ke backend untuk menghapus session PHP
        await fetch("http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend/api/logout.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        console.error("Gagal terhubung ke backend saat logout:", err);
      } finally {
        // Hapus data session di localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        // Arahkan kembali pengguna ke beranda
        window.location.href = "index.html";
      }
    });
  }
});