document.addEventListener("DOMContentLoaded", async () => {
  const sidebarContainer = document.getElementById("sidebar-container");
  if (!sidebarContainer) return;

  const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
  const sidebarUrl = `${window.location.origin}${currentDir}components/sidebar.html?v=3`;

  let sidebarHtml = null;

  try {
    const response = await fetch(sidebarUrl);
    if (response.ok) {
      sidebarHtml = await response.text();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("Gagal mengambil file sidebar:", error);
    return;
  }

  try {
    sidebarContainer.innerHTML = sidebarHtml;

    const adminApp = document.getElementById("adminApp");
    let topbar = document.querySelector(".main-panel > .topbar");
    let sidebarToggle = document.getElementById("sidebarToggle");
    let sidebarCollapseButton = document.getElementById("sidebarCollapseButton");
    let sidebarBackdrop = document.getElementById("sidebarBackdrop");

    if (topbar && !sidebarToggle) {
      sidebarToggle = document.createElement("button");
      sidebarToggle.id = "sidebarToggle";
      sidebarToggle.className = "icon-button";
      sidebarToggle.type = "button";
      sidebarToggle.setAttribute("aria-label", "Buka atau tutup menu");
      sidebarToggle.setAttribute("aria-expanded", "true");
      sidebarToggle.innerHTML = '<iconify-icon icon="lucide:menu" aria-hidden="true"></iconify-icon>';
      topbar.prepend(sidebarToggle);
    }

    if (!sidebarCollapseButton) {
      const sidebar = sidebarContainer.querySelector(".sidebar");
      if (sidebar) {
        sidebarCollapseButton = document.createElement("button");
        sidebarCollapseButton.id = "sidebarCollapseButton";
        sidebarCollapseButton.className = "sidebar-collapse-button";
        sidebarCollapseButton.type = "button";
        sidebarCollapseButton.setAttribute("aria-label", "Tutup menu");
        sidebarCollapseButton.innerHTML = '<iconify-icon icon="mdi:chevron-left" aria-hidden="true"></iconify-icon>';
        sidebar.append(sidebarCollapseButton);
      }
    }

    if (!sidebarBackdrop) {
      sidebarBackdrop = document.createElement("button");
      sidebarBackdrop.id = "sidebarBackdrop";
      sidebarBackdrop.className = "sidebar-backdrop";
      sidebarBackdrop.type = "button";
      sidebarBackdrop.setAttribute("aria-label", "Tutup menu");
      sidebarBackdrop.hidden = true;
      adminApp?.insertAdjacentElement("afterbegin", sidebarBackdrop);
    }

    const setSidebarOpen = (isOpen) => {
      if (adminApp) adminApp.classList.toggle("sidebar-collapsed", !isOpen);
      if (sidebarToggle) sidebarToggle.setAttribute("aria-expanded", String(isOpen));
      if (sidebarBackdrop) {
        sidebarBackdrop.hidden = !isOpen || !window.matchMedia("(max-width: 1024px)").matches;
      }
    };

    if (window.matchMedia("(max-width: 1024px)").matches) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }

    sidebarToggle?.addEventListener("click", () => {
      const isCollapsed = adminApp?.classList.contains("sidebar-collapsed");
      setSidebarOpen(Boolean(isCollapsed));
    });

    sidebarCollapseButton?.addEventListener("click", () => setSidebarOpen(false));
    sidebarBackdrop?.addEventListener("click", () => setSidebarOpen(false));

    window.matchMedia("(max-width: 1024px)").addEventListener("change", (event) => {
      setSidebarOpen(!event.matches);
    });

    const currentPath = window.location.pathname.split("/").pop() || "Dashboard_Admin.html";
    const navLinks = sidebarContainer.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === currentPath) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });

    initLogoutHandler();
  } catch (error) {
    console.error("Error rendering sidebar:", error);
  }
});

