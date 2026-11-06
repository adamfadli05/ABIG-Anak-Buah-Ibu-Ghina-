<?php
/**
 * API Kuliner Admin — Task 31.3, 32.3, 33.3, 34.3
 *
 * GET    /api/admin/kuliner.php              — daftar semua kuliner
 * GET    /api/admin/kuliner.php?q=...        — pencarian berdasarkan nama kuliner
 * GET    /api/admin/kuliner.php?id=...       — detail kuliner berdasarkan id_tempat
 * POST   /api/admin/kuliner.php              — tambah kuliner baru (JSON)
 * PUT    /api/admin/kuliner.php?id=...       — ubah kuliner berdasarkan id_tempat (JSON)
 * DELETE /api/admin/kuliner.php?id=...       — hapus kuliner berdasarkan id_tempat
 *
 * Catatan: foto diterima sebagai URL (photo_url) karena upload file
 * dilakukan langsung dari FE ke Supabase Storage.
 */

require_once __DIR__ . '/../../env.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/middleware.php';

header('Content-Type: application/json');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Autentikasi & role Admin
requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];

// =============================================================================
// GET — Daftar / Pencarian / Detail
// =============================================================================
if ($method === 'GET') {

    $id = trim($_GET['id'] ?? '');
    $q  = trim($_GET['q']  ?? '');

    // --- Detail kuliner ---
    if ($id !== '') {
        if (!ctype_digit($id)) {
            http_response_code(400);
            echo json_encode(["status" => false, "message" => "ID kuliner tidak valid"]);
            exit;
        }

        $result = pg_query_params(
            $conn,
            "SELECT
                tk.id_tempat,
                tk.id_kuliner,
                k.nama_kuliner,
                k.deskripsi,
                k.id_kategori,
                ka.nama_kategori,
                tk.nama_tempat,
                tk.alamat,
                tk.latitude,
                tk.longitude,
                tk.jam_buka,
                tk.jam_tutup,
                tk.no_telepon,
                tk.foto        AS photo_url,
                tk.harga,
                COALESCE(ROUND(AVG(u.rating)::numeric, 1), 0) AS rata_rata_rating,
                COUNT(u.id_ulasan) AS jumlah_ulasan
            FROM tempat_kuliner tk
            JOIN kuliner k   ON tk.id_kuliner  = k.id_kuliner
            JOIN kategori ka ON k.id_kategori  = ka.id_kategori
            LEFT JOIN ulasan u ON tk.id_tempat = u.id_tempat
            WHERE tk.id_tempat = $1
            GROUP BY
                tk.id_tempat, tk.id_kuliner, k.nama_kuliner, k.deskripsi,
                k.id_kategori, ka.nama_kategori, tk.nama_tempat, tk.alamat,
                tk.latitude, tk.longitude, tk.jam_buka, tk.jam_tutup,
                tk.no_telepon, tk.foto, tk.harga",
            [$id]
        );

        if (!$result) {
            http_response_code(500);
            echo json_encode(["status" => false, "message" => "Gagal mengambil detail kuliner"]);
            exit;
        }

        $data = pg_fetch_assoc($result);

        if (!$data) {
            http_response_code(404);
            echo json_encode(["status" => false, "message" => "Kuliner tidak ditemukan"]);
            exit;
        }

        http_response_code(200);
        echo json_encode(["status" => true, "data" => $data]);
        exit;
    }

    // --- Pencarian atau daftar semua ---
    if ($q !== '') {
        $result = pg_query_params(
            $conn,
            "SELECT
                tk.id_tempat,
                tk.id_kuliner,
                k.nama_kuliner,
                k.deskripsi,
                k.id_kategori,
                ka.nama_kategori,
                tk.nama_tempat,
                tk.alamat,
                tk.latitude,
                tk.longitude,
                tk.jam_buka,
                tk.jam_tutup,
                tk.no_telepon,
                tk.foto        AS photo_url,
                tk.harga,
                COALESCE(ROUND(AVG(u.rating)::numeric, 1), 0) AS rata_rata_rating,
                COUNT(u.id_ulasan) AS jumlah_ulasan
            FROM tempat_kuliner tk
            JOIN kuliner k   ON tk.id_kuliner  = k.id_kuliner
            JOIN kategori ka ON k.id_kategori  = ka.id_kategori
            LEFT JOIN ulasan u ON tk.id_tempat = u.id_tempat
            WHERE LOWER(k.nama_kuliner) LIKE LOWER($1)
            GROUP BY
                tk.id_tempat, tk.id_kuliner, k.nama_kuliner, k.deskripsi,
                k.id_kategori, ka.nama_kategori, tk.nama_tempat, tk.alamat,
                tk.latitude, tk.longitude, tk.jam_buka, tk.jam_tutup,
                tk.no_telepon, tk.foto, tk.harga
            ORDER BY k.nama_kuliner ASC",
            ['%' . $q . '%']
        );
    } else {
        $result = pg_query(
            $conn,
            "SELECT
                tk.id_tempat,
                tk.id_kuliner,
                k.nama_kuliner,
                k.deskripsi,
                k.id_kategori,
                ka.nama_kategori,
                tk.nama_tempat,
                tk.alamat,
                tk.latitude,
                tk.longitude,
                tk.jam_buka,
                tk.jam_tutup,
                tk.no_telepon,
                tk.foto        AS photo_url,
                tk.harga,
                COALESCE(ROUND(AVG(u.rating)::numeric, 1), 0) AS rata_rata_rating,
                COUNT(u.id_ulasan) AS jumlah_ulasan
            FROM tempat_kuliner tk
            JOIN kuliner k   ON tk.id_kuliner  = k.id_kuliner
            JOIN kategori ka ON k.id_kategori  = ka.id_kategori
            LEFT JOIN ulasan u ON tk.id_tempat = u.id_tempat
            GROUP BY
                tk.id_tempat, tk.id_kuliner, k.nama_kuliner, k.deskripsi,
                k.id_kategori, ka.nama_kategori, tk.nama_tempat, tk.alamat,
                tk.latitude, tk.longitude, tk.jam_buka, tk.jam_tutup,
                tk.no_telepon, tk.foto, tk.harga
            ORDER BY tk.id_tempat ASC"
        );
    }

    if (!$result) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal mengambil data kuliner"]);
        exit;
    }

    $data = [];
    while ($row = pg_fetch_assoc($result)) {
        $data[] = $row;
    }

    if (empty($data) && $q !== '') {
        http_response_code(200);
        echo json_encode([
            "status"  => true,
            "message" => "Tidak ada kuliner yang cocok dengan pencarian",
            "data"    => []
        ]);
        exit;
    }

    http_response_code(200);
    echo json_encode(["status" => true, "data" => $data]);
    exit;
}

