# 🍽️ MANGAN YUKKK

Website pencarian dan rekomendasi kuliner khas Cirebon yang membantu pengguna menemukan berbagai pilihan kuliner berdasarkan kategori, lokasi, harga, dan informasi lainnya.

MANGAN YUKKK dikembangkan sebagai proyek mata kuliah Manajemen Proyek menggunakan metode Scrum oleh Kelompok 1.

## GAMBARAN UMUM

MANGAN YUKKK merupakan website yang menyediakan informasi mengenai berbagai kuliner khas Cirebon untuk membantu masyarakat maupun wisatawan menemukan tempat kuliner yang sesuai dengan kebutuhan mereka.

Website ini menyediakan informasi kuliner seperti nama, foto, deskripsi, kategori, alamat, harga, jam operasional, nomor telepon, serta lokasi yang terintegrasi dengan Google Maps.

Pengguna dapat menjelajahi rekomendasi kuliner, mencari kuliner berdasarkan nama, melakukan filter berdasarkan kategori, melihat detail kuliner, memberikan rating dan ulasan, serta menyimpan kuliner favorit.

Antarmuka website terdiri dari dua bagian utama:

- **Halaman Pengguna:** Menyediakan fitur pencarian, rekomendasi, detail kuliner, peta lokasi, rating dan ulasan, serta daftar kuliner favorit.
- **Dashboard Admin:** Menyediakan pengelolaan data kuliner, kategori, dan informasi pengguna yang terdaftar.

## LATAR BELAKANG

Cirebon memiliki beragam kuliner khas yang menjadi daya tarik bagi masyarakat maupun wisatawan. Namun, tidak semua orang mengetahui informasi mengenai lokasi, harga, jam operasional, dan pilihan kuliner yang tersedia.

Informasi kuliner juga masih dapat ditemukan secara terpisah melalui berbagai sumber, sehingga pengguna perlu mencari informasi dari beberapa tempat sebelum menentukan pilihan.

Berdasarkan permasalahan tersebut, MANGAN YUKKK dikembangkan sebagai platform informasi kuliner yang mengumpulkan berbagai informasi kuliner khas Cirebon dalam satu website.

Melalui website ini, pengguna diharapkan dapat:

- Menemukan berbagai kuliner khas Cirebon dengan lebih mudah.
- Mengetahui informasi harga, alamat, dan jam operasional.
- Melihat lokasi kuliner melalui integrasi Google Maps.
- Mengetahui pengalaman pengguna lain melalui rating dan ulasan.
- Menyimpan kuliner yang disukai agar mudah ditemukan kembali.

## FITUR

### Halaman Awal

- Landing page sebagai halaman pengenalan website.
- Navigasi menuju halaman utama dan fitur pencarian kuliner.

### Fitur Pengguna

**Beranda dan Rekomendasi Kuliner**

- Menampilkan daftar rekomendasi kuliner khas Cirebon.
- Menampilkan informasi foto, nama, harga, dan rating kuliner.
- Pencarian kuliner berdasarkan nama.
- Filter kuliner berdasarkan kategori.
- Pagination dengan maksimal 20 data pada setiap halaman.

**Detail Kuliner**

- Menampilkan informasi lengkap kuliner.
- Menampilkan foto, nama, deskripsi, kategori, alamat, harga, jam operasional, dan nomor telepon jika tersedia.
- Menampilkan lokasi kuliner melalui Google Maps.
- Menyediakan petunjuk menuju lokasi kuliner.
- Menampilkan rating dan ulasan pengguna.
- Pagination pada daftar ulasan dengan maksimal 10 ulasan setiap halaman.

**Rating dan Ulasan**

- Pengguna dapat memberikan rating terhadap kuliner.
- Pengguna dapat menambahkan ulasan.
- Ulasan dapat disertai foto.
- Penyaringan kata terlarang dengan mengganti kata tersebut menjadi tanda `***`.

**Kuliner Favorit**

- Pengguna dapat menyimpan kuliner ke daftar favorit.
- Pengguna dapat menghapus kuliner dari daftar favorit.
- Menampilkan daftar kuliner yang telah disimpan.
- Pagination dengan maksimal 20 data setiap halaman.

**Profil Pengguna**

- Menampilkan informasi profil pengguna.
- Mengubah informasi profil.
- Mengelola informasi akun.
- Logout dari akun pengguna.

### Dashboard Admin

**Dashboard**

- Menampilkan halaman utama pengelolaan website.
- Menyediakan navigasi menuju menu pengelolaan.
- Menyediakan fitur logout melalui sidebar.

**Pengelolaan Data Kuliner**

- Menampilkan daftar kuliner yang tersedia.
- Menambahkan data kuliner baru.
- Mengubah informasi kuliner.
- Menghapus data kuliner.
- Pagination dengan maksimal 20 data setiap halaman.

