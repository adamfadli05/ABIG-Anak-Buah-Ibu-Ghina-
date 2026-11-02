const PROFILE_API_BASE = "http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend";
const OFFLINE_ERROR = "Perangkat tidak terhubung ke internet. Periksa jaringan Anda dan coba lagi.";
const SERVER_CONNECTION_ERROR = "Server profil tidak dapat dihubungi. Pastikan Apache dan backend berjalan, lalu coba lagi.";
let currentProfile = null;
let nameUpdateTimeout = null;
let isProfilePhotoUploading = false;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("retryProfile").addEventListener("click", loadProfile);
  document.getElementById("retryConnectionButton").addEventListener("click", loadProfile);
  document.getElementById("profileForm").addEventListener("submit", saveProfile);
  document.getElementById("nameEditForm").addEventListener("submit", saveName);
  document.getElementById("nameEditInput").addEventListener("input", clearNameValidation);
  document.getElementById("nameEditInput").addEventListener("keydown", handleNameEditKeydown);
  document.getElementById("passwordForm").addEventListener("submit", changePassword);
  document.getElementById("currentPassword").addEventListener("input", validateCurrentPassword);
  document.getElementById("newPassword").addEventListener("input", validateNewPassword);
  document.getElementById("confirmPassword").addEventListener("input", validateConfirmPassword);
  document.getElementById("passwordResultAction").addEventListener("click", closeChangeResult);
  document.querySelectorAll(".password-visibility-toggle").forEach((button) => {
    button.addEventListener("click", togglePasswordVisibility);
  });
  document.getElementById("logoutButton").addEventListener("click", openLogoutConfirmation);
  document.getElementById("cancelLogoutButton").addEventListener("click", closeLogoutConfirmation);
  document.getElementById("confirmLogoutButton").addEventListener("click", logout);
  document.getElementById("finishLogoutButton").addEventListener("click", finishLogout);
  document.getElementById("logoutModal").addEventListener("click", handleLogoutOverlayClick);
  document.addEventListener("keydown", handleLogoutDialogKeydown);
  document.getElementById("profilePhoto").addEventListener("input", previewProfilePhoto);
  document.getElementById("editNameButton").addEventListener("click", openNameEditor);
  document.getElementById("cancelNameEdit").addEventListener("click", closeNameEditor);
  document.getElementById("editPhotoButton").addEventListener("click", togglePhotoMenu);
  document.getElementById("uploadPhotoButton").addEventListener("click", requestPhotoFile);
  document.getElementById("replacePhotoButton").addEventListener("click", requestPhotoFile);
  document.getElementById("removePhotoButton").addEventListener("click", removeProfilePhoto);
  document.getElementById("photoFileInput").addEventListener("change", handlePhotoFileSelection);
  document.getElementById("cancelProfileEdit").addEventListener("click", closeProfileEditor);
  document.getElementById("togglePasswordButton").addEventListener("click", togglePasswordEditor);
  document.getElementById("cancelPasswordEdit").addEventListener("click", closePasswordEditor);
  document.addEventListener("click", closePhotoMenuOnOutsideClick);
  loadProfile();
});

async function loadProfile() {
  const loading = document.getElementById("profileLoading");
  const error = document.getElementById("profileError");
  const content = document.getElementById("profileContent");
  const cachedProfile = getCachedProfile();
  if (!currentProfile && cachedProfile) {
    renderProfile(cachedProfile);
    content.hidden = false;
  }
  loading.hidden = Boolean(currentProfile);
  error.hidden = true;
  if (!currentProfile) content.hidden = true;

  try {
    const response = await fetch(`${PROFILE_API_BASE}/api/profil.php`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.replace(`login.html?returnTo=${encodeURIComponent("profile.html")}`);
      return;
    }

    const result = await response.json();
    if (!response.ok || !result.status || !result.data) {
      throw new Error(result.message || "Gagal memuat profil.");
    }

    renderProfile(result.data);
    document.getElementById("connectionErrorModal").hidden = true;
    loading.hidden = true;
    content.hidden = false;
  } catch (requestError) {
    loading.hidden = true;
    const errorMessage = getRequestErrorMessage(requestError, "Gagal memuat profil.");
    if (!currentProfile) {
      error.hidden = false;
      document.getElementById("profileErrorText").textContent = errorMessage;
    }
    if (!navigator.onLine || requestError instanceof TypeError) {
      showConnectionError(errorMessage);
    } else if (!currentProfile) {
      error.hidden = false;
    }
  }
}

