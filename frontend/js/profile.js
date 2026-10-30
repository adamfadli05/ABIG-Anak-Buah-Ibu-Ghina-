const PROFILE_API_BASE = "http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend";
const CONNECTION_ERROR = "Koneksi internet terputus. Periksa koneksi Anda dan coba lagi.";
let currentProfile = null;
let nameUpdateTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("retryProfile").addEventListener("click", loadProfile);
  document.getElementById("profileForm").addEventListener("submit", saveProfile);
  document.getElementById("nameEditForm").addEventListener("submit", saveName);
  document.getElementById("nameEditInput").addEventListener("input", clearNameValidation);
  document.getElementById("nameEditInput").addEventListener("keydown", handleNameEditKeydown);
  document.getElementById("passwordForm").addEventListener("submit", changePassword);
  document.getElementById("currentPassword").addEventListener("input", validateCurrentPassword);
  document.getElementById("newPassword").addEventListener("input", validateNewPassword);
  document.getElementById("confirmPassword").addEventListener("input", validateConfirmPassword);
  document.getElementById("passwordResultAction").addEventListener("click", closePasswordResult);
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
  loading.hidden = false;
  error.hidden = true;
  content.hidden = true;

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
    loading.hidden = true;
    content.hidden = false;
  } catch (requestError) {
    loading.hidden = true;
    error.hidden = false;
    document.getElementById("profileErrorText").textContent = isNetworkError(requestError)
      ? CONNECTION_ERROR
      : requestError.message || "Gagal memuat profil.";
  }
}

function renderProfile(user) {
  currentProfile = { ...user };
  const name = user.nama || "";
  document.getElementById("displayName").textContent = name;
  document.getElementById("headerName").textContent = name;
  document.getElementById("displayEmail").textContent = user.email || "";
  document.getElementById("profilePhoto").value = user.foto_profil || "";
  document.getElementById("sidebarName").textContent = name;
  setProfilePhoto(user.foto_profil || "");
  localStorage.setItem("user", JSON.stringify(user));
}

async function saveProfile(event) {
  event.preventDefault();
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
    showMessage(message, isNetworkError(requestError) ? CONNECTION_ERROR : requestError.message, "error");
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
    showNameValidation(
      message,
      "Username harus mengandung minimal satu huruf dan tidak boleh kosong atau hanya berisi spasi."
    );
    input.focus();
    return;
  }
  if (nameLength < 2) {
    showNameValidation(message, "Nama minimal 2 karakter");
    input.focus();
    return;
  }
  if (nameLength > 100) {
    showNameValidation(message, "Username maksimal 100 karakter.");
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
    showNameValidation(
      message,
      isNetworkError(requestError) ? CONNECTION_ERROR : requestError.message || "Gagal memperbarui nama pengguna."
    );
    input.focus();
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
    showPasswordResult(true, "");
  } catch (requestError) {
    showPasswordResult(
      false,
      isNetworkError(requestError) ? CONNECTION_ERROR : requestError.message || "Silakan periksa data dan coba lagi."
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
    error.textContent = isNetworkError(requestError) ? CONNECTION_ERROR : requestError.message;
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
    closePasswordResult();
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
}

function clearPasswordFieldError(field) {
  const input = document.getElementById(field);
  const error = document.getElementById(`${field}Error`);
  input.removeAttribute("aria-invalid");
  error.textContent = "";
  error.hidden = true;
}

function clearPasswordValidation() {
  ["currentPassword", "newPassword", "confirmPassword"].forEach(clearPasswordFieldError);
}

function showPasswordResult(success, detail) {
  const modal = document.getElementById("passwordResultModal");
  const dialog = document.getElementById("passwordResultDialog");
  const icon = document.getElementById("passwordResultIcon");
  const title = document.getElementById("passwordResultTitle");
  const message = document.getElementById("passwordResultMessage");
  dialog.classList.toggle("is-error", !success);
  icon.className = `fa-solid ${success ? "fa-circle-check" : "fa-circle-xmark"} password-result-icon`;
  title.textContent = success ? "Perubahan berhasil disimpan" : "Perubahan gagal disimpan";
  message.textContent = detail;
  message.hidden = !detail;
  document.getElementById("passwordResultAction").textContent = success ? "Oke" : "Coba lagi";
  modal.dataset.success = String(success);
  modal.hidden = false;
  document.getElementById("passwordResultAction").focus();
}

function closePasswordResult() {
  const modal = document.getElementById("passwordResultModal");
  const wasSuccessful = modal.dataset.success === "true";
  modal.hidden = true;
  if (wasSuccessful) closePasswordEditor();
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

function handlePhotoFileSelection(event) {
  if (!event.currentTarget.files.length) return;
  event.currentTarget.value = "";
  openProfileEditor();
  showMessage(
    document.getElementById("profileFormMessage"),
    "Backend belum mendukung unggah file foto. Untuk sementara, masukkan URL foto.",
    "error"
  );
  document.getElementById("profilePhoto").focus();
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
    showMessage(message, isNetworkError(requestError) ? CONNECTION_ERROR : requestError.message, "error");
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

function isNetworkError(error) {
  return error instanceof TypeError || !navigator.onLine;
}

function showMessage(element, text, kind) {
  element.textContent = text;
  element.dataset.kind = kind;
  element.hidden = false;
}