// =============================================================================
// POST — Tambah kuliner baru (JSON)
// foto diterima sebagai photo_url (URL Supabase Storage dari FE)
// =============================================================================
if ($method === 'POST') {

    $body = json_decode(file_get_contents("php://input"), true) ?? [];

    $nama_kuliner = trim($body['nama_kuliner'] ?? '');
    $deskripsi    = trim($body['deskripsi']    ?? '');
    $id_kategori  = trim((string)($body['id_kategori'] ?? ''));
    $nama_tempat  = trim($body['nama_tempat']  ?? '');
    $alamat       = trim($body['alamat']       ?? '');
    $latitude     = trim((string)($body['latitude']    ?? ''));
    $longitude    = trim((string)($body['longitude']   ?? ''));
    $harga        = trim((string)($body['harga']       ?? ''));
    $jam_operasional = trim($body['jam_operasional'] ?? '') ?: null;
    $no_telepon      = trim($body['no_telepon']      ?? '') ?: null;
    $photo_url       = trim($body['photo_url']       ?? '') ?: null;

    // Parsing jam_operasional → jam_buka & jam_tutup (format: "08:00 - 21:00")
    $jam_buka  = null;
    $jam_tutup = null;
    if ($jam_operasional !== null) {
        $parts     = explode('-', $jam_operasional, 2);
        $jam_buka  = trim($parts[0] ?? '') ?: null;
        $jam_tutup = trim($parts[1] ?? '') ?: null;
    }

    // Validasi field wajib
    if (empty($nama_kuliner) || empty($deskripsi) || empty($id_kategori) ||
        empty($nama_tempat)  || empty($alamat)    ||
        $latitude === ''     || $longitude === ''  || $harga === '') {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Semua field wajib diisi"]);
        exit;
    }

    // Validasi id_kategori numerik
    if (!ctype_digit($id_kategori)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "ID kategori tidak valid"]);
        exit;
    }

    // Validasi kategori ada di database
    $cek_kat = pg_query_params($conn, 'SELECT id_kategori FROM kategori WHERE id_kategori = $1', [$id_kategori]);
    if (!$cek_kat) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memeriksa kategori"]);
        exit;
    }
    if (pg_num_rows($cek_kat) === 0) {
        http_response_code(404);
        echo json_encode(["status" => false, "message" => "Kategori tidak ditemukan"]);
        exit;
    }

    // Validasi harga
    if (!is_numeric($harga) || (float)$harga < 0) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Harga tidak valid"]);
        exit;
    }

    // Validasi koordinat
    if (!is_numeric($latitude) || !is_numeric($longitude)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Latitude dan longitude harus berupa angka"]);
        exit;
    }
    if ((float)$latitude < -90 || (float)$latitude > 90) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Latitude harus antara -90 dan 90"]);
        exit;
    }
    if ((float)$longitude < -180 || (float)$longitude > 180) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Longitude harus antara -180 dan 180"]);
        exit;
    }

    // Validasi photo_url jika diisi
    if ($photo_url !== null && !filter_var($photo_url, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Format URL foto tidak valid"]);
        exit;
    }

    // Simpan ke tabel kuliner lalu tempat_kuliner dalam transaksi
    pg_query($conn, 'BEGIN');

    $ins_kuliner = pg_query_params(
        $conn,
        'INSERT INTO kuliner (nama_kuliner, deskripsi, id_kategori)
         VALUES ($1, $2, $3)
         RETURNING id_kuliner',
        [$nama_kuliner, $deskripsi, $id_kategori]
    );

    if (!$ins_kuliner || pg_num_rows($ins_kuliner) === 0) {
        pg_query($conn, 'ROLLBACK');
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal menyimpan data kuliner"]);
        exit;
    }

    $id_kuliner = pg_fetch_assoc($ins_kuliner)['id_kuliner'];

    $ins_tempat = pg_query_params(
        $conn,
        'INSERT INTO tempat_kuliner
            (id_kuliner, nama_tempat, alamat, latitude, longitude, harga, jam_buka, jam_tutup, no_telepon, foto)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id_tempat',
        [
            $id_kuliner, $nama_tempat, $alamat,
            $latitude, $longitude, $harga,
            $jam_buka, $jam_tutup, $no_telepon,
            $photo_url
        ]
    );

    if (!$ins_tempat || pg_num_rows($ins_tempat) === 0) {
        pg_query($conn, 'ROLLBACK');
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal menyimpan data tempat kuliner"]);
        exit;
    }

    pg_query($conn, 'COMMIT');

    $id_tempat = pg_fetch_assoc($ins_tempat)['id_tempat'];

    http_response_code(201);
    echo json_encode([
        "status"  => true,
        "message" => "Kuliner berhasil ditambahkan",
        "data"    => [
            "id_kuliner"   => (int)$id_kuliner,
            "id_tempat"    => (int)$id_tempat,
            "nama_kuliner" => $nama_kuliner,
            "photo_url"    => $photo_url
        ]
    ]);
    exit;
}