function getCachedProfile() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user && typeof user === "object" && user.id_user ? user : null;
  } catch (error) {
    console.error("[Profile] Data profil tersimpan tidak valid:", error);
    return null;
  }
}

function showConnectionError(message) {
  const modal = document.getElementById("connectionErrorModal");
  const title = document.getElementById("connectionErrorTitle");
  const detail = document.getElementById("connectionErrorMessage");
  const isOffline = !navigator.onLine;
  title.textContent = isOffline ? "Tidak ada koneksi internet" : "Tidak dapat terhubung ke server";
  detail.textContent = isOffline
    ? "Periksa koneksi internet Anda dan coba lagi."
    : message;
  modal.hidden = false;
  document.getElementById("retryConnectionButton").focus();
}

function renderProfile(user) {
  currentProfile = { ...user };
  const name = user.nama || "";
  document.getElementById("displayName").textContent = name;
  const navUserName = document.getElementById("navUserName");
  if (navUserName) navUserName.textContent = name;
  document.getElementById("displayEmail").textContent = user.email || "";
  document.getElementById("profilePhoto").value = user.foto_profil || "";
  document.getElementById("sidebarName").textContent = name;
  setProfilePhoto(user.foto_profil || "");
  localStorage.setItem("user", JSON.stringify(user));
}

async function saveProfile(event) {
  event.preventDefault();
  if (isProfilePhotoUploading) return;
  const photoInput = document.getElementById("profilePhoto");
  const message = document.getElementById("profileFormMessage");
  const button = event.currentTarget.querySelector("button[type='submit']");
  const photo = photoInput.value.trim();

  if (photo && !isValidHttpUrl(photo)) {
    showMessage(message, "Masukkan URL foto dengan format yang valid.", "error");
    photoInput.focus();
    return;
  }

  if (photo === (currentProfile?.foto_profil || "")) {
    showMessage(message, "Tidak ada perubahan untuk disimpan.", "error");
    return;
  }

  button.disabled = true;
  message.hidden = true;
  try {
    const response = await fetch(`${PROFILE_API_BASE}/api/profil.php`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foto_profil: photo }),
    });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data) {
      throw new Error(result.message || "Gagal memperbarui profil.");
    }

    renderProfile(result.data);
    showMessage(message, result.message || "Profil berhasil diperbarui.", "success");
  } catch (requestError) {
    showMessage(message, getRequestErrorMessage(requestError, "Gagal memperbarui profil."), "error");
  } finally {
    button.disabled = false;
  }
}

async function saveName(event) {
  event.preventDefault();
  const input = document.getElementById("nameEditInput");
  const message = document.getElementById("nameValidationMessage");
  const button = event.currentTarget.querySelector("button[type='submit']");
  const name = input.value.trim();
  const nameLength = Array.from(name).length;

  if (!/\p{L}/u.test(name)) {
    showNameValidation(message, "Nama pengguna tidak valid");
    input.focus();
    return;
  }
  if (nameLength < 2 || nameLength > 100) {
    showNameValidation(message, "Nama pengguna tidak valid");
    input.focus();
    return;
  }
  if (name === (currentProfile?.nama || "")) {
    closeNameEditor();
    return;
  }

  button.disabled = true;
  clearNameValidation();
  hideNameUpdateMessage();
  try {
    const response = await fetch(`${PROFILE_API_BASE}/api/profil.php`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: name }),
    });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data) {
      throw new Error(result.message || "Gagal memperbarui nama pengguna.");
    }

    renderProfile(result.data);
    closeNameEditor();
    showNameUpdateMessage();
  } catch (requestError) {
    console.error("[Profile] Gagal memperbarui nama pengguna:", requestError);
    showChangeResult(
      false,
      getRequestErrorMessage(requestError, "Gagal memperbarui nama pengguna. Silakan coba lagi."),
      true
    );
  } finally {
    button.disabled = false;
  }
}

