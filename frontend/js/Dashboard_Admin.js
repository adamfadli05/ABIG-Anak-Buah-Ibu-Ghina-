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
  const summaryCards = document.getElementById("summaryCards");
  const totalCulinary = document.getElementById("totalCulinary");
  const totalCategories = document.getElementById("totalCategories");
  const totalUsers = document.getElementById("totalUsers");
  const culinaryCards = document.getElementById("culinaryCards");
  const culinaryEmpty = document.getElementById("culinaryEmpty");
  const numberFormatter = new Intl.NumberFormat("id-ID");

  // State Pagination Admin (20 data per halaman)
  let allKulinerData = [];
  let currentAdminPage = 1;
  const itemsPerPageAdmin = 20;

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

    loadDashboardSummary();

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
      priceText.textContent = item.harga !== null && item.harga !== undefined && item.harga !== "" && Number.isFinite(price) ? `Rp. ${new Intl.NumberFormat("id-ID").format(price)}` : "Harga belum tersedia";

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
      if (totalPages <= 5 || i === 1 || i === totalPages || (i >= currentAdminPage - 1 && i <= currentAdminPage + 1)) {
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

  async function loadDashboardSummary() {
    summaryCards.setAttribute("aria-busy", "true");

    try {
      const dashResult = await getJson(`${API_BASE_URL}/api/admin/dashboard.php`);
      if (!dashResult.status || !dashResult.data) {
        throw new Error(dashResult.message || "Data dashboard dari server tidak valid.");
      }

      const data = dashResult.data;

      if (totalCulinary) {
        const culinaryCount = data.total_tempat !== undefined && data.total_tempat !== null ? data.total_tempat : data.total_kuliner;
        totalCulinary.textContent = numberFormatter.format(getCount(culinaryCount));
      }
      if (totalCategories) {
        totalCategories.textContent = numberFormatter.format(getCount(data.total_kategori));
      }
      if (totalUsers) {
        totalUsers.textContent = numberFormatter.format(getCount(data.total_user));
      }

      summaryCards.hidden = false;
      summaryCards.setAttribute("aria-busy", "false");

      try {
        const culinaryResult = await getJson(`${API_BASE_URL}/api/tempat_kuliner.php`);
        if (culinaryResult.status && Array.isArray(culinaryResult.data)) {
          const culinary = culinaryResult.data;
          const details = await Promise.all(culinary.map((item) => getJson(`${API_BASE_URL}/api/detail_kuliner.php?id=${encodeURIComponent(item.id_tempat)}`).catch(() => null)));
          allKulinerData = culinary.map((item, index) => {
            const detail = details[index];
            const rating = detail?.status && detail?.data ? detail.data.rata_rata_rating : 0;
            return { ...item, rata_rata_rating: rating };
          });
          currentAdminPage = 1;
          renderCulinaryWithPagination();
        } else {
          culinaryEmpty.hidden = false;
        }
      } catch (culinaryError) {
        console.error("Gagal memuat kartu kuliner:", culinaryError);
        culinaryEmpty.hidden = false;
      }
    } catch (error) {
      console.error("Gagal memuat ringkasan dashboard:", error);
    } finally {
      summaryCards.setAttribute("aria-busy", "false");
    }
  }

  if (authRetryButton) authRetryButton.addEventListener("click", checkAdminAccess);

  window.addEventListener("offline", () => {
    if (!adminApp.hidden) loadDashboardSummary();
  });
  window.addEventListener("online", () => {
    if (adminApp.hidden) checkAdminAccess();
    else loadDashboardSummary();
  });

  checkAdminAccess();
})();
