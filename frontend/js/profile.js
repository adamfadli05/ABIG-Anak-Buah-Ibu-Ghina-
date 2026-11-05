const PROFILE_API_BASE = window.PROFILE_API_BASE || window.BASE_URL || window.location.origin;
const OFFLINE_ERROR = "Periksa koneksi internet anda.";
const SERVER_CONNECTION_ERROR = "Server profil tidak dapat dihubungi. Pastikan Apache dan backend berjalan, lalu coba lagi.";

// Fallback UUID generator — crypto.randomUUID() hanya tersedia di HTTPS/localhost
function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let currentProfile = null;
let nameUpdateTimeout = null;
let isProfilePhotoUploading = false;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("retryProfile").addEventListener("click", loadProfile);
  document.getElementById("retryConnectionButton").addEventListener("click", loadProfile);
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
  document.getElementById("editNameButton").addEventListener("click", openNameEditor);
  document.getElementById("cancelNameEdit").addEventListener("click", closeNameEditor);
  document.getElementById("editPhotoButton").addEventListener("click", togglePhotoMenu);
  document.getElementById("uploadPhotoButton").addEventListener("click", requestPhotoFile);
  document.getElementById("replacePhotoButton").addEventListener("click", requestPhotoFile);
  document.getElementById("removePhotoButton").addEventListener("click", removeProfilePhoto);
  document.getElementById("cancelRemovePhotoButton").addEventListener("click", closeRemovePhotoModal);
  document.getElementById("confirmRemovePhotoButton").addEventListener("click", confirmRemovePhoto);
  document.getElementById("finishRemovePhotoButton").addEventListener("click", closeRemovePhotoModal);
  document.getElementById("photoFileInput").addEventListener("change", handlePhotoFileSelection);
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
  document.getElementById("sidebarName").textContent = name;
  setProfilePhoto(user.foto_profil || "");
  localStorage.setItem("user", JSON.stringify(user));
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
    if (detail === "Kata sandi lama tidak sesuai") {
      setPasswordFieldError("currentPassword", "Kata sandi saat ini tidak sesuai.");
      currentPassword.focus();
      return;
    }
    showChangeResult(false, detail);
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

  // Clear localStorage dulu — logout di sisi client selalu berhasil
  localStorage.clear();

  // Coba destroy session di backend (best-effort, tidak block logout)
  try {
    await fetch(`${PROFILE_API_BASE}/logout.php`, {
      method: "GET",
      credentials: "include",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
  } catch (_) {
    // Abaikan error jaringan — session di server akan expired sendiri
  }

  document.getElementById("logoutConfirmDialog").hidden = true;
  document.getElementById("logoutSuccessDialog").hidden = false;
  document.getElementById("finishLogoutButton").focus();
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
  button.querySelector("iconify-icon").setAttribute("icon", showPassword ? "codicon:eye" : "codicon:eye-closed");
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
  if (isProfilePhotoUploading) return;
  const file = input.files[0];
  if (!file) return;
  input.value = "";
  const message = document.getElementById("photoActionMessage");
  const extensionByType = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  isProfilePhotoUploading = true;
  document.getElementById("editPhotoButton").disabled = true;
  document.getElementById("removePhotoButton").disabled = true;
  message.hidden = true;
  try {
    const supabaseConfig = window.SUPABASE_CONFIG;
    if (!window.supabase) {
      throw new Error("Layanan unggah foto gagal dimuat. Periksa koneksi internet, lalu muat ulang halaman.");
    }
    if (!supabaseConfig?.url || !supabaseConfig.anonKey || !supabaseConfig.profilePhotoBucket) {
      throw new Error("Konfigurasi Supabase atau nama bucket foto profil belum tersedia. Muat ulang halaman dan periksa konfigurasi.");
    }

    const supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
    const photoPath = `profil/${currentProfile?.id_user || "pengguna"}/${generateUUID()}.${extensionByType[file.type] || "img"}`;
    const { error: uploadError } = await supabaseClient.storage
      .from(supabaseConfig.profilePhotoBucket)
      .upload(photoPath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const photoUrl = supabaseClient.storage.from(supabaseConfig.profilePhotoBucket).getPublicUrl(photoPath).data.publicUrl;
    const response = await fetch(`${PROFILE_API_BASE}/api/profil.php`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foto_profil: photoUrl }),
    });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data) {
      throw new Error(result.message || "Gagal memperbarui foto profil.");
    }

    renderProfile(result.data);
    message.hidden = true;
  } catch (uploadError) {
    console.error("[Profile] Gagal mengganti foto profil:", uploadError);
    showMessage(message, getRequestErrorMessage(uploadError, "Foto gagal diunggah. Silakan coba lagi."), "error");
  } finally {
    isProfilePhotoUploading = false;
    document.getElementById("editPhotoButton").disabled = false;
    document.getElementById("removePhotoButton").disabled = false;
  }
}