async function changePassword(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  clearPasswordValidation();
  const button = form.querySelector("button[type='submit']");

  if (!newPassword.value && !confirmPassword.value) {
    setPasswordFieldError("newPassword", "Belum ada perubahan");
    setPasswordFieldError("confirmPassword", "Belum ada perubahan");
    newPassword.focus();
    return;
  }
  if (newPassword.value.length < 8) {
    setPasswordFieldError("newPassword", "Kata sandi baru minimal 8 karakter.");
    newPassword.focus();
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    setPasswordFieldError("confirmPassword", "Konfirmasi sandi tidak cocok.");
    confirmPassword.focus();
    return;
  }
  if (!currentPassword.value) {
    setPasswordFieldError("currentPassword", "Kata sandi saat ini wajib diisi.");
    currentPassword.focus();
    return;
  }

  button.disabled = true;
  try {
    const response = await fetch(`${PROFILE_API_BASE}/api/profil.php`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password_lama: currentPassword.value,
        password_baru: newPassword.value,
        konfirmasi_baru: confirmPassword.value,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.status) {
      throw new Error(result.message || "Gagal mengubah kata sandi.");
    }

    form.reset();
    clearPasswordValidation();
    showChangeResult(true, "");
  } catch (requestError) {
    const detail = getRequestErrorMessage(requestError, "Silakan periksa data dan coba lagi.");
    showChangeResult(
      false,
      detail === "Kata sandi lama tidak sesuai" ? "" : detail
    );
  } finally {
    button.disabled = false;
  }
}

async function logout() {
  const button = document.getElementById("confirmLogoutButton");
  const error = document.getElementById("logoutErrorMessage");
  button.disabled = true;
  document.getElementById("cancelLogoutButton").disabled = true;
  error.hidden = true;
  try {
    const response = await fetch(`${PROFILE_API_BASE}/logout.php`, {
      method: "GET",
      credentials: "include",
      redirect: "follow",
    });
    if (!response.ok) throw new Error("Gagal mengakhiri sesi. Silakan coba lagi.");
    localStorage.clear();
    document.getElementById("logoutConfirmDialog").hidden = true;
    document.getElementById("logoutSuccessDialog").hidden = false;
    document.getElementById("finishLogoutButton").focus();
  } catch (requestError) {
    error.textContent = getRequestErrorMessage(requestError, "Gagal mengakhiri sesi.");
    error.hidden = false;
    button.disabled = false;
    document.getElementById("cancelLogoutButton").disabled = false;
    button.focus();
  }
}

function openLogoutConfirmation() {
  const modal = document.getElementById("logoutModal");
  document.getElementById("logoutConfirmDialog").hidden = false;
  document.getElementById("logoutSuccessDialog").hidden = true;
  document.getElementById("logoutErrorMessage").hidden = true;
  modal.hidden = false;
  document.getElementById("cancelLogoutButton").focus();
}

function closeLogoutConfirmation() {
  document.getElementById("logoutModal").hidden = true;
  document.getElementById("logoutErrorMessage").hidden = true;
  document.getElementById("logoutButton").focus();
}

function finishLogout() {
  window.location.replace("login.html");
}

function handleLogoutOverlayClick(event) {
  if (event.target === event.currentTarget && !document.getElementById("confirmLogoutButton").disabled) {
    closeLogoutConfirmation();
  }
}

