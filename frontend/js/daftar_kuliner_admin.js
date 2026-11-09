document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = window.BASE_URL || window.location.origin;

  // Bypass tampilan auth di local agar langsung masuk ke panel utama
  const authState = document.getElementById("authState");
  const adminApp = document.getElementById("adminApp");

  if (authState) authState.hidden = true;
  if (adminApp) adminApp.hidden = false;

  const tableLoading = document.getElementById("tableLoading");
  const tableError = document.getElementById("tableError");
  const tableWrapper = document.getElementById("tableWrapper");
  const tableEmpty = document.getElementById("tableEmpty");
  const kulinerTableBody = document.getElementById("kulinerTableBody");
  const searchInput = document.getElementById("searchKuliner");
  const tableRetryButton = document.getElementById("tableRetryButton");
  const tableCard = document.querySelector(".table-card");
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
  let pendingDeleteId = null;
  let deleteInProgress = false;

  async function fetchKulinerData() {
    if (tableLoading) tableLoading.hidden = false;
    if (tableError) tableError.hidden = true;
    if (tableWrapper) tableWrapper.hidden = true;
    if (tableEmpty) tableEmpty.hidden = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/kuliner.php`, {
        headers: { "Accept": "application/json" },
        credentials: "include"
      });
      const result = await response.json();

      if (!response.ok || !result.status || !Array.isArray(result.data)) {
        throw new Error(result.message || "Gagal mengambil data kuliner dari server.");
      }

      culinaryData = result.data;

      renderTable(culinaryData);
    } catch (error) {
      console.error("Error fetching culinary data:", error);
      if (tableLoading) tableLoading.hidden = true;
      if (tableWrapper) tableWrapper.hidden = true;
      if (tableCard) tableCard.hidden = true; // Sembunyikan kotak tabel utama
      if (tableError) tableError.hidden = false; // Tampilkan pesan error koneksi
    }
  }

  // Fungsi merender baris tabel ke HTML
  function renderTable(data) {
    if (tableLoading) tableLoading.hidden = true;

    if (!data || data.length === 0) {
      if (tableCard) tableCard.hidden = true;
      if (tableEmpty) tableEmpty.hidden = false;
      return;
    }

    if (tableCard) tableCard.hidden = false;
    if (tableEmpty) tableEmpty.hidden = true;
    if (tableWrapper) tableWrapper.hidden = false;
    if (kulinerTableBody) kulinerTableBody.innerHTML = "";

    data.forEach((item, index) => {
      const tr = document.createElement("tr");

      const fotoUrl = item.photo_url || item.foto || item.image || "assets/default-kuliner.png";
      const namaKuliner = item.nama_kuliner || item.name || "Tanpa Nama";
      const kategori = item.nama_kategori || item.kategori || "Umum";
      const alamat = item.alamat || "-";
      const itemId = item.id_tempat;

      tr.innerHTML = `
        <td><strong>${index + 1}.</strong></td>
        <td><img src="${fotoUrl}" alt="${namaKuliner}" class="table-img" onerror="this.src='assets/default-kuliner.png'"></td>
        <td>${namaKuliner}</td>
        <td>${kategori}</td>
        <td>${alamat}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-action btn-edit" data-id="${itemId}">
              <iconify-icon icon="lucide:pencil" aria-hidden="true"></iconify-icon> Edit
            </button>
            <button class="btn-action btn-delete" data-id="${itemId}">
              <iconify-icon icon="bi:trash-fill" aria-hidden="true"></iconify-icon> Hapus
            </button>
          </div>
        </td>
      `;
      if (kulinerTableBody) kulinerTableBody.appendChild(tr);
    });
  }

  function getFilteredCulinaryData() {
    const keyword = searchInput.value.trim().toLowerCase();
    return culinaryData.filter((item) => {
      const name = (item.nama_kuliner || "").toLowerCase();
      const category = (item.nama_kategori || "").toLowerCase();
      const address = (item.alamat || "").toLowerCase();
      return name.includes(keyword) || category.includes(keyword) || address.includes(keyword);
    });
  }

  function showDeleteState(state) {
    deleteConfirmModal.dataset.state = state;
    deleteConfirmState.hidden = state !== "confirm";
    deleteProgressState.hidden = state !== "progress";
    deleteSuccessState.hidden = state !== "success";
    deleteErrorState.hidden = state !== "error";
  }

  function closeDeleteModal() {
    if (deleteInProgress) return;
    deleteConfirmModal.hidden = true;
    pendingDeleteId = null;
  }

  // Fitur Pencarian Real-Time
  if (searchInput) {
    searchInput.addEventListener("input", () => renderTable(getFilteredCulinaryData()));
  }

  if (kulinerTableBody) {
    kulinerTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;

      const id = button.getAttribute("data-id");
      if (button.classList.contains("btn-edit")) {
        alert(`Edit kuliner dengan ID: ${id}`);
        return;
      }

      if (!button.classList.contains("btn-delete")) return;

      const name = button.closest("tr")?.querySelector("td:nth-child(3)")?.textContent.trim();
      pendingDeleteId = id;
      if (deleteConfirmMessage) {
        deleteConfirmMessage.textContent = `Kuliner “${name || "kuliner ini"}” akan di hapus dari daftar kuliner.`;
      }
      showDeleteState("confirm");
      deleteConfirmModal.hidden = false;
      cancelDeleteBtn.focus();
    });
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", () => {
      closeDeleteModal();
    });
  }

  async function deletePendingCulinary() {
    if (!pendingDeleteId || deleteInProgress) return;

    deleteInProgress = true;
    confirmDeleteBtn.disabled = true;
    retryDeleteBtn.disabled = true;
    showDeleteState("progress");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/kuliner.php?id=${encodeURIComponent(pendingDeleteId)}`,
        {
          method: "DELETE",
          headers: { "Accept": "application/json" },
          credentials: "include"
        }
      );
      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.message || "Periksa koneksi internet Anda, lalu coba lagi.");
      }

      culinaryData = culinaryData.filter((item) => String(item.id_tempat) !== String(pendingDeleteId));
      renderTable(getFilteredCulinaryData());
      showDeleteState("success");
      closeDeleteSuccessBtn.focus();
    } catch (error) {
      console.error("Error deleting culinary:", error);
      deleteErrorMessage.textContent = !navigator.onLine || error instanceof TypeError
        ? "Periksa koneksi internet anda"
        : error.message || "Terjadi kesalahan. Silakan coba lagi.";
      showDeleteState("error");
      retryDeleteBtn.focus();
    } finally {
      deleteInProgress = false;
      confirmDeleteBtn.disabled = false;
      retryDeleteBtn.disabled = false;
    }
  }

  confirmDeleteBtn.addEventListener("click", deletePendingCulinary);
  retryDeleteBtn.addEventListener("click", deletePendingCulinary);
  closeDeleteSuccessBtn.addEventListener("click", closeDeleteModal);
  deleteConfirmModal.addEventListener("click", (event) => {
    if (event.target === deleteConfirmModal) closeDeleteModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !deleteConfirmModal.hidden) closeDeleteModal();
  });

  if (tableRetryButton) {
    tableRetryButton.addEventListener("click", fetchKulinerData);
  }

  // Jalankan fungsi ambil data
  fetchKulinerData();
});