// =============================================================================
// PUT — Ubah kuliner berdasarkan id_tempat (JSON)
// foto diterima sebagai photo_url; null = pertahankan foto lama
// =============================================================================
if ($method === 'PUT') {

    $id = trim($_GET['id'] ?? '');

    if (empty($id) || !ctype_digit($id)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "ID kuliner tidak valid"]);
        exit;
    }

    // Cek kuliner ada dan ambil data lama
    $cek = pg_query_params(
        $conn,
        "SELECT tk.id_tempat, tk.id_kuliner, tk.foto AS photo_url,
                k.nama_kuliner, k.deskripsi, k.id_kategori,
                tk.nama_tempat, tk.alamat, tk.latitude, tk.longitude,
                tk.harga, tk.jam_buka, tk.jam_tutup, tk.no_telepon
         FROM tempat_kuliner tk
         JOIN kuliner k ON tk.id_kuliner = k.id_kuliner
         WHERE tk.id_tempat = $1",
        [$id]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memeriksa data kuliner"]);
        exit;
    }

    $lama = pg_fetch_assoc($cek);

    if (!$lama) {
        http_response_code(404);
        echo json_encode(["status" => false, "message" => "Kuliner tidak ditemukan"]);
        exit;
    }

    $body = json_decode(file_get_contents("php://input"), true) ?? [];

    // Ambil nilai baru, fallback ke nilai lama jika tidak dikirim
    $nama_kuliner = trim($body['nama_kuliner'] ?? $lama['nama_kuliner']);
    $deskripsi    = trim($body['deskripsi']    ?? $lama['deskripsi']);
    $id_kategori  = trim((string)($body['id_kategori'] ?? $lama['id_kategori']));
    $nama_tempat  = trim($body['nama_tempat']  ?? $lama['nama_tempat']);
    $alamat       = trim($body['alamat']       ?? $lama['alamat']);
    $latitude     = trim((string)($body['latitude']  ?? $lama['latitude']));
    $longitude    = trim((string)($body['longitude'] ?? $lama['longitude']));
    $harga        = trim((string)($body['harga']     ?? $lama['harga']));

    // Parsing jam_operasional → jam_buka & jam_tutup (format: "08:00 - 21:00")
    // Kalau tidak dikirim, fallback ke nilai lama
    if (array_key_exists('jam_operasional', $body) && $body['jam_operasional'] !== '') {
        $parts     = explode('-', $body['jam_operasional'], 2);
        $jam_buka  = trim($parts[0] ?? '') ?: null;
        $jam_tutup = trim($parts[1] ?? '') ?: null;
    } else {
        $jam_buka  = $lama['jam_buka'];
        $jam_tutup = $lama['jam_tutup'];
    }

    $no_telepon   = array_key_exists('no_telepon', $body) ? ($body['no_telepon'] ?: null) : $lama['no_telepon'];

    // Foto: kalau dikirim pakai photo_url baru, kalau tidak pertahankan lama
    $photo_url = array_key_exists('photo_url', $body)
        ? (trim($body['photo_url']) ?: null)
        : $lama['photo_url'];

    // Validasi field wajib
    if (empty($nama_kuliner) || empty($deskripsi) || empty($id_kategori) ||
        empty($nama_tempat)  || empty($alamat)    ||
        $latitude === ''     || $longitude === ''  || $harga === '') {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Field wajib tidak boleh kosong"]);
        exit;
    }

    // Validasi id_kategori
    if (!ctype_digit((string)$id_kategori)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "ID kategori tidak valid"]);
        exit;
    }

    $cek_kat = pg_query_params($conn, 'SELECT id_kategori FROM kategori WHERE id_kategori = $1', [$id_kategori]);
    if (!$cek_kat) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memeriksa kategori"]);
        exit;
    }
    if (pg_num_rows($cek_kat) === 0) {
        http_response_code(404);
        echo json_encode(["status" => false, "message" => "Kategori tidak ditemukan"]);
        exit;
    }

    // Validasi harga
    if (!is_numeric($harga) || (float)$harga < 0) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Harga tidak valid"]);
        exit;
    }

    // Validasi koordinat
    if (!is_numeric($latitude) || !is_numeric($longitude)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Latitude dan longitude harus berupa angka"]);
        exit;
    }
    if ((float)$latitude < -90 || (float)$latitude > 90) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Latitude harus antara -90 dan 90"]);
        exit;
    }
    if ((float)$longitude < -180 || (float)$longitude > 180) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Longitude harus antara -180 dan 180"]);
        exit;
    }

    // Validasi photo_url jika diisi
    if ($photo_url !== null && !filter_var($photo_url, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Format URL foto tidak valid"]);
        exit;
    }

    // Update dalam transaksi
    pg_query($conn, 'BEGIN');

    $upd_kuliner = pg_query_params(
        $conn,
        'UPDATE kuliner
         SET nama_kuliner = $1, deskripsi = $2, id_kategori = $3
         WHERE id_kuliner = $4',
        [$nama_kuliner, $deskripsi, $id_kategori, $lama['id_kuliner']]
    );

    if (!$upd_kuliner) {
        pg_query($conn, 'ROLLBACK');
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memperbarui data kuliner"]);
        exit;
    }

    $upd_tempat = pg_query_params(
        $conn,
        'UPDATE tempat_kuliner
         SET nama_tempat = $1, alamat = $2, latitude = $3, longitude = $4,
             harga = $5, jam_buka = $6, jam_tutup = $7, no_telepon = $8, foto = $9
         WHERE id_tempat = $10',
        [
            $nama_tempat, $alamat, $latitude, $longitude,
            $harga, $jam_buka, $jam_tutup, $no_telepon,
            $photo_url, $id
        ]
    );

    if (!$upd_tempat) {
        pg_query($conn, 'ROLLBACK');
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memperbarui data tempat kuliner"]);
        exit;
    }

    pg_query($conn, 'COMMIT');

    http_response_code(200);
    echo json_encode([
        "status"  => true,
        "message" => "Kuliner berhasil diperbarui",
        "data"    => [
            "id_tempat"    => (int)$id,
            "id_kuliner"   => (int)$lama['id_kuliner'],
            "nama_kuliner" => $nama_kuliner,
            "deskripsi"    => $deskripsi,
            "id_kategori"  => (int)$id_kategori,
            "nama_tempat"  => $nama_tempat,
            "alamat"       => $alamat,
            "latitude"     => $latitude,
            "longitude"    => $longitude,
            "harga"        => $harga,
            "jam_buka"     => $jam_buka,
            "jam_tutup"    => $jam_tutup,
            "jam_operasional" => ($jam_buka && $jam_tutup) ? "$jam_buka - $jam_tutup" : null,
            "no_telepon"   => $no_telepon,
            "photo_url"    => $photo_url
        ]
    ]);
    exit;
}