function initLogoutHandler() {
  const logoutButton = document.getElementById("adminLogoutButton");
  if (!logoutButton) return;

  if (!document.getElementById("logoutModalOverlay")) {
    const modalHTML = `
        <div id="logoutModalOverlay" class="modal-overlay" hidden>
          <div id="logoutConfirmDialog" class="logout-dialog" role="alertdialog" aria-modal="true">
            <p class="logout-dialog-message">Apakah anda yakin ingin keluar ?</p>
            <div class="logout-dialog-actions">
              <button id="cancelLogoutBtn" class="button button-cancel" type="button">Batal</button>
              <button id="confirmLogoutBtn" class="button button-secondary" type="button">OKE</button>
            </div>
          </div>
          <div id="logoutSuccessDialog" class="logout-dialog logout-success-dialog" hidden>
            <svg class="logout-success-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="#24a148"></circle>
              <path d="m7 12.5 3.2 3.2 6.8-7" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
            </svg>
            <p class="logout-dialog-message">Anda berhasil keluar</p>
            <button id="closeLogoutSuccessBtn" class="logout-success-button" type="button">Oke</button>
          </div>
          <div id="logoutErrorDialog" class="logout-dialog logout-error-dialog" role="alertdialog" aria-modal="true" hidden>
            <svg class="logout-error-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="#e53935"></circle>
              <path d="m8.5 8.5 7 7m0-7-7 7" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="2"></path>
            </svg>
            <p class="logout-dialog-message logout-error-title">Anda gagal keluar</p>
            <p class="logout-error-description" id="logoutErrorMessage">Periksa koneksi internet anda</p>
            <button id="retryLogoutBtn" class="logout-success-button logout-retry-button" type="button">Coba lagi</button>
          </div>
        </div>
      `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  const overlay = document.getElementById("logoutModalOverlay");
  const confirmDialog = document.getElementById("logoutConfirmDialog");
  const successDialog = document.getElementById("logoutSuccessDialog");
  const errorDialog = document.getElementById("logoutErrorDialog");

  const cancelBtn = document.getElementById("cancelLogoutBtn");
  const confirmBtn = document.getElementById("confirmLogoutBtn");
  const retryBtn = document.getElementById("retryLogoutBtn");
  const okSuccessBtn = document.getElementById("closeLogoutSuccessBtn");
  const errorMessage = document.getElementById("logoutErrorMessage");

  function showState({ confirm, success, error }) {
    if (confirmDialog) confirmDialog.hidden = !confirm;
    if (successDialog) successDialog.hidden = !success;
    if (errorDialog) errorDialog.hidden = !error;
  }

  logoutButton.addEventListener("click", () => {
    if (overlay) overlay.hidden = false;
    showState({ confirm: true, success: false, error: false });
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (overlay) overlay.hidden = true;
    });
  }

  async function executeLogout() {
    const API_BASE_URL = window.BASE_URL || window.location.origin;
    const logoutUrl = `${API_BASE_URL}/logout.php`;

    if (confirmBtn) confirmBtn.disabled = true;
    if (retryBtn) retryBtn.disabled = true;

    try {
      const response = await fetch(logoutUrl, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok || !result.status) {
        throw new Error(result.message || "Gagal melakukan proses keluar dari server.");
      }

      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("admin_logged_in");
      sessionStorage.clear();

      showState({ confirm: false, success: true, error: false });
    } catch (error) {
      console.error("Logout error:", error);
      if (errorMessage) {
        errorMessage.textContent = !navigator.onLine || error instanceof TypeError
          ? "Periksa koneksi internet anda"
          : error.message || "Silakan coba lagi.";
      }
      showState({ confirm: false, success: false, error: true });
    } finally {
      if (confirmBtn) confirmBtn.disabled = false;
      if (retryBtn) retryBtn.disabled = false;
    }
  }

  if (confirmBtn) confirmBtn.addEventListener("click", executeLogout);
  if (retryBtn) retryBtn.addEventListener("click", executeLogout);

  if (okSuccessBtn) {
    okSuccessBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay && !successDialog.hidden) {
        window.location.href = "index.html";
      } else if (e.target === overlay && !confirmDialog.hidden) {
        overlay.hidden = true;
      }
    });
  }
}

window.addEventListener("storage", (event) => {
  const authWasRemoved = event.key === null || (["user", "role", "admin_logged_in"].includes(event.key) && event.newValue === null) || (event.key === "role" && event.newValue !== "admin");
  if (!authWasRemoved) return;
  if (localStorage.getItem("role") === "admin" && localStorage.getItem("user")) return;

  const currentPage = window.location.pathname.split("/").pop() || "Dashboard_Admin.html";
  window.location.replace(`login.html?returnTo=${encodeURIComponent(currentPage)}`);
});
