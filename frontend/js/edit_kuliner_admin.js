document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = window.BASE_URL || window.location.origin;
  const ADMIN_KULINER_CACHE_KEY = "mangan_yukk_admin_kuliner_v1";
  const ALL_ADMIN_KULINER_CACHE_KEY = "mangan_yukk_admin_kuliner_all_v1";
  const ADMIN_KATEGORI_CACHE_KEY = "mangan_yukk_admin_kategori_v1";
  const EDIT_DRAFT_KEY = "mangan_yukk_edit_kuliner_item";

  // Inject CSS menyatu agar teks petunjuk & error foto selalu rapi di bawah area foto
  function injectEditPhotoStyles() {
    if (document.getElementById("editKulinerPhotoFixStyle")) return;
    const styleEl = document.createElement("style");
    styleEl.id = "editKulinerPhotoFixStyle";
    styleEl.textContent = `
      .edit-photo-section {
        display: flex;
        justify-content: center;
      }
      .edit-photo-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        width: 100%;
      }
      .edit-photo-wrapper .edit-photo-card {
        flex-direction: column;
      }
      .edit-photo-wrapper .edit-photo-card.input-error,
      .edit-photo-wrapper .edit-photo-card.photo-error {
        border: 1.5px solid #ef4444 !important;
        outline: none;
      }
      .photo-hint-text {
        margin-top: 8px;
        margin-bottom: 0;
        font-size: 13px;
        color: #6b7280;
        text-align: center;
      }
      .edit-photo-wrapper .photo-hint-text.photo-error,
      .photo-error-text {
        margin-top: 6px;
        margin-bottom: 0;
        font-size: 13px;
        font-weight: 500;
        color: #ef4444 !important;
        text-align: center;
      }
    `;
    document.head.appendChild(styleEl);
  }

  injectEditPhotoStyles();

  const authState = document.getElementById("authState");
  const adminApp = document.getElementById("adminApp");
  const editLoadingState = document.getElementById("editLoadingState");
  const editConnectionError = document.getElementById("editConnectionError");
  const editPageRetryBtn = document.getElementById("editPageRetryBtn");
  const editCulinarySection = document.getElementById("editCulinarySection");
  const editCulinaryForm = document.getElementById("editCulinaryForm");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const editKategoriSelect = document.getElementById("editKategori");
  const editPhotoPreview = document.getElementById("editPhotoPreview");
  const editPhotoInput = document.getElementById("editPhotoInput");
  const editPhotoCard = document.getElementById("editPhotoCard");
  const editPhotoWrapper = document.querySelector(".edit-photo-wrapper");
  const photoHintText = document.querySelector(".photo-hint-text");
  const photoErrorText = document.getElementById("photoErrorText");
  const alertBanner = document.getElementById("formAlertBanner");
  const alertMessage = document.getElementById("formAlertMessage");

  const successEditModal = document.getElementById("successEditModal");
  const closeSuccessEditBtn = document.getElementById("closeSuccessEditBtn");
  const errorEditModal = document.getElementById("errorEditModal");
  const editErrorMessage = document.getElementById("editErrorMessage");
  const retryEditBtn = document.getElementById("retryEditBtn");

  const params = new URLSearchParams(window.location.search);
  const kulinerId = params.get("id") || "";

  let existingPhotoUrl = "";
  let selectedPhotoFile = null;
  let uploadedPhotoUrl = "";
  let supabaseClientInstance = null;
  let isSubmitting = false;

  const getApiUrl = (endpoint) => `${API_BASE_URL}/api/admin/${endpoint}`;

  async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      return await fetch(url, {
        ...options,
        signal: controller ? controller.signal : options.signal,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function hideBanner() {
    if (alertBanner) alertBanner.hidden = true;
  }

  function showBanner(msg) {
    setPhotoError("");
    if (alertMessage) alertMessage.textContent = msg;
    if (alertBanner) alertBanner.hidden = false;
  }

  function setPhotoError(message = "") {
    if (!photoHintText && !photoErrorText) return;

    if (message) {
      hideBanner();
      if (editPhotoCard) {
        editPhotoCard.classList.add("input-error", "photo-error");
      }
      if (photoHintText) {
        photoHintText.hidden = false;
        photoHintText.classList.add("photo-error");
      }
      if (photoErrorText) {
        photoErrorText.textContent = message;
        photoErrorText.hidden = true;
      }
    } else {
      if (editPhotoCard) {
        editPhotoCard.classList.remove("input-error", "photo-error");
      }
      if (photoHintText) {
        photoHintText.hidden = false;
        photoHintText.classList.remove("photo-error");
      }
      if (photoErrorText) {
        photoErrorText.textContent = "";
        photoErrorText.hidden = true;
      }
    }
  }

  function scrollToValidation(targetEl, focusTarget = true) {
    const el = targetEl || alertBanner || editCulinarySection;
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (focusTarget && typeof el.focus === "function") {
        try {
          el.focus({ preventScroll: true });
        } catch (_) {
          el.focus();
        }
      }
    });
  }

  function getSupabaseClient() {
    const config = window.SUPABASE_CONFIG;
    if (!window.supabase || !config || !config.url || !config.anonKey) return null;
    if (!supabaseClientInstance) {
      supabaseClientInstance = window.supabase.createClient(config.url, config.anonKey);
    }
    return supabaseClientInstance;
  }

  function showConnectionLostView() {
    if (editLoadingState) editLoadingState.hidden = true;
    if (editCulinarySection) editCulinarySection.hidden = true;
    if (editConnectionError) editConnectionError.hidden = false;
  }

  function showFormView() {
    if (editLoadingState) editLoadingState.hidden = true;
    if (editConnectionError) editConnectionError.hidden = true;
    if (editCulinarySection) editCulinarySection.hidden = false;
  }

  function resolvePhotoUrl(rawPath) {
    const val = String(rawPath || "").trim();
    if (!val) return "";
    if (/^(https?:\/\/|data:|blob:)/i.test(val)) return val;
    if (val.startsWith("/")) return `${window.location.origin}${val}`;
    return `${API_BASE_URL}/${val.replace(/^\/+/, "")}`;
  }

  function parseRupiahInteger(rawPrice) {
    if (rawPrice === null || rawPrice === undefined || rawPrice === "") return NaN;
    if (typeof rawPrice === "number") {
      return Number.isFinite(rawPrice) ? Math.round(rawPrice) : NaN;
    }

    const str = String(rawPrice).trim();
    if (!str) return NaN;

    if (/^\d+\.\d{1,2}$/.test(str)) {
      const parts = str.split(".");
      if (/^0+$/.test(parts[1])) {
        return Number(parts[0]);
      }
      return Math.round(Number(str));
    }

    if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
      return Number(str.replace(/\./g, ""));
    }

    if (/^\d{1,3}(,\d{3})+$/.test(str)) {
      return Number(str.replace(/,/g, ""));
    }

    if (!/^[\d.,]+$/.test(str)) {
      return NaN;
    }

    const cleaned = str.replace(/\./g, "").replace(/,/g, ".");
    const num = Number(cleaned);
    return Number.isFinite(num) ? Math.round(num) : NaN;
  }

  function formatHargaInput(rawPrice) {
    if (rawPrice === null || rawPrice === undefined || rawPrice === "") return "";
    const num = parseRupiahInteger(rawPrice);
    if (!Number.isFinite(num) || num <= 0) return String(rawPrice);
    return num.toLocaleString("id-ID");
  }

  function readCachedCategories() {
    try {
      const raw = localStorage.getItem(ADMIN_KATEGORI_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function writeCachedCategories(categories) {
    try {
      localStorage.setItem(ADMIN_KATEGORI_CACHE_KEY, JSON.stringify(categories));
    } catch (_) {}
  }

  function renderKategoriSelect(categories, selectedCategoryId = "") {
    if (!editKategoriSelect || !Array.isArray(categories)) return;
    editKategoriSelect.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
    const fragment = document.createDocumentFragment();
    categories.forEach((cat) => {
      const catId = cat.id_kategori || cat.id;
      const catName = cat.nama_kategori || cat.name;
      const option = document.createElement("option");
      option.value = catId;
      option.textContent = catName;
      if (String(catId) === String(selectedCategoryId)) {
        option.selected = true;
      }
      fragment.appendChild(option);
    });
    editKategoriSelect.appendChild(fragment);
  }

  function populateFormWithItem(item) {
    setPhotoError("");
    hideBanner();
    document.getElementById("editIdKuliner").value = kulinerId;
    document.getElementById("editNamaKuliner").value = item.nama_kuliner || item.name || item.nama || "";
    document.getElementById("editLatitude").value = item.latitude || item.lat || "";
    document.getElementById("editHarga").value = formatHargaInput(item.harga ?? item.price ?? "");
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
    document.getElementById("editNoTelepon").value = item.no_telepon || item.nomor_telepon || item.phone_number || "";
    document.getElementById("editDeskripsi").value = item.deskripsi || item.description || "";

    const selectedCatId = item.id_kategori || item.category_id || item.kategori_id || "";
    const cachedCats = readCachedCategories();
    if (cachedCats && cachedCats.length > 0) {
      renderKategoriSelect(cachedCats, selectedCatId);
    }

    const rawPhoto = item.photo_url || item.foto || item.image || item.gambar || "";
    existingPhotoUrl = resolvePhotoUrl(rawPhoto);
    if (editPhotoPreview) {
      if (existingPhotoUrl) {
        editPhotoPreview.src = existingPhotoUrl;
        editPhotoPreview.style.display = "block";
      } else {
        editPhotoPreview.removeAttribute("src");
        editPhotoPreview.style.display = "none";
      }
    }
  }

  async function checkAdminAccessSilent() {
    const rawRole = localStorage.getItem("role");
    if (rawRole === "admin") {
      if (adminApp) adminApp.hidden = false;
      if (authState) authState.hidden = true;
      await initEditPage();
      return;
    }

    if (!navigator.onLine) {
      if (adminApp) adminApp.hidden = false;
      if (authState) authState.hidden = true;
      showConnectionLostView();
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
      await initEditPage();
    } catch (error) {
      console.error("Gagal memeriksa sesi admin:", error);
      if (!navigator.onLine || error instanceof TypeError) {
        if (adminApp) adminApp.hidden = false;
        if (authState) authState.hidden = true;
        showConnectionLostView();
      } else {
        window.location.replace("index.html");
      }
    }
  }

  async function fetchKategoriOptions(selectedCategoryId = "") {
    const response = await fetch(getApiUrl("kategori.php"), {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Gagal memuat kategori.");

    const result = await response.json();
    const categories = Array.isArray(result) ? result : result.data || [];
    writeCachedCategories(categories);
    renderKategoriSelect(categories, selectedCategoryId);
  }

  function getCachedItemById(id) {
    try {
      const draftRaw = sessionStorage.getItem(EDIT_DRAFT_KEY);
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        const draftId = draft?.id_tempat || draft?.id_kuliner || draft?.id;
        if (String(draftId) === String(id)) return draft;
      }
    } catch (_) {}

    try {
      const listRaw = localStorage.getItem(ADMIN_KULINER_CACHE_KEY);
      if (listRaw) {
        const list = JSON.parse(listRaw);
        if (Array.isArray(list)) {
          const found = list.find((d) => String(d.id_tempat || d.id_kuliner || d.id) === String(id));
          if (found) return found;
        }
      }
    } catch (_) {}

    try {
      const allRaw = localStorage.getItem(ALL_ADMIN_KULINER_CACHE_KEY);
      if (allRaw) {
        const allList = JSON.parse(allRaw);
        if (Array.isArray(allList)) {
          const found = allList.find((d) => String(d.id_tempat || d.id_kuliner || d.id) === String(id));
          if (found) return found;
        }
      }
    } catch (_) {}

    return null;
  }

  async function fetchKulinerDetailById(id) {
    const response = await fetch(`${getApiUrl("kuliner.php")}?id=${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Gagal mengambil detail kuliner.");

    const result = await response.json();
    if (Array.isArray(result.data)) {
      return result.data.find((d) => String(d.id_tempat || d.id_kuliner || d.id) === String(id)) || null;
    }
    return result.data || result || null;
  }

  async function initEditPage() {
    if (!kulinerId) {
      window.location.replace("daftar_kuliner_admin.html");
      return;
    }

    const cachedItem = getCachedItemById(kulinerId);

    if (!navigator.onLine && !cachedItem) {
      showConnectionLostView();
      return;
    }

    if (cachedItem) {
      populateFormWithItem(cachedItem);
      showFormView();
      const selectedCatId = cachedItem.id_kategori || cachedItem.category_id || cachedItem.kategori_id || "";
      if (navigator.onLine) {
        fetchKategoriOptions(selectedCatId).catch(() => {});
      }
      return;
    }

    if (editLoadingState) editLoadingState.hidden = false;
    if (editConnectionError) editConnectionError.hidden = true;
    if (editCulinarySection) editCulinarySection.hidden = true;

    try {
      const item = await fetchKulinerDetailById(kulinerId);
      if (!item) {
        window.location.replace("daftar_kuliner_admin.html");
        return;
      }

      populateFormWithItem(item);
      await fetchKategoriOptions(item.id_kategori || item.category_id || item.kategori_id);
      showFormView();
    } catch (error) {
      console.error("Gagal memuat halaman edit kuliner:", error);
      showConnectionLostView();
    }
  }

  async function preparePhotoForUpload(file) {
    if (typeof createImageBitmap !== "function" || typeof document.createElement !== "function") {
      return file;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 1024;
      let { width, height } = bitmap;
      if (width <= maxDim && height <= maxDim && file.size <= 1024 * 1024) {
        bitmap.close();
        return file;
      }
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const targetType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, targetType, 0.78));
      if (!blob || blob.size >= file.size) return file;
      const ext = targetType === "image/png" ? "png" : "jpg";
      return new File([blob], `kuliner.${ext}`, { type: targetType });
    } catch (_) {
      return file;
    }
  }

  async function uploadKulinerPhoto(file) {
    const fileToUpload = await preparePhotoForUpload(file);
    const config = window.SUPABASE_CONFIG;
    const supabaseClient = getSupabaseClient();
    if (supabaseClient && config && config.url && config.anonKey) {
      const bucket = config.kulinerPhotoBucket || config.reviewPhotoBucket || "kuliner";
      const extMap = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const ext = extMap[fileToUpload.type] || "jpg";
      const uniqueId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const photoPath = `kuliner/${uniqueId}.${ext}`;
      const { error } = await supabaseClient.storage.from(bucket).upload(photoPath, fileToUpload, {
        contentType: fileToUpload.type,
        upsert: false,
      });
      if (error) throw new Error(`Foto gagal diunggah: ${error.message}`);
      return supabaseClient.storage.from(bucket).getPublicUrl(photoPath).data.publicUrl;
    }

    const formData = new FormData();
    formData.append("foto", fileToUpload);
    formData.append("photo", fileToUpload);
    const uploadRes = await fetchWithTimeout(
      getApiUrl("upload_foto.php"),
      {
        method: "POST",
        body: formData,
        credentials: "include",
      },
      12000
    );
    if (!uploadRes.ok) throw new Error("Gagal mengunggah foto kuliner.");
    const uploadJson = await uploadRes.json();
    const url = uploadJson.photo_url || uploadJson.url || uploadJson.data?.photo_url || uploadJson.data?.url;
    if (!url) throw new Error("URL foto hasil unggahan tidak ditemukan.");
    return resolvePhotoUrl(url);
  }

  const editHargaInputEl = document.getElementById("editHarga");
  if (editHargaInputEl) {
    editHargaInputEl.addEventListener("blur", (e) => {
      const raw = e.target.value.trim();
      if (!raw) return;
      const parsed = parseRupiahInteger(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        e.target.value = parsed.toLocaleString("id-ID");
      }
    });
  }

  if (editPhotoInput) {
    editPhotoInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        e.target.value = "";
        setPhotoError("Format foto harus JPG, PNG, atau WEBP.");
        scrollToValidation(photoHintText || editPhotoWrapper, false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        e.target.value = "";
        setPhotoError("Ukuran foto maksimal 5 MB.");
        scrollToValidation(photoHintText || editPhotoWrapper, false);
        return;
      }

      setPhotoError("");
      selectedPhotoFile = file;
      uploadedPhotoUrl = "";

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (editPhotoPreview) {
          editPhotoPreview.src = uploadEvent.target.result;
          editPhotoPreview.style.display = "block";
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
      window.location.href = "daftar_kuliner_admin.html";
    });
  }

  if (editPageRetryBtn) {
    editPageRetryBtn.addEventListener("click", () => {
      initEditPage();
    });
  }

  window.addEventListener("offline", () => {
    showConnectionLostView();
  });

  window.addEventListener("online", () => {
    if (editConnectionError && !editConnectionError.hidden) {
      initEditPage();
    }
  });

  if (editCulinaryForm) {
    editCulinaryForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (isSubmitting) return;

      if (!navigator.onLine) {
        if (editErrorMessage) editErrorMessage.textContent = "Periksa koneksi internet anda";
        if (errorEditModal) errorEditModal.hidden = false;
        return;
      }

      const allInputs = editCulinaryForm.querySelectorAll("input, textarea, select");
      allInputs.forEach((el) => el.classList.remove("input-error"));
      setPhotoError("");
      hideBanner();

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

      const hasPhoto = Boolean(selectedPhotoFile || existingPhotoUrl);
      if (!hasPhoto) {
        setPhotoError("Foto kuliner wajib ada.");
      }

      const emptyFields = [];
      if (!hasPhoto && editPhotoWrapper) {
        emptyFields.push(editPhotoWrapper);
      }
      if (!nama) {
        namaInput.classList.add("input-error");
        emptyFields.push(namaInput);
      }
      if (!latitudeVal) {
        latInput.classList.add("input-error");
        emptyFields.push(latInput);
      }
      if (!hargaVal) {
        hargaInput.classList.add("input-error");
        emptyFields.push(hargaInput);
      }
      if (!longitudeVal) {
        lonInput.classList.add("input-error");
        emptyFields.push(lonInput);
      }
      if (!kategori) {
        katInput.classList.add("input-error");
        emptyFields.push(katInput);
      }
      if (!alamat) {
        alamatInput.classList.add("input-error");
        emptyFields.push(alamatInput);
      }
      if (!deskripsi) {
        descInput.classList.add("input-error");
        emptyFields.push(descInput);
      }

      if (emptyFields.length > 0) {
        if (!hasPhoto) {
          scrollToValidation(photoHintText || editPhotoWrapper, false);
        } else {
          showBanner("Mohon lengkapi data kuliner sebelum menyimpan.");
          scrollToValidation(emptyFields[0], true);
        }
        return;
      }

      if (!/^[\d.,]+$/.test(hargaVal)) {
        hargaInput.classList.add("input-error");
        showBanner("Harga harus berupa angka");
        scrollToValidation(hargaInput, true);
        return;
      }

      const parsedHarga = parseRupiahInteger(hargaVal);
      if (!Number.isFinite(parsedHarga)) {
        hargaInput.classList.add("input-error");
        showBanner("Harga harus berupa angka");
        scrollToValidation(hargaInput, true);
        return;
      }

      if (parsedHarga <= 0) {
        hargaInput.classList.add("input-error");
        showBanner("Harga harus lebih dari 0.");
        scrollToValidation(hargaInput, true);
        return;
      }

      const latNum = Number(latitudeVal);
      if (!/^-?\d+\.\d+$/.test(latitudeVal) || !Number.isFinite(latNum) || latNum < -7.5 || latNum > -6.0) {
        latInput.classList.add("input-error");
        showBanner("Latitude harus berada di wilayah operasional (antara -7.5 hingga -6.0) dan menggunakan titik (.)");
        scrollToValidation(latInput, true);
        return;
      }

      const lonNum = Number(longitudeVal);
      if (!/^-?\d+\.\d+$/.test(longitudeVal) || !Number.isFinite(lonNum) || lonNum < 108.0 || lonNum > 109.2) {
        lonInput.classList.add("input-error");
        showBanner("Longitude harus berada di wilayah operasional (antara 108.0 hingga 109.2) dan menggunakan titik (.)");
        scrollToValidation(lonInput, true);
        return;
      }

      if (deskripsi.length > 300) {
        descInput.classList.add("input-error");
        showBanner("Deskripsi kuliner melebihi batas maksimal 300 karakter.");
        scrollToValidation(descInput, true);
        return;
      }

      hideBanner();
      isSubmitting = true;

      const saveBtn = document.getElementById("saveEditBtn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Menyimpan";
      }

      try {
        let finalPhotoUrl = existingPhotoUrl;
        if (selectedPhotoFile) {
          if (!uploadedPhotoUrl) {
            uploadedPhotoUrl = await uploadKulinerPhoto(selectedPhotoFile);
          }
          finalPhotoUrl = uploadedPhotoUrl;
        }

        const jamBukaVal = document.getElementById("editJamBuka")?.value || "";
        const jamTutupVal = document.getElementById("editJamTutup")?.value || "";
        const jamOperasionalVal = jamBukaVal && jamTutupVal ? `${jamBukaVal} - ${jamTutupVal}` : null;
        const selectedKatText = katInput.options?.[katInput.selectedIndex]?.textContent?.trim() || "";

        const payload = {
          nama_kuliner: nama,
          nama_tempat: nama,
          deskripsi: deskripsi,
          id_kategori: kategori,
          alamat: alamat,
          latitude: latitudeVal,
          longitude: longitudeVal,
          harga: parsedHarga,
          jam_operasional: jamOperasionalVal,
          no_telepon: document.getElementById("editNoTelepon").value.trim() || null,
          photo_url: finalPhotoUrl || null,
          foto: finalPhotoUrl || null,
        };

        const response = await fetchWithTimeout(
          `${getApiUrl("kuliner.php")}?id=${encodeURIComponent(kulinerId)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
            credentials: "include",
          },
          12000
        );

        const textResponse = await response.text();
        let result;
        try {
          result = JSON.parse(textResponse);
        } catch (_) {
          throw new Error("Server mengembalikan respons yang tidak valid.");
        }

        if (!response.ok || !result.status) {
          throw new Error(result.message || "Gagal memperbarui kuliner");
        }

        const updatedRecord = {
          nama_kuliner: nama,
          nama_tempat: nama,
          deskripsi,
          id_kategori: kategori,
          ...(selectedKatText ? { nama_kategori: selectedKatText, kategori: selectedKatText } : {}),
          alamat,
          latitude: latitudeVal,
          longitude: longitudeVal,
          harga: parsedHarga,
          jam_operasional: jamOperasionalVal,
          no_telepon: payload.no_telepon,
          photo_url: finalPhotoUrl || null,
          foto: finalPhotoUrl || null,
        };

        try {
          sessionStorage.setItem(
            EDIT_DRAFT_KEY,
            JSON.stringify({ id_tempat: kulinerId, id_kuliner: kulinerId, id: kulinerId, ...updatedRecord })
          );

          const cachedRaw = localStorage.getItem(ADMIN_KULINER_CACHE_KEY);
          if (cachedRaw) {
            const parsedList = JSON.parse(cachedRaw);
            if (Array.isArray(parsedList)) {
              const updatedList = parsedList.map((row) => {
                const rowId = row.id_tempat || row.id_kuliner || row.id;
                if (String(rowId) !== String(kulinerId)) return row;
                return {
                  ...row,
                  ...updatedRecord,
                  photo_url: finalPhotoUrl || row.photo_url,
                  foto: finalPhotoUrl || row.foto,
                };
              });
              localStorage.setItem(ADMIN_KULINER_CACHE_KEY, JSON.stringify(updatedList));
            }
          }

          const allRaw = localStorage.getItem(ALL_ADMIN_KULINER_CACHE_KEY);
          if (allRaw) {
            const parsedAll = JSON.parse(allRaw);
            if (Array.isArray(parsedAll)) {
              const updatedAll = parsedAll.map((row) => {
                const rowId = row.id_tempat || row.id_kuliner || row.id;
                if (String(rowId) !== String(kulinerId)) return row;
                return {
                  ...row,
                  ...updatedRecord,
                  photo_url: finalPhotoUrl || row.photo_url,
                  foto: finalPhotoUrl || row.foto,
                };
              });
              localStorage.setItem(ALL_ADMIN_KULINER_CACHE_KEY, JSON.stringify(updatedAll));
            }
          }
        } catch (_) {}

        if (successEditModal) {
          successEditModal.hidden = false;
          if (closeSuccessEditBtn) closeSuccessEditBtn.focus();
        }
      } catch (error) {
        console.error("Error saving culinary:", error);
        if (editErrorMessage) {
          const isTimeout = error?.name === "AbortError";
          editErrorMessage.textContent = !navigator.onLine || error instanceof TypeError
            ? "Periksa koneksi internet anda"
            : isTimeout
              ? "Waktu permintaan habis, coba lagi"
              : error.message || "Gagal memperbarui kuliner";
        }
        if (errorEditModal) {
          errorEditModal.hidden = false;
          if (retryEditBtn) retryEditBtn.focus();
        }
      } finally {
        isSubmitting = false;
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Simpan";
        }
      }
    });
  }

  if (closeSuccessEditBtn) {
    closeSuccessEditBtn.addEventListener("click", () => {
      window.location.href = "daftar_kuliner_admin.html";
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

  checkAdminAccessSilent();
});