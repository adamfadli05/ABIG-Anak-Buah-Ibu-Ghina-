document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = window.BASE_URL || window.location.origin;
  const ADMIN_KULINER_CACHE_KEY = "mangan_yukk_admin_kuliner_v1";
  const ALL_ADMIN_KULINER_CACHE_KEY = "mangan_yukk_admin_kuliner_all_v1";
  const EDIT_DRAFT_KEY = "mangan_yukk_edit_kuliner_item";

  const authState = document.getElementById("authState");
  const adminApp = document.getElementById("adminApp");

  const tableCard = document.querySelector(".table-card");
  const tableLoading = document.getElementById("tableLoading");
  const tableError = document.getElementById("tableError");
  const tableErrorTitle = document.getElementById("tableErrorTitle");
  const tableErrorMessage = document.getElementById("tableErrorMessage");
  const tableWrapper = document.getElementById("tableWrapper");
  const tableEmpty = document.getElementById("tableEmpty");
  const tableNoData = document.getElementById("tableNoData");
  const searchToolbar = document.getElementById("searchToolbar");
  const addCulinaryButton = document.getElementById("btnTambahKuliner");
  const kulinerTableBody = document.getElementById("kulinerTableBody");
  const searchInput = document.getElementById("searchKuliner");
  const tableRetryButton = document.getElementById("tableRetryButton");

  const deleteConfirmModal = document.getElementById("deleteConfirmModal");
  const deleteConfirmMessage = document.getElementById("deleteDialogMessage");
  const deleteConfirmState = document.getElementById("deleteConfirmState");
  const deleteProgressState = document.getElementById("deleteProgressState");
  const deleteSuccessState = document.getElementById("deleteSuccessState");
  const deleteErrorState = document.getElementById("deleteErrorState");
  const deleteErrorMessage = document.getElementById("deleteErrorMessage");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const retryDeleteBtn = document.getElementById("retryDeleteBtn");
  const closeDeleteSuccessBtn = document.getElementById("closeDeleteSuccessBtn");

  let culinaryData = [];
  let allCulinaryData = [];
  let isFetchingAllForSearch = false;
  let allCulinaryPromise = null;
  let pendingDeleteId = null;
  let deleteInProgress = false;

  // State Pagination Admin (20 data kuliner per halaman)
  let currentAdminPage = 1;
  let totalPagesFromBE = 1;
  const itemsPerPageAdmin = 20;
  const pageDataCache = new Map();

  function readKulinerCache() {
    try {
      const raw = localStorage.getItem(ADMIN_KULINER_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function writeKulinerCache(items) {
    try {
      localStorage.setItem(ADMIN_KULINER_CACHE_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  function readAllKulinerCache() {
    try {
      const raw = localStorage.getItem(ALL_ADMIN_KULINER_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function writeAllKulinerCache(items) {
    try {
      localStorage.setItem(ALL_ADMIN_KULINER_CACHE_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  function clearAllKulinerCache() {
    allCulinaryData = [];
    allCulinaryPromise = null;
    try {
      localStorage.removeItem(ALL_ADMIN_KULINER_CACHE_KEY);
    } catch (_) {}
  }

  const getApiUrl = (endpoint) => `${API_BASE_URL}/api/admin/${endpoint}`;

  function resolvePhotoUrl(rawPath) {
    const val = String(rawPath || "").trim();
    if (!val) return "";
    if (/^(https?:\/\/|data:|blob:)/i.test(val)) return val;
    if (val.startsWith("/")) return `${window.location.origin}${val}`;
    return `${API_BASE_URL}/${val.replace(/^\/+/, "")}`;
  }

  function showTableConnectionLost() {
    const paginationContainer = document.getElementById("paginationContainer");
    const isMobileLayout = window.matchMedia("(max-width: 480px)").matches;
    if (tableLoading) tableLoading.hidden = true;
    if (tableWrapper) tableWrapper.hidden = true;
    if (tableCard) tableCard.hidden = true;
    if (tableEmpty) tableEmpty.hidden = true;
    if (tableNoData) tableNoData.hidden = true;
    if (searchToolbar) searchToolbar.hidden = isMobileLayout;
    if (addCulinaryButton) addCulinaryButton.hidden = isMobileLayout;
    if (paginationContainer) {
      paginationContainer.innerHTML = "";
      paginationContainer.hidden = true;
    }
    if (tableError) tableError.hidden = false;
    if (tableErrorTitle) tableErrorTitle.textContent = "Koneksi Internet Terputus";
    if (tableErrorMessage) {
      tableErrorMessage.textContent = "Periksa kembali jaringan internet anda dan silahkan muat ulang halaman";
    }
  }

  function showTableRequestError(error) {
    showTableConnectionLost();
    if (tableErrorTitle) tableErrorTitle.textContent = "Daftar Kuliner Gagal Dimuat";

    const status = error instanceof Error ? error.message.match(/HTTP \d+/) : null;
    if (tableErrorMessage) {
      tableErrorMessage.textContent = status
        ? `Server mengembalikan ${status[0]}. Periksa backend dan database lokal, lalu coba lagi.`
        : "Backend lokal gagal memuat data. Periksa sesi Admin dan database, lalu coba lagi.";
    }
  }

  async function checkAdminAccessSilent() {
    const rawRole = localStorage.getItem("role");

    if (rawRole === "admin") {
      if (adminApp) adminApp.hidden = false;
      if (authState) authState.hidden = true;
      initAdminApp();
      return;
    }

    if (!navigator.onLine) {
      if (adminApp) adminApp.hidden = false;
      if (authState) authState.hidden = true;
      showTableConnectionLost();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/me.php`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const result = await response.json();

      if (!response.ok || !result.status || result.role !== "admin") {
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("admin_logged_in");
        window.location.replace("index.html");
        return;
      }

      localStorage.setItem("user", JSON.stringify(result.data || {}));
      localStorage.setItem("role", result.role);

      if (adminApp) adminApp.hidden = false;
      if (authState) authState.hidden = true;
      initAdminApp();
    } catch (error) {
      console.error("Gagal memeriksa sesi admin:", error);
      if (!navigator.onLine || error instanceof TypeError) {
        if (adminApp) adminApp.hidden = false;
        if (authState) authState.hidden = true;
        showTableConnectionLost();
      } else {
        window.location.replace("index.html");
      }
    }
  }

  async function fetchAllCulinaryForSearch(forceNoCache = false) {
    if (!forceNoCache && allCulinaryData.length > 0) {
      return allCulinaryData;
    }

    if (!forceNoCache) {
      const cachedAll = readAllKulinerCache();
      if (cachedAll && cachedAll.length > 0) {
        allCulinaryData = cachedAll;
        return allCulinaryData;
      }
    }

    if (!navigator.onLine) {
      return allCulinaryData;
    }

    if (!forceNoCache && allCulinaryPromise) {
      return allCulinaryPromise;
    }

    isFetchingAllForSearch = true;
    const cacheBuster = forceNoCache ? `&_t=${Date.now()}` : "";

    allCulinaryPromise = (async () => {
      try {
        const firstUrl = `${getApiUrl("kuliner.php")}?page=1&limit=1000${cacheBuster}`;
        const response = await fetch(firstUrl, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (!response.ok) throw new Error("Gagal mengambil semua data kuliner.");

        const result = await response.json();
        let combined = Array.isArray(result.data)
          ? [...result.data]
          : Array.isArray(result)
            ? [...result]
            : [];

        const totalPages = Number(result.pagination?.total_pages) || 1;
        if (totalPages > 1 && combined.length < (Number(result.pagination?.total_items) || Infinity)) {
          const extraPromises = [];
          for (let p = 2; p <= totalPages; p++) {
            extraPromises.push(
              fetch(`${getApiUrl("kuliner.php")}?page=${p}&limit=1000${cacheBuster}`, {
                headers: { Accept: "application/json" },
                credentials: "include",
              })
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null)
            );
          }
          const extraResults = await Promise.all(extraPromises);
          extraResults.forEach((res) => {
            if (res && Array.isArray(res.data)) {
              combined = combined.concat(res.data);
            }
          });
        }

        const seenIds = new Set();
        allCulinaryData = combined.filter((item) => {
          const idKey = String(item.id_tempat || item.id_kuliner || item.id || JSON.stringify(item));
          if (seenIds.has(idKey)) return false;
          seenIds.add(idKey);
          return true;
        });

        writeAllKulinerCache(allCulinaryData);
        return allCulinaryData;
      } catch (error) {
        console.error("Gagal memuat semua data kuliner untuk pencarian:", error);
        return allCulinaryData;
      } finally {
        isFetchingAllForSearch = false;
        allCulinaryPromise = null;
      }
    })();

    return allCulinaryPromise;
  }

  async function fetchKulinerData(forceNoCache = false, isPageSwitch = false) {
    const paginationContainer = document.getElementById("paginationContainer");

    if (!navigator.onLine) {
      showTableConnectionLost();
      return;
    }

    const cachedPage = !forceNoCache ? pageDataCache.get(currentAdminPage) : null;
    const localCachedFirstPage =
      !forceNoCache && currentAdminPage === 1 && !cachedPage ? readKulinerCache() : null;
    const initialData = cachedPage || localCachedFirstPage;

    if (initialData && initialData.length > 0) {
      culinaryData = initialData;
      if (tableError) tableError.hidden = true;
      renderTableWithPagination(totalPagesFromBE);
    } else if (!isPageSwitch) {
      if (tableCard) tableCard.hidden = false;
      if (tableLoading) tableLoading.hidden = false;
      if (tableError) tableError.hidden = true;
      if (tableWrapper) tableWrapper.hidden = true;
      if (tableEmpty) tableEmpty.hidden = true;
      if (tableNoData) tableNoData.hidden = true;
      if (searchToolbar) searchToolbar.hidden = false;
      if (addCulinaryButton) addCulinaryButton.hidden = false;
      if (paginationContainer) paginationContainer.innerHTML = "";
    }

    try {
      const cacheBuster = forceNoCache ? `&_t=${Date.now()}` : "";
      const url = `${getApiUrl("kuliner.php")}?page=${currentAdminPage}&limit=${itemsPerPageAdmin}${cacheBuster}`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        if (
          window.matchMedia("(max-width: 480px)").matches &&
          (response.status === 401 || response.status === 403)
        ) {
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          localStorage.removeItem("admin_logged_in");
          window.location.replace("index.html");
          return;
        }
        throw new Error(`Gagal mengambil data dari server (HTTP ${response.status}).`);
      }

      const result = await response.json();
      const rawData = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];
      totalPagesFromBE = Number(result.pagination?.total_pages) || 1;

      culinaryData = rawData;
      pageDataCache.set(currentAdminPage, culinaryData);
      if (currentAdminPage === 1) {
        writeKulinerCache(culinaryData);
      }
      renderTableWithPagination(totalPagesFromBE);

      // Preload semua data di background agar pencarian instan tanpa tunggu fetch
      if (allCulinaryData.length === 0 && !isFetchingAllForSearch) {
        fetchAllCulinaryForSearch(forceNoCache).then(() => {
          if (searchInput && searchInput.value.trim()) {
            renderTableWithPagination(totalPagesFromBE);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching culinary data:", error);
      if (!navigator.onLine || error instanceof TypeError) {
        showTableConnectionLost();
      } else if (!initialData || initialData.length === 0) {
        if (window.matchMedia("(max-width: 480px)").matches) {
          showTableRequestError(error);
        } else {
          showTableConnectionLost();
        }
      }
    }
  }

  window.changeAdminPage = function (page) {
    if (!navigator.onLine) {
      showTableConnectionLost();
      return;
    }
    if (page < 1) return;
    currentAdminPage = page;
    renderAdminPaginationControls(totalPagesFromBE);
    fetchKulinerData(false, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function renderTableWithPagination(totalPages = totalPagesFromBE) {
    const hasKeyword = Boolean(searchInput && searchInput.value.trim());
    const filteredData = getFilteredCulinaryData();
    const paginationContainer = document.getElementById("paginationContainer");

    if (tableLoading) tableLoading.hidden = true;
    if (tableError) tableError.hidden = true;

    if (!filteredData || filteredData.length === 0) {
      if (tableCard) tableCard.hidden = true;
      const showNoData =
        window.matchMedia("(max-width: 480px)").matches && !hasKeyword && culinaryData.length === 0;
      if (tableEmpty) tableEmpty.hidden = showNoData;
      if (tableNoData) tableNoData.hidden = !showNoData;
      if (searchToolbar) searchToolbar.hidden = showNoData;
      if (addCulinaryButton) {
        addCulinaryButton.hidden = window.matchMedia("(max-width: 480px)").matches && hasKeyword;
      }
      if (paginationContainer) {
        paginationContainer.innerHTML = "";
        paginationContainer.hidden = true;
      }
      return;
    }

    if (tableCard) tableCard.hidden = false;
    if (tableEmpty) tableEmpty.hidden = true;
    if (tableNoData) tableNoData.hidden = true;
    if (searchToolbar) searchToolbar.hidden = false;
    if (addCulinaryButton) addCulinaryButton.hidden = false;
    if (tableWrapper) tableWrapper.hidden = false;
    if (kulinerTableBody) kulinerTableBody.replaceChildren();

    const startIndex = hasKeyword ? 0 : (currentAdminPage - 1) * itemsPerPageAdmin;
    const fragment = document.createDocumentFragment();

    filteredData.forEach((item, index) => {
      const tr = document.createElement("tr");

      const rawFoto = item.photo_url || item.foto || item.image || item.gambar || "";
      const fotoUrl = resolvePhotoUrl(rawFoto);
      const namaKuliner = item.nama_tempat || item.nama_kuliner || item.name || "Tanpa Nama";
      const kategori = item.nama_kategori || item.kategori || "Umum";
      const alamat = item.alamat || "-";
      const itemId = item.id_tempat || item.id_kuliner || item.id;
      const absoluteNo = startIndex + index + 1;

      const tdNo = document.createElement("td");
      tdNo.textContent = `${absoluteNo}.`;

      const tdImg = document.createElement("td");
      if (fotoUrl) {
        const img = document.createElement("img");
        img.src = fotoUrl;
        img.alt = namaKuliner;
        img.className = "table-img";
        img.loading = "eager";
        img.addEventListener(
          "error",
          () => {
            img.style.display = "none";
          },
          { once: true }
        );
        tdImg.appendChild(img);
      }

      const tdNama = document.createElement("td");
      tdNama.textContent = namaKuliner;

      const tdKat = document.createElement("td");
      tdKat.textContent = kategori;

      const tdAlamat = document.createElement("td");
      tdAlamat.textContent = alamat;

      const tdAction = document.createElement("td");
      const actionWrap = document.createElement("div");
      actionWrap.className = "action-buttons";

      const btnEdit = document.createElement("button");
      btnEdit.className = "btn-action btn-edit";
      btnEdit.setAttribute("data-id", itemId);
      btnEdit.innerHTML = '<iconify-icon icon="boxicons:pencil-draw-filled" aria-hidden="true"></iconify-icon> Edit';

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn-action btn-delete";
      btnDelete.setAttribute("data-id", itemId);
      btnDelete.innerHTML = '<iconify-icon icon="bi:trash-fill" aria-hidden="true"></iconify-icon> Hapus';

      actionWrap.append(btnEdit, btnDelete);
      tdAction.appendChild(actionWrap);

      tr.append(tdNo, tdImg, tdNama, tdKat, tdAlamat, tdAction);
      fragment.appendChild(tr);
    });

    if (kulinerTableBody) kulinerTableBody.appendChild(fragment);

    if (hasKeyword) {
      if (paginationContainer) {
        paginationContainer.innerHTML = "";
        paginationContainer.hidden = true;
      }
    } else {
      renderAdminPaginationControls(totalPages);
    }
  }

  function renderAdminPaginationControls(totalPagesInput) {
    const paginationContainer = document.getElementById("paginationContainer");
    if (!paginationContainer) return;

    paginationContainer.hidden = false;

    const totalPages = Math.max(1, Number(totalPagesInput) || 1);
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

  function navigateToEditPage(id) {
    if (!navigator.onLine) {
      showTableConnectionLost();
      return;
    }
    const sourceList = allCulinaryData.length > 0 ? allCulinaryData : culinaryData;
    const item = sourceList.find(
      (d) => String(d.id_tempat || d.id_kuliner || d.id) === String(id)
    );
    if (item) {
      try {
        sessionStorage.setItem(EDIT_DRAFT_KEY, JSON.stringify(item));
      } catch (_) {}
    }
    window.location.href = `edit_kuliner_admin.html?id=${encodeURIComponent(id)}`;
  }

  if (kulinerTableBody) {
    kulinerTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;

      const id = button.getAttribute("data-id");

      if (button.classList.contains("btn-edit")) {
        navigateToEditPage(id);
        return;
      }

      if (button.classList.contains("btn-delete")) {
        const name = button.closest("tr")?.querySelector("td:nth-child(3)")?.textContent.trim();
        pendingDeleteId = id;
        if (deleteConfirmMessage) {
          deleteConfirmMessage.textContent = `Kuliner “${name || "kuliner ini"}” akan di hapus dari daftar kuliner.`;
        }
        showDeleteState("confirm");
        if (deleteConfirmModal) deleteConfirmModal.hidden = false;
        if (cancelDeleteBtn) cancelDeleteBtn.focus();
      }
    });
  }

  function getFilteredCulinaryData() {
    const rawKeyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    if (!rawKeyword) return culinaryData;

    const sourceData = allCulinaryData.length > 0 ? allCulinaryData : culinaryData;
    const keywords = rawKeyword.split(/\s+/);

    return sourceData.filter((item) => {
      const name = (item.nama_kuliner || item.name || "").toLowerCase();
      const category = (item.nama_kategori || item.kategori || "").toLowerCase();
      const address = (item.alamat || item.address || "").toLowerCase();

      const combinedText = `${name} ${category} ${address}`;
      return keywords.every((kw) => combinedText.includes(kw));
    });
  }

  function showDeleteState(state) {
    if (!deleteConfirmModal) return;
    deleteConfirmModal.dataset.state = state;
    if (deleteConfirmState) deleteConfirmState.hidden = state !== "confirm";
    if (deleteProgressState) deleteProgressState.hidden = state !== "progress";
    if (deleteSuccessState) deleteSuccessState.hidden = state !== "success";
    if (deleteErrorState) deleteErrorState.hidden = state !== "error";
  }

  function closeDeleteModal() {
    if (deleteInProgress || !deleteConfirmModal) return;
    deleteConfirmModal.hidden = true;
    pendingDeleteId = null;
  }

  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);

  async function deletePendingCulinary() {
    if (!pendingDeleteId || deleteInProgress) return;

    deleteInProgress = true;
    if (confirmDeleteBtn) confirmDeleteBtn.disabled = true;
    if (retryDeleteBtn) retryDeleteBtn.disabled = true;
    showDeleteState("progress");

    try {
      const response = await fetch(`${getApiUrl("kuliner.php")}?id=${encodeURIComponent(pendingDeleteId)}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.message || "Periksa koneksi internet Anda.");
      }

      culinaryData = culinaryData.filter(
        (item) => String(item.id_tempat || item.id_kuliner || item.id) !== String(pendingDeleteId)
      );
      allCulinaryData = allCulinaryData.filter(
        (item) => String(item.id_tempat || item.id_kuliner || item.id) !== String(pendingDeleteId)
      );
      pageDataCache.clear();
      clearAllKulinerCache();
      if (currentAdminPage === 1) {
        writeKulinerCache(culinaryData);
      }

      if (culinaryData.length === 0 && currentAdminPage > 1) {
        currentAdminPage -= 1;
        await fetchKulinerData(true, true);
      } else {
        renderTableWithPagination(totalPagesFromBE);
      }

      showDeleteState("success");
      if (closeDeleteSuccessBtn) closeDeleteSuccessBtn.focus();
    } catch (error) {
      console.error("Error deleting culinary:", error);
      if (deleteErrorMessage) {
        deleteErrorMessage.textContent =
          !navigator.onLine || error instanceof TypeError
            ? "Periksa koneksi internet anda"
            : error.message || "Terjadi kesalahan. Silakan coba lagi.";
      }
      showDeleteState("error");
      if (retryDeleteBtn) retryDeleteBtn.focus();
    } finally {
      deleteInProgress = false;
      if (confirmDeleteBtn) confirmDeleteBtn.disabled = false;
      if (retryDeleteBtn) retryDeleteBtn.disabled = false;
    }
  }

  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", deletePendingCulinary);
  if (retryDeleteBtn) retryDeleteBtn.addEventListener("click", deletePendingCulinary);
  if (closeDeleteSuccessBtn) closeDeleteSuccessBtn.addEventListener("click", closeDeleteModal);

  if (deleteConfirmModal) {
    deleteConfirmModal.addEventListener("click", (event) => {
      if (event.target === deleteConfirmModal) closeDeleteModal();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", async () => {
      const keyword = searchInput.value.trim();
      if (!keyword) {
        renderTableWithPagination(totalPagesFromBE);
        return;
      }

      if (allCulinaryData.length === 0) {
        await fetchAllCulinaryForSearch(false);
        if (searchInput.value.trim() === keyword) {
          renderTableWithPagination(totalPagesFromBE);
        }
        return;
      }

      renderTableWithPagination(totalPagesFromBE);
    });
  }

  if (tableRetryButton) {
    tableRetryButton.addEventListener("click", () => {
      clearAllKulinerCache();
      fetchKulinerData(true);
    });
  }

  window.addEventListener("offline", () => {
    showTableConnectionLost();
  });

  window.addEventListener("online", () => {
    if (tableError && !tableError.hidden) {
      clearAllKulinerCache();
      fetchKulinerData(true);
    }
  });

  function initAdminApp() {
    fetchKulinerData(false);
  }

  checkAdminAccessSilent();
});