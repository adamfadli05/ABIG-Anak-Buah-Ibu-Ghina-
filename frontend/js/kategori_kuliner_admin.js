document.addEventListener("DOMContentLoaded", () => {
  // --- DINAMIS API URL (TIDAK HARDCODE) ---
  // Menggunakan relative path yang aman dan fleksibel untuk komputer lokal maupun hosting
  const API_URL = "../backend/api/admin/kategori.php";

  const tableCardContainer = document.getElementById("tableCardContainer");
  const tableLoading = document.getElementById("tableLoading");
  const tableError = document.getElementById("tableError");
  const tableWrapper = document.getElementById("tableWrapper");
  const tableEmpty = document.getElementById("tableEmpty");
  const kategoriTableBody = document.getElementById("kategoriTableBody");

  const btnAddKategori = document.getElementById("btnAddKategori");
  
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

  const categoryInUseModal = document.getElementById("categoryInUseModal");
  const inUseMessageText = document.getElementById("inUseMessageText");
  const closeInUseBtn = document.getElementById("closeInUseBtn");

  let kategoriData = [];
  let selectedDeleteId = null;

  // Mengambil Data dari kategori.php
  async function fetchKategoriData() {
    if (tableLoading) tableLoading.hidden = false;
    if (tableError) tableError.hidden = true;
    if (tableWrapper) tableWrapper.hidden = true;
    if (tableEmpty) tableEmpty.hidden = true;

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Server merespons dengan status ${response.status}`);
      }

      const result = await response.json();
      if (Array.isArray(result)) {
        kategoriData = result;
      } else if (result && Array.isArray(result.data)) {
        kategoriData = result.data;
      } else if (result && Array.isArray(result.kategori)) {
        kategoriData = result.kategori;
      } else {
        kategoriData = [];
      }

      renderTable(kategoriData);
    } catch (error) {
      console.error("Gagal mengambil data kategori:", error);
      if (tableLoading) tableLoading.hidden = true;
      if (tableError) tableError.hidden = false;
    }
  }

  // Render Tabel Kategori & Jumlah Kuliner dari Database
  function renderTable(data) {
    if (tableLoading) tableLoading.hidden = true;

    if (!data || data.length === 0) {
      if (tableCardContainer) tableCardContainer.hidden = false;
      if (tableEmpty) tableEmpty.hidden = false;
      return;
    }

    if (tableCardContainer) tableCardContainer.hidden = false;
    if (tableWrapper) tableWrapper.hidden = false;
    if (kategoriTableBody) kategoriTableBody.innerHTML = "";

    data.forEach((item, index) => {
      const tr = document.createElement("tr");
      const id = item.id_kategori || item.id;
      const nama = item.nama_kategori || item.name || "-";
      const jumlah = Number(item.jumlah_kuliner ?? item.total_kuliner ?? item.count_kuliner ?? item.jml ?? 0);

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
      kategoriTableBody.appendChild(tr);
    });
  }

  // Buka Modal Tambah
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
      if (kategoriModal) kategoriModal.hidden = false;
      if (namaKategoriInput) namaKategoriInput.focus();
    });
  }

  // Tutup Modal Form
  function closeModal() {
    if (kategoriModal) kategoriModal.hidden = true;
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

  // Event Klik Edit & Hapus
  if (kategoriTableBody) {
    kategoriTableBody.addEventListener("click", async (e) => {
      const button = e.target.closest("button");
      if (!button) return;

      const id = button.getAttribute("data-id");
      const nama = button.getAttribute("data-nama");

      if (button.classList.contains("btn-edit")) {
        if (modalTitle) modalTitle.textContent = "Edit Kategori";
        if (editIdKategori) editIdKategori.value = id;
        if (namaKategoriInput) {
          namaKategoriInput.value = nama;
          namaKategoriInput.classList.remove("input-error");
        }
        const alertBanner = document.getElementById("formAlertBanner");
        if (alertBanner) alertBanner.hidden = true;
        if (kategoriModal) kategoriModal.hidden = false;
        if (namaKategoriInput) namaKategoriInput.focus();
      }

      if (button.classList.contains("btn-delete")) {
        const jumlahKuliner = Number(button.getAttribute("data-jumlah") || 0);

        if (jumlahKuliner > 0) {
          if (inUseMessageText) {
            inUseMessageText.textContent = `Kategori "${nama}" masih digunakan oleh beberapa kuliner.`;
          }
          if (categoryInUseModal) categoryInUseModal.hidden = false;
          return;
        }

        selectedDeleteId = id;
        if (deleteConfirmText) {
          deleteConfirmText.textContent = `Kategori "${nama}" akan dihapus dari daftar kategori.`;
        }
        if (deleteConfirmModal) deleteConfirmModal.hidden = false;
      }
    });
  }

  // Tombol Batal pada Modal Konfirmasi Hapus
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", () => {
      if (deleteConfirmModal) deleteConfirmModal.hidden = true;
      selectedDeleteId = null;
    });
  }

  // Tombol Hapus (Konfirmasi)
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!selectedDeleteId) return;

      if (deleteConfirmModal) deleteConfirmModal.hidden = true;

      try {
        const response = await fetch(`${API_URL}?id=${encodeURIComponent(selectedDeleteId)}`, {
          method: "DELETE",
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok || !result.status) {
          throw new Error(result.message || "Gagal menghapus kategori.");
        }
        
        if (successMessageText) successMessageText.textContent = "Kategori berhasil di hapus";
        if (successModal) successModal.hidden = false;
        fetchKategoriData();
      } catch (error) {
        console.error(error);
        if (errorModalTitle) errorModalTitle.textContent = "Kategori gagal di hapus";
        if (errorMessageText) errorMessageText.textContent = error.message || "Periksa koneksi internet anda";
        if (errorModal) errorModal.hidden = false;
      } finally {
        selectedDeleteId = null;
      }
    });
  }

  // Tutup Modal "Kategori Masih Digunakan"
  if (closeInUseBtn) {
    closeInUseBtn.addEventListener("click", () => {
      if (categoryInUseModal) categoryInUseModal.hidden = true;
    });
  }

  // Submit Form dengan Validasi Kosong & Cek Duplikat Nama
  if (kategoriForm) {
    kategoriForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = editIdKategori.value;
      const nama_kategori = namaKategoriInput.value.trim();
      const alertBanner = document.getElementById("formAlertBanner");
      const alertMessage = document.getElementById("formAlertMessage");

      if (!nama_kategori) {
        namaKategoriInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Mohon isi nama kategori sebelum menyimpan";
        if (alertBanner) alertBanner.hidden = false;
        return;
      }

      const currentId = id ? String(id) : null;
      const isDuplicate = kategoriData.some(item => {
        const itemId = String(item.id_kategori || item.id || "");
        const itemName = (item.nama_kategori || item.name || "").trim().toLowerCase();
        return itemName === nama_kategori.toLowerCase() && itemId !== currentId;
      });

      if (isDuplicate) {
        namaKategoriInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Nama kategori sudah ada, gunakan nama lain";
        if (alertBanner) alertBanner.hidden = false;
        return;
      }

      namaKategoriInput.classList.remove("input-error");
      if (alertBanner) alertBanner.hidden = true;

      const formData = new FormData();
      formData.append("nama_kategori", nama_kategori);
      if (id) {
        formData.append("id", id);
        formData.append("_method", "PUT");
      }

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
          credentials: "include",
        });

        const result = await response.json();
        if (!response.ok || !result.status) {
          throw new Error(result.message || "Gagal menyimpan kategori.");
        }

        closeModal();

        // Atur teks sukses sesuai mode (Tambah / Edit)
        if (successMessageText) {
          successMessageText.textContent = id ? "Kategori berhasil di perbarui" : "Kategori berhasil disimpan";
        }

        if (successModal) successModal.hidden = false;
        fetchKategoriData();
      } catch (error) {
        console.error(error);
        closeModal();

        // Atur teks gagal sesuai mode (Tambah / Edit)
        if (errorModalTitle) {
          errorModalTitle.textContent = id ? "Kategori gagal di di perbarui" : "Kategori gagal disimpan";
        }

        if (errorMessageText) errorMessageText.textContent = error.message || "Periksa koneksi internet anda";
        if (errorModal) errorModal.hidden = false;
      }
    });
  }

  // Tombol Oke pada pop-up sukses
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener("click", () => {
      if (successModal) successModal.hidden = true;
    });
  }

  // Tombol Coba lagi pada pop-up gagal
  if (retryErrorBtn) {
    retryErrorBtn.addEventListener("click", () => {
      if (errorModal) errorModal.hidden = true;
      if (kategoriModal) kategoriModal.hidden = false;
    });
  }

  fetchKategoriData();
});