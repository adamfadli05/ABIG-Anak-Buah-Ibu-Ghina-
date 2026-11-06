document.addEventListener("DOMContentLoaded", () => {
  const addCulinaryButton = document.getElementById("btnTambahKuliner");
  if (!addCulinaryButton) return;

  addCulinaryButton.addEventListener("click", () => {
    window.location.assign("tambah_kuliner_admin.html");
  });
});
