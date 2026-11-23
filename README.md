# Mangan Yukkk 🍜

Aplikasi web untuk eksplorasi kuliner khas Cirebon. Pengguna dapat mencari, melihat detail, memberikan ulasan, dan menyimpan kuliner favorit. Dilengkapi panel Admin untuk mengelola data kuliner, kategori, dan pengguna.

**Live:** [http://manganyukkk.my.id](http://manganyukkk.my.id)

---

## Anggota Tim

| Nama | Role |
|------|------|
| Ibrahim Hilal | Frontend Developer |
| Rizki Aidil Fazri | Backend Developer |
| Euis Fahira | Frontend Developer |
| Adam Fadli | Frontend Developer |

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
