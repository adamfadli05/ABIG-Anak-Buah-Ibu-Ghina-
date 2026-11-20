-- Enable pg_trgm extension untuk pencarian LIKE yang lebih cepat
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index untuk filter ulasan per tempat (paling sering dipakai)
CREATE INDEX IF NOT EXISTS idx_ulasan_id_tempat
    ON ulasan (id_tempat);

-- Index untuk filter ulasan per user (cek kepemilikan)
CREATE INDEX IF NOT EXISTS idx_ulasan_id_user
    ON ulasan (id_user);

-- Index composite untuk agregasi rating per tempat
CREATE INDEX IF NOT EXISTS idx_ulasan_tempat_rating
    ON ulasan (id_tempat, rating)
    WHERE rating IS NOT NULL;

-- Index composite untuk cek kepemilikan (id_user + id_tempat)
CREATE INDEX IF NOT EXISTS idx_ulasan_user_tempat
    ON ulasan (id_user, id_tempat);

-- Index untuk urut ulasan terbaru per tempat (pagination)
CREATE INDEX IF NOT EXISTS idx_ulasan_tempat_tanggal
    ON ulasan (id_tempat, tanggal DESC);

-- ============================================================
-- Tabel: favorit
-- ============================================================

-- Index untuk daftar favorit per user (listing + pagination)
CREATE INDEX IF NOT EXISTS idx_favorit_id_user
    ON favorit (id_user);

-- Index composite untuk cek duplikat favorit
CREATE INDEX IF NOT EXISTS idx_favorit_user_tempat
    ON favorit (id_user, id_tempat);

-- Index untuk JOIN ke kuliner (paling sering di-JOIN)
CREATE INDEX IF NOT EXISTS idx_tempat_kuliner_id_kuliner
    ON tempat_kuliner (id_kuliner);

-- Index untuk filter koordinat tidak null (tempat_kuliner.php, rekomendasi.php)
CREATE INDEX IF NOT EXISTS idx_tempat_kuliner_koordinat
    ON tempat_kuliner (id_tempat)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;


-- Index untuk JOIN ke kategori
CREATE INDEX IF NOT EXISTS idx_kuliner_id_kategori
    ON kuliner (id_kategori);

-- GIN index untuk pencarian nama kuliner (LIKE dengan leading wildcard)
CREATE INDEX IF NOT EXISTS idx_kuliner_nama_trgm
    ON kuliner USING gin (nama_kuliner gin_trgm_ops);

-- Functional index untuk pencarian case-insensitive
CREATE INDEX IF NOT EXISTS idx_kuliner_nama_lower
    ON kuliner (LOWER(nama_kuliner));


-- Functional index untuk filter nama kategori case-insensitive
CREATE INDEX IF NOT EXISTS idx_kategori_nama_lower
    ON kategori (LOWER(nama_kategori));

-- GIN index untuk pencarian nama kategori
CREATE INDEX IF NOT EXISTS idx_kategori_nama_trgm
    ON kategori USING gin (nama_kategori gin_trgm_ops);

-- Index untuk login/register (cek email unik)
CREATE INDEX IF NOT EXISTS idx_users_email
    ON users (email);

-- Functional index untuk pencarian user case-insensitive
CREATE INDEX IF NOT EXISTS idx_users_nama_lower
    ON users (LOWER(nama));

CREATE INDEX IF NOT EXISTS idx_users_email_lower
    ON users (LOWER(email));

-- Index untuk login admin
CREATE INDEX IF NOT EXISTS idx_admin_email
    ON admin (email);
