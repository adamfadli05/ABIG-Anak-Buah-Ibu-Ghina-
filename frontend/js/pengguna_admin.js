document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = window.BASE_URL || window.location.origin;

  const authState = document.getElementById("authState");
  const adminApp = document.getElementById("adminApp");
  const adminName = document.getElementById("adminName");

  const loading = document.getElementById("usersLoading");
  const errorState = document.getElementById("usersError");
  const errorTitle = document.getElementById("usersErrorTitle");
  const errorMessage = document.getElementById("usersErrorMessage");
  const retryButton = document.getElementById("usersRetryButton");

  const emptyState = document.getElementById("usersEmpty");
  const noResultsState = document.getElementById("usersNoResults");
  const tableCard = document.getElementById("usersTableCard");
  const tableBody = document.getElementById("usersTableBody");

  const searchInput = document.getElementById("searchUsers");
  const searchContainer = document.querySelector(".users-search-container");

  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const paginationContainer = document.getElementById("paginationContainer");

  // State pagination server-side
  let users = [];
  let usersLoaded = false;
  let currentUserPage = 1;
  const itemsPerPageUser = 20;
  let totalPagesFromBE = 1;

  // Mengambil data dari API
  async function getJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error(`Respons server tidak valid (HTTP ${response.status}).`);
    }

    if (!response.ok || (result.status !== undefined && !result.status)) {
      const error = new Error(result.message || `Permintaan gagal (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }

    return result;
  }

  // Mengarahkan pengguna jika akses tidak sesuai
  function redirectForAccessError(error) {
    if (error.status === 401) {
      clearAuthStorage();
      const returnTo = encodeURIComponent("pengguna_admin.html");
      window.location.replace(`login.html?returnTo=${returnTo}`);
      return true;
    }

    if (error.status === 403) {
      clearAuthStorage();
      window.location.replace("index.html");
      return true;
    }

    return false;
  }

  // Menghapus data autentikasi
  function clearAuthStorage() {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("admin_logged_in");
    sessionStorage.clear();
  }

  // Memeriksa akses admin
  async function checkAdminAccessSilent() {
    if (authState) authState.hidden = true;
    if (adminApp) adminApp.hidden = false;

    const rawUser = localStorage.getItem("user");

    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (adminName) {
          adminName.textContent = parsed?.nama || parsed?.name || "Admin";
        }
      } catch {
        if (adminName) adminName.textContent = "Admin";
      }
    }

    try {
      const result = await getJson(`${API_BASE_URL}/api/me.php`);

      if (result.role !== "admin") {
        localStorage.setItem("user", JSON.stringify(result.data || {}));
        localStorage.setItem("role", result.role);
        window.location.replace("index.html");
        return;
      }

      localStorage.setItem("user", JSON.stringify(result.data || {}));
      localStorage.setItem("role", result.role);

      if (adminName) {
        adminName.textContent = result.data?.nama || "Admin";
      }

      await loadUsers();
    } catch (error) {
      if (redirectForAccessError(error)) return;
      await loadUsers();
    }
  }

  function matchesUserSearch(user, keyword) {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("id");
    if (!normalizedKeyword) return true;

    const userName = (user.nama || "").toLocaleLowerCase("id");
    const userEmail = (user.email || "").toLocaleLowerCase("id");
    const searchTerms = normalizedKeyword.split(/\s+/).filter(Boolean);
    const emailTerms = searchTerms.filter((term) => term.includes("@"));
    const nameTerms = searchTerms.filter((term) => !term.includes("@"));

    if (emailTerms.length > 0) {
      return emailTerms.every((term) => userEmail.includes(term)) && nameTerms.every((term) => userName.includes(term));
    }

    return searchTerms.every((term) => userName.includes(term) || userEmail.includes(term));
  }

  // Berpindah halaman pagination dengan memanggil API BE
  window.changeUserPage = function (page) {
    if (page < 1 || page > totalPagesFromBE) return;
    currentUserPage = page;
    loadUsers();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Menampilkan data pengguna sesuai halaman dari BE
  function renderUsersWithPagination() {
    if (!usersLoaded) return;

    const keyword = searchInput ? searchInput.value.trim() : "";
    const filteredUsers = users.filter((user) => matchesUserSearch(user, keyword));

    tableBody.replaceChildren();
    loading.hidden = true;
    errorState.hidden = true;

    const isEmpty = users.length === 0 && currentUserPage === 1 && !keyword;
    const isNoResults = !isEmpty && filteredUsers.length === 0;

    if (emptyState) emptyState.hidden = !isEmpty;
    if (searchContainer) searchContainer.hidden = isEmpty;
    if (noResultsState) noResultsState.hidden = !isNoResults;
    if (tableCard) tableCard.hidden = isEmpty || isNoResults;

    // Jika data kosong
    if (isEmpty || isNoResults) {
      if (paginationContainer) {
        paginationContainer.innerHTML = "";
        paginationContainer.hidden = true;
      }
      return;
    }

    const startIndex = (currentUserPage - 1) * itemsPerPageUser;

    // Menampilkan data halaman aktif dari BE (maksimal 20 pengguna)
    filteredUsers.forEach((user, index) => {
      const row = document.createElement("tr");
      const absoluteNo = startIndex + index + 1;

      const values = [`${absoluteNo}.`, user.nama || "-", user.email || "-"];

      values.forEach((value, colIndex) => {
        const cell = document.createElement("td");
        cell.textContent = value;

        if (colIndex === 0) {
          cell.className = "td-no";
        } else if (colIndex === 1) {
          cell.className = "td-nama";
        } else {
          cell.className = "td-email";
        }

        row.append(cell);
      });

      tableBody.append(row);
    });

    renderUserPaginationControls(totalPagesFromBE);
  }

  // Membuat tombol pagination (menampilkan semua nomor halaman tanpa titik-titik)
  function renderUserPaginationControls(totalItems) {
    if (!paginationContainer) return;

    const totalPages = totalItems; // total_pages dari BE

    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      paginationContainer.hidden = true;
      return;
    }

    paginationContainer.hidden = false;

    let html = `
    <button
      class="pagination-arrow"
      onclick="changeUserPage(${currentUserPage - 1})"
      ${currentUserPage === 1 ? "disabled" : ""}
      aria-label="Halaman sebelumnya"
    >
      <iconify-icon icon="mdi:chevron-left" style="font-size: 14px; display: flex; align-items: center; justify-content: center;"></iconify-icon>
    </button>
  `;

    // Loop untuk menampilkan SEMUA nomor halaman secara berurutan
    for (let i = 1; i <= totalPages; i++) {
      html += `
      <button
        class="pagination-number ${i === currentUserPage ? "active" : ""}"
        onclick="changeUserPage(${i})"
        aria-label="Halaman ${i}"
        ${i === currentUserPage ? 'aria-current="page"' : ""}
      >
        ${i}
      </button>
    `;
    }

    html += `
    <button
      class="pagination-arrow"
      onclick="changeUserPage(${currentUserPage + 1})"
      ${currentUserPage === totalPages ? "disabled" : ""}
      aria-label="Halaman berikutnya"
    >
      <iconify-icon icon="mdi:chevron-right" style="font-size: 14px; display: flex; align-items: center; justify-content: center;"></iconify-icon>
    </button>
  `;

    paginationContainer.innerHTML = html;
  }

  // Menampilkan kondisi ketika internet terputus
  function showOfflineState() {
    loading.hidden = true;
    emptyState.hidden = true;
    noResultsState.hidden = true;
    tableCard.hidden = true;
    searchContainer.hidden = true;

    if (paginationContainer) {
      paginationContainer.innerHTML = "";
      paginationContainer.hidden = true;
    }

    if (errorTitle) {
      errorTitle.textContent = "Koneksi Internet Terputus";
    }

    if (errorMessage) {
      errorMessage.textContent = "Periksa kembali jaringan internet anda dan silahkan muat ulang halaman";
    }

    errorState.hidden = false;
  }

  // Mengambil daftar pengguna dari API dengan parameter page dan limit
  async function loadUsers() {
    if (!navigator.onLine) {
      showOfflineState();
      return;
    }

    usersLoaded = false;
    loading.hidden = false;
    errorState.hidden = true;
    emptyState.hidden = true;
    noResultsState.hidden = true;
    tableCard.hidden = true;
    searchContainer.hidden = true;
    retryButton.disabled = true;

    if (paginationContainer) {
      paginationContainer.innerHTML = "";
      paginationContainer.hidden = true;
    }

    try {
      const keyword = searchInput ? searchInput.value.trim() : "";
      const searchParam = keyword ? `&search=${encodeURIComponent(keyword)}` : "";
      const result = await getJson(`${API_BASE_URL}/api/admin/user.php?page=${currentUserPage}&limit=20${searchParam}`);

      const rawData = Array.isArray(result.data) ? result.data : [];
      totalPagesFromBE = result.pagination?.total_pages || 1;

      users = rawData;
      usersLoaded = true;
      renderUsersWithPagination();
    } catch (error) {
      if (redirectForAccessError(error)) return;

      loading.hidden = true;

      const isOffline = !navigator.onLine || error instanceof TypeError;

      if (isOffline) {
        showOfflineState();
      } else {
        if (errorTitle) {
          errorTitle.textContent = "Daftar Pengguna Gagal Dimuat";
        }

        if (errorMessage) {
          errorMessage.textContent = error.message || "Terjadi kesalahan saat memuat data pengguna.";
        }

        errorState.hidden = false;
      }
    } finally {
      retryButton.disabled = false;
    }
  }

  // Mengatur sidebar
  function setSidebarOpen(isOpen) {
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    adminApp.classList.toggle("sidebar-collapsed", !isOpen);
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
    sidebarToggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
    sidebarBackdrop.hidden = !isMobile || !isOpen;
  }

  // Pencarian pengguna (reset ke halaman 1 dan fetch ke BE)
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentUserPage = 1;
        loadUsers();
      }, 300);
    });
  }

  // Tombol muat ulang
  if (retryButton) {
    retryButton.addEventListener("click", loadUsers);
  }

  // Tombol sidebar
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      setSidebarOpen(adminApp.classList.contains("sidebar-collapsed"));
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", () => {
      setSidebarOpen(false);
    });
  }

  window.addEventListener("resize", () => {
    if (sidebarBackdrop) {
      sidebarBackdrop.hidden = !window.matchMedia("(max-width: 700px)").matches || adminApp.classList.contains("sidebar-collapsed");
    }
  });

  // Ketika koneksi internet terputus
  window.addEventListener("offline", showOfflineState);

  // Jalankan pemeriksaan admin
  checkAdminAccessSilent();
});
