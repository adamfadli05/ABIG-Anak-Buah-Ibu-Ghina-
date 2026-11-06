(() => {
  const API_BASE_URL = window.BASE_URL || window.location.origin;
  const adminApp = document.getElementById("adminApp");
  const authState = document.getElementById("authState");
  const authTitle = document.getElementById("authTitle");
  const authMessage = document.getElementById("authMessage");
  const authErrorIcon = document.getElementById("authErrorIcon");
  const authIconify = document.getElementById("authIconify");
  const authOfflineIcon = document.getElementById("authOfflineIcon");
  const authRetryButton = document.getElementById("authRetryButton");
  const authRetryLabel = document.getElementById("authRetryLabel");
  const summaryLoading = document.getElementById("summaryLoading");
  const summaryError = document.getElementById("summaryError");
  const summaryErrorTitle = document.getElementById("summaryErrorTitle");
  const summaryErrorIcon = document.getElementById("summaryErrorIcon");
  const summaryIconify = document.getElementById("summaryIconify");
  const summaryOfflineIcon = document.getElementById("summaryOfflineIcon");
  const summaryErrorMessage = document.getElementById("summaryErrorMessage");
  const summaryRetryButton = document.getElementById("summaryRetryButton");
  const summaryRetryLabel = document.getElementById("summaryRetryLabel");
  const summaryCards = document.getElementById("summaryCards");
  const culinaryCards = document.getElementById("culinaryCards");
  const culinaryEmpty = document.getElementById("culinaryEmpty");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const adminLogoutButton = document.getElementById("adminLogoutButton");
  const logoutConfirmModal = document.getElementById("logoutConfirmModal");
  const logoutSuccessModal = document.getElementById("logoutSuccessModal");
  const logoutErrorMessage = document.getElementById("logoutErrorMessage");
  const confirmLogoutButton = document.getElementById("confirmLogoutButton");
  const numberFormatter = new Intl.NumberFormat("id-ID");

  async function getJson(url, options = {}) {
    const response = await fetch(url, { ...options, credentials: "include" });
    let result;

    try {
      result = await response.json();
    } catch {
      const error = new Error(`Respons server tidak valid (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
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
    authErrorIcon.hidden = true;
    authOfflineIcon.toggleAttribute("hidden", true);
    authIconify.hidden = false;
    authTitle.textContent = "Memeriksa akses Admin...";
    authMessage.textContent = "Mohon tunggu sebentar.";

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
      authState.hidden = true;
      adminApp.hidden = false;
      await loadDashboardSummary();
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        const returnTo = encodeURIComponent("Dashboard_Admin.html");
        window.location.replace(`login.html?returnTo=${returnTo}`);
        return;
      }

      const isOffline = !navigator.onLine || error instanceof TypeError;

      authTitle.textContent = isOffline ? "Koneksi Internet Terputus" : "Validasi halaman gagal dilakukan";
      authMessage.textContent = isOffline
        ? "Periksa kembali jaringan internet Anda dan silakan muat ulang halaman."
        : error.message || "Gagal memeriksa akses Admin.";
      authIconify.hidden = isOffline;
      authOfflineIcon.toggleAttribute("hidden", !isOffline);
      authErrorIcon.hidden = false;
      authRetryLabel.textContent = isOffline ? "Muat Ulang" : "Coba lagi";
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

  function resolvePhoto(value) {
    const photo = String(value || "").trim();
    if (!photo) return "https://placehold.co/400x300/e0e0e0/555555?text=Kuliner";
    if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
    if (photo.startsWith("uploads/")) return `${API_BASE_URL}/${photo}`;
    return `${API_BASE_URL}/uploads/${photo.replace(/^\/+/, "")}`;
  }

  function renderCulinaryCards(items) {
    culinaryCards.replaceChildren();
    culinaryEmpty.hidden = items.length > 0;
    culinaryCards.hidden = items.length === 0;

    items.forEach((item) => {
      const title = item.nama_kuliner || item.nama_tempat || "Kuliner";
      const card = document.createElement("a");
      card.className = "culinary-card";
      card.href = `detail_kuliner.html?id=${encodeURIComponent(item.id_tempat)}`;
      card.setAttribute("aria-label", `Lihat detail ${title}`);

      const photo = document.createElement("img");
      photo.className = "culinary-photo";
      photo.src = resolvePhoto(item.foto);
      photo.alt = title;
      photo.addEventListener("error", () => {
        photo.src = "https://placehold.co/400x300/e0e0e0/555555?text=Kuliner";
      }, { once: true });

      const content = document.createElement("div");
      content.className = "culinary-card-content";

      const heading = document.createElement("h3");
      heading.className = "culinary-card-title";
      heading.textContent = title;

      const address = document.createElement("p");
      address.className = "culinary-card-address";
      const locationIcon = document.createElement("iconify-icon");
      locationIcon.setAttribute("icon", "lucide:map-pin");
      locationIcon.setAttribute("aria-hidden", "true");
      const addressText = document.createElement("span");
      addressText.textContent = item.alamat || item.nama_tempat || "Alamat belum tersedia";
      address.append(locationIcon, addressText);

      const footer = document.createElement("div");
      footer.className = "culinary-card-footer";
      const price = Number(item.harga);
      const priceText = document.createElement("span");
      priceText.textContent = item.harga !== null && item.harga !== undefined && item.harga !== "" && Number.isFinite(price)
        ? `Rp. ${new Intl.NumberFormat("id-ID").format(price)}`
        : "Harga belum tersedia";

      const rating = document.createElement("span");
      rating.className = "culinary-card-rating";
      const starIcon = document.createElement("iconify-icon");
      starIcon.setAttribute("icon", "material-symbols:star-rounded");
      starIcon.setAttribute("aria-hidden", "true");
      const ratingValue = Number(item.rata_rata_rating);
      const ratingText = document.createElement("span");
      ratingText.textContent = (Number.isFinite(ratingValue) ? ratingValue : 0).toFixed(1);
      rating.append(starIcon, ratingText);
      footer.append(priceText, rating);
      content.append(heading, address, footer);
      card.append(photo, content);
      culinaryCards.append(card);
    });
  }

  async function loadDashboardSummary() {
    summaryLoading.hidden = false;
    summaryError.hidden = true;
    summaryCards.hidden = true;
    culinaryCards.hidden = true;
    culinaryEmpty.hidden = true;
    summaryCards.setAttribute("aria-busy", "true");
    summaryRetryButton.disabled = true;

    try {
      // Pakai satu endpoint dashboard yang return semua data sekaligus
      const dashResult = await getJson(`${API_BASE_URL}/api/admin/dashboard.php`);
      if (!dashResult.status || !dashResult.data) {
        throw new Error(dashResult.message || "Data dashboard dari server tidak valid.");
      }

      const data = dashResult.data;

      document.getElementById("totalCulinary").textContent = numberFormatter.format(getCount(data.total_kuliner));
      document.getElementById("totalCategories").textContent = numberFormatter.format(getCount(data.total_kategori));
      document.getElementById("totalUsers").textContent = numberFormatter.format(getCount(data.total_user));

      // Ambil data kuliner untuk card grid
      const culinaryResult = await getJson(`${API_BASE_URL}/api/tempat_kuliner.php`);
      if (!culinaryResult.status || !Array.isArray(culinaryResult.data)) {
        throw new Error("Data kuliner dari server tidak valid.");
      }

      // Ambil rating dari detail kuliner secara paralel
      const culinary = culinaryResult.data;
      const details = await Promise.all(culinary.map((item) =>
        getJson(`${API_BASE_URL}/api/detail_kuliner.php?id=${encodeURIComponent(item.id_tempat)}`).catch(() => null)
      ));
      const culinaryWithRatings = culinary.map((item, index) => {
        const detail = details[index];
        const rating = detail?.status && detail?.data ? detail.data.rata_rata_rating : 0;
        return { ...item, rata_rata_rating: rating };
      });

      renderCulinaryCards(culinaryWithRatings);

      summaryCards.hidden = false;
      summaryCards.setAttribute("aria-busy", "false");
      summaryLoading.hidden = true;
    } catch (error) {
      summaryLoading.hidden = true;
      const isOffline = !navigator.onLine || error instanceof TypeError;
      summaryErrorTitle.textContent = isOffline ? "Koneksi Internet Terputus" : "Dashboard gagal dimuat";
      summaryErrorMessage.textContent = isOffline
        ? "Periksa kembali jaringan internet Anda dan muat ulang halaman."
        : error.message || "Ringkasan dashboard gagal dimuat.";
      summaryIconify.hidden = isOffline;
      summaryOfflineIcon.toggleAttribute("hidden", !isOffline);
      summaryRetryLabel.textContent = isOffline ? "Muat Ulang" : "Coba lagi";
      summaryError.hidden = false;
    } finally {
      summaryCards.setAttribute("aria-busy", "false");
      summaryRetryButton.disabled = false;
    }
  }

  function openLogoutConfirmation() {
    logoutErrorMessage.hidden = true;
    logoutConfirmModal.hidden = false;
    document.getElementById("cancelLogoutButton").focus();
  }

  function closeLogoutConfirmation() {
    if (confirmLogoutButton.disabled) return;
    logoutConfirmModal.hidden = true;
    adminLogoutButton.focus();
  }

  async function logout() {
    confirmLogoutButton.disabled = true;
    logoutErrorMessage.hidden = true;

    try {
      const result = await getJson(`${API_BASE_URL}/logout.php`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!result.status) {
        throw new Error(result.message || "Gagal keluar dari akun.");
      }

      localStorage.removeItem("user");
      localStorage.removeItem("role");
      logoutConfirmModal.hidden = true;
      logoutSuccessModal.hidden = false;
      document.getElementById("finishLogoutButton").focus();
    } catch (error) {
      logoutErrorMessage.textContent = error.message || "Gagal keluar dari akun.";
      logoutErrorMessage.hidden = false;
    } finally {
      confirmLogoutButton.disabled = false;
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
  adminLogoutButton.addEventListener("click", openLogoutConfirmation);
  document.getElementById("cancelLogoutButton").addEventListener("click", closeLogoutConfirmation);
  confirmLogoutButton.addEventListener("click", logout);
  document.getElementById("finishLogoutButton").addEventListener("click", () => {
    window.location.replace("login.html");
  });
  logoutConfirmModal.addEventListener("click", (event) => {
    if (event.target === logoutConfirmModal) closeLogoutConfirmation();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !logoutConfirmModal.hidden) closeLogoutConfirmation();
  });
  sidebarToggle.addEventListener("click", () => {
    setSidebarOpen(adminApp.classList.contains("sidebar-collapsed"));
  });
  sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));

  window.addEventListener("resize", () => {
    sidebarBackdrop.hidden = !window.matchMedia("(max-width: 700px)").matches || adminApp.classList.contains("sidebar-collapsed");
  });

  window.addEventListener("offline", () => {
    if (!adminApp.hidden) loadDashboardSummary();
  });
  window.addEventListener("online", () => {
    if (adminApp.hidden) checkAdminAccess();
    else loadDashboardSummary();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.error("[Admin] Gagal mendaftarkan cache offline:", error);
    });
  }

  checkAdminAccess();
})();