// =============================================================================
// DELETE — Hapus kuliner berdasarkan id_tempat (hard delete)
// Menghapus ulasan & favorit terkait dalam satu transaksi agar konsisten
// =============================================================================
if ($method === 'DELETE') {

    $id = trim($_GET['id'] ?? '');

    if (empty($id) || !ctype_digit($id)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "ID kuliner tidak valid"]);
        exit;
    }

    // Cek kuliner ada
    $cek = pg_query_params(
        $conn,
        "SELECT tk.id_tempat, tk.id_kuliner
         FROM tempat_kuliner tk
         WHERE tk.id_tempat = $1",
        [$id]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memeriksa data kuliner"]);
        exit;
    }

    $data = pg_fetch_assoc($cek);

    if (!$data) {
        http_response_code(404);
        echo json_encode(["status" => false, "message" => "Kuliner tidak ditemukan"]);
        exit;
    }

    $id_kuliner = $data['id_kuliner'];

    // Hapus dalam transaksi: ulasan & favorit dulu, lalu tempat, lalu kuliner
    pg_query($conn, 'BEGIN');

    // Hapus ulasan terkait
    $del_ulasan = pg_query_params($conn, 'DELETE FROM ulasan WHERE id_tempat = $1', [$id]);
    if (!$del_ulasan) {
        pg_query($conn, 'ROLLBACK');
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal menghapus ulasan terkait"]);
        exit;
    }

    // Hapus favorit terkait
    $del_favorit = pg_query_params($conn, 'DELETE FROM favorit WHERE id_tempat = $1', [$id]);
    if (!$del_favorit) {
        pg_query($conn, 'ROLLBACK');
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal menghapus favorit terkait"]);
        exit;
    }

    // Hapus tempat kuliner
    $del_tempat = pg_query_params($conn, 'DELETE FROM tempat_kuliner WHERE id_tempat = $1', [$id]);
    if (!$del_tempat) {
        pg_query($conn, 'ROLLBACK');
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal menghapus tempat kuliner"]);
        exit;
    }

    // Hapus data kuliner jika tidak ada tempat lain yang mereferensikan
    $cek_lain = pg_query_params(
        $conn,
        'SELECT id_tempat FROM tempat_kuliner WHERE id_kuliner = $1 LIMIT 1',
        [$id_kuliner]
    );
    if ($cek_lain && pg_num_rows($cek_lain) === 0) {
        $del_kuliner = pg_query_params($conn, 'DELETE FROM kuliner WHERE id_kuliner = $1', [$id_kuliner]);
        if (!$del_kuliner) {
            pg_query($conn, 'ROLLBACK');
            http_response_code(500);
            echo json_encode(["status" => false, "message" => "Gagal menghapus data kuliner"]);
            exit;
        }
    }

    pg_query($conn, 'COMMIT');

    http_response_code(200);
    echo json_encode(["status" => true, "message" => "Kuliner berhasil dihapus"]);
    exit;
}

// =============================================================================
// Method tidak diizinkan
// =============================================================================
http_response_code(405);
echo json_encode(["status" => false, "message" => "Method tidak diizinkan"]);
