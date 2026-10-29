const PROFILE_API_BASE = "http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend";
const CONNECTION_ERROR = "Koneksi internet terputus. Periksa koneksi Anda dan coba lagi.";
let currentProfile = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("retryProfile").addEventListener("click", loadProfile);
  document.getElementById("profileForm").addEventListener("submit", saveProfile);
  document.getElementById("passwordForm").addEventListener("submit", changePassword);
  document.getElementById("logoutButton").addEventListener("click", logout);
  document.getElementById("profilePhoto").addEventListener("input", previewProfilePhoto);
  document.getElementById("editNameButton").addEventListener("click", openProfileEditor);
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
  document.getElementById("profileName").value = name;
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
  const nameInput = document.getElementById("profileName");
  const photoInput = document.getElementById("profilePhoto");
  const message = document.getElementById("profileFormMessage");
  const button = event.currentTarget.querySelector("button[type='submit']");
  const name = nameInput.value.trim();
  const photo = photoInput.value.trim();

  if (name.length < 2) {
    showMessage(message, "Nama minimal 2 karakter.", "error");
    nameInput.focus();
    return;
  }
  if (name.length > 100) {
    showMessage(message, "Nama maksimal 100 karakter.", "error");
    nameInput.focus();
    return;
  }
  if (photo && !isValidHttpUrl(photo)) {
    showMessage(message, "Masukkan URL foto dengan format yang valid.", "error");
    photoInput.focus();
    return;
  }

  const updates = {};
  if (name !== (currentProfile?.nama || "")) updates.nama = name;
  if (photo !== (currentProfile?.foto_profil || "")) updates.foto_profil = photo;
  if (Object.keys(updates).length === 0) {
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
      body: JSON.stringify(updates),
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

async function changePassword(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const message = document.getElementById("passwordFormMessage");
  const button = form.querySelector("button[type='submit']");

  if (newPassword.value.length < 8) {
    showMessage(message, "Kata sandi baru minimal 8 karakter.", "error");
    newPassword.focus();
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    showMessage(message, "Konfirmasi kata sandi tidak sesuai.", "error");
    confirmPassword.focus();
    return;
  }
  if (!currentPassword.value) {
    showMessage(message, "Kata sandi saat ini wajib diisi.", "error");
    currentPassword.focus();
    return;
  }

  button.disabled = true;
  message.hidden = true;
  try {
    const response = await fetch(`${PROFILE_API_BASE}/api/ubah_password.php`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kata_sandi_saat_ini: currentPassword.value,
        kata_sandi_baru: newPassword.value,
        konfirmasi_kata_sandi: confirmPassword.value,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.status) {
      throw new Error(result.message || "Gagal mengubah kata sandi.");
    }

    form.reset();
    showMessage(message, result.message || "Kata sandi berhasil diubah.", "success");
  } catch (requestError) {
    showMessage(message, isNetworkError(requestError) ? CONNECTION_ERROR : requestError.message, "error");
  } finally {
    button.disabled = false;
  }
}

async function logout() {
  const button = document.getElementById("logoutButton");
  button.disabled = true;
  try {
    const response = await fetch(`${PROFILE_API_BASE}/logout.php`, {
      method: "GET",
      credentials: "include",
      redirect: "follow",
    });
    if (!response.ok) throw new Error("Gagal mengakhiri sesi. Silakan coba lagi.");
    localStorage.clear();
    window.location.replace("login.html");
  } catch (requestError) {
    button.disabled = false;
    window.alert(isNetworkError(requestError) ? CONNECTION_ERROR : requestError.message);
  }
}

function previewProfilePhoto() {
  setProfilePhoto(document.getElementById("profilePhoto").value.trim());
}

function openProfileEditor() {
  const form = document.getElementById("profileForm");
  form.hidden = false;
  document.getElementById("profileName").focus();
}

function closeProfileEditor() {
  const form = document.getElementById("profileForm");
  form.hidden = true;
  document.getElementById("profileFormMessage").hidden = true;
}

function togglePasswordEditor() {
  const form = document.getElementById("passwordForm");
  const button = document.getElementById("togglePasswordButton");
  form.hidden = !form.hidden;
  button.setAttribute("aria-expanded", String(!form.hidden));
  if (!form.hidden) document.getElementById("currentPassword").focus();
}

function closePasswordEditor() {
  const form = document.getElementById("passwordForm");
  form.hidden = true;
  form.reset();
  document.getElementById("passwordFormMessage").hidden = true;
  document.getElementById("togglePasswordButton").setAttribute("aria-expanded", "false");
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