function handleLogoutDialogKeydown(event) {
  const passwordModal = document.getElementById("passwordResultModal");
  if (event.key === "Escape" && !passwordModal.hidden) {
    closeChangeResult();
    return;
  }
  if (event.key === "Escape" && !document.getElementById("logoutModal").hidden) {
    const successDialog = document.getElementById("logoutSuccessDialog");
    if (successDialog.hidden) closeLogoutConfirmation();
  }
}

function previewProfilePhoto() {
  setProfilePhoto(document.getElementById("profilePhoto").value.trim());
}

function openProfileEditor() {
  const form = document.getElementById("profileForm");
  form.hidden = false;
  document.getElementById("profilePhoto").focus();
}

function closeProfileEditor() {
  const form = document.getElementById("profileForm");
  form.hidden = true;
  document.getElementById("profileFormMessage").hidden = true;
}

function openNameEditor() {
  const form = document.getElementById("nameEditForm");
  const input = document.getElementById("nameEditInput");
  hideNameUpdateMessage();
  clearNameValidation();
  input.value = currentProfile?.nama || "";
  document.getElementById("nameDisplayRow").hidden = true;
  form.hidden = false;
  input.focus();
  input.select();
}

function closeNameEditor() {
  document.getElementById("nameEditForm").hidden = true;
  document.getElementById("nameDisplayRow").hidden = false;
  clearNameValidation();
}

function handleNameEditKeydown(event) {
  if (event.key === "Escape") closeNameEditor();
}

function clearNameValidation() {
  const input = document.getElementById("nameEditInput");
  const message = document.getElementById("nameValidationMessage");
  input.removeAttribute("aria-invalid");
  message.hidden = true;
  message.textContent = "";
}

function showNameValidation(message, text) {
  const input = document.getElementById("nameEditInput");
  message.textContent = text;
  message.hidden = false;
  input.setAttribute("aria-invalid", "true");
}

function showNameUpdateMessage() {
  const message = document.getElementById("nameUpdateMessage");
  clearTimeout(nameUpdateTimeout);
  message.hidden = false;
  nameUpdateTimeout = setTimeout(hideNameUpdateMessage, 4000);
}

function hideNameUpdateMessage() {
  clearTimeout(nameUpdateTimeout);
  document.getElementById("nameUpdateMessage").hidden = true;
}

function togglePasswordEditor() {
  const form = document.getElementById("passwordForm");
  const button = document.getElementById("togglePasswordButton");
  form.hidden = !form.hidden;
  button.setAttribute("aria-expanded", String(!form.hidden));
  button.hidden = !form.hidden;
  if (!form.hidden) document.getElementById("currentPassword").focus();
}

function closePasswordEditor() {
  const form = document.getElementById("passwordForm");
  form.hidden = true;
  form.reset();
  clearPasswordValidation();
  const button = document.getElementById("togglePasswordButton");
  button.hidden = false;
  button.setAttribute("aria-expanded", "false");
  button.focus();
}

function validateCurrentPassword() {
  const input = document.getElementById("currentPassword");
  if (!input.getAttribute("aria-invalid")) return;
  if (input.value) clearPasswordFieldError("currentPassword");
}

function validateNewPassword() {
  const input = document.getElementById("newPassword");
  if (input.getAttribute("aria-invalid")) {
    const error = document.getElementById("newPasswordError").textContent;
    if (error === "Belum ada perubahan" && input.value) {
      clearPasswordFieldError("newPassword");
    } else if (error === "Kata sandi baru minimal 8 karakter." && input.value.length >= 8) {
      clearPasswordFieldError("newPassword");
    }
  }
  const confirmInput = document.getElementById("confirmPassword");
  if (confirmInput.getAttribute("aria-invalid") && document.getElementById("confirmPasswordError").textContent === "Belum ada perubahan" && input.value) {
    clearPasswordFieldError("confirmPassword");
  }
  if (confirmInput.getAttribute("aria-invalid") && confirmInput.value === input.value) {
    clearPasswordFieldError("confirmPassword");
  }
}

