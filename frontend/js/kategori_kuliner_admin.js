document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = window.BASE_URL || window.location.origin;
  const KATEGORI_CACHE_KEY = "mangan_yukk_admin_kategori_v1";
  const API_URL = `${API_BASE_URL}/api/admin/kategori.php`;
  const VALID_CATEGORY_NAME_REGEX = /^[A-Za-z\s]+$/;

  const tableCardContainer = document.getElementById("tableCardContainer");
  const tableLoading = document.getElementById("tableLoading");
  const tableError = document.getElementById("tableError");
  const tableWrapper = document.getElementById("tableWrapper");
  const tableEmpty = document.getElementById("tableEmpty");
  const categoryEmptyMobile = document.getElementById("categoryEmptyMobile");
  const kategoriTableBody = document.getElementById("kategoriTableBody");
  const tableErrorState = document.getElementById("tableErrorState");
  const tableErrorTitle = document.getElementById("tableErrorTitle");
  const tableErrorDesc = document.getElementById("tableErrorDesc");
  const btnReloadKategori = document.getElementById("btnReloadKategori");

  const btnAddKategori = document.getElementById("btnAddKategori");
  const saveKategoriBtn = document.getElementById("saveKategoriBtn");

  // Elemen Modal Form
  const kategoriModal = document.getElementById("kategoriModal");
  const modalTitle = document.getElementById("modalTitle");
  const kategoriForm = document.getElementById("kategoriForm");
  const editIdKategori = document.getElementById("editIdKategori");
  const namaKategoriInput = document.getElementById("namaKategoriInput");
  const cancelModalBtn = document.getElementById("cancelModalBtn");

  // Elemen Modal Validasi Pop-up
  const successModal = document.getElementById("successModal");
  const successMessageText = document.getElementById("successMessageText");
  const closeSuccessBtn = document.getElementById("closeSuccessBtn");

  const errorModal = document.getElementById("errorModal");
  const errorModalTitle = document.getElementById("errorModalTitle");
  const errorMessageText = document.getElementById("errorMessageText");
  const retryErrorBtn = document.getElementById("retryErrorBtn");

  // Elemen Modal Konfirmasi Hapus & Masih Digunakan
  const deleteConfirmModal = document.getElementById("deleteConfirmModal");
  const deleteConfirmText = document.getElementById("deleteConfirmText");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const retryDeleteBtn = document.getElementById("retryDeleteBtn");

  const categoryInUseModal = document.getElementById("categoryInUseModal");
  const inUseMessageText = document.getElementById("inUseMessageText");
  const closeInUseBtn = document.getElementById("closeInUseBtn");

  let kategoriData = [];
  let selectedDeleteId = null;
  let activeErrorAction = null;
  let isSavingKategori = false;
  let isDeletingKategori = false;
  const isMobileCategoryLayout = () => window.matchMedia("(max-width: 480px)").matches;

  function showPopup(modalEl) {
    if (!modalEl) return;
    modalEl.hidden = false;
    modalEl.style.display = "flex";
  }

  function hidePopup(modalEl) {
    if (!modalEl) return;
    modalEl.hidden = true;
    modalEl.style.display = "none";
  }

  function openErrorPopup(title, message, action = null) {
    activeErrorAction = action;
    if (errorModalTitle) errorModalTitle.textContent = title;
    if (errorMessageText) errorMessageText.textContent = message;
    showPopup(errorModal);
  }

  function openSuccessPopup(message) {
    if (successMessageText) successMessageText.textContent = message;
    showPopup(successModal);
  }

  async function parseJsonSafe(response) {
    try {
      const text = await response.text();
      if (!text) return {};
      return JSON.parse(text);
    } catch (_) {
      return {};
    }
  }

  function readKategoriCache() {
    try {
      const raw = localStorage.getItem(KATEGORI_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function writeKategoriCache(items) {
    try {
      localStorage.setItem(KATEGORI_CACHE_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  function clearKategoriCache() {
    try {
      localStorage.removeItem(KATEGORI_CACHE_KEY);
    } catch (_) {}
  }

  function extractCategoryCount(item) {
    const rawCount =
      item.jumlah_kuliner ??
      item.total_kuliner ??
      item.count_kuliner ??
      item.jml_kuliner ??
      item.jml ??
      0;
    const parsed = Number(rawCount);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  async function checkAdminAccessSilent() {
    const rawRole = localStorage.getItem("role");

    if (rawRole === "admin") {
      await fetchKategoriData();
      return;
    }

    try {
      const meUrl = `${API_BASE_URL}/api/me.php`;
      const response = await fetch(meUrl, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const result = await parseJsonSafe(response);

      if (response.status >= 500) {
        await fetchKategoriData();
        return;
      }

      if (!response.ok || !result.status || result.role !== "admin") {
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("admin_logged_in");
        window.location.replace("index.html");
        return;
      }

      localStorage.setItem("user", JSON.stringify(result.data || {}));
      localStorage.setItem("role", result.role);

      await fetchKategoriData();
    } catch (_) {
      await fetchKategoriData();
    }
  }

  function showTableErrorUI(isOffline) {
    if (tableCardContainer) tableCardContainer.hidden = true;
    if (categoryEmptyMobile) categoryEmptyMobile.hidden = true;
    if (btnAddKategori) btnAddKategori.hidden = true;
    if (tableErrorState) {
      if (tableErrorTitle) {
        tableErrorTitle.textContent = isOffline ? "Koneksi Internet Terputus" : "Gagal Memuat Data";
      }
      if (tableErrorDesc) {
        tableErrorDesc.textContent = isOffline
          ? "Periksa kembali jaringan internet anda dan silahkan muat ulang halaman"
          : "Terjadi kesalahan saat memuat daftar kategori dari server.";
      }
      tableErrorState.hidden = false;
    }
  }

  async function fetchKategoriData(forceNoCache = false) {
    const cached = !forceNoCache ? readKategoriCache() : null;

    if (cached && cached.length > 0) {
      kategoriData = cached;
      if (tableErrorState) tableErrorState.hidden = true;
      renderTable(kategoriData);
    } else {
      if (tableErrorState) tableErrorState.hidden = true;
      if (tableCardContainer) tableCardContainer.hidden = false;
      if (btnAddKategori) btnAddKategori.hidden = false;
      if (tableLoading) tableLoading.hidden = false;
      if (tableError) tableError.hidden = true;
      if (tableWrapper) tableWrapper.hidden = true;
      if (tableEmpty) tableEmpty.hidden = true;
    }

    if (!navigator.onLine) {
      if (!cached || cached.length === 0) {
        showTableErrorUI(true);
      }
      return;
    }

    try {
      const url = forceNoCache ? `${API_URL}?_t=${Date.now()}` : API_URL;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Server merespons dengan status ${response.status}`);
      }

      const result = await parseJsonSafe(response);
      if (Array.isArray(result)) {
        kategoriData = result;
      } else if (result && Array.isArray(result.data)) {
        kategoriData = result.data;
      } else if (result && Array.isArray(result.kategori)) {
        kategoriData = result.kategori;
      } else {
        kategoriData = [];
      }

      writeKategoriCache(kategoriData);
      renderTable(kategoriData);
    } catch (_) {
      if (tableLoading) tableLoading.hidden = true;
      if (!cached || cached.length === 0) {
        showTableErrorUI(!navigator.onLine);
      }
    }
  }

  if (btnReloadKategori) {
    btnReloadKategori.addEventListener("click", () => fetchKategoriData(true));
  }

  function renderTable(data) {
    if (tableLoading) tableLoading.hidden = true;
    if (tableErrorState) tableErrorState.hidden = true;
    if (btnAddKategori) btnAddKategori.hidden = false;

    if (!data || data.length === 0) {
      const showMobileEmpty = isMobileCategoryLayout();
      if (tableCardContainer) tableCardContainer.hidden = showMobileEmpty;
      if (tableWrapper) tableWrapper.hidden = true;
      if (tableEmpty) tableEmpty.hidden = showMobileEmpty;
      if (categoryEmptyMobile) categoryEmptyMobile.hidden = !showMobileEmpty;
      if (kategoriTableBody) kategoriTableBody.replaceChildren();
      return;
    }

    if (tableCardContainer) tableCardContainer.hidden = false;
    if (tableEmpty) tableEmpty.hidden = true;
    if (categoryEmptyMobile) categoryEmptyMobile.hidden = true;
    if (tableWrapper) tableWrapper.hidden = false;

    const fragment = document.createDocumentFragment();

    data.forEach((item, index) => {
      const tr = document.createElement("tr");
      const id = String(item.id_kategori ?? item.id ?? "").trim();
      const nama = String(item.nama_kategori ?? item.name ?? "-").trim() || "-";
      const jumlah = extractCategoryCount(item);

      tr.innerHTML = `
        <td>${index + 1}.</td>
        <td>${nama}</td>
        <td>${jumlah}</td>
        <td>
          <div class="action-buttons">
            <button type="button" class="btn-action btn-edit" data-id="${id}" data-nama="${nama}">
              <iconify-icon icon="boxicons:pencil-draw-filled" aria-hidden="true"></iconify-icon> Edit
            </button>
            <button type="button" class="btn-action btn-delete" data-id="${id}" data-nama="${nama}" data-jumlah="${jumlah}">
              <iconify-icon icon="bi:trash-fill" aria-hidden="true"></iconify-icon> Hapus
            </button>
          </div>
        </td>
      `;
      fragment.appendChild(tr);
    });

    if (kategoriTableBody) {
      kategoriTableBody.replaceChildren(fragment);
    }
  }

  if (btnAddKategori) {
    btnAddKategori.addEventListener("click", () => {
      if (modalTitle) modalTitle.textContent = "Tambah Kategori";
      if (editIdKategori) editIdKategori.value = "";
      if (namaKategoriInput) {
        namaKategoriInput.value = "";
        namaKategoriInput.classList.remove("input-error");
      }
      const alertBanner = document.getElementById("formAlertBanner");
      if (alertBanner) alertBanner.hidden = true;
      showPopup(kategoriModal);
      if (namaKategoriInput) namaKategoriInput.focus();
    });
  }

  function closeModal() {
    hidePopup(kategoriModal);
    if (namaKategoriInput) namaKategoriInput.classList.remove("input-error");
    const alertBanner = document.getElementById("formAlertBanner");
    if (alertBanner) alertBanner.hidden = true;
  }

  if (cancelModalBtn) {
    cancelModalBtn.addEventListener("click", closeModal);
  }

  if (kategoriModal) {
    kategoriModal.addEventListener("click", (e) => {
      if (e.target === kategoriModal) closeModal();
    });
  }

  if (kategoriTableBody) {
    kategoriTableBody.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (!button) return;

      const id = String(button.getAttribute("data-id") || "").trim();
      const nama = String(button.getAttribute("data-nama") || "").trim();

      if (button.classList.contains("btn-edit")) {
        if (modalTitle) modalTitle.textContent = "Edit Kategori";
        if (editIdKategori) editIdKategori.value = id;
        if (namaKategoriInput) {
          namaKategoriInput.value = nama;
          namaKategoriInput.classList.remove("input-error");
        }
        const alertBanner = document.getElementById("formAlertBanner");
        if (alertBanner) alertBanner.hidden = true;
        showPopup(kategoriModal);
        if (namaKategoriInput) namaKategoriInput.focus();
      }

      if (button.classList.contains("btn-delete")) {
        const jumlahKuliner = Number(button.getAttribute("data-jumlah") || 0);

        if (jumlahKuliner > 0) {
          if (inUseMessageText) {
            inUseMessageText.textContent = `Kategori "${nama}" masih digunakan oleh beberapa kuliner.`;
          }
          showPopup(categoryInUseModal);
          return;
        }

        if (!id) {
          openErrorPopup("Kategori gagal di hapus", "ID kategori tidak ditemukan.", null);
          return;
        }

        selectedDeleteId = id;
        if (deleteConfirmText) {
          deleteConfirmText.textContent = `Kategori "${nama}" akan dihapus dari daftar kategori.`;
        }
        showPopup(deleteConfirmModal);
      }
    });
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", () => {
      hidePopup(deleteConfirmModal);
      selectedDeleteId = null;
    });
  }

  async function executeDelete() {
    if (!selectedDeleteId || isDeletingKategori) return;

    const targetId = String(selectedDeleteId);
    isDeletingKategori = true;
    if (confirmDeleteBtn) confirmDeleteBtn.disabled = true;
    if (retryDeleteBtn) retryDeleteBtn.disabled = true;

    try {
      const response = await fetch(`${API_URL}?id=${encodeURIComponent(targetId)}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const result = await parseJsonSafe(response);
      const isSuccess =
        response.ok &&
        (result.status === true || result.success === true || result.status === undefined);

      if (!isSuccess) {
        throw new Error(result.message || `Gagal menghapus kategori (HTTP ${response.status}).`);
      }

      selectedDeleteId = null;
      kategoriData = kategoriData.filter(
        (item) => String(item.id_kategori ?? item.id ?? "").trim() !== targetId
      );
      clearKategoriCache();
      renderTable(kategoriData);

      openSuccessPopup("Kategori berhasil di hapus");
      void fetchKategoriData(true);
    } catch (error) {
      const isConnectionError =
        !navigator.onLine ||
        error instanceof TypeError ||
        (error && typeof error.message === "string" && error.message.includes("Failed to fetch"));

      openErrorPopup(
        "Kategori gagal di hapus",
        isConnectionError
          ? "Periksa koneksi internet anda"
          : (error && error.message) || "Gagal menghapus kategori.",
        "delete"
      );
    } finally {
      isDeletingKategori = false;
      if (confirmDeleteBtn) confirmDeleteBtn.disabled = false;
      if (retryDeleteBtn) retryDeleteBtn.disabled = false;
    }
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      hidePopup(deleteConfirmModal);
      await executeDelete();
    });
  }

  if (closeInUseBtn) {
    closeInUseBtn.addEventListener("click", () => {
      hidePopup(categoryInUseModal);
    });
  }

  async function executeFormSubmit() {
    if (isSavingKategori) return;

    const id = editIdKategori ? editIdKategori.value : "";
    const nama_kategori = namaKategoriInput ? namaKategoriInput.value.trim() : "";
    const alertBanner = document.getElementById("formAlertBanner");
    const alertMessage = document.getElementById("formAlertMessage");

    if (!nama_kategori) {
      if (namaKategoriInput) namaKategoriInput.classList.add("input-error");
      if (alertMessage) alertMessage.textContent = "Mohon isi nama kategori sebelum menyimpan";
      if (alertBanner) alertBanner.hidden = false;
      return;
    }

    if (!VALID_CATEGORY_NAME_REGEX.test(nama_kategori)) {
      if (namaKategoriInput) namaKategoriInput.classList.add("input-error");
      if (alertMessage) {
        alertMessage.textContent =
          "Nama kategori tidak boleh mengandung angka dan karakter khusus atau unicode.";
      }
      if (alertBanner) alertBanner.hidden = false;
      return;
    }

    const currentId = id ? String(id) : null;
    const isDuplicate = kategoriData.some((item) => {
      const itemId = String(item.id_kategori ?? item.id ?? "");
      const itemName = String(item.nama_kategori ?? item.name ?? "").trim().toLowerCase();
      return itemName === nama_kategori.toLowerCase() && itemId !== currentId;
    });

    if (isDuplicate) {
      if (namaKategoriInput) namaKategoriInput.classList.add("input-error");
      if (alertMessage) alertMessage.textContent = "Kategori sudah tersedia, silahkan gunakan nama lain.";
      if (alertBanner) alertBanner.hidden = false;
      return;
    }

    if (namaKategoriInput) namaKategoriInput.classList.remove("input-error");
    if (alertBanner) alertBanner.hidden = true;

    const formData = new FormData();
    formData.append("nama_kategori", nama_kategori);
    if (id) {
      formData.append("id", id);
      formData.append("_method", "PUT");
    }

    isSavingKategori = true;
    if (saveKategoriBtn) saveKategoriBtn.disabled = true;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
        credentials: "include",
      });

      const result = await parseJsonSafe(response);
      if (!response.ok || !result.status) {
        throw new Error(result.message || "Gagal menyimpan kategori.");
      }

      clearKategoriCache();
      closeModal();
      openSuccessPopup(id ? "Kategori berhasil di perbarui" : "Kategori berhasil disimpan");
      void fetchKategoriData(true);
    } catch (error) {
      closeModal();
      const isConnectionError =
        !navigator.onLine ||
        error instanceof TypeError ||
        (error && typeof error.message === "string" && error.message.includes("Failed to fetch"));

      openErrorPopup(
        id ? "Kategori gagal di perbarui" : "Kategori gagal disimpan",
        isConnectionError
          ? "Periksa koneksi internet anda"
          : (error && error.message) || "Periksa koneksi internet anda",
        "submit"
      );
    } finally {
      isSavingKategori = false;
      if (saveKategoriBtn) saveKategoriBtn.disabled = false;
    }
  }

  if (kategoriForm) {
    kategoriForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await executeFormSubmit();
    });
  }

  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener("click", () => {
      hidePopup(successModal);
    });
  }

  if (retryErrorBtn) {
    retryErrorBtn.addEventListener("click", async () => {
      hidePopup(errorModal);
      if (activeErrorAction === "delete") {
        await executeDelete();
      } else {
        showPopup(kategoriModal);
      }
    });
  }

  checkAdminAccessSilent();
});