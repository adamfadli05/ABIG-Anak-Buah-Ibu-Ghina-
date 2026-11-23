(() => {
  const API_BASE_URL = window.BASE_URL || window.location.origin;
  const adminApp = document.getElementById("adminApp");
  const authState = document.getElementById("authState");
  const authRetryButton = document.getElementById("authRetryButton");
  const summaryCards = document.getElementById("summaryCards");
  const totalCulinary = document.getElementById("totalCulinary");
  const totalCategories = document.getElementById("totalCategories");
  const totalUsers = document.getElementById("totalUsers");
  const culinaryCards = document.getElementById("culinaryCards");
  const culinaryEmpty = document.getElementById("culinaryEmpty");
  const numberFormatter = new Intl.NumberFormat("id-ID");

  const DASHBOARD_CACHE_KEY = "mangan_yukk_admin_dashboard_v1";

  // State Pagination Admin (20 data per halaman)
  let allKulinerData = [];
  let currentAdminPage = 1;
  const itemsPerPageAdmin = 20;

  function readDashboardCache() {
    try {
      const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function writeDashboardCache(payload) {
    try {
      localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(payload));
    } catch (_) {}
  }

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

  // --- CEK AKSES ADMIN SECARA SENYAP (SILENT CHECK) TANPA LOADING SCREEN ---
  async function checkAdminAccess() {
    if (authState) authState.hidden = true;
    if (adminApp) adminApp.hidden = false;

    const cached = readDashboardCache();
    if (cached) {
      if (cached.summary) applySummaryData(cached.summary);
      if (Array.isArray(cached.culinary) && cached.culinary.length > 0) {
        allKulinerData = cached.culinary;
        currentAdminPage = 1;
        renderCulinaryWithPagination();
      }
    }

    loadDashboardSummary(cached);

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
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        const returnTo = encodeURIComponent("Dashboard_Admin.html");
        window.location.replace(`login.html?returnTo=${returnTo}`);
        return;
      }
      console.error("Validasi sesi senyap gagal:", error);
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

  function applySummaryData(data) {
    if (totalCulinary) {
      const culinaryCount =
        data.total_tempat !== undefined && data.total_tempat !== null
          ? data.total_tempat
          : data.total_kuliner;
      totalCulinary.textContent = numberFormatter.format(getCount(culinaryCount));
    }
    if (totalCategories) {
      totalCategories.textContent = numberFormatter.format(getCount(data.total_kategori));
    }
    if (totalUsers) {
      totalUsers.textContent = numberFormatter.format(getCount(data.total_user));
    }
    if (summaryCards) {
      summaryCards.hidden = false;
    }
  }

  function resolvePhoto(value) {
    const photo = String(value || "").trim();
    if (!photo) return "https://placehold.co/400x300/e0e0e0/555555?text=Kuliner";
    if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
    if (photo.startsWith("uploads/")) return `${API_BASE_URL}/${photo}`;
    return `${API_BASE_URL}/uploads/${photo.replace(/^\/+/, "")}`;
  }

  window.changeAdminPage = function (page) {
    const totalPages = Math.max(1, Math.ceil(allKulinerData.length / itemsPerPageAdmin));
    if (page < 1 || page > totalPages) return;
    currentAdminPage = page;
    renderCulinaryWithPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function renderCulinaryWithPagination() {
    culinaryCards.replaceChildren();
    const paginationContainer = document.getElementById("paginationContainer");

    culinaryEmpty.hidden = allKulinerData.length > 0;
    culinaryCards.hidden = allKulinerData.length === 0;

    if (allKulinerData.length === 0) {
      if (paginationContainer) paginationContainer.innerHTML = "";
      return;
    }

    const startIndex = (currentAdminPage - 1) * itemsPerPageAdmin;
    const endIndex = startIndex + itemsPerPageAdmin;
    const paginatedItems = allKulinerData.slice(startIndex, endIndex);
    const fragment = document.createDocumentFragment();

    paginatedItems.forEach((item) => {
      const title = item.nama_kuliner || item.nama_tempat || "Kuliner";
      const card = document.createElement("div");
      card.className = "culinary-card culinary-card-static";

      const photo = document.createElement("img");
      photo.className = "culinary-photo";
      photo.src = resolvePhoto(item.foto);
      photo.alt = title;
      photo.addEventListener(
        "error",
        () => {
          photo.src = "https://placehold.co/400x300/e0e0e0/555555?text=Kuliner";
        },
        { once: true }
      );

      const content = document.createElement("div");
      content.className = "culinary-card-content";

      const heading = document.createElement("h3");
      heading.className = "culinary-card-title";
      heading.textContent = title;

      const address = document.createElement("p");
      address.className = "culinary-card-address";
      const locationIcon = document.createElement("iconify-icon");
      locationIcon.setAttribute("icon", "material-symbols:location-on");
      locationIcon.setAttribute("aria-hidden", "true");
      const addressText = document.createElement("span");
      addressText.textContent = item.alamat || item.nama_tempat || "Alamat belum tersedia";
      address.append(locationIcon, addressText);

      const footer = document.createElement("div");
      footer.className = "culinary-card-footer";
      const price = Number(item.harga);
      const priceText = document.createElement("span");
      priceText.textContent =
        item.harga !== null &&
        item.harga !== undefined &&
        item.harga !== "" &&
        Number.isFinite(price)
          ? `Rp. ${numberFormatter.format(price)}`
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
      fragment.append(card);
    });

    culinaryCards.append(fragment);
    renderAdminPaginationControls();
  }

  function renderAdminPaginationControls() {
    const paginationContainer = document.getElementById("paginationContainer");
    if (!paginationContainer) return;

    const totalPages = Math.max(1, Math.ceil(allKulinerData.length / itemsPerPageAdmin));
    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    let html = `
      <button class="pagination-arrow" onclick="changeAdminPage(${currentAdminPage - 1})" ${currentAdminPage === 1 ? "disabled" : ""}>
        <iconify-icon icon="mdi:chevron-left" style="font-size: 14px; display: flex; align-items: center; justify-content: center;"></iconify-icon>
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      if (
        totalPages <= 5 ||
        i === 1 ||
        i === totalPages ||
        (i >= currentAdminPage - 1 && i <= currentAdminPage + 1)
      ) {
        html += `
          <button class="pagination-number ${i === currentAdminPage ? "active" : ""}" onclick="changeAdminPage(${i})">
            ${i}
          </button>
        `;
      } else if (i === currentAdminPage - 2 || i === currentAdminPage + 2) {
        html += `<span style="padding: 0 4px; color: rgba(0, 0, 0, 0.5); font-weight: 500; font-size: 16px;">...</span>`;
      }
    }

    html += `
      <button class="pagination-arrow" onclick="changeAdminPage(${currentAdminPage + 1})" ${currentAdminPage === totalPages ? "disabled" : ""}>
        <iconify-icon icon="mdi:chevron-right" style="font-size: 14px; display: flex; align-items: center; justify-content: center;"></iconify-icon>
      </button>
    `;

    paginationContainer.innerHTML = html;
  }

  async function loadDashboardSummary(cachedData = null) {
    if (summaryCards) summaryCards.setAttribute("aria-busy", "true");

    try {
      const [dashSettled, culinarySettled] = await Promise.allSettled([
        getJson(`${API_BASE_URL}/api/admin/dashboard.php`),
        getJson(`${API_BASE_URL}/api/tempat_kuliner.php`),
      ]);

      let nextSummary = cachedData?.summary || null;
      let nextCulinary = Array.isArray(cachedData?.culinary) ? cachedData.culinary : null;

      if (dashSettled.status === "fulfilled") {
        const dashResult = dashSettled.value;
        if (!dashResult.status || !dashResult.data) {
          throw new Error(dashResult.message || "Data dashboard dari server tidak valid.");
        }
        nextSummary = dashResult.data;
        applySummaryData(nextSummary);
      } else {
        console.error("Gagal memuat ringkasan dashboard:", dashSettled.reason);
      }

      if (culinarySettled.status === "fulfilled") {
        const culinaryResult = culinarySettled.value;
        if (culinaryResult.status && Array.isArray(culinaryResult.data)) {
          nextCulinary = culinaryResult.data.map((item) => ({
            ...item,
            rata_rata_rating: Number(item.rata_rata_rating ?? item.rating ?? 0),
          }));
          allKulinerData = nextCulinary;
          currentAdminPage = 1;
          renderCulinaryWithPagination();
        } else {
          culinaryEmpty.hidden = false;
        }
      } else {
        console.error("Gagal memuat kartu kuliner:", culinarySettled.reason);
        if (!nextCulinary || nextCulinary.length === 0) {
          culinaryEmpty.hidden = false;
        }
      }

      if (nextSummary || nextCulinary) {
        writeDashboardCache({
          summary: nextSummary,
          culinary: nextCulinary,
        });
      }
    } finally {
      if (summaryCards) summaryCards.setAttribute("aria-busy", "false");
    }
  }

  if (authRetryButton) authRetryButton.addEventListener("click", checkAdminAccess);

  window.addEventListener("offline", () => {
    if (adminApp && !adminApp.hidden) loadDashboardSummary(readDashboardCache());
  });
  window.addEventListener("online", () => {
    if (adminApp && !adminApp.hidden) checkAdminAccess();
  });

  checkAdminAccess();
})();