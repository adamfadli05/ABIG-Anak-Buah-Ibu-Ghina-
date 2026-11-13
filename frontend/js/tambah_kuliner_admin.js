document.addEventListener("DOMContentLoaded", () => {
  const apiBaseUrl = (window.BASE_URL || window.location.origin).replace(/\/+$/, "");

  // --- CEK AKSES ADMIN SECARA SENYAP (SILENT CHECK) ---
  async function checkAdminAccessSilent() {
    const rawRole = localStorage.getItem("role");
    
    // Jika di local/storage sudah ada role admin, langsung jalankan inisialisasi form
    if (rawRole === "admin") {
      initAdminForm();
      return;
    }

    // Jika belum ada data lokal, lakukan verifikasi senyap ke server
    try {
      const response = await fetch(`${apiBaseUrl}/api/me.php`, {
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
      
      initAdminForm();
    } catch (error) {
      console.error("Gagal memeriksa sesi admin:", error);
      window.location.replace("index.html");
    }
  }

  const form = document.getElementById("addCulinaryForm");
  if (!form) return;

  const photoInput = document.getElementById("culinaryPhoto");
  const photoPicker = document.getElementById("photoPicker");
  const photoPreview = document.getElementById("photoPreview");
  const photoPlaceholder = document.getElementById("photoPlaceholder");
  const photoHelp = document.querySelector(".photo-help");
  const removePhotoButton = document.getElementById("removePhoto");
  const alertBanner = document.getElementById("formAlertBanner");
  const alertMessage = document.getElementById("formAlertMessage");
  const retryCategoriesButton = document.getElementById("retryCategories");
  const saveSuccessModal = document.getElementById("saveSuccessModal");
  const closeSaveSuccessButton = document.getElementById("closeSaveSuccess");
  const saveErrorModal = document.getElementById("saveErrorModal");
  const saveErrorMessage = document.getElementById("saveErrorMessage");
  const retrySaveButton = document.getElementById("retrySave");
  const saveButton = form.querySelector('button[type="submit"]');
  const namaInput = document.getElementById("namaKuliner");
  const hargaInput = document.getElementById("harga");
  const kategoriSelect = document.getElementById("kategori");
  const alamatInput = document.getElementById("alamat");
  const deskripsiInput = document.getElementById("deskripsi");
  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");
  const jamOperasionalInput = document.getElementById("jamOperasional");
  const teleponInput = document.getElementById("telepon");
  const photoHelpText = photoHelp.textContent;

  let uploadedFile = null;
  let previewUrl = "";
  let uploadedPhotoUrl = "";
  let photoValidationMessage = "";
  let categoryLoadFailed = false;
  let categoryLoading = false;
  let isSubmitting = false;
  let redirectingAfterSave = false;

  function showFormAlert(message, retryCategories) {
    alertMessage.textContent = message;
    retryCategoriesButton.hidden = !retryCategories;
    alertBanner.hidden = false;
  }

  function hideFormAlert() {
    alertBanner.hidden = true;
    retryCategoriesButton.hidden = true;
  }

  function showPhotoValidation(message) {
    photoValidationMessage = message;
    photoPicker.classList.add("input-error");
    photoHelp.classList.add("input-error-text");
    photoHelp.textContent = message;
  }

  function clearPhotoValidation() {
    photoValidationMessage = "";
    photoPicker.classList.remove("input-error");
    photoHelp.classList.remove("input-error-text");
    photoHelp.textContent = photoHelpText;
  }

  function showSaveSuccess() {
    saveSuccessModal.hidden = false;
    closeSaveSuccessButton.focus();
  }

  function showSaveError(message) {
    saveErrorMessage.textContent = message;
    saveErrorModal.hidden = false;
    retrySaveButton.focus();
  }

  function setPhoto(file) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = "";
    }

    uploadedFile = file;
    uploadedPhotoUrl = "";
    clearPhotoValidation();

    if (file) {
      previewUrl = URL.createObjectURL(file);
      photoPreview.src = previewUrl;
      photoPreview.hidden = false;
      photoPlaceholder.hidden = true;
      removePhotoButton.hidden = false;
      photoPicker.classList.add("has-photo");
    } else {
      photoPreview.removeAttribute("src");
      photoPreview.hidden = true;
      photoPlaceholder.hidden = false;
      removePhotoButton.hidden = true;
      photoPicker.classList.remove("has-photo");
    }
  }

  function photoMimeType(file) {
    const extension = file.name.split(".").pop().toLowerCase();
    const allowedTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };
    const expectedType = allowedTypes[extension];

    if (!expectedType || (file.type && file.type !== expectedType)) return null;
    return { extension: extension === "jpeg" ? "jpg" : extension, mimeType: expectedType };
  }

  photoPicker.addEventListener("click", () => photoInput.click());

  photoInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const fileType = photoMimeType(file);
    if (!fileType) {
      photoInput.value = "";
      setPhoto(null);
      showPhotoValidation("Format foto harus JPG atau PNG.");
      if (!categoryLoadFailed) hideFormAlert();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      photoInput.value = "";
      setPhoto(null);
      showPhotoValidation("Ukuran foto maksimal 5 MB.");
      if (!categoryLoadFailed) hideFormAlert();
      return;
    }

    setPhoto(file);
    if (!categoryLoadFailed) hideFormAlert();
  });

  removePhotoButton.addEventListener("click", () => {
    photoInput.value = "";
    setPhoto(null);
    if (!categoryLoadFailed) hideFormAlert();
  });

  async function loadCategories() {
    if (categoryLoading) return;
    categoryLoading = true;
    kategoriSelect.disabled = true;
    kategoriSelect.replaceChildren(new Option("Memuat kategori...", "", true, true));
    retryCategoriesButton.disabled = true;
    retryCategoriesButton.hidden = true;

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/kategori.php`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.status || !Array.isArray(result.data)) {
        throw new Error(result.message || "Respons kategori tidak valid.");
      }

      const categories = result.data.filter(
        (category) =>
          category &&
          category.id_kategori !== null &&
          category.id_kategori !== undefined &&
          /^\d+$/.test(String(category.id_kategori)) &&
          category.nama_kategori
      );
      if (!categories.length) throw new Error("Belum ada kategori yang dapat dipilih.");

      const placeholder = new Option("Atur kategori kuliner", "", true, true);
      placeholder.disabled = true;
      kategoriSelect.replaceChildren(placeholder);

      categories.forEach((category) => {
        kategoriSelect.add(new Option(category.nama_kategori, String(category.id_kategori)));
      });
      kategoriSelect.disabled = false;

      if (categoryLoadFailed || alertMessage.textContent === "Kategori masih dimuat. Coba lagi sebentar.") {
        hideFormAlert();
      }
      categoryLoadFailed = false;
    } catch (error) {
      console.error("Gagal memuat kategori:", error);
      categoryLoadFailed = true;
      kategoriSelect.replaceChildren(new Option("Kategori tidak tersedia", "", true, true));
      showFormAlert("Gagal memuat kategori. Periksa koneksi lalu coba lagi.", true);
    } finally {
      categoryLoading = false;
      retryCategoriesButton.disabled = false;
    }
  }

  retryCategoriesButton.addEventListener("click", loadCategories);

  function generateFileId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const random = Math.random() * 16;
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return Math.floor(value).toString(16);
    });
  }

  async function uploadPhoto(file) {
    const config = window.SUPABASE_CONFIG;
    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function" ||
      !config ||
      !config.url ||
      !config.anonKey ||
      !config.culinaryPhotoBucket
    ) {
      throw new Error("Konfigurasi unggah foto belum tersedia.");
    }

    const fileType = photoMimeType(file);
    if (!fileType) throw new Error("Format foto harus JPG atau PNG.");

    const client = window.supabase.createClient(config.url, config.anonKey);
    const filePath = `kuliner/${generateFileId()}.${fileType.extension}`;
    const { error } = await client.storage
      .from(config.culinaryPhotoBucket)
      .upload(filePath, file, { contentType: fileType.mimeType, upsert: false });

    if (error) throw new Error(error.message || "Foto gagal diunggah.");

    const { data } = client.storage.from(config.culinaryPhotoBucket).getPublicUrl(filePath);
    if (!data || !data.publicUrl) throw new Error("URL foto yang diunggah tidak tersedia.");
    return data.publicUrl;
  }

  function setSubmitting(submitting) {
    form.querySelectorAll("input, select, textarea, button").forEach((control) => {
      if (submitting) {
        control.disabled = true;
      } else {
        control.disabled = control === kategoriSelect && (categoryLoadFailed || categoryLoading);
      }
    });
    saveButton.textContent = submitting ? "Menyimpan..." : "Simpan";
  }

  function showValidationError(message, input) {
    showFormAlert(message, false);
    if (input) {
      input.classList.add("input-error");
      input.focus();
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting || redirectingAfterSave) return;

    if (categoryLoadFailed) {
      showFormAlert("Gagal memuat kategori. Periksa koneksi lalu coba lagi.", true);
      return;
    }
    if (categoryLoading) {
      showFormAlert("Kategori masih dimuat. Coba lagi sebentar.", false);
      return;
    }

    hideFormAlert();
    form.querySelectorAll(".input-error").forEach((input) => {
      if (input !== photoPicker) input.classList.remove("input-error");
    });

    if (photoValidationMessage) {
      showPhotoValidation(photoValidationMessage);
      showFormAlert(photoValidationMessage, false);
      return;
    }

    clearPhotoValidation();

    const namaKuliner = namaInput.value.trim();
    const harga = hargaInput.value.trim();
    const idKategori = kategoriSelect.value;
    const alamat = alamatInput.value.trim();
    const deskripsi = deskripsiInput.value.trim();
    const latitudeValue = latitudeInput.value.trim();
    const longitudeValue = longitudeInput.value.trim();
    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);
    const missingFields = [];

    const photoMissing = !uploadedFile;
    if (!namaKuliner) missingFields.push(namaInput);
    if (!harga) missingFields.push(hargaInput);
    if (!idKategori) missingFields.push(kategoriSelect);
    if (!alamat) missingFields.push(alamatInput);
    if (!deskripsi) missingFields.push(deskripsiInput);
    if (!latitudeValue) missingFields.push(latitudeInput);
    if (!longitudeValue) missingFields.push(longitudeInput);

    if (missingFields.length || photoMissing) {
      missingFields.forEach((field) => field.classList.add("input-error"));
      showFormAlert("Mohon lengkapi data kuliner sebelum menyimpan.", false);
      (missingFields[0] || photoPicker).focus();
      return;
    }

    const hargaValue = Number(harga);
    if (!/^-?\d+$/.test(harga) || !Number.isFinite(hargaValue)) {
      return showValidationError("Harga harus berupa angka", hargaInput);
    }
    if (hargaValue <= 0) {
      return showValidationError("Harga harus lebih dari 0", hargaInput);
    }
    if (Array.from(deskripsi).length > 300) {
      return showValidationError("Deskripsi kuliner melebihi batas maksimal 300 karakter.", deskripsiInput);
    }
    const jamOperasional = jamOperasionalInput.value.trim();
    if (
      jamOperasional &&
      !/^(?:[01]\d|2[0-3]):[0-5]\d\s*-\s*(?:[01]\d|2[0-3]):[0-5]\d$/.test(jamOperasional)
    ) {
      return showValidationError("Format jam operasional harus HH:MM - HH:MM.", jamOperasionalInput);
    }
    if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(latitudeValue) || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return showValidationError(
        "Latitude harus berupa angka antara -90 sampai 90.",
        latitudeInput
      );
    }
    if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(longitudeValue) || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return showValidationError(
        "Longitude harus berupa angka antara -180 sampai 180.",
        longitudeInput
      );
    }

    isSubmitting = true;
    setSubmitting(true);

    try {
      if (!uploadedPhotoUrl) uploadedPhotoUrl = await uploadPhoto(uploadedFile);

      const payload = {
        nama_kuliner: namaKuliner,
        nama_tempat: namaKuliner,
        deskripsi,
        id_kategori: Number(idKategori),
        alamat,
        latitude: latitudeValue,
        longitude: longitudeValue,
        harga,
        jam_operasional: jamOperasional || null,
        no_telepon: teleponInput.value.trim() || null,
        photo_url: uploadedPhotoUrl,
      };

      const response = await fetch(`${apiBaseUrl}/api/admin/kuliner.php`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.message || "Data kuliner gagal disimpan.");
      }

      redirectingAfterSave = true;
      showSaveSuccess();
    } catch (error) {
      console.error("Gagal menyimpan kuliner:", error);
      const message =
        !navigator.onLine || error instanceof TypeError
          ? "Periksa koneksi internet anda"
          : error.message || "Periksa koneksi internet anda";
      showSaveError(message);
    } finally {
      isSubmitting = false;
      if (!redirectingAfterSave) setSubmitting(false);
    }
  });

  retrySaveButton.addEventListener("click", () => {
    if (isSubmitting) return;
    saveErrorModal.hidden = true;
    form.requestSubmit();
  });

  closeSaveSuccessButton.addEventListener("click", () => {
    saveSuccessModal.hidden = true;
    window.location.href = "daftar_kuliner_admin.html";
  });

  function initAdminForm() {
    loadCategories();
  }

  // Jalankan pengecekan akses secara senyap saat halaman dimuat
  checkAdminAccessSilent();
});