function validateConfirmPassword() {
  const input = document.getElementById("confirmPassword");
  if (!input.getAttribute("aria-invalid")) return;
  const error = document.getElementById("confirmPasswordError").textContent;
  if (error === "Belum ada perubahan" && input.value) {
    clearPasswordFieldError("confirmPassword");
  } else if (input.value === document.getElementById("newPassword").value) {
    clearPasswordFieldError("confirmPassword");
  }
}

function setPasswordFieldError(field, text) {
  const input = document.getElementById(field);
  const error = document.getElementById(`${field}Error`);
  input.setAttribute("aria-invalid", "true");
  error.textContent = text;
  error.hidden = false;
  if (field === "newPassword") document.getElementById("passwordHint").hidden = true;
}

function clearPasswordFieldError(field) {
  const input = document.getElementById(field);
  const error = document.getElementById(`${field}Error`);
  input.removeAttribute("aria-invalid");
  error.textContent = "";
  error.hidden = true;
  if (field === "newPassword") document.getElementById("passwordHint").hidden = false;
}

function clearPasswordValidation() {
  ["currentPassword", "newPassword", "confirmPassword"].forEach(clearPasswordFieldError);
}

function showChangeResult(success, detail, returnToNameEditor = false) {
  const modal = document.getElementById("passwordResultModal");
  const dialog = document.getElementById("passwordResultDialog");
  const icon = document.getElementById("passwordResultIcon");
  const title = document.getElementById("passwordResultTitle");
  const message = document.getElementById("passwordResultMessage");
  dialog.classList.toggle("is-error", !success);
  icon.className = `fa-solid ${success ? "fa-circle-check" : "fa-circle-xmark"} password-result-icon`;
  title.textContent = success ? "Perubahan berhasil disimpan" : "Perubahan gagal di simpan";
  message.textContent = detail;
  message.hidden = !detail;
  document.getElementById("passwordResultAction").textContent = success ? "Oke" : "Coba lagi";
  modal.dataset.success = String(success);
  modal.dataset.returnToNameEditor = String(returnToNameEditor);
  modal.hidden = false;
  document.getElementById("passwordResultAction").focus();
}

function closeChangeResult() {
  const modal = document.getElementById("passwordResultModal");
  const wasSuccessful = modal.dataset.success === "true";
  const returnToNameEditor = modal.dataset.returnToNameEditor === "true";
  modal.hidden = true;
  delete modal.dataset.returnToNameEditor;
  if (wasSuccessful) closePasswordEditor();
  else if (returnToNameEditor) document.getElementById("nameEditInput").focus();
  else document.querySelector(".password-save-button").focus();
}

function togglePasswordVisibility(event) {
  const button = event.currentTarget;
  const input = button.parentElement.querySelector("input");
  const showPassword = input.type === "password";
  input.type = showPassword ? "text" : "password";
  button.setAttribute("aria-label", `${showPassword ? "Sembunyikan" : "Tampilkan"} ${input.labels[0].textContent.toLowerCase()}`);
  button.innerHTML = `<i class="fa-regular ${showPassword ? "fa-eye" : "fa-eye-slash"}" aria-hidden="true"></i>`;
}

function togglePhotoMenu() {
  const menu = document.getElementById("photoMenu");
  const button = document.getElementById("editPhotoButton");
  menu.hidden = !menu.hidden;
  button.setAttribute("aria-expanded", String(!menu.hidden));
}

function closePhotoMenu() {
  document.getElementById("photoMenu").hidden = true;
  document.getElementById("editPhotoButton").setAttribute("aria-expanded", "false");
}

function closePhotoMenuOnOutsideClick(event) {
  if (!event.target.closest(".profile-avatar-wrap, .photo-menu")) closePhotoMenu();
}

function requestPhotoFile() {
  closePhotoMenu();
  document.getElementById("photoFileInput").click();
}

