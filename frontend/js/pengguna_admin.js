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

  let users = [];
  let usersLoaded = false;

  // State Pagination Pengguna (20 data per halaman)
  let currentUserPage = 1;
  const itemsPerPageUser = 20;

  async function getJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: { Accept: "application/json", ...options.headers }
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

  function clearAuthStorage() {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("admin_logged_in");
    sessionStorage.clear();
  }

  async function checkAdminAccessSilent() {
    if (authState) authState.hidden = true;
    if (adminApp) adminApp.hidden = false;

    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (adminName) adminName.textContent = parsed?.nama || parsed?.name || "Admin";
      } catch (e) {
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
      if (adminName) adminName.textContent = result.data?.nama || "Admin";
      
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
      return emailTerms.every((term) => userEmail.includes(term)) &&
        nameTerms.every((term) => userName.includes(term));
    }

    return searchTerms.every((term) =>
      userName.includes(term) || userEmail.includes(term)
    );
  }

  window.changeUserPage = function(page) {
    const keyword = searchInput.value.trim();
    const filteredUsers = users.filter((user) => matchesUserSearch(user, keyword));
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPageUser));
    if (page < 1 || page > totalPages) return;
    currentUserPage = page;
    renderUsersWithPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function renderUsersWithPagination() {
    if (!usersLoaded) return;

    const keyword = searchInput.value.trim();
    const filteredUsers = users.filter((user) => matchesUserSearch(user, keyword));
    const paginationContainer = document.getElementById("paginationContainer");

    tableBody.replaceChildren();
    loading.hidden = true;
    errorState.hidden = true;

    const isEmpty = users.length === 0;
    const isNoResults = !isEmpty && filteredUsers.length === 0;

    if (emptyState) emptyState.hidden = !isEmpty;
    if (searchContainer) searchContainer.hidden = isEmpty;
    if (noResultsState) noResultsState.hidden = !isNoResults;
    if (tableCard) tableCard.hidden = isEmpty || isNoResults;

    if (isEmpty || isNoResults) {
      if (paginationContainer) paginationContainer.innerHTML = "";
      return;
    }

    const startIndex = (currentUserPage - 1) * itemsPerPageUser;
    const endIndex = startIndex + itemsPerPageUser;
    const paginatedItems = filteredUsers.slice(startIndex, endIndex);

    paginatedItems.forEach((user, index) => {
      const row = document.createElement("tr");
      const absoluteNo = startIndex + index + 1;
      const values = [
        `${absoluteNo}.`,
        user.nama || "-",
        user.email || "-"
      ];

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

    // Panggil fungsi kontrol pagination agar tombol render di bawah tabel
    renderUserPaginationControls(filteredUsers.length);
  }

  function renderUserPaginationControls(totalItems) {
    const paginationContainer = document.getElementById("paginationContainer");
    if (!paginationContainer) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPageUser));
    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    let html = `
      <button class="pagination-arrow" onclick="changeUserPage(${currentUserPage - 1})" ${currentUserPage === 1 ? 'disabled' : ''}>
        <iconify-icon icon="mdi:chevron-left" style="font-size: 14px; display: flex; align-items: center; justify-content: center;"></iconify-icon>
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      if (totalPages <= 5 || i === 1 || i === totalPages || (i >= currentUserPage - 1 && i <= currentUserPage + 1)) {
        html += `
          <button class="pagination-number ${i === currentUserPage ? 'active' : ''}" onclick="changeUserPage(${i})">
            ${i}
          </button>
        `;
      } else if (i === currentUserPage - 2 || i === currentUserPage + 2) {
        html += `<span style="padding: 0 4px; color: rgba(0, 0, 0, 0.5); font-weight: 500; font-size: 16px;">...</span>`;
      }
    }

    html += `
      <button class="pagination-arrow" onclick="changeUserPage(${currentUserPage + 1})" ${currentUserPage === totalPages ? 'disabled' : ''}>
        <iconify-icon icon="mdi:chevron-right" style="font-size: 14px; display: flex; align-items: center; justify-content: center;"></iconify-icon>
      </button>
    `;

    paginationContainer.innerHTML = html;
  }

  function showOfflineState() {
    loading.hidden = true;
    emptyState.hidden = true;
    noResultsState.hidden = true;
    tableCard.hidden = true;
    searchContainer.hidden = true;
    const paginationContainer = document.getElementById("paginationContainer");
    if (paginationContainer) paginationContainer.innerHTML = "";

    if (errorTitle) {
      errorTitle.textContent = "Koneksi Internet Terputus";
    }
    if (errorMessage) {
      errorMessage.textContent = "Periksa kembali jaringan internet anda dan silahkan muat ulang halaman";
    }
    errorState.hidden = false;
  }

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
    const paginationContainer = document.getElementById("paginationContainer");
    if (paginationContainer) paginationContainer.innerHTML = "";

    try {
      const result = await getJson(`${API_BASE_URL}/api/admin/user.php`);
      // Mendukung format { data: [...] } ataupun langsung array [...]
      const rawData = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
      
      users = rawData;
      usersLoaded = true;
      currentUserPage = 1;
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

  function setSidebarOpen(isOpen) {
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    adminApp.classList.toggle("sidebar-collapsed", !isOpen);
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
    sidebarToggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
    sidebarBackdrop.hidden = !isMobile || !isOpen;
  }

  window.addEventListener("offline", () => {
    showOfflineState();
  });

  searchInput.addEventListener("input", () => {
    currentUserPage = 1;
    renderUsersWithPagination();
  });
  
  retryButton.addEventListener("click", loadUsers);
  
  sidebarToggle.addEventListener("click", () => {
    setSidebarOpen(adminApp.classList.contains("sidebar-collapsed"));
  });
  
  sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));
  
  window.addEventListener("resize", () => {
    sidebarBackdrop.hidden = !window.matchMedia("(max-width: 700px)").matches ||
      adminApp.classList.contains("sidebar-collapsed");
  });

  checkAdminAccessSilent();
});