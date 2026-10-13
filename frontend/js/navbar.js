document.addEventListener("DOMContentLoaded", function () {
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const isLoggedIn = !!user;

  let profileContentHTML = `
    <iconify-icon icon="famicons:person" width="22" height="22"></iconify-icon>
  `;

  if (isLoggedIn && user.foto_profil) {
    profileContentHTML = `
      <img src="${user.foto_profil}" alt="${user.nama || "Profil"}" 
           style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; display: block;" 
           onerror="this.onerror=null; this.outerHTML='<iconify-icon icon=\\'famicons:person\\' width=\\'22\\' height=\\'22\\'></iconify-icon>';" />
    `;
  }

  const logoutButtonHTML = isLoggedIn
    ? `
    <a href="#" class="nav-icon-link" id="btnLogout" title="Keluar" aria-label="Keluar">
      <iconify-icon icon="basil:logout-solid" width="22" height="22"></iconify-icon>
    </a>
  `
    : "";

  const navbarHTML = `
    <header class="navbar">
      <a class="brand" href="index.html" aria-label="Mangan Yukkk beranda">
        <span>MANGAN</span>
        <span>yukkk</span>
      </a>

      <nav class="nav-actions" aria-label="Menu pengguna">
        <div class="nav-dropdown-wrapper">
          <button type="button" class="nav-icon-btn" id="navMenuToggle" aria-label="Buka menu" aria-expanded="false">
            <iconify-icon icon="hugeicons:filter-horizontal" width="24" height="24"></iconify-icon>
          </button>

          <div class="nav-dropdown-horizontal" id="navDropdownMenu">
            <a href="reviews.html" class="nav-icon-link" id="reviewButton" title="Ulasan Kuliner">
              <iconify-icon icon="fluent:notepad-edit-20-filled" width="22" height="22"></iconify-icon>
            </a>

            <a href="#" class="nav-icon-link" id="savedButton" title="Kuliner Tersimpan">
              <iconify-icon icon="boxicons:bookmark-filled" width="22" height="22"></iconify-icon>
            </a>

            <a href="#" class="nav-icon-link" id="profileButton" title="${isLoggedIn ? user.nama || "Profil" : "Masuk / Profil"}">
              ${profileContentHTML}
            </a>

            ${logoutButtonHTML}
          </div>
        </div>
      </nav>
    </header>
  `;

  const navbarContainer = document.getElementById("navbar-container");
  if (navbarContainer) {
    navbarContainer.innerHTML = navbarHTML;
  }

  const navMenuToggle = document.getElementById("navMenuToggle");
  const navDropdownMenu = document.getElementById("navDropdownMenu");
  const reviewButton = document.getElementById("reviewButton");
  const savedButton = document.getElementById("savedButton");
  const profileButton = document.getElementById("profileButton");
  const btnLogout = document.getElementById("btnLogout");

  if (navMenuToggle && navDropdownMenu) {
    navMenuToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      navDropdownMenu.classList.toggle("show");
    });
  }

  document.addEventListener("click", function (event) {
    if (navDropdownMenu && !navDropdownMenu.contains(event.target) && navMenuToggle && !navMenuToggle.contains(event.target)) {
      navDropdownMenu.classList.remove("show");
    }
  });

  if (reviewButton) {
    reviewButton.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.href = isLoggedIn ? "reviews.html" : "login.html";
    });
  }

  if (savedButton) {
    savedButton.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.href = isLoggedIn ? "saved.html" : "login.html";
    });
  }

  if (profileButton) {
    profileButton.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.href = isLoggedIn ? "profile.html" : "login.html";
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", async function (event) {
      event.preventDefault();
      try {
        await fetch("http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend/api/logout.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Logout error:", err);
      } finally {
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        window.location.href = "index.html";
      }
    });
  }
});