**Pengelolaan Kategori**

- Menampilkan daftar kategori kuliner.
- Menambahkan kategori baru.
- Mengubah kategori.
- Menghapus kategori yang tidak digunakan.

**Pengelolaan Pengguna**

- Menampilkan daftar akun pengguna yang terdaftar.
- Melihat detail informasi pengguna.
- Mencari pengguna berdasarkan nama atau email.
- Pagination dengan maksimal 20 data setiap halaman.

### Peningkatan Sistem

- **Pagination:** Membagi daftar data menjadi beberapa halaman agar data lebih terorganisasi dan tidak ditampilkan sekaligus.
- **Penyaringan Kata Terlarang:** Menyamarkan kata-kata kasar pada ulasan menggunakan tanda `***`.
- **Optimasi Performa:** Mengoptimalkan proses pengambilan data, query database, dan respons API agar website berjalan lebih cepat.
- **Perbaikan Bug:** Memperbaiki kesalahan pada fitur dan tampilan berdasarkan hasil pengujian.
- **Design System:** Menyeragamkan penggunaan warna, typography, spacing, dan komponen antarmuka.
- **Pembuatan Desain Mobile:** Menyusun desain tampilan mobile untuk halaman pengguna dan dashboard admin.

## LINGKUP DAN BATASAN

**Di dalam lingkup:**

- Website informasi dan rekomendasi kuliner khas Cirebon.
- Pengelolaan data kuliner dan kategori oleh Admin.
- Pencarian dan filter kategori kuliner.
- Integrasi Google Maps untuk menampilkan lokasi kuliner.
- Rating dan ulasan pengguna.
- Penyimpanan daftar kuliner favorit.
- Pengelolaan profil dan akun pengguna.
- Dashboard Admin untuk pengelolaan informasi website.
- Pagination, penyaringan kata terlarang, dan optimasi performa website.

**Di luar lingkup (tidak dibangun pada proyek ini):**

- Pemesanan makanan secara langsung melalui website.
- Pembayaran makanan secara online.
- Layanan pengantaran makanan.
- Pelacakan pesanan secara real-time.
- Aplikasi native Android dan iOS.

MANGAN YUKKK berfokus pada penyediaan informasi dan rekomendasi kuliner, bukan sebagai platform transaksi makanan.

## TIM PENGEMBANG

Proyek MANGAN YUKKK dikembangkan oleh Kelompok 1 dengan pembagian tanggung jawab berdasarkan peran dalam pengembangan perangkat lunak.

- Project Manager (PM) - Adam Fadli: Mengelola perencanaan proyek, pembagian pekerjaan, pemantauan sprint, dan koordinasi tim.
- UI/UX Designer - Adel Zamalia: Merancang antarmuka dan pengalaman pengguna.
- Frontend Developer (FE) - Euis Fahira Yuningsih dan Ibrahim Hilal: Mengembangkan tampilan website dan mengintegrasikannya dengan API.
- Backend Developer (BE) - Rizki Aidil Fazri: Mengembangkan API, mengelola database, dan memproses logika sistem.
- Software Quality Assurance (SQA) - : Melakukan pengujian fitur dan memastikan hasil pengembangan sesuai dengan Acceptance Criteria dan Definition of Done.

## STATUS PROYEK

MANGAN YUKKK dikembangkan menggunakan metode Scrum dalam lima sprint.

Setiap sprint memiliki tujuan dan kumpulan pekerjaan yang disusun berdasarkan Product Backlog. Pekerjaan dibagi berdasarkan peran anggota tim, kemudian dipantau melalui Sprint Backlog dan Trello.

Pengembangan dilakukan secara bertahap, mulai dari pembangunan halaman pengguna, fitur pencarian dan rekomendasi kuliner, integrasi Google Maps, pengelolaan data melalui dashboard admin, hingga peningkatan kualitas dan performa website.

Sprint 5 difokuskan pada perbaikan bug, penerapan Design System, pagination pada beberapa daftar data, penyaringan kata terlarang pada ulasan, optimasi performa website, serta pembuatan desain mobile untuk halaman pengguna dan dashboard admin.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | PHP 8.2 (Apache) |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage |
| Auth | PHP Session + Google OAuth 2.0 |
| Deployment | Docker, Docker Compose, VPS |
| CI/CD | GitHub Actions |

---

## Struktur Proyek