async function removeProfilePhoto() {
  closePhotoMenu();
  // Tampilkan modal konfirmasi
  const modal = document.getElementById("removePhotoModal");
  document.getElementById("removePhotoConfirmDialog").hidden = false;
  document.getElementById("removePhotoResultDialog").hidden = true;
  modal.hidden = false;
  document.getElementById("cancelRemovePhotoButton").focus();
}

function closeRemovePhotoModal() {
  document.getElementById("removePhotoModal").hidden = true;
  document.getElementById("removePhotoConfirmDialog").hidden = true;
  document.getElementById("removePhotoResultDialog").hidden = true;
}

async function confirmRemovePhoto() {
  const confirmBtn = document.getElementById("confirmRemovePhotoButton");
  const cancelBtn = document.getElementById("cancelRemovePhotoButton");
  confirmBtn.disabled = true;
  cancelBtn.disabled = true;

  try {
    const button = document.getElementById("removePhotoButton");
    button.disabled = true;

    const response = await fetch(`${PROFILE_API_BASE}/api/profil.php`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foto_profil: null }),
    });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data) {
      throw new Error(result.message || "Gagal menghapus foto profil.");
    }

    renderProfile(result.data);

    // Tampilkan dialog sukses
    const icon = document.getElementById("removePhotoResultIcon");
    const msg = document.getElementById("removePhotoResultMessage");
    const sub = document.getElementById("removePhotoResultSub");
    icon.className = "fa-solid fa-circle-check logout-success-icon";
    icon.style.color = "";
    msg.textContent = "Foto profil berhasil dihapus";
    sub.hidden = true;
    document.getElementById("removePhotoConfirmDialog").hidden = true;
    document.getElementById("removePhotoResultDialog").hidden = false;
    document.getElementById("finishRemovePhotoButton").focus();
    button.disabled = false;

  } catch (err) {
    // Tampilkan dialog gagal
    const icon = document.getElementById("removePhotoResultIcon");
    const msg = document.getElementById("removePhotoResultMessage");
    const sub = document.getElementById("removePhotoResultSub");
    icon.className = "fa-solid fa-circle-xmark logout-success-icon";
    icon.style.color = "#e53e3e";
    msg.textContent = "Foto profil gagal dihapus";
    sub.textContent = getRequestErrorMessage(err, "Silakan coba lagi.");
    sub.style.marginTop = "8px";
    sub.style.display = "block";
    sub.hidden = false;
    document.getElementById("removePhotoConfirmDialog").hidden = true;
    document.getElementById("removePhotoResultDialog").hidden = false;
    document.getElementById("finishRemovePhotoButton").focus();
    document.getElementById("removePhotoButton").disabled = false;
  } finally {
    confirmBtn.disabled = false;
    cancelBtn.disabled = false;
  }
}

function setProfilePhoto(photoUrl) {
  const image = document.getElementById("profileAvatar");
  const fallback = document.getElementById("profileAvatarFallback");
  image.onerror = () => {
    image.hidden = true;
    fallback.hidden = false;
  };
  if (!photoUrl) {
    image.removeAttribute("src");
    image.hidden = true;
    fallback.hidden = false;
    return;
  }
  image.src = photoUrl;
  image.hidden = false;
  fallback.hidden = true;
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