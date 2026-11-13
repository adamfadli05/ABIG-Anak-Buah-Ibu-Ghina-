document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = window.BASE_URL || window.location.origin;

  // --- CEK AKSES ADMIN SECARA SENYAP (SILENT CHECK) ---
  async function checkAdminAccessSilent() {
    const rawRole = localStorage.getItem("role");
    
    // Jika di local/storage sudah ada role admin, langsung buka aplikasi tanpa loading screen
    if (rawRole === "admin") {
      if (adminApp) adminApp.hidden = false;
      if (authState) authState.hidden = true;
      initAdminApp();
      return;
    }

    // Jika belum ada data lokal, lakukan verifikasi senyap ke server
    try {
      const response = await fetch(`${API_BASE_URL}/api/me.php`, {
        credentials: "include",
        headers: { Accept: "application/json" }
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
      // Jika gagal/terputus, arahkan kembali ke halaman utama atau login
      window.location.replace("index.html");
    }
  }

  // Bypass tampilan auth di local / elemen penampung
  const authState = document.getElementById("authState");
  const adminApp = document.getElementById("adminApp");

  const contentHeaderFlex = document.querySelector(".content-header-flex");
  const searchToolbar = document.querySelector(".search-toolbar");
  const tableCard = document.querySelector(".table-card");
  const tableLoading = document.getElementById("tableLoading");
  const tableError = document.getElementById("tableError");
  const tableWrapper = document.getElementById("tableWrapper");
  const tableEmpty = document.getElementById("tableEmpty");
  const kulinerTableBody = document.getElementById("kulinerTableBody");
  const searchInput = document.getElementById("searchKuliner");
  const tableRetryButton = document.getElementById("tableRetryButton");

  // Elemen Halaman Edit Kuliner
  const editCulinarySection = document.getElementById("editCulinarySection");
  const editCulinaryForm = document.getElementById("editCulinaryForm");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const editKategoriSelect = document.getElementById("editKategori");
  const editPhotoPreview = document.getElementById("editPhotoPreview");
  const editPhotoInput = document.getElementById("editPhotoInput");

  // Elemen Modal Sukses Edit
  const successEditModal = document.getElementById("successEditModal");
  const closeSuccessEditBtn = document.getElementById("closeSuccessEditBtn");

  // Elemen Modal Gagal Edit (Sesuai Figma)
  const errorEditModal = document.getElementById("errorEditModal");
  const editErrorMessage = document.getElementById("editErrorMessage");
  const retryEditBtn = document.getElementById("retryEditBtn");

  // Elemen Modal Hapus
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

  // --- DINAMIS BASE URL (TIDAK HARDCODE) ---
  const getApiUrl = (endpoint) => {
    return `../backend/api/admin/${endpoint}`;
  };

  async function fetchKulinerData() {
    if (tableLoading) tableLoading.hidden = false;
    if (tableError) tableError.hidden = true;
    if (tableWrapper) tableWrapper.hidden = true;
    if (tableEmpty) tableEmpty.hidden = true;

    try {
      const response = await fetch(getApiUrl("kuliner.php"), {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Gagal mengambil data dari server.");

      const result = await response.json();
      const rawData = result.data || result;
      if (!Array.isArray(rawData)) {
        throw new Error("Format data tidak valid.");
      }

      culinaryData = rawData;
      renderTable(culinaryData);
    } catch (error) {
      console.error("Error fetching culinary data:", error);
      if (tableLoading) tableLoading.hidden = true;
      if (tableWrapper) tableWrapper.hidden = true;
      if (tableCard) tableCard.hidden = true;
      if (tableError) tableError.hidden = false;
    }
  }

  // Mengambil opsi kategori untuk dropdown form edit (Tanpa Hardcode)
  async function fetchKategoriOptions(selectedCategoryId = "") {
    try {
      const response = await fetch(getApiUrl("kategori.php"), {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      const categories = Array.isArray(result) ? result : result.data || [];

      if (editKategoriSelect) {
        editKategoriSelect.innerHTML = '<option value="" disabled>Pilih Kategori</option>';
        categories.forEach((cat) => {
          const catId = cat.id_kategori || cat.id;
          const catName = cat.nama_kategori || cat.name;
          const option = document.createElement("option");
          option.value = catId;
          option.textContent = catName;
          if (String(catId) === String(selectedCategoryId)) {
            option.selected = true;
          }
          editKategoriSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Gagal memuat kategori:", error);
    }
  }

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

      const fotoUrl = item.photo_url || item.foto || item.image || "";
      const namaKuliner = item.nama_kuliner || item.name || "Tanpa Nama";
      const kategori = item.nama_kategori || item.kategori || "Umum";
      const alamat = item.alamat || "-";
      const itemId = item.id_tempat || item.id_kuliner || item.id;

      tr.innerHTML = `
        <td>${index + 1}.</td>
        <td><img src="${fotoUrl}" alt="${namaKuliner}" class="table-img" onerror="this.style.display='none'"></td>
        <td>${namaKuliner}</td>
        <td>${kategori}</td>
        <td>${alamat}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-action btn-edit" data-id="${itemId}">
              <iconify-icon icon="boxicons:pencil-draw-filled" aria-hidden="true"></iconify-icon> Edit
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

  // Menampilkan Halaman Edit dan Mengisi Data Otomatis dari Database
  async function openEditPage(id) {
    const item = culinaryData.find((d) => String(d.id_tempat || d.id_kuliner || d.id) === String(id));
    if (!item) {
      alert("Data kuliner tidak ditemukan!");
      return;
    }

    const alertBanner = document.getElementById("formAlertBanner");
    if (alertBanner) alertBanner.hidden = true;

    document.getElementById("editIdKuliner").value = id;
    document.getElementById("editNamaKuliner").value = item.nama_kuliner || item.name || item.nama || "";
    document.getElementById("editLatitude").value = item.latitude || item.lat || "";
    document.getElementById("editHarga").value = item.harga || item.price || "";
    document.getElementById("editLongitude").value = item.longitude || item.lng || item.lon || "";

    const jamBukaInput = document.getElementById("editJamBuka");
    const jamTutupInput = document.getElementById("editJamTutup");

    let jamBukaVal = item.jam_buka || "";
    let jamTutupVal = item.jam_tutup || "";

    if (!jamBukaVal && item.jam_operasional) {
      const parts = item.jam_operasional.split("-");
      jamBukaVal = (parts[0] || "").trim();
      jamTutupVal = (parts[1] || "").trim();
    }

    if (jamBukaInput) jamBukaInput.value = jamBukaVal;
    if (jamTutupInput) jamTutupInput.value = jamTutupVal;

    document.getElementById("editAlamat").value = item.alamat || item.address || "";
    document.getElementById("editNoTelepon").value = item.nomor_telepon || item.phone_number || item.no_telp || "";
    document.getElementById("editDeskripsi").value = item.deskripsi || item.description || "";

    await fetchKategoriOptions(item.id_kategori || item.category_id || item.kategori_id);

    let fotoPath = item.photo_url || item.foto || item.image || item.gambar || "";
    let fotoUrl = "";
    if (fotoPath) {
      if (fotoPath.startsWith("http://") || fotoPath.startsWith("https://") || fotoPath.startsWith("data:")) {
        fotoUrl = fotoPath;
      } else {
        const cleanPath = fotoPath.replace(/^\/+/, "");
        fotoUrl = window.location.origin + "/" + cleanPath;
      }
    }

    const previewImg = document.getElementById("editPhotoPreview");
    if (previewImg) {
      if (fotoUrl) {
        previewImg.src = fotoUrl;
        previewImg.style.display = "block";
      } else {
        previewImg.removeAttribute("src");
        previewImg.style.display = "none";
      }
    }

    if (contentHeaderFlex) contentHeaderFlex.hidden = true;
    if (searchToolbar) searchToolbar.hidden = true;
    if (tableCard) tableCard.hidden = true;
    if (tableEmpty) tableEmpty.hidden = true;

    if (editCulinarySection) editCulinarySection.hidden = false;
  }

  function closeEditPage() {
    if (editCulinarySection) editCulinarySection.hidden = true;

    if (contentHeaderFlex) contentHeaderFlex.hidden = false;
    if (searchToolbar) searchToolbar.hidden = false;
    if (tableCard) tableCard.hidden = false;
  }

  if (kulinerTableBody) {
    kulinerTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;

      const id = button.getAttribute("data-id");

      if (button.classList.contains("btn-edit")) {
        openEditPage(id);
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

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", closeEditPage);
  }

  if (editPhotoInput) {
    editPhotoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          if (editPhotoPreview) {
            editPhotoPreview.src = uploadEvent.target.result;
            editPhotoPreview.style.display = "block";
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function editPhotoPreviewUrlOrExisting() {
    const previewImg = document.getElementById("editPhotoPreview");
    return previewImg && previewImg.src && !previewImg.src.startsWith("data:") ? previewImg.src : null;
  }

  // Submit Form Edit & Validasi
  if (editCulinaryForm) {
    editCulinaryForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const alertBanner = document.getElementById("formAlertBanner");
      const alertMessage = document.getElementById("formAlertMessage");

      const allInputs = editCulinaryForm.querySelectorAll("input, textarea, select");
      allInputs.forEach((el) => el.classList.remove("input-error"));

      const namaInput = document.getElementById("editNamaKuliner");
      const latInput = document.getElementById("editLatitude");
      const hargaInput = document.getElementById("editHarga");
      const lonInput = document.getElementById("editLongitude");
      const katInput = document.getElementById("editKategori");
      const alamatInput = document.getElementById("editAlamat");
      const descInput = document.getElementById("editDeskripsi");

      const nama = namaInput.value.trim();
      const latitudeVal = latInput.value.trim();
      const hargaVal = hargaInput.value.trim();
      const longitudeVal = lonInput.value.trim();
      const kategori = katInput.value;
      const alamat = alamatInput.value.trim();
      const deskripsi = descInput.value.trim();

      if (!nama || !latitudeVal || !hargaVal || !longitudeVal || !kategori || !alamat || !deskripsi) {
        if (!nama) namaInput.classList.add("input-error");
        if (!latitudeVal) latInput.classList.add("input-error");
        if (!hargaVal) hargaInput.classList.add("input-error");
        if (!longitudeVal) lonInput.classList.add("input-error");
        if (!kategori) katInput.classList.add("input-error");
        if (!alamat) alamatInput.classList.add("input-error");
        if (!deskripsi) descInput.classList.add("input-error");

        if (alertMessage) alertMessage.textContent = "Mohon lengkapi data kuliner sebelum menyimpan.";
        if (alertBanner) alertBanner.hidden = false;
        return;
      }

      const cleanHarga = hargaVal.replace(/\./g, "").replace(/,/g, ".");
      if (isNaN(cleanHarga) || Number(cleanHarga) <= 0) {
        hargaInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Harga harus lebih dari 0.";
        if (alertBanner) alertBanner.hidden = false;
        hargaInput.focus();
        return;
      }

      const finalHarga = parseInt(cleanHarga, 10);

      const latRaw = latInput.value.trim();
      const latNum = Number(latRaw);
      
      if (latRaw.includes(",") || !latRaw.includes(".") || isNaN(latNum) || latNum < -7.5 || latNum > -6.0) {
        latInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Latitude harus berada di wilayah operasional (antara -7.5 hingga -6.0) dan menggunakan titik (.)";
        if (alertBanner) alertBanner.hidden = false;
        latInput.focus();
        return;
      }

      const lonRaw = lonInput.value.trim();
      const lonNum = Number(lonRaw);

      if (lonRaw.includes(",") || !lonRaw.includes(".") || isNaN(lonNum) || lonNum < 108.0 || lonNum > 109.2) {
        lonInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Longitude harus berada di wilayah operasional (antara 108.0 hingga 109.2) dan menggunakan titik (.)";
        if (alertBanner) alertBanner.hidden = false;
        lonInput.focus();
        return;
      }

      if (deskripsi.length > 300) {
        descInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Deskripsi kuliner melebihi batas maksimal 300 karakter.";
        if (alertBanner) alertBanner.hidden = false;
        descInput.focus();
        return;
      }
      if (alertBanner) alertBanner.hidden = true;

      const id = document.getElementById("editIdKuliner").value;
      const jamBukaVal = document.getElementById("editJamBuka")?.value || "";
      const jamTutupVal = document.getElementById("editJamTutup")?.value || "";
      const jamOperasionalVal = jamBukaVal && jamTutupVal ? `${jamBukaVal} - ${jamTutupVal}` : null;

      const payload = {
        nama_kuliner: nama,
        nama_tempat: nama,
        deskripsi: deskripsi,
        id_kategori: kategori,
        alamat: alamat,
        latitude: latitudeVal,
        longitude: longitudeVal,
        harga: finalHarga,
        jam_operasional: jamOperasionalVal,
        no_telepon: document.getElementById("editNoTelepon").value || null,
        photo_url: editPhotoPreviewUrlOrExisting(),
      };

      const saveBtn = document.getElementById("saveEditBtn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Menyimpan";
      }

      try {
        const response = await fetch(`${getApiUrl("kuliner.php")}?id=${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        const textResponse = await response.text();
        let result;
        try {
          result = JSON.parse(textResponse);
        } catch (err) {
          throw new Error("Server mengembalikan respons yang tidak valid.");
        }

        if (!response.ok || !result.status) {
          throw new Error(result.message || "Gagal memperbarui kuliner");
        }

        closeEditPage();
        if (successEditModal) {
          successEditModal.hidden = false;
          if (closeSuccessEditBtn) closeSuccessEditBtn.focus();
        }

        fetchKulinerData();
      } catch (error) {
        console.error("Error saving culinary:", error);

        if (editErrorMessage) {
          editErrorMessage.textContent = !navigator.onLine || error instanceof TypeError ? "Periksa koneksi internet anda" : error.message || "Gagal memperbarui kuliner";
        }
        if (errorEditModal) {
          errorEditModal.hidden = false;
          if (retryEditBtn) retryEditBtn.focus();
        }
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Simpan";
        }
      }
    });
  }

  if (closeSuccessEditBtn) {
    closeSuccessEditBtn.addEventListener("click", () => {
      if (successEditModal) successEditModal.hidden = true;
    });
  }

  if (successEditModal) {
    successEditModal.addEventListener("click", (e) => {
      if (e.target === successEditModal) successEditModal.hidden = true;
    });
  }

  if (retryEditBtn) {
    retryEditBtn.addEventListener("click", () => {
      if (errorEditModal) errorEditModal.hidden = true;
      if (editCulinaryForm) editCulinaryForm.dispatchEvent(new Event("submit"));
    });
  }

  if (errorEditModal) {
    errorEditModal.addEventListener("click", (e) => {
      if (e.target === errorEditModal) errorEditModal.hidden = true;
    });
  }

  function getFilteredCulinaryData() {
    const rawKeyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    if (!rawKeyword) return culinaryData;

    const keywords = rawKeyword.split(/\s+/);

    return culinaryData.filter((item) => {
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

      culinaryData = culinaryData.filter((item) => String(item.id_tempat || item.id_kuliner || item.id) !== String(pendingDeleteId));
      renderTable(getFilteredCulinaryData());
      showDeleteState("success");
      if (closeSuccessEditBtn) closeSuccessEditBtn.focus();
    } catch (error) {
      console.error("Error deleting culinary:", error);
      if (deleteErrorMessage) {
        deleteErrorMessage.textContent = !navigator.onLine || error instanceof TypeError ? "Periksa koneksi internet anda" : error.message || "Terjadi kesalahan. Silakan coba lagi.";
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
    searchInput.addEventListener("input", () => renderTable(getFilteredCulinaryData()));
  }

  if (tableRetryButton) {
    tableRetryButton.addEventListener("click", fetchKulinerData);
  }

  // Fungsi Inisialisasi Utama Aplikasi Kuliner Admin
  function initAdminApp() {
    fetchKulinerData();
  }

  // Jalankan pemeriksaan akses secara senyap saat halaman dimuat
  checkAdminAccessSilent();
});