```
ABIG-Anak-Buah-Ibu-Ghina-/
├── frontend/               # HTML, CSS, JS
│   ├── css/
│   ├── js/
│   ├── assets/
│   ├── Dockerfile
│   ├── nginx.conf          # Reverse proxy ke backend
│   └── docker-entrypoint.sh
├── backend/                # PHP API
│   ├── api/
│   │   ├── admin/          # Endpoint khusus Admin
│   │   │   ├── middleware.php
│   │   │   ├── dashboard.php
│   │   │   ├── kuliner.php
│   │   │   ├── kategori.php
│   │   │   └── user.php
│   │   ├── login.php
│   │   ├── register.php
│   │   ├── me.php
│   │   ├── kuliner.php
│   │   ├── kategori.php
│   │   ├── tempat_kuliner.php
│   │   ├── detail_kuliner.php
│   │   ├── filter_kuliner.php
│   │   ├── search.php
│   │   ├── rekomendasi.php
│   │   ├── favorit.php
│   │   ├── ulasan.php
│   │   ├── rating.php
│   │   └── profil.php
│   ├── config/
│   │   └── database.php
│   ├── env.php
│   ├── google.php
│   ├── logout.php
│   ├── callback.php
│   ├── swagger.yaml
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── deploy.yml      # CD: auto-deploy ke VPS setiap push ke main
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Setup Lokal (Tanpa Docker / XAMPP)

### 1. Clone repo
```bash
git clone https://github.com/adamfadli05/ABIG-Anak-Buah-Ibu-Ghina-.git
cd ABIG-Anak-Buah-Ibu-Ghina-
```

### 2. Buat file `.env`
Copy dari contoh:
```bash
cp .env.example .env
```
Lalu isi nilai yang sesuai di `.env`.

### 3. Install dependency PHP
```bash
cd backend
composer install
```

### 4. Jalankan di XAMPP
- Taruh folder project di `htdocs/`
- Akses frontend: `http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/frontend`
- Akses backend: `http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend`

---

## Setup dengan Docker

### 1. Clone repo dan buat `.env`
```bash
git clone https://github.com/adamfadli05/ABIG-Anak-Buah-Ibu-Ghina-.git
cd ABIG-Anak-Buah-Ibu-Ghina-
cp .env.example .env
# Edit .env sesuai kebutuhan
```

### 2. Jalankan dengan Docker Compose
```bash
docker compose up --build -d
```

### 3. Akses aplikasi
- Frontend + Backend: `http://localhost`

### Stop container
```bash
docker compose down
```

---

## Environment Variables

Lihat `.env.example` untuk daftar lengkap variabel yang diperlukan:

| Variable | Keterangan |
|----------|------------|
| `FRONTEND_URL` | URL frontend |
| `BACKEND_URL` | URL backend |
| `DB_HOST` | Host database Supabase |
| `DB_PORT` | Port database |
| `DB_NAME` | Nama database |
| `DB_USER` | Username database |
| `DB_PASSWORD` | Password database |
| `GOOGLE_CLIENT_SECRET` | JSON credentials Google OAuth |
| `CORS_ALLOWED_ORIGINS` | Origins yang diizinkan CORS |

---

## API Documentation

Dokumentasi lengkap tersedia di file `backend/swagger.yaml`.

Cara buka di browser:
1. Buka [editor.swagger.io](https://editor.swagger.io)
2. Copy isi `backend/swagger.yaml`
3. Paste di panel kiri

### Endpoint Utama

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/register.php` | Register akun |
| POST | `/api/login.php` | Login (user & admin) |
| GET | `/api/me.php` | Cek sesi login |
| POST | `/logout.php` | Logout |
| GET | `/api/kuliner.php` | Daftar kuliner |
| GET | `/api/tempat_kuliner.php` | Daftar tempat kuliner |
| GET | `/api/detail_kuliner.php?id=` | Detail kuliner |
| GET | `/api/search.php?q=` | Pencarian kuliner |
| GET | `/api/filter_kuliner.php?kategori=` | Filter by kategori |
| GET | `/api/rekomendasi.php` | Rekomendasi kuliner |
| GET/POST/DELETE | `/api/favorit.php` | Kelola favorit |
| GET/POST/PUT/DELETE | `/api/ulasan.php` | Kelola ulasan |
| GET/POST/PUT/DELETE | `/api/rating.php` | Kelola rating |
| GET/PUT/POST | `/api/profil.php` | Kelola profil |
| GET | `/api/admin/dashboard.php` | Dashboard admin |
| GET/POST/PUT/DELETE | `/api/admin/kuliner.php` | Kelola kuliner (admin) |
| GET/POST/PUT/DELETE | `/api/admin/kategori.php` | Kelola kategori (admin) |
| GET | `/api/admin/user.php` | Daftar pengguna (admin) |

---

## CI/CD

- **CD:** Setiap push ke branch `main` → GitHub Actions otomatis deploy ke VPS via SSH
- Workflow: `.github/workflows/deploy.yml`

---

## Git Conventions

| Hal | Kesepakatan |
|-----|-------------|
| Strategi branching | Feature branch |
| Format nama branch | `nama-fitur` |
| Awalan commit | `feat` / `fix` / `docs` / `refactor` / `chore` |
| Pull request | 1 orang FE menyetujui FE, anggota lain selain FE |
