// Data Default Kategori Kuliner
let dataKategori = JSON.parse(localStorage.getItem('adminKategoriData')) || [
    { id: 1, nama: "Makanan Utama", icon: "dashicons:food", deskripsi: "Hidangan makanan berat khas daerah", jumlahItem: 12 },
    { id: 2, nama: "Minuman", icon: "mdi:coffee", deskripsi: "Aneka ragam olahan minuman segar & hangat", jumlahItem: 8 },
    { id: 3, nama: "Cemilan & Oleh-oleh", icon: "mdi:cookie", deskripsi: "Makanan ringan dan kudapan khas", jumlahItem: 15 }
  ];
  
  // Element DOM
  const tableBody = document.getElementById('kategori-table-body');
  const searchInput = document.getElementById('search-input');
  
  const modal = document.getElementById('kategori-modal');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('kategori-form');
  
  const btnTambah = document.getElementById('btn-tambah');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnBatal = document.getElementById('btn-batal');
  
  // Render Tabel Kategori
  function renderTable(data = dataKategori) {
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">Kategori tidak ditemukan.</td></tr>`;
      return;
    }
  
    data.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <div class="badge-icon">
            <iconify-icon icon="${item.icon}"></iconify-icon>
          </div>
        </td>
        <td><strong>${item.nama}</strong></td>
        <td>${item.deskripsi}</td>
        <td><span class="badge-count">${item.jumlahItem || 0} Item</span></td>
        <td>
          <button class="btn btn-edit" onclick="editKategori(${item.id})">Edit</button>
          <button class="btn btn-danger" onclick="hapusKategori(${item.id})">Hapus</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
  
  // Simpan data ke LocalStorage
  function saveData() {
    localStorage.setItem('adminKategoriData', JSON.stringify(dataKategori));
    renderTable();
  }
  
  // Modal Toggle
  btnTambah.addEventListener('click', () => {
    form.reset();
    document.getElementById('kategori-id').value = '';
    modalTitle.textContent = "Tambah Kategori Baru";
    modal.classList.remove('hidden');
  });
  
  function closeModal() {
    modal.classList.add('hidden');
  }
  
  btnCloseModal.addEventListener('click', closeModal);
  btnBatal.addEventListener('click', closeModal);
  
  // Submit Form (Tambah / Edit)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
  
    const id = document.getElementById('kategori-id').value;
    const nama = document.getElementById('nama-kategori').value;
    const icon = document.getElementById('icon-kategori').value;
    const deskripsi = document.getElementById('deskripsi-kategori').value;
  
    if (id) {
      // Edit Kategori
      const index = dataKategori.findIndex(k => k.id == id);
      if (index !== -1) {
        dataKategori[index] = { ...dataKategori[index], nama, icon, deskripsi };
      }
    } else {
      // Tambah Kategori Baru
      const newKategori = {
        id: Date.now(),
        nama,
        icon,
        deskripsi,
        jumlahItem: 0
      };
      dataKategori.push(newKategori);
    }
  
    saveData();
    closeModal();
  });
  
  // Edit Kategori
  window.editKategori = function(id) {
    const item = dataKategori.find(k => k.id === id);
    if (item) {
      document.getElementById('kategori-id').value = item.id;
      document.getElementById('nama-kategori').value = item.nama;
      document.getElementById('icon-kategori').value = item.icon;
      document.getElementById('deskripsi-kategori').value = item.deskripsi;
  
      modalTitle.textContent = "Edit Kategori Kuliner";
      modal.classList.remove('hidden');
    }
  };
  
  // Hapus Kategori
  window.hapusKategori = function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      dataKategori = dataKategori.filter(item => item.id !== id);
      saveData();
    }
  };
  
  // Fitur Pencarian Real-time
  searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = dataKategori.filter(item => 
      item.nama.toLowerCase().includes(keyword) || 
      item.deskripsi.toLowerCase().includes(keyword)
    );
    renderTable(filtered);
  });
  
  // Load awal
  renderTable();