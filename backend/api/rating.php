<?php
session_start();
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Validasi autentikasi
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'user') {
    http_response_code(401);
    echo json_encode([
        "status"  => false,
        "message" => "Anda harus login untuk memberikan rating"
    ]);
    exit;
}

$id_user = $_SESSION['id_user'];

// ============================================================
// GET — Ambil rata-rata dan jumlah rating berdasarkan id_tempat
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $id_tempat = trim($_GET['id_tempat'] ?? '');

    if (!is_numeric($id_tempat) || intval($id_tempat) <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "ID tempat kuliner tidak valid"
        ]);
        exit;
    }

    $result = pg_query_params(
        $conn,
        "SELECT
            COALESCE(AVG(rating), 0) AS rata_rata_rating,
            COUNT(id_ulasan)         AS jumlah_rating
        FROM ulasan
        WHERE id_tempat = $1
        AND rating IS NOT NULL",
        [$id_tempat]
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal mengambil data rating"
        ]);
        exit;
    }

    $data = pg_fetch_assoc($result);

    http_response_code(200);
    echo json_encode([
        "status" => true,
        "data"   => [
            "rata_rata_rating" => round(floatval($data['rata_rata_rating']), 1),
            "jumlah_rating"    => intval($data['jumlah_rating'])
        ]
    ]);
    exit;
}

// ============================================================
// POST — Simpan atau perbarui rating kuliner
// Aturan: satu rating per pengguna per kuliner (upsert)
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $body      = json_decode(file_get_contents("php://input"), true);
    $id_tempat = intval($body['id_tempat'] ?? 0);
    $rating    = intval($body['rating']    ?? 0);

    // Validasi id_tempat
    if ($id_tempat <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "ID tempat kuliner tidak valid"
        ]);
        exit;
    }

    // Validasi rating (bilangan bulat 1-5)
    if ($rating < 1 || $rating > 5) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "Rating harus bilangan bulat antara 1 sampai 5"
        ]);
        exit;
    }

    // Validasi keberadaan kuliner
    $cek_tempat = pg_query_params(
        $conn,
        'SELECT id_tempat FROM tempat_kuliner WHERE id_tempat = $1',
        [$id_tempat]
    );

    if (!$cek_tempat || pg_num_rows($cek_tempat) === 0) {
        http_response_code(404);
        echo json_encode([
            "status"  => false,
            "message" => "Tempat kuliner tidak ditemukan"
        ]);
        exit;
    }

    // Cek apakah user sudah pernah rating tempat ini
    $cek = pg_query_params(
        $conn,
        'SELECT id_ulasan, rating FROM ulasan WHERE id_user = $1 AND id_tempat = $2',
        [$id_user, $id_tempat]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal memeriksa data rating"
        ]);
        exit;
    }

    if (pg_num_rows($cek) > 0) {
        // Sudah ada — update rating yang ada
        $existing = pg_fetch_assoc($cek);
        $result = pg_query_params(
            $conn,
            'UPDATE ulasan SET rating = $1 WHERE id_ulasan = $2 AND id_user = $3 RETURNING id_ulasan',
            [$rating, $existing['id_ulasan'], $id_user]
        );

        if (!$result || pg_num_rows($result) === 0) {
            http_response_code(500);
            echo json_encode([
                "status"  => false,
                "message" => "Gagal memperbarui rating"
            ]);
            exit;
        }

        $row = pg_fetch_assoc($result);

        http_response_code(200);
        echo json_encode([
            "status"    => true,
            "message"   => "Rating berhasil diperbarui",
            "id_ulasan" => $row['id_ulasan']
        ]);
        exit;

    } else {
        // Belum ada — simpan rating baru
        $result = pg_query_params(
            $conn,
            'INSERT INTO ulasan (id_user, id_tempat, rating, tanggal)
             VALUES ($1, $2, $3, NOW())
             RETURNING id_ulasan',
            [$id_user, $id_tempat, $rating]
        );

        if (!$result || pg_num_rows($result) === 0) {
            http_response_code(500);
            echo json_encode([
                "status"  => false,
                "message" => "Gagal menyimpan rating"
            ]);
            exit;
        }

        $row = pg_fetch_assoc($result);

        http_response_code(201);
        echo json_encode([
            "status"    => true,
            "message"   => "Rating berhasil disimpan",
            "id_ulasan" => $row['id_ulasan']
        ]);
        exit;
    }
}

