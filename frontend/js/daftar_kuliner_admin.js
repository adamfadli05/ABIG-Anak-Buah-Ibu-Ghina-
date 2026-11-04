// State Data Kuliner (Default Data Sederhana)
let dataKuliner = JSON.parse(localStorage.getItem('adminKulinerData')) || [
    { id: 1, nama: "Empal Gentong", kategori: "Makanan", harga: 25000, rating: 4.8, gambar: "https://via.placeholder.com/50" },
    { id: 2, nama: "Nasi Jamblang", kategori: "Makanan", harga: 15000, rating: 4.7, gambar: "https://via.placeholder.com/50" },
    { id: 3, nama: "Es Tebu", kategori: "Minuman", harga: 5000, rating: 4.5, gambar: "https://via.placeholder.com/50" }
  ];
  
  // Element DOM
  const tableBody = document.getElementById('kuliner-table-body');
  const searchInput = document.getElementById('search-input');
  const filterKategori = document.getElementById('filter-kategori');
  
  const modal = document.getElementById('kuliner-modal');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('kuliner-form');
  
  const btnTambah = document.getElementById('btn-tambah');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnBatal = document.getElementById('btn-batal');
  
  // Render Tabel
  function renderTable(data = dataKuliner) {
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Data kuliner tidak ditemukan.</td></tr>`;
      return;
    }
  
    data.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td><img src="${item.gambar}" alt="${item.nama}" class="img-thumb"></td>
        <td><strong>${item.nama}</strong></td>
        <td>${item.kategori}</td>
        <td>Rp ${item.harga.toLocaleString('id-ID')}</td>
        <td>⭐ ${item.rating || 5.0}</td>
        <td>
          <button class="btn btn-edit" onclick="editKuliner(${item.id})">Edit</button>
          <button class="btn btn-danger" onclick="hapusKuliner(${item.id})">Hapus</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
  
  // Simpan ke LocalStorage
  function saveData() {
    localStorage.setItem('adminKulinerData', JSON.stringify(dataKuliner));
    renderTable();
  }
  
  // Buka Modal (Tambah)
  btnTambah.addEventListener('click', () => {
    form.reset();
    document.getElementById('kuliner-id').value = '';
    modalTitle.textContent = "Tambah Kuliner Baru";
    modal.classList.remove('hidden');
  });
  
  // Tutup Modal
  function closeModal() {
    modal.classList.add('hidden');
  }
  btnCloseModal.addEventListener('click', closeModal);
  btnBatal.addEventListener('click', closeModal);
  
  // Handle Form Submit (Tambah / Edit)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
  
    const id = document.getElementById('kuliner-id').value;
    const nama = document.getElementById('nama').value;
    const kategori = document.getElementById('kategori').value;
    const harga = parseInt(document.getElementById('harga').value);
    const gambar = document.getElementById('gambar').value;
  
    if (id) {
      // Edit Data
      const index = dataKuliner.findIndex(item => item.id == id);
      dataKuliner[index] = { ...dataKuliner[index], nama, kategori, harga, gambar };
    } else {
      // Tambah Data Baru
      const newKuliner = {
        id: Date.now(),
        nama,
        kategori,
        harga,
        rating: 5.0,
        gambar
      };
      dataKuliner.push(newKuliner);
    }
  
    saveData();
    closeModal();
  });
  
  // Edit Kuliner
  window.editKuliner = function(id) {
    const item = dataKuliner.find(k => k.id === id);
    if (item) {
      document.getElementById('kuliner-id').value = item.id;
      document.getElementById('nama').value = item.nama;
      document.getElementById('kategori').value = item.kategori;
      document.getElementById('harga').value = item.harga;
      document.getElementById('gambar').value = item.gambar;
  
      modalTitle.textContent = "Edit Data Kuliner";
      modal.classList.remove('hidden');
    }
  };
  
  // Hapus Kuliner
  window.hapusKuliner = function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data kuliner ini?")) {
      dataKuliner = dataKuliner.filter(item => item.id !== id);
      saveData();
    }
  };
  
  // Filter & Pencarian
  function filterData() {
    const keyword = searchInput.value.toLowerCase();
    const kategoriSelected = filterKategori.value;
  
    const filtered = dataKuliner.filter(item => {
      const matchNama = item.nama.toLowerCase().includes(keyword);
      const matchKategori = kategoriSelected === 'semua' || item.kategori === kategoriSelected;
      return matchNama && matchKategori;
    });
  
    renderTable(filtered);
  }
  
  searchInput.addEventListener('input', filterData);
  filterKategori.addEventListener('change', filterData);
  
  // Inisialisasi Tampilan Awal
  renderTable();