async function handlePhotoFileSelection(event) {
  const input = event.currentTarget;
  const file = input.files[0];
  if (!file) return;
  input.value = "";
  openProfileEditor();
  const message = document.getElementById("profileFormMessage");
  const saveButton = document.querySelector("#profileForm button[type='submit']");
  const extensionByType = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

  if (!extensionByType[file.type]) {
    showMessage(message, "Pilih foto berformat JPG, PNG, atau WEBP.", "error");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showMessage(message, "Ukuran foto maksimal 5 MB.", "error");
    return;
  }

  const supabaseConfig = window.SUPABASE_CONFIG;
  if (!window.supabase) {
    showMessage(message, "Layanan unggah foto gagal dimuat. Periksa koneksi internet, lalu muat ulang halaman.", "error");
    return;
  }
  if (!supabaseConfig?.url || !supabaseConfig.anonKey || !supabaseConfig.profilePhotoBucket) {
    showMessage(message, "Konfigurasi Supabase atau nama bucket foto profil belum tersedia. Muat ulang halaman dan periksa konfigurasi.", "error");
    return;
  }

  isProfilePhotoUploading = true;
  saveButton.disabled = true;
  showMessage(message, "Sedang mengunggah foto...", "success");
  try {
    const supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
    const photoPath = `profil/${currentProfile?.id_user || "pengguna"}/${crypto.randomUUID()}.${extensionByType[file.type]}`;
    const { error: uploadError } = await supabaseClient.storage
      .from(supabaseConfig.profilePhotoBucket)
      .upload(photoPath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const photoUrl = supabaseClient.storage.from(supabaseConfig.profilePhotoBucket).getPublicUrl(photoPath).data.publicUrl;
    document.getElementById("profilePhoto").value = photoUrl;
    previewProfilePhoto();
    showMessage(message, "Foto berhasil diunggah. Tekan Simpan perubahan untuk menerapkan foto profil.", "success");
  } catch (uploadError) {
    console.error("[Profile] Gagal mengunggah foto profil:", uploadError);
    showMessage(message, getRequestErrorMessage(uploadError, "Foto gagal diunggah. Silakan coba lagi."), "error");
  } finally {
    isProfilePhotoUploading = false;
    saveButton.disabled = false;
  }
}

async function removeProfilePhoto() {
  closePhotoMenu();
  if (!window.confirm("Apakah Anda yakin ingin menghapus foto profil?")) return;

  const button = document.getElementById("removePhotoButton");
  const message = document.getElementById("photoActionMessage");
  button.disabled = true;
  message.hidden = true;
  try {
    const response = await fetch(`${PROFILE_API_BASE}/api/profil.php`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foto_profil: "" }),
    });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data) {
      throw new Error(result.message || "Gagal menghapus foto profil.");
    }

    renderProfile(result.data);
    showMessage(message, "Foto profil berhasil dihapus.", "success");
  } catch (requestError) {
    showMessage(message, getRequestErrorMessage(requestError, "Gagal menghapus foto profil."), "error");
  } finally {
    button.disabled = false;
  }
}

function setProfilePhoto(photoUrl) {
  const image = document.getElementById("profileAvatar");
  const fallback = document.getElementById("profileAvatarFallback");
  image.onerror = () => {
    image.hidden = true;
    fallback.hidden = false;
  };
  if (!photoUrl || !isValidHttpUrl(photoUrl)) {
    image.removeAttribute("src");
    image.hidden = true;
    fallback.hidden = false;
    return;
  }
  image.src = photoUrl;
  image.hidden = false;
  fallback.hidden = true;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getRequestErrorMessage(error, fallback) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return OFFLINE_ERROR;
  if (error instanceof TypeError) return SERVER_CONNECTION_ERROR;
  return error?.message || fallback;
}

function showMessage(element, text, kind) {
  element.textContent = text;
  element.dataset.kind = kind;
  element.hidden = false;
}