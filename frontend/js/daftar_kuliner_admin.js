document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = window.BASE_URL || window.location.origin;

  // Bypass tampilan auth di local
  const authState = document.getElementById("authState");
  const adminApp = document.getElementById("adminApp");

  if (authState) authState.hidden = true;
  if (adminApp) adminApp.hidden = false;

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

  async function fetchKulinerData() {
    if (tableLoading) tableLoading.hidden = false;
    if (tableError) tableError.hidden = true;
    if (tableWrapper) tableWrapper.hidden = true;
    if (tableEmpty) tableEmpty.hidden = true;

    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/admin/kuliner.php`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error();
    } catch (e) {
      try {
        response = await fetch(`${API_BASE_URL}/api/admin/tempat_kuliner.php`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
      } catch (err) {
        throw new Error("Gagal mengambil data dari server.");
      }
    }

    try {
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

  // Mengambil opsi kategori untuk dropdown form edit
  async function fetchKategoriOptions(selectedCategoryId = "") {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/kategori.php`, {
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
    document.getElementById("editJamOperasional").value = item.jam_operasional || item.opening_hours || item.jam_buka || "";
    document.getElementById("editAlamat").value = item.alamat || item.address || "";
    document.getElementById("editNoTelepon").value = item.nomor_telepon || item.phone_number || item.no_telp || "";
    document.getElementById("editDeskripsi").value = item.deskripsi || item.description || "";

    await fetchKategoriOptions(item.id_kategori || item.category_id || item.kategori_id);

    // Menampilkan Foto Otomatis dari Database
    let fotoPath = item.photo_url || item.foto || item.image || item.gambar || "";
    let fotoUrl = "";
    if (fotoPath) {
      if (fotoPath.startsWith("http://") || fotoPath.startsWith("https://") || fotoPath.startsWith("data:")) {
        fotoUrl = fotoPath;
      } else {
        const cleanPath = fotoPath.replace(/^\/+/, "");
        fotoUrl = `${API_BASE_URL.replace(/\/api\/admin$/, "")}/${cleanPath}`;
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

  // Submit Form Edit & Validasi Sesuai Figma (Integrasi PUT & POST)
  if (editCulinaryForm) {
    editCulinaryForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const alertBanner = document.getElementById("formAlertBanner");
      const alertMessage = document.getElementById("formAlertMessage");

      // Reset semua status error sebelumnya
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

      // 1. Validasi Field Kosong
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

      // 2. Validasi Harga Harus Berupa Angka
      const cleanHarga = hargaVal.replace(/\./g, "").replace(/,/g, ".");
      if (isNaN(cleanHarga)) {
        hargaInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Harga harus berupa angka.";
        if (alertBanner) alertBanner.hidden = false;
        hargaInput.focus();
        return;
      }

      // 3. Validasi Harga > 0
      if (Number(cleanHarga) <= 0) {
        hargaInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Harga harus lebih dari 0.";
        if (alertBanner) alertBanner.hidden = false;
        hargaInput.focus();
        return;
      }

      // 4. Validasi Latitude (-90 s.d 90)
      const latNum = Number(latitudeVal);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        latInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Latitude harus berupa angka antara -90 hingga 90 dan menggunakan titik (.) sebagai pemisah desimal.";
        if (alertBanner) alertBanner.hidden = false;
        latInput.focus();
        return;
      }

      // 5. Validasi Longitude (-180 s.d 180)
      const lonNum = Number(longitudeVal);
      if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        lonInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Longitude harus berupa angka antara -180 hingga 180 dan menggunakan titik (.) sebagai pemisah desimal.";
        if (alertBanner) alertBanner.hidden = false;
        lonInput.focus();
        return;
      }

      // Jika lulus semua validasi client-side
      if (alertBanner) alertBanner.hidden = true;

      const id = document.getElementById("editIdKuliner").value;
      const formData = new FormData();
      formData.append("id", id);
      formData.append("id_tempat", id);
      formData.append("id_kuliner", id);
      formData.append("_method", "PUT");

      formData.append("nama_kuliner", nama);
      formData.append("latitude", latitudeVal);
      formData.append("harga", cleanHarga);
      formData.append("longitude", longitudeVal);
      formData.append("id_kategori", kategori);
      formData.append("jam_operasional", document.getElementById("editJamOperasional").value);
      formData.append("alamat", alamat);
      formData.append("nomor_telepon", document.getElementById("editNoTelepon").value);
      formData.append("deskripsi", deskripsi);

      if (editPhotoInput.files[0]) {
        formData.append("foto", editPhotoInput.files[0]);
      }

      const saveBtn = document.getElementById("saveEditBtn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Menyimpan...";
      }

      try {
        // Integrasi request PUT / POST ke backend kuliner.php
        const response = await fetch(`${API_BASE_URL}/api/admin/kuliner.php?id=${encodeURIComponent(id)}`, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
          credentials: "include",
        });

        const result = await response.json();

        if (!response.ok || !result.status) {
          throw new Error(result.message || "Gagal memperbarui kuliner");
        }

        // BERHASIL: TUTUP FORM EDIT & TAMPILKAN MODAL SUKSES
        closeEditPage();
        if (successEditModal) {
          successEditModal.hidden = false;
          if (closeSuccessEditBtn) closeSuccessEditBtn.focus();
        }

        fetchKulinerData();
      } catch (error) {
        console.error("Error saving culinary:", error);

        // GAGAL: TAMPILKAN MODAL POP-UP GAGAL (SESUAI FIGMA)
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

  // Event Listener Modal Sukses
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

  // Event Listener Modal Gagal
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
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    return culinaryData.filter((item) => {
      const name = (item.nama_kuliner || item.name || "").toLowerCase();
      const category = (item.nama_kategori || item.kategori || "").toLowerCase();
      const address = (item.alamat || item.address || "").toLowerCase();
      return name.includes(keyword) || category.includes(keyword) || address.includes(keyword);
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
      const response = await fetch(`${API_BASE_URL}/api/admin/kuliner.php?id=${encodeURIComponent(pendingDeleteId)}`, {
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

  fetchKulinerData();
});
