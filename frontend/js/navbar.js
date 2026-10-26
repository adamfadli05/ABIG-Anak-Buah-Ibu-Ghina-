document.addEventListener("DOMContentLoaded", function () {
  const navbarContainer = document.getElementById("navbar-container");

  // 1. TAMBAHKAN STYLING KUSTOM SWEETALERT UNTUK UKURAN & BORDER
  if (!document.getElementById("figma-sweetalert-style")) {
    const styleEl = document.createElement("style");
    styleEl.id = "figma-sweetalert-style";
    styleEl.innerHTML = `
      .swal2-container.swal2-backdrop-show, .swal2-container.swal2-bg {
        background: rgba(217, 217, 217, 0.7) !important;
      }
      .figma-logout-popup {
        width: 339px !important;
        height: 185px !important;
        border-radius: 20px !important;
        padding: 24px 20px 8px 20px !important;
        box-sizing: border-box !important;
        background-color: #ffffff !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        overflow: hidden !important;
      }
      .figma-logout-popup .swal2-actions {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        width: 100% !important;
        margin: 0 0 16px 0 !important;
      }
      .figma-btn-cancel,
      .figma-btn-confirm {
        width: 100px !important;
        height: 35px !important;
        border-radius: 0px !important;
        font-weight: 400 !important;
        font-size: 20px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 20px !important;
        border: none !important;
        cursor: pointer !important;
      }
      .figma-btn-cancel {
        background-color: #d3d3d3 !important;
        color: #001b7d !important;
      }
      .figma-btn-confirm {
        background-color: #001b7d !important;
        color: #ffffff !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // 2. FETCH & INJECT NAVBAR.HTML
  if (navbarContainer) {
    fetch("components/navbar.html")
      .then((response) => {
        if (response.ok) return response.text();
        throw new Error("Gagal memuat navbar.html");
      })
      .then((html) => {
        navbarContainer.innerHTML = html;
        window.initNavbarState();
      })
      .catch((error) => console.error("Gagal memuat navbar:", error));
  }

  // 3. FUNGSI UTAMA RENDER STATUS LOGIN & KONDISI TOMBOL LOGOUT
  window.initNavbarState = function () {
    const userData = localStorage.getItem("user");
    const userRole = localStorage.getItem("role");

    const isLoggedIn = (!!userData && userData !== "null" && userData !== "undefined") || !!userRole;

    const profileButton = document.getElementById("profileButton");
    const btnLogout = document.getElementById("btnLogout");

    if (profileButton) {
      profileButton.title = isLoggedIn ? "Profil" : "Masuk / Profil";
      profileButton.innerHTML = `<iconify-icon icon="famicons:person" width="22" height="22"></iconify-icon>`;
    }

    if (btnLogout) {
      if (isLoggedIn) {
        btnLogout.style.setProperty("display", "inline-flex", "important");
      } else {
        btnLogout.style.setProperty("display", "none", "important");
      }
    }

    // Log status sistem auth ke console untuk debugging
    if (userData) {
      console.info("[Auth System] Status: User Terautentikasi");
    } else {
      console.log("[Auth System] Status: Belum ada sesi login (Guest).");
    }
  };

  // 4. EVENT DELEGATION KLIK NAVBAR (MENAMPUNG SEMUA MENU & NAVIGASI)
  document.addEventListener("click", function (event) {
    const navMenuToggle = event.target.closest("#navMenuToggle");
    const navDropdownMenu = document.getElementById("navDropdownMenu");
    const btnLogout = event.target.closest("#btnLogout");
    const profileButton = event.target.closest("#profileButton");
    const savedButton = event.target.closest("#savedButton");
    const reviewButton = event.target.closest("#reviewButton");

    const userData = localStorage.getItem("user");
    const userRole = localStorage.getItem("role");
    const isLoggedIn = (!!userData && userData !== "null" && userData !== "undefined") || !!userRole;

    // Toggle Dropdown Menu
    if (navMenuToggle) {
      event.preventDefault();
      event.stopPropagation();
      if (navDropdownMenu) {
        navDropdownMenu.classList.toggle("show");
      }
      return;
    }

    if (navDropdownMenu && navDropdownMenu.classList.contains("show") && !navDropdownMenu.contains(event.target) && !navMenuToggle) {
      navDropdownMenu.classList.remove("show");
    }

    // Proteksi Navigasi Halaman Profil
    if (profileButton) {
      event.preventDefault();
      if (!isLoggedIn) {
        window.location.href = "login.html";
      }
      return;
    }

   // Proteksi Navigasi Halaman Saved (Ikon Bookmark)
   if (savedButton) {
    const checkUser = localStorage.getItem("user");
    const checkRole = localStorage.getItem("role");
    const isLoggedIn = (checkUser && checkUser !== "null" && checkUser !== "undefined") || (checkRole && checkRole !== "null");

    if (!isLoggedIn) {
      // Jika BELUM LOGIN, batalkan pindah halaman dan arahkan ke login.html
      event.preventDefault();
      window.location.href = "login.html";
    }
    // Jika SUDAH LOGIN, biarkan kosong! 
    // Browser akan otomatis membaca href="saved.html" dari HTML dan langsung berpindah halaman dengan mulus.
    return;
  }

    // Proteksi Navigasi Halaman Reviews
    if (reviewButton) {
      event.preventDefault();
      if (!isLoggedIn) {
        window.location.href = "login.html";
      }
      return;
    }

    // SWEETALERT POPUP KONFIRMASI LOGOUT
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
        title: '<span style="color: #001b7d; font-weight: 400; font-size: 24px; display: inline-block; margin-bottom: 5px;">Apakah anda yakin<br>ingin keluar ?</span>',
        showCancelButton: true,
        confirmButtonText: "OKE",
        cancelButtonText: "Batal",
        confirmButtonColor: "#001b7d",
        cancelButtonColor: "#d3d3d3",
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
          popup: "figma-logout-popup",
          confirmButton: "figma-btn-confirm",
          cancelButton: "figma-btn-cancel",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; width: 100%; height: 100%; box-sizing: border-box;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1; margin-top: 5px;">
                  <iconify-icon icon="mdi:check-circle" style="color: #319F43; font-size: 38px; margin-bottom: 2px;"></iconify-icon>
                  <p style="color: #001b7d; font-family: 'Inter'; font-weight: 400; font-size: 24px; margin: 0; text-align: center;">Anda berhasil keluar</p>
                </div>
                <div style="width: 100%; display: flex; justify-content: flex-end; margin-top: 15px; padding-right: 0px;">
                  <button id="swalCustomOkeBtn" style="background: none !important; border: none !important; color: #001b7d !important; font-family: 'Inter' !important; font-size: 18px !important; font-weight: 400 !important; text-decoration: underline !important; cursor: pointer !important; padding: 0px !important;">Oke</button>
                </div>
              </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            customClass: { popup: "figma-logout-popup" },
            didOpen: () => {
              const okeBtn = document.getElementById("swalCustomOkeBtn");
              if (okeBtn) {
                okeBtn.addEventListener("click", () => {
                  Swal.close();
                  executeLogout();
                });
              }
            },
          });
        }
      });
    }
  });

  // Fungsi Eksekusi Hapus Sesi Logout
  function executeLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.clear();

    fetch("http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend/api/logout.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .catch((err) => console.error("Logout backend error:", err))
      .finally(() => {
        window.location.replace("index.html");
      });
  }
});
