document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = window.BASE_URL || window.location.origin;
  const USERS_CACHE_KEY = "mangan_yukk_admin_users_v1";

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

  let currentUserPage = 1;
  let totalPagesFromBE = 1;
  const itemsPerPageUser = 20;
  const pageDataCache = new Map();

  window.allUsers = [];
  window.currentPage = 1;
  window.itemsPerPage = itemsPerPageUser;

  function readUsersCache() {
    try {
      const raw = localStorage.getItem(USERS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { items: parsed, totalPages: Math.max(1, Math.ceil(parsed.length / itemsPerPageUser)) };
      }
      if (parsed && Array.isArray(parsed.items)) {
        return {
          items: parsed.items,
          totalPages: Math.max(1, Number(parsed.totalPages) || 1),
        };
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  function writeUsersCache(items, totalPages = 1) {
    try {
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify({ items, totalPages: Math.max(1, Number(totalPages) || 1) }));
    } catch (_) {}
  }

  async function getJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: { Accept: "application/json", ...options.headers },
    });
    let result;

    try {
      result = await response.json();
    } catch {
      const error = new Error(`Respons server tidak valid (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
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

  function resolveTotalPages(result, rawData) {
    const explicitPages = Number(result?.pagination?.total_pages ?? result?.total_pages ?? result?.meta?.total_pages);
    if (Number.isFinite(explicitPages) && explicitPages >= 1) {
      return explicitPages;
    }

    const totalItems = Number(result?.pagination?.total_items ?? result?.pagination?.total ?? result?.total_items ?? result?.total);
    if (Number.isFinite(totalItems) && totalItems > 0) {
      return Math.max(1, Math.ceil(totalItems / itemsPerPageUser));
    }

    if (Array.isArray(rawData) && rawData.length > itemsPerPageUser) {
      return Math.max(1, Math.ceil(rawData.length / itemsPerPageUser));
    }

    return 1;
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

    const cached = readUsersCache();
    if (cached && cached.items.length > 0) {
      totalPagesFromBE = cached.totalPages;
      window.allUsers = cached.items;
      currentUserPage = 1;
      window.currentPage = 1;
      renderUsersWithPagination(totalPagesFromBE);
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

      await loadUsers(Boolean(cached && cached.items.length > 0), false);
    } catch (error) {
      if (redirectForAccessError(error)) return;
      await loadUsers(Boolean(cached && cached.items.length > 0), false);
    }
  }

  window.changePage = function (page) {
    if (page < 1) return;
    currentUserPage = page;
    window.currentPage = page;
    renderPaginationControls(totalPagesFromBE);
    loadUsers(true, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function renderUsersWithPagination(totalPages = totalPagesFromBE) {
    const paginationContainer = document.getElementById("paginationContainer");

    if (loading) loading.hidden = true;
    if (errorState) errorState.hidden = true;

    const hasKeyword = Boolean(searchInput && searchInput.value.trim());
    const isEmpty = window.allUsers.length === 0;

    if (emptyState) emptyState.hidden = !isEmpty || hasKeyword;
    if (noResultsState) noResultsState.hidden = !(isEmpty && hasKeyword);
    if (searchContainer) searchContainer.hidden = isEmpty && !hasKeyword;
    if (tableCard) tableCard.hidden = isEmpty;

    if (isEmpty) {
      if (tableBody) tableBody.replaceChildren();
      if (paginationContainer && !hasKeyword) paginationContainer.innerHTML = "";
      return;
    }

    // Jika BE mengembalikan semua data (> itemsPerPageUser), slice di sisi client
    const itemsToDisplay = window.allUsers.length > itemsPerPageUser ? window.allUsers.slice((currentUserPage - 1) * itemsPerPageUser, currentUserPage * itemsPerPageUser) : window.allUsers;

    const startIndex = (currentUserPage - 1) * itemsPerPageUser;
    const fragment = document.createDocumentFragment();

    itemsToDisplay.forEach((user, index) => {
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

      fragment.append(row);
    });

    if (tableBody) {
      tableBody.replaceChildren(fragment);
    }

    renderPaginationControls(totalPages);
  }
  function renderPaginationControls(totalPagesInput = totalPagesFromBE) {
    const paginationContainer = document.getElementById("paginationContainer");
    if (!paginationContainer) return;

    paginationContainer.hidden = false;

    const totalPages = Math.max(1, Number(totalPagesInput) || 1);
    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    let html = `
      <button class="pagination-arrow" onclick="changePage(${currentUserPage - 1})" ${currentUserPage === 1 ? "disabled" : ""}>
        <iconify-icon icon="mdi:chevron-left" style="font-size: 14px; display: flex; align-items: center; justify-content: center;"></iconify-icon>
      </button>
    `;

    const mobilePages =
      totalPages > 5 && window.matchMedia("(max-width: 480px)").matches
        ? [...new Set([1, currentUserPage - 1, currentUserPage, currentUserPage + 1, totalPages])]
            .filter((page) => page >= 1 && page <= totalPages)
            .sort((a, b) => a - b)
        : null;

    if (mobilePages) {
      mobilePages.forEach((page, index) => {
        if (index > 0 && page - mobilePages[index - 1] > 1) {
          html += '<span class="pagination-dots" aria-hidden="true">...</span>';
        }

        html += `
          <button class="pagination-number ${page === currentUserPage ? "active" : ""}" onclick="changePage(${page})">
            ${page}
          </button>
        `;
      });
    } else {
      for (let page = 1; page <= totalPages; page++) {
        html += `
          <button class="pagination-number ${page === currentUserPage ? "active" : ""}" onclick="changePage(${page})">
            ${page}
          </button>
        `;
      }
    }

    html += `
      <button class="pagination-arrow" onclick="changePage(${currentUserPage + 1})" ${currentUserPage === totalPages ? "disabled" : ""}>
        <iconify-icon icon="mdi:chevron-right" style="font-size: 14px; display: flex; align-items: center; justify-content: center;"></iconify-icon>
      </button>
    `;

    paginationContainer.innerHTML = html;
  }

  function showOfflineState() {
    if (loading) loading.hidden = true;
    if (emptyState) emptyState.hidden = true;
    if (noResultsState) noResultsState.hidden = true;
    if (tableCard) tableCard.hidden = true;
    if (searchContainer) searchContainer.hidden = true;
    const paginationContainer = document.getElementById("paginationContainer");
    if (paginationContainer) paginationContainer.innerHTML = "";

    if (errorTitle) {
      errorTitle.textContent = "Koneksi Internet Terputus";
    }
    if (errorMessage) {
      errorMessage.textContent = "Periksa kembali jaringan internet anda dan silahkan muat ulang halaman";
    }
    if (errorState) errorState.hidden = false;
  }

  async function loadUsers(silentBackground = false, isPageSwitch = false) {
    const keyword = searchInput ? searchInput.value.trim() : "";
    const cacheKey = `${currentUserPage}:${keyword.toLowerCase()}`;
    const cachedPage = pageDataCache.get(cacheKey);
    const localFirst = currentUserPage === 1 && !keyword && !cachedPage ? readUsersCache() : null;
    const initialData = cachedPage || (localFirst ? localFirst.items : null);

    if (initialData && initialData.length > 0) {
      window.allUsers = initialData;
      renderUsersWithPagination(totalPagesFromBE);
    }

    if (!navigator.onLine) {
      if (!initialData || initialData.length === 0) {
        showOfflineState();
      }
      return;
    }

    if (!silentBackground && !isPageSwitch && (!initialData || initialData.length === 0)) {
      if (loading) loading.hidden = false;
      if (errorState) errorState.hidden = true;
      if (emptyState) emptyState.hidden = true;
      if (noResultsState) noResultsState.hidden = true;
      if (tableCard) tableCard.hidden = true;
      if (searchContainer) searchContainer.hidden = true;
    }

    if (retryButton) retryButton.disabled = true;

    try {
      const queryParams = new URLSearchParams({
        page: String(currentUserPage),
        limit: String(itemsPerPageUser),
      });
      if (keyword) {
        queryParams.set("search", keyword);
      }

      const result = await getJson(`${API_BASE_URL}/api/admin/user.php?${queryParams.toString()}`);
      const rawData = Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : [];

      totalPagesFromBE = resolveTotalPages(result, rawData);

      window.allUsers = rawData;
      pageDataCache.set(cacheKey, rawData);
      if (currentUserPage === 1 && !keyword) {
        writeUsersCache(rawData, totalPagesFromBE);
      }

      renderUsersWithPagination(totalPagesFromBE);
    } catch (error) {
      if (loading) loading.hidden = true;
      if (redirectForAccessError(error)) return;

      if (!initialData || initialData.length === 0) {
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
          if (errorState) errorState.hidden = false;
        }
      }
    } finally {
      if (loading) loading.hidden = true;
      if (retryButton) retryButton.disabled = false;
    }
  }

  function setSidebarOpen(isOpen) {
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    if (adminApp) adminApp.classList.toggle("sidebar-collapsed", !isOpen);
    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-expanded", String(isOpen));
      sidebarToggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
    }
    if (sidebarBackdrop) sidebarBackdrop.hidden = !isMobile || !isOpen;
  }

  window.addEventListener("offline", () => {
    if (!readUsersCache()?.items?.length) {
      showOfflineState();
    }
  });

  if (searchInput) {
    let searchTimeout = null;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentUserPage = 1;
        window.currentPage = 1;
        loadUsers(true, true);
      }, 150);
    });
  }

  if (retryButton) {
    retryButton.addEventListener("click", () => loadUsers(false, false));
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      setSidebarOpen(adminApp ? adminApp.classList.contains("sidebar-collapsed") : false);
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));
  }

  window.addEventListener("resize", () => {
    if (sidebarBackdrop) {
      sidebarBackdrop.hidden = !window.matchMedia("(max-width: 700px)").matches || (adminApp ? adminApp.classList.contains("sidebar-collapsed") : false);
    }
  });

  checkAdminAccessSilent();
});
