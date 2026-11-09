(() => {                                   // <‑‑ PEMBUKA IIFE
  const API_BASE_URL = "http://manganyukkk.my.id";
  const form = document.getElementById("addCulinaryForm");
  const photoInput = document.getElementById("culinaryPhoto");
  const photoPicker = document.getElementById("photoPicker");
  const photoPreview = document.getElementById("photoPreview");
  const photoPlaceholder = document.getElementById("photoPlaceholder");
  const removePhotoButton = document.getElementById("removePhoto");
  const formMessage = document.getElementById("formMessage");
  let previewUrl = "";

  function setPhoto(file) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = file ? URL.createObjectURL(file) : "";
    photoPreview.hidden = !file;
    photoPlaceholder.hidden = Boolean(file);
    removePhotoButton.hidden = !file;
    if (file) photoPreview.src = previewUrl;
  }

  // --- Foto picker & preview ---
  photoPicker.addEventListener("click", () => photoInput.click());

  photoInput.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      photoInput.value = "";
      setPhoto(null);
      formMessage.textContent = "Pilih foto dengan format JPG, PNG, atau WebP.";
      formMessage.hidden = false;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      photoInput.value = "";
      setPhoto(null);
      formMessage.textContent = "Ukuran foto maksimal 5 MB.";
      formMessage.hidden = false;
      return;
    }

    formMessage.hidden = true;
    setPhoto(file);
  });

  removePhotoButton.addEventListener("click", () => {
    photoInput.value = "";
    setPhoto(null);
  });

  // --- Submit & validasi ---
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formMessage.hidden = true;

    // Validasi deskripsi
    const deskripsi = document.getElementById('deskripsi').value;
    if (deskripsi.length > 300) {
      formMessage.textContent = "Deskripsi maksimal 300 karakter.";
      formMessage.hidden = false;
      return;
    }

    // Validasi harga
    const harga = document.getElementById('harga').value;
    if (harga === '' || Number(harga) < 0) {
      formMessage.textContent = "Harga harus berupa angka positif.";
      formMessage.hidden = false;
      return;
    }

    // Foto wajib
    if (!photoInput.files || !photoInput.files[0]) {
      formMessage.textContent = "Foto kuliner wajib diunggah.";
      formMessage.hidden = false;
      return;
    }

    const formData = new FormData(form);

    try {
      const response = await fetch(`${API_BASE_URL}/kuliner`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Server mengembalikan status tidak berhasil.");
      }

      // Sukses
      formMessage.textContent = "Kuliner berhasil ditambahkan!";
      formMessage.className = "form-message success";
      formMessage.hidden = false;

      // Redirect ke dashboard setelah 1,5 detik
      setTimeout(() => {
        window.location.href = "Dashboard_Admin.html";
      }, 1500);
    } catch (err) {
      console.error(err);
      formMessage.textContent = "Gagal menyimpan data: " + err.message + " - coba lagi?";
      formMessage.className = "form-message error";
      formMessage.hidden = false;
    }
  });
})();                                      // <‑‑ PENUTUP IIFE