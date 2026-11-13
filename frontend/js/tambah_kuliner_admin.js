document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addCulinaryForm");
  const photoInput = document.getElementById("culinaryPhoto");
  const photoPicker = document.getElementById("photoPicker");
  const photoPreview = document.getElementById("photoPreview");
  const photoPlaceholder = document.getElementById("photoPlaceholder");
  const removePhotoButton = document.getElementById("removePhoto");
  const kategoriSelect = document.getElementById("kategori");
  const hargaInput = document.getElementById("harga");

  const alertBanner = document.getElementById("formAlertBanner");
  const alertMessage = document.getElementById("formAlertMessage");

  let previewUrl = "";
  let uploadedFile = null; // Menyimpan referensi file yang dipilih

  // --- Fetch Data Kategori dari kategori.php ---
  async function loadKategori() {
    try {
      const response = await fetch("/ABIG-Anak-Buah-Ibu-Ghina-/backend/api/admin/kategori.php", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const textRes = await response.text();
      let result;
      try {
        result = JSON.parse(textRes);
      } catch (err) {
        console.error("Gagal parsing JSON kategori:", textRes);
        return;
      }

      const dataKategori = Array.isArray(result) ? result : (result.data || result.kategori || []);

      if (kategoriSelect && dataKategori.length > 0) {
        kategoriSelect.innerHTML = '<option value="" selected disabled>Atur kategori kuliner</option>';
        
        dataKategori.forEach((kat) => {
          const option = document.createElement("option");
          option.value = kat.id_kategori || kat.id;
          option.textContent = kat.nama_kategori || kat.nama;
          kategoriSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Gagal memuat kategori:", err);
    }
  }

  loadKategori();

  // --- Auto Format Titik Ribuan pada Input Harga ---
  if (hargaInput) {
    hargaInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value) {
        value = parseInt(value, 10).toLocaleString("id-ID");
      }
      e.target.value = value;
    });
  }

  function setPhoto(file) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    uploadedFile = file; // Simpan file ke variabel global
    previewUrl = file ? URL.createObjectURL(file) : "";
    photoPreview.hidden = !file;
    photoPlaceholder.hidden = Boolean(file);
    removePhotoButton.hidden = !file;
    if (file) {
      photoPreview.src = previewUrl;
      if (photoPicker) photoPicker.classList.remove("input-error");
    }
  }

  // --- Foto picker & preview ---
  if (photoPicker && photoInput) {
    photoPicker.addEventListener("click", () => photoInput.click());

    photoInput.addEventListener("change", () => {
      const file = photoInput.files?.[0];
      if (!file) return;

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        photoInput.value = "";
        setPhoto(null);
        if (alertMessage) alertMessage.textContent = "Pilih foto dengan format JPG, PNG, atau WebP.";
        if (alertBanner) alertBanner.hidden = false;
        if (photoPicker) photoPicker.classList.add("input-error");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        photoInput.value = "";
        setPhoto(null);
        if (alertMessage) alertMessage.textContent = "Ukuran foto maksimal 5 MB.";
        if (alertBanner) alertBanner.hidden = false;
        if (photoPicker) photoPicker.classList.add("input-error");
        return;
      }

      if (alertBanner) alertBanner.hidden = true;
      if (photoPicker) photoPicker.classList.remove("input-error");
      setPhoto(file);
    });
  }

  if (removePhotoButton) {
    removePhotoButton.addEventListener("click", () => {
      photoInput.value = "";
      uploadedFile = null;
      setPhoto(null);
    });
  }

  // --- Submit & Validasi ---
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Bersihkan semua error merah sebelumnya
      const allInputs = form.querySelectorAll("input, textarea, select");
      allInputs.forEach((el) => el.classList.remove("input-error"));
      if (photoPicker) photoPicker.classList.remove("input-error");

      const namaInput = document.getElementById("namaKuliner");
      const descInput = document.getElementById("deskripsi");
      const katInput = document.getElementById("kategori");
      const alamatInput = document.getElementById("alamat");
      const latInput = document.getElementById("latitude");
      const lonInput = document.getElementById("longitude");

      const nama = namaInput ? namaInput.value.trim() : "";
      const hargaVal = hargaInput ? hargaInput.value.trim() : "";
      const deskripsi = descInput ? descInput.value.trim() : "";
      const kategori = katInput ? katInput.value : "";
      const alamat = alamatInput ? alamatInput.value.trim() : "";
      const latitudeVal = latInput ? latInput.value.trim() : "";
      const longitudeVal = lonInput ? lonInput.value.trim() : "";
      
      // Cek apakah foto sudah ada (melalui variabel uploadedFile atau elemen preview)
      const hasPhoto = uploadedFile !== null || (photoPreview && !photoPreview.hidden);

      let hasError = false;

     // 1. Validasi Foto Wajib Diisi
      if (!hasPhoto) {
        if (photoPicker) photoPicker.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Unggah foto kuliner terlebih dahulu.";
        if (alertBanner) alertBanner.hidden = false;
        return;
      }

      // 2. Validasi Kolom Teks & Kategori Wajib Diisi
      if (!nama || !hargaVal || !deskripsi || !kategori.toString().trim() || !alamat || !latitudeVal || !longitudeVal) {
        if (!nama && namaInput) namaInput.classList.add("input-error");
        if (!hargaVal && hargaInput) hargaInput.classList.add("input-error");
        if (!deskripsi && descInput) descInput.classList.add("input-error");
        if (!kategori.toString().trim() && katInput) katInput.classList.add("input-error");
        if (!alamat && alamatInput) alamatInput.classList.add("input-error");
        if (!latitudeVal && latInput) latInput.classList.add("input-error");
        if (!longitudeVal && lonInput) lonInput.classList.add("input-error");
        
        if (alertMessage) alertMessage.textContent = "Semua field wajib diisi";
        if (alertBanner) alertBanner.hidden = false;
        return;
      }

      // 3. Validasi & Pembersihan Harga (Hilangkan titik ribuan sebelum dikirim ke backend)
      const cleanHarga = hargaVal.replace(/\./g, "").replace(/,/g, ".");
      if (isNaN(cleanHarga) || Number(cleanHarga) <= 0) {
        if (hargaInput) hargaInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Harga harus berupa angka lebih dari 0.";
        if (alertBanner) alertBanner.hidden = false;
        if (hargaInput) hargaInput.focus();
        return;
      }
      const finalHarga = parseInt(cleanHarga, 10);

      // 4. Validasi Panjang Deskripsi Maksimal 300 Karakter
      if (deskripsi.length > 300) {
        if (descInput) descInput.classList.add("input-error");
        if (alertMessage) alertMessage.textContent = "Deskripsi kuliner melebihi batas maksimal 300 karakter.";
        if (alertBanner) alertBanner.hidden = false;
        if (descInput) descInput.focus();
        return;
      }

      if (alertBanner) alertBanner.hidden = true;

      const jamBukaVal = document.getElementById("jamBuka")?.value || "";
      const jamTutupVal = document.getElementById("jamTutup")?.value || "";
      const jamOperasionalVal = jamBukaVal && jamTutupVal ? `${jamBukaVal} - ${jamTutupVal}` : null;

      // Siapkan FormData untuk dikirim ke kuliner.php
      const formData = new FormData();
      formData.append("nama_kuliner", nama);
      formData.append("nama_tempat", nama);
      formData.append("deskripsi", deskripsi);
      formData.append("id_kategori", kategori);
      formData.append("alamat", alamat);
      formData.append("latitude", latitudeVal);
      formData.append("longitude", longitudeVal);
      formData.append("harga", finalHarga);
      if (jamOperasionalVal) formData.append("jam_operasional", jamOperasionalVal);
      const telVal = document.getElementById("telepon")?.value;
      if (telVal) formData.append("no_telepon", telVal);
      
      // Masukkan file foto yang valid ke FormData
      if (uploadedFile) {
        formData.append("photo", uploadedFile);
        formData.append("foto", uploadedFile);
      }

      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Menyimpan";
      }

      try {
        const response = await fetch("/ABIG-Anak-Buah-Ibu-Ghina-/backend/api/admin/kuliner.php", {
          method: "POST",
          body: formData,
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
          throw new Error(result.message || "Gagal menambahkan kuliner");
        }

        window.location.href = "daftar_kuliner_admin.html";
      } catch (error) {
        console.error("Error adding culinary:", error);
        if (alertMessage) {
          alertMessage.textContent = !navigator.onLine || error instanceof TypeError ? "Periksa koneksi internet anda" : error.message || "Gagal menambahkan kuliner";
        }
        if (alertBanner) alertBanner.hidden = false;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Simpan";
        }
      }
    });
  }
});