document.addEventListener("DOMContentLoaded", async function () {
  const navbarContainer = document.getElementById("navbar-container");

  // 1. FETCH & INJECT NAVBAR.HTML
  if (navbarContainer) {
    try {
      const response = await fetch("components/navbar.html");
      if (response.ok) {
        navbarContainer.innerHTML = await response.text();
        await window.initNavbarState();
      }
    } catch (error) {
      console.error("Gagal memuat navbar.html:", error);
    }
  }

  // 2. FUNGSI UTAMA RENDER STATUS LOGGED IN / OUT
  window.initNavbarState = async function () {
    const BASE_URL = "http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend";
    let userData = localStorage.getItem("user");
    let user = null;

    if (userData) {
      try {
        user = JSON.parse(userData);
        if (typeof user === "string") user = JSON.parse(user);
      } catch (e) {
        console.error("Gagal parse localStorage user:", e);
        user = null;
      }
    }

    // FALLBACK: Cek PHP Session jika localStorage belum sempat terisi
    if (!user) {
      try {
        const res = await fetch(`${BASE_URL}/api/me.php`, { credentials: "include" });
        const data = await res.json();
        if (data.status && data.data) {
          user = data.data;
          localStorage.setItem("user", JSON.stringify(data.data));
          localStorage.setItem("role", data.role || "user");
        }
      } catch (err) {
        console.log("Cek session backend skip.");
      }
    }

    // Cek keberadaan user
    const isLoggedIn = !!user;

    const profileButton = document.getElementById("profileButton");
    const btnLogout = document.getElementById("btnLogout");

    if (profileButton) {
      profileButton.title = isLoggedIn ? (user.nama || user.name || "Profil") : "Masuk / Profil";

      const foto = user?.foto_profil || user?.picture || user?.avatar;
      if (isLoggedIn && foto) {
        profileButton.innerHTML = `
          <img src="${foto}" alt="${user.nama || 'Profil'}" 
               style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; display: block;" 
               onerror="this.onerror=null; this.outerHTML='<iconify-icon icon=\\'famicons:person\\' width=\\'22\\' height=\\'22\\'></iconify-icon>';" />
        `;
      } else {
        profileButton.innerHTML = `<iconify-icon icon="famicons:person" width="22" height="22"></iconify-icon>`;
      }
    }

    // PAKSA TAMPILKAN TOMBOL LOGOUT JIKA USER TERDAPAT PADA SESSION/LOCALSTORAGE
    if (btnLogout) {
      if (isLoggedIn) {
        btnLogout.style.display = "inline-flex";
      } else {
        btnLogout.style.display = "none";
      }
    }
  };

  // 3. EVENT DELEGATION KLIK NAVBAR
  document.addEventListener("click", function (event) {
    const navMenuToggle = event.target.closest("#navMenuToggle");
    const navDropdownMenu = document.getElementById("navDropdownMenu");
    const btnLogout = event.target.closest("#btnLogout");
    const profileButton = event.target.closest("#profileButton");
    const savedButton = event.target.closest("#savedButton");

    const userData = localStorage.getItem("user");
    const isLoggedIn = !!userData;

    if (navMenuToggle) {
      event.preventDefault();
      event.stopPropagation();
      if (navDropdownMenu) {
        navDropdownMenu.classList.toggle("show");
      }
      return;
    }

    if (navDropdownMenu && !navDropdownMenu.contains(event.target)) {
      navDropdownMenu.classList.remove("show");
    }

    if (profileButton) {
      event.preventDefault();
      window.location.href = isLoggedIn ? "profile.html" : "login.html";
      return;
    }

    if (savedButton) {
      event.preventDefault();
      window.location.href = isLoggedIn ? "saved.html" : "login.html";
      return;
    }

    // SWEETALERT POPUP LOGOUT
    if (btnLogout) {
      event.preventDefault();
      event.stopPropagation();

      if (typeof Swal === "undefined") {
        if (confirm("Apakah anda yakin ingin keluar ?")) {
          executeLogout();
        }
        return;
      }

      Swal.fire({
        title: '<span style="color: #001b7d; font-weight: 600; font-size: 18px;">Apakah anda yakin<br>ingin keluar ?</span>',
        showCancelButton: true,
        confirmButtonText: 'OKE',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#001b7d',
        cancelButtonColor: '#d3d3d3',
        reverseButtons: true,
        customClass: {
          popup: 'figma-logout-popup',
          confirmButton: 'figma-btn-confirm',
          cancelButton: 'figma-btn-cancel'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 10px;">
                <iconify-icon icon="mdi:check-circle" style="color: #28a745; font-size: 48px; margin-bottom: 12px;"></iconify-icon>
                <p style="color: #001b7d; font-weight: 600; font-size: 17px; margin: 0 0 15px 0; text-align: center;">Anda berhasil keluar</p>
                <div style="width: 100%; display: flex; justify-content: flex-end; padding-right: 5px;">
                  <span id="swalCustomOkeBtn" style="color: #001b7d; font-weight: bold; text-decoration: underline; cursor: pointer; font-size: 14px;">Oke</span>
                </div>
              </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            customClass: { popup: 'figma-logout-popup' },
            didOpen: () => {
              const okeBtn = document.getElementById("swalCustomOkeBtn");
              if (okeBtn) {
                okeBtn.addEventListener("click", () => {
                  Swal.close();
                  executeLogout();
                });
              }
            }
          });
        }
      });
    }
  });

  async function executeLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.clear();

    try {
      await fetch("http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend/api/logout.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error("Gagal terhubung ke backend saat logout:", err);
    } finally {
      window.location.replace("index.html");
    }
  }
});