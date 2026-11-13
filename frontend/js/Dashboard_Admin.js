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
    // Langsung tampilkan panel admin terlebih dahulu agar tidak ada jeda loading
    if (authState) authState.hidden = true;
    if (adminApp) adminApp.hidden = false;
    
    // Muat data dashboard langsung
    loadDashboardSummary();

    // Validasi sesi ke server di latar belakang secara senyap
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

      // Jika terjadi error selain 401 (misal offline), biarkan dashboard tetap berjalan atau tangani sesuai kondisi
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

  function renderCulinaryCards(items) {
    culinaryCards.replaceChildren();
    culinaryEmpty.hidden = items.length > 0;
    culinaryCards.hidden = items.length === 0;

    items.forEach((item) => {
      const title = item.nama_kuliner || item.nama_tempat || "Kuliner";
      const card = document.createElement("div");
      card.className = "culinary-card culinary-card-static";

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
      locationIcon.setAttribute("icon", "material-symbols:location-on");
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
    summaryCards.setAttribute("aria-busy", "true");

    try {
      // 1. Ambil data ringkasan langsung dari BE
      const dashResult = await getJson(`${API_BASE_URL}/api/admin/dashboard.php`);
      if (!dashResult.status || !dashResult.data) {
        throw new Error(dashResult.message || "Data dashboard dari server tidak valid.");
      }

      const data = dashResult.data;

      // 2. Langsung sinkronkan angka ke elemen ringkasan di dashboard
      if (totalCulinary) {
        const culinaryCount = data.total_tempat !== undefined && data.total_tempat !== null
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

      // Pastikan kartu ringkasan langsung tampil dan aktif
      summaryCards.hidden = false;
      summaryCards.setAttribute("aria-busy", "false");

      // 3. Ambil data daftar tempat kuliner secara terpisah
      try {
        const culinaryResult = await getJson(`${API_BASE_URL}/api/tempat_kuliner.php`);
        if (culinaryResult.status && Array.isArray(culinaryResult.data)) {
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