// ============================================================
// PUT — Ubah rating kuliner (harus sudah pernah memberi rating)
// Task 25.3: Validasi kepemilikan, perbarui nilai rating dan tanggal (updated_at).
// Memastikan perubahan memperbarui data lama, bukan membuat rating baru.
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {

    $body      = json_decode(file_get_contents("php://input"), true);
    $id_ulasan = intval($body['id_ulasan'] ?? 0);
    $rating    = intval($body['rating']    ?? 0);

    // Validasi id_ulasan
    if ($id_ulasan <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "ID rating tidak valid"
        ]);
        exit;
    }

    // Validasi rating (bilangan bulat 1-5)
    if ($rating < 1 || $rating > 5) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "Rating harus bilangan bulat antara 1 sampai 5"
        ]);
        exit;
    }

    // Cek apakah rating ada dan milik user ini
    $cek = pg_query_params(
        $conn,
        'SELECT id_ulasan, rating FROM ulasan WHERE id_ulasan = $1 AND id_user = $2 AND rating IS NOT NULL',
        [$id_ulasan, $id_user]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal memeriksa data rating"
        ]);
        exit;
    }

    if (pg_num_rows($cek) === 0) {
        http_response_code(404);
        echo json_encode([
            "status"  => false,
            "message" => "Rating tidak ditemukan atau bukan milik Anda"
        ]);
        exit;
    }

    // Update rating dan tanggal (updated_at) — bukan membuat baru
    $result = pg_query_params(
        $conn,
        'UPDATE ulasan SET rating = $1, tanggal = NOW() WHERE id_ulasan = $2 AND id_user = $3 RETURNING id_ulasan, rating, tanggal',
        [$rating, $id_ulasan, $id_user]
    );

    if (!$result || pg_num_rows($result) === 0) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal mengubah rating"
        ]);
        exit;
    }

    $row = pg_fetch_assoc($result);

    // Ambil rata-rata dan jumlah rating terbaru
    $stat = pg_query_params(
        $conn,
        "SELECT COALESCE(AVG(rating), 0) AS rata_rata_rating, COUNT(id_ulasan) AS jumlah_rating
         FROM ulasan WHERE id_tempat = (SELECT id_tempat FROM ulasan WHERE id_ulasan = $1) AND rating IS NOT NULL",
        [$id_ulasan]
    );

    $stat_data = $stat ? pg_fetch_assoc($stat) : null;

    http_response_code(200);
    echo json_encode([
        "status"     => true,
        "message"    => "Rating berhasil diubah",
        "id_ulasan"  => $row['id_ulasan'],
        "rating"     => intval($row['rating']),
        "updated_at" => $row['tanggal'],
        "statistik"  => $stat_data ? [
            "rata_rata_rating" => round(floatval($stat_data['rata_rata_rating']), 1),
            "jumlah_rating"    => intval($stat_data['jumlah_rating'])
        ] : null
    ]);
    exit;
}

// ============================================================
// DELETE — Hapus rating kuliner milik sendiri
// Task 27.3: Validasi kepemilikan, hapus rating, return statistik terbaru.
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {

    $body      = json_decode(file_get_contents("php://input"), true);
    $id_ulasan = intval($body['id_ulasan'] ?? 0);

    // Validasi id_ulasan
    if ($id_ulasan <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "ID rating tidak valid"
        ]);
        exit;
    }

    // Cek apakah rating ada dan milik user ini
    $cek = pg_query_params(
        $conn,
        'SELECT id_ulasan, id_tempat FROM ulasan WHERE id_ulasan = $1 AND id_user = $2 AND rating IS NOT NULL',
        [$id_ulasan, $id_user]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal memeriksa data rating"
        ]);
        exit;
    }

    if (pg_num_rows($cek) === 0) {
        http_response_code(404);
        echo json_encode([
            "status"  => false,
            "message" => "Rating tidak ditemukan atau bukan milik Anda"
        ]);
        exit;
    }

    $ulasan = pg_fetch_assoc($cek);
    $id_tempat = $ulasan['id_tempat'];

    // Cek apakah ulasan ini hanya punya rating (tidak ada komentar)
    $cek_komentar = pg_query_params(
        $conn,
        'SELECT komentar FROM ulasan WHERE id_ulasan = $1',
        [$id_ulasan]
    );
    $row_komentar = pg_fetch_assoc($cek_komentar);

    if (empty($row_komentar['komentar'])) {
        // Tidak ada komentar → hapus seluruh baris
        $result = pg_query_params(
            $conn,
            'DELETE FROM ulasan WHERE id_ulasan = $1 AND id_user = $2',
            [$id_ulasan, $id_user]
        );
    } else {
        // Ada komentar → set rating jadi NULL saja, baris tetap ada
        $result = pg_query_params(
            $conn,
            'UPDATE ulasan SET rating = NULL WHERE id_ulasan = $1 AND id_user = $2',
            [$id_ulasan, $id_user]
        );
    }

    if (!$result) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal menghapus rating"
        ]);
        exit;
    }

    // Ambil rata-rata dan jumlah rating terbaru setelah penghapusan
    $stat = pg_query_params(
        $conn,
        "SELECT COALESCE(AVG(rating), 0) AS rata_rata_rating, COUNT(id_ulasan) AS jumlah_rating
         FROM ulasan WHERE id_tempat = $1 AND rating IS NOT NULL",
        [$id_tempat]
    );

    $stat_data = $stat ? pg_fetch_assoc($stat) : null;

    http_response_code(200);
    echo json_encode([
        "status"    => true,
        "message"   => "Rating berhasil dihapus",
        "statistik" => $stat_data ? [
            "rata_rata_rating" => round(floatval($stat_data['rata_rata_rating']), 1),
            "jumlah_rating"    => intval($stat_data['jumlah_rating'])
        ] : null
    ]);
    exit;
}

// Method tidak diizinkan
http_response_code(405);
echo json_encode([
    "status"  => false,
    "message" => "Method tidak diizinkan"
]);
