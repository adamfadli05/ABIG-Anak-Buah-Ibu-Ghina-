document.addEventListener("DOMContentLoaded", async () => {
  const sidebarContainer = document.getElementById("sidebar-container");
  if (!sidebarContainer) return;

  // Dapatkan path folder tempat file HTML berada (misal: /ABIG-Anak-Buah-Ibu-Ghina-/frontend/)
  const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
  const sidebarUrl = `${window.location.origin}${currentDir}components/sidebar.html`;

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

  // ... sisa kode selanjutnya tetap sama ...

  try {
    sidebarContainer.innerHTML = sidebarHtml;

    // Deteksi halaman aktif berdasarkan nama file URL saat ini
    const currentPath = window.location.pathname.split("/").pop() || "Dashboard_Admin.html";
    const navLinks = sidebarContainer.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === currentPath) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });

    // Inisialisasi Logika Logout
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
            <p class="logout-dialog-message">Apakah anda ingin keluar ?</p>
            <div class="logout-dialog-actions">
              <button id="cancelLogoutBtn" class="button button-cancel" type="button">Batal</button>
              <button id="confirmLogoutBtn" class="button button-secondary" type="button">OKE</button>
            </div>
          </div>
          <div id="logoutProgressDialog" class="logout-dialog logout-success-dialog" role="status" aria-live="polite" hidden>
            <p class="logout-dialog-message">Keluar dari akun...</p>
          </div>
          <div id="logoutSuccessDialog" class="logout-dialog logout-success-dialog" hidden>
            <iconify-icon icon="mdi:check-circle" class="logout-success-icon" aria-hidden="true"></iconify-icon>
            <p class="logout-dialog-message">Anda berhasil keluar</p>
            <button id="closeLogoutSuccessBtn" class="logout-success-button" type="button">Oke</button>
          </div>
          <div id="logoutErrorDialog" class="logout-dialog" hidden>
            <p class="logout-error-message" id="logoutErrorMessage">Gagal keluar. Periksa koneksi internet.</p>
            <button id="retryLogoutBtn" class="button button-secondary" type="button">Coba lagi</button>
          </div>
        </div>
      `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  const overlay = document.getElementById("logoutModalOverlay");
  const confirmDialog = document.getElementById("logoutConfirmDialog");
  const progressDialog = document.getElementById("logoutProgressDialog");
  const successDialog = document.getElementById("logoutSuccessDialog");
  const errorDialog = document.getElementById("logoutErrorDialog");

  const cancelBtn = document.getElementById("cancelLogoutBtn");
  const confirmBtn = document.getElementById("confirmLogoutBtn");
  const retryBtn = document.getElementById("retryLogoutBtn");
  const okSuccessBtn = document.getElementById("closeLogoutSuccessBtn");

  function showState({ confirm, progress, success, error }) {
    if (confirmDialog) confirmDialog.hidden = !confirm;
    if (progressDialog) progressDialog.hidden = !progress;
    if (successDialog) successDialog.hidden = !success;
    if (errorDialog) errorDialog.hidden = !error;
  }

  logoutButton.addEventListener("click", () => {
    if (overlay) overlay.hidden = false;
    showState({ confirm: true, progress: false, success: false, error: false });
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (overlay) overlay.hidden = true;
    });
  }

  async function executeLogout() {
    showState({ confirm: false, progress: true, success: false, error: false });
    const API_BASE_URL = window.BASE_URL || window.location.origin;
    if (confirmBtn) confirmBtn.disabled = true;
    if (retryBtn) retryBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE_URL}/logout.php`, {
        method: "POST",
        headers: { "Accept": "application/json" },
        credentials: "include"
      });

      const result = await response.json();
      if (!response.ok || !result.status) {
        throw new Error(result.message || "Gagal melakukan proses keluar dari server.");
      }

      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("admin_logged_in");
      sessionStorage.clear();
      showState({ confirm: false, progress: false, success: true, error: false });
    } catch (error) {
      console.error("Logout error:", error);
      showState({ confirm: false, progress: false, success: false, error: true });
    } finally {
      if (confirmBtn) confirmBtn.disabled = false;
      if (retryBtn) retryBtn.disabled = false;
    }
  }

  if (confirmBtn) confirmBtn.addEventListener("click", executeLogout);
  if (retryBtn) retryBtn.addEventListener("click", executeLogout);

  // Mengarahkan ke index.html saat tombol "Oke" pada pop-up sukses diklik
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
  const authWasRemoved = event.key === null ||
    (["user", "role", "admin_logged_in"].includes(event.key) && event.newValue === null) ||
    (event.key === "role" && event.newValue !== "admin");
  if (!authWasRemoved) return;
  if (localStorage.getItem("role") === "admin" && localStorage.getItem("user")) return;

  const currentPage = window.location.pathname.split("/").pop() || "Dashboard_Admin.html";
  window.location.replace(`login.html?returnTo=${encodeURIComponent(currentPage)}`);
});
