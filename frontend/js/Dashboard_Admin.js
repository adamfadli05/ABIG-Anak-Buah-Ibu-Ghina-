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
  const culinaryCards = document.getElementById("culinaryCards");
  const culinaryEmpty = document.getElementById("culinaryEmpty");
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
      const [culinaryResult, categoriesResult] = await Promise.all([
        getJson(`${API_BASE_URL}/api/tempat_kuliner.php`),
        getJson(`${API_BASE_URL}/api/kategori.php`),
      ]);
      if (!culinaryResult.status || !categoriesResult.status || !Array.isArray(culinaryResult.data) || !Array.isArray(categoriesResult.data)) {
        throw new Error("Data dashboard dari server tidak valid.");
      }

      const culinary = culinaryResult.data.slice(0, 3);
      const details = await Promise.all(culinary.map((item) => getJson(
        `${API_BASE_URL}/api/detail_kuliner.php?id=${encodeURIComponent(item.id_tempat)}`
      )));
      const culinaryWithRatings = culinary.map((item, index) => {
        const detail = details[index];
        if (!detail.status || !detail.data) {
          throw new Error(detail.message || "Rating kuliner gagal dimuat.");
        }
        return { ...item, rata_rata_rating: detail.data.rata_rata_rating };
      });

      document.getElementById("totalCulinary").textContent = numberFormatter.format(culinaryResult.data.length);
      document.getElementById("totalCategories").textContent = numberFormatter.format(categoriesResult.data.length);
      document.getElementById("totalUsers").textContent = "—";
      renderCulinaryCards(culinaryWithRatings);

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
