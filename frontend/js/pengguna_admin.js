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
  const usersCount = document.getElementById("usersCount");
  const searchInput = document.getElementById("searchUsers");
  const searchContainer = document.querySelector(".users-search-container");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  let users = [];
  let usersLoaded = false;

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

    if (!response.ok || !result.status) {
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

  // --- CEK AKSES DI BALIK LAYAR TANPA MENAMPILKAN LOADING SCREEN ---
  async function checkAdminAccessSilent() {
    // Pastikan langsung tampilkan panel admin tanpa layar "Memeriksa akses..."
    if (authState) authState.hidden = true;
    if (adminApp) adminApp.hidden = false;

    // Ambil nama user dari localStorage jika ada untuk mempercepat render nama
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (adminName) adminName.textContent = parsed?.nama || parsed?.name || "Admin";
      } catch (e) {
        if (adminName) adminName.textContent = "Admin";
      }
    }

    // Validasi tetap berjalan senyap ke server di latar belakang
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
      
      // Muat data pengguna setelah sesi dipastikan valid
      await loadUsers();
    } catch (error) {
      if (redirectForAccessError(error)) return;
      // Jika terjadi error koneksi saat validasi senyap, biarkan loadUsers yang menangani error-nya
      await loadUsers();
    }
  }

  function formatDate(value) {
    if (!value) return "Tidak tersedia";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Tidak tersedia" : dateFormatter.format(date);
  }

  function renderUsers() {
    if (!usersLoaded) return;

    const keyword = searchInput.value.trim().toLocaleLowerCase("id");
    const searchTerms = keyword.split(/\s+/).filter(Boolean);

    const filteredUsers = users.filter((user) => {
      if (searchTerms.length === 0) return true;
      const combined = `${user.nama || ""} ${user.email || ""}`.toLocaleLowerCase("id");
      return searchTerms.every((term) => combined.includes(term));
    });

    tableBody.replaceChildren();
    loading.hidden = true;
    errorState.hidden = true;

    const isEmpty = users.length === 0;
    emptyState.hidden = !isEmpty;
    searchContainer.hidden = isEmpty;
    noResultsState.hidden = isEmpty || filteredUsers.length > 0;
    tableCard.hidden = isEmpty || filteredUsers.length === 0;

    if (isEmpty || filteredUsers.length === 0) return;

    if (usersCount) {
      usersCount.textContent = `Menampilkan ${filteredUsers.length} pengguna`;
    }

    filteredUsers.forEach((user, index) => {
      const row = document.createElement("tr");
      const values = [
        `${index + 1}.`,
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
  }

  function showOfflineState() {
    loading.hidden = true;
    emptyState.hidden = true;
    noResultsState.hidden = true;
    tableCard.hidden = true;
    searchContainer.hidden = true;

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

    try {
      const result = await getJson(`${API_BASE_URL}/api/admin/user.php`);
      if (!Array.isArray(result.data)) {
        throw new Error("Data pengguna dari server tidak valid.");
      }
      users = result.data;
      usersLoaded = true;
      renderUsers();
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

  searchInput.addEventListener("input", renderUsers);
  retryButton.addEventListener("click", loadUsers);
  sidebarToggle.addEventListener("click", () => {
    setSidebarOpen(adminApp.classList.contains("sidebar-collapsed"));
  });
  sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));
  window.addEventListener("resize", () => {
    sidebarBackdrop.hidden = !window.matchMedia("(max-width: 700px)").matches ||
      adminApp.classList.contains("sidebar-collapsed");
  });

  // Langsung tampilkan panel admin tanpa jeda teks "Memeriksa akses Admin..."
  checkAdminAccessSilent();
});