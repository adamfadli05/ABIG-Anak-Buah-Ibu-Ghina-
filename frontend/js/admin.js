(() => {
  const API_BASE_URL = "http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend";
  const adminApp = document.getElementById("adminApp");
  const authState = document.getElementById("authState");
  const authMessage = document.getElementById("authMessage");
  const authRetryButton = document.getElementById("authRetryButton");
  const summaryLoading = document.getElementById("summaryLoading");
  const summaryError = document.getElementById("summaryError");
  const summaryErrorMessage = document.getElementById("summaryErrorMessage");
  const summaryRetryButton = document.getElementById("summaryRetryButton");
  const summaryCards = document.getElementById("summaryCards");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const navigationMessage = document.getElementById("navigationMessage");
  const numberFormatter = new Intl.NumberFormat("id-ID");

  async function getJson(url) {
    const response = await fetch(url, { credentials: "include" });
    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error(`Respons server tidak valid (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      const error = new Error(result.message || `Permintaan gagal (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }

    return result;
  }

  async function checkAdminAccess() {
    authRetryButton.hidden = true;
    authMessage.textContent = "Memeriksa akses Admin...";

    try {
      const result = await getJson(`${API_BASE_URL}/api/me.php`);

      if (!result.status || !result.role) {
        throw new Error(result.message || "Status akun tidak dapat diverifikasi.");
      }

      if (result.role !== "admin") {
        localStorage.removeItem("user");
        localStorage.setItem("role", result.role);
        window.location.replace("index.html");
        return;
      }

      localStorage.setItem("user", JSON.stringify(result.data || {}));
      localStorage.setItem("role", result.role);
      document.getElementById("adminName").textContent = result.data?.nama || "Admin";
      authState.hidden = true;
      adminApp.hidden = false;
      await loadDashboardSummary();
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        const returnTo = encodeURIComponent("admin.html");
        window.location.replace(`login.html?returnTo=${returnTo}`);
        return;
      }

      authMessage.textContent = error.message || "Gagal memeriksa akses Admin.";
      authRetryButton.hidden = false;
    }
  }

  function getCount(value) {
    if (value === null || value === undefined || value === "") return 0;
    const count = Number(value);
    if (!Number.isFinite(count) || count < 0) {
      throw new Error("Data ringkasan dari server tidak valid.");
    }
    return count;
  }

  async function loadDashboardSummary() {
    summaryLoading.hidden = false;
    summaryError.hidden = true;
    summaryCards.hidden = true;
    summaryCards.setAttribute("aria-busy", "true");
    summaryRetryButton.disabled = true;

    try {
      const result = await getJson(`${API_BASE_URL}/api/dashboard.php`);
      if (!result.status) {
        throw new Error(result.message || "Ringkasan dashboard gagal dimuat.");
      }

      const data = result.data || result;
      document.getElementById("totalCulinary").textContent = numberFormatter.format(getCount(data.total_culinary));
      document.getElementById("totalCategories").textContent = numberFormatter.format(getCount(data.total_categories));
      document.getElementById("totalUsers").textContent = numberFormatter.format(getCount(data.total_users));
      document.getElementById("totalReviews").textContent = numberFormatter.format(getCount(data.total_reviews));

      summaryCards.hidden = false;
      summaryCards.setAttribute("aria-busy", "false");
      summaryLoading.hidden = true;
    } catch (error) {
      summaryLoading.hidden = true;
      summaryErrorMessage.textContent = error.message || "Ringkasan dashboard gagal dimuat.";
      summaryError.hidden = false;
    } finally {
      summaryRetryButton.disabled = false;
    }
  }

  function setSidebarOpen(isOpen) {
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    adminApp.classList.toggle("sidebar-collapsed", !isOpen);
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
    sidebarToggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
    sidebarBackdrop.hidden = !isMobile || !isOpen;
  }

  authRetryButton.addEventListener("click", checkAdminAccess);
  summaryRetryButton.addEventListener("click", loadDashboardSummary);
  sidebarToggle.addEventListener("click", () => {
    setSidebarOpen(adminApp.classList.contains("sidebar-collapsed"));
  });
  sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));

  document.querySelectorAll("[data-coming-soon]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigationMessage.textContent = `Halaman ${link.dataset.comingSoon} belum tersedia pada kerangka awal ini.`;
      navigationMessage.hidden = false;
    });
  });

  window.addEventListener("resize", () => {
    sidebarBackdrop.hidden = !window.matchMedia("(max-width: 700px)").matches || adminApp.classList.contains("sidebar-collapsed");
  });

  checkAdminAccess();
})();
