(() => {
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formMessage.textContent = "Kerangka form siap. Penyimpanan data akan dihubungkan berikutnya.";
    formMessage.hidden = false;
  });
})();
