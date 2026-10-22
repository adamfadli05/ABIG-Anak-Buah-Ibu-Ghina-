<?php
session_start();
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Validasi autentikasi — harus sudah login sebagai user
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'user') {
    http_response_code(401);
    echo json_encode([
        "status"  => false,
        "message" => "Anda harus login untuk menggunakan fitur ini"
    ]);
    exit;
}

$id_user = $_SESSION['id_user'];

// ============================================================
// GET — Ambil semua favorit milik user yang sedang login
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = pg_query_params(
        $conn,
        "SELECT
            f.id_favorit,
            f.id_tempat,
            f.status_kunjungan,
            f.tanggal,
            k.nama_kuliner,
            k.foto AS foto_kuliner,
            tk.nama_tempat,
            tk.alamat,
            tk.harga,
            tk.jam_buka,
            tk.jam_tutup,
            tk.foto AS foto_tempat,
            COALESCE(AVG(u.rating), 0) AS rata_rata_rating,
            COUNT(u.id_ulasan) AS jumlah_ulasan
        FROM favorit f
        JOIN tempat_kuliner tk ON f.id_tempat = tk.id_tempat
        JOIN kuliner k ON tk.id_kuliner = k.id_kuliner
        LEFT JOIN ulasan u ON tk.id_tempat = u.id_tempat
        WHERE f.id_user = $1
        GROUP BY
            f.id_favorit,
            f.id_tempat,
            f.status_kunjungan,
            f.tanggal,
            k.nama_kuliner,
            k.foto,
            tk.nama_tempat,
            tk.alamat,
            tk.harga,
            tk.jam_buka,
            tk.jam_tutup,
            tk.foto
        ORDER BY f.tanggal DESC",
        [$id_user]
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal mengambil data favorit"
        ]);
        exit;
    }

    $data = [];
    while ($row = pg_fetch_assoc($result)) {
        $data[] = $row;
    }

    if (empty($data)) {
        http_response_code(200);
        echo json_encode([
            "status"  => true,
            "message" => "Belum ada kuliner yang disimpan",
            "data"    => []
        ]);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        "status" => true,
        "data"   => $data
    ]);
    exit;
}

// ============================================================
// POST — Simpan kuliner ke favorit
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body     = json_decode(file_get_contents("php://input"), true);
    $id_tempat = intval($body['id_tempat'] ?? 0);

    // Validasi id_tempat
    if ($id_tempat <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "ID tempat kuliner tidak valid"
        ]);
        exit;
    }

    // Cek apakah tempat kuliner ada
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

    // Cek apakah sudah difavoritkan sebelumnya
    $cek = pg_query_params(
        $conn,
        'SELECT id_favorit FROM favorit WHERE id_user = $1 AND id_tempat = $2',
        [$id_user, $id_tempat]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal memeriksa data favorit"
        ]);
        exit;
    }

    if (pg_num_rows($cek) > 0) {
        http_response_code(409);
        echo json_encode([
            "status"  => false,
            "message" => "Kuliner sudah ada di daftar favorit"
        ]);
        exit;
    }

    // Simpan ke favorit
    $result = pg_query_params(
        $conn,
        'INSERT INTO favorit (id_user, id_tempat, status_kunjungan, tanggal)
         VALUES ($1, $2, false, NOW())
         RETURNING id_favorit',
        [$id_user, $id_tempat]
    );

    if (!$result || pg_num_rows($result) === 0) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal menyimpan favorit"
        ]);
        exit;
    }

    $row = pg_fetch_assoc($result);

    http_response_code(201);
    echo json_encode([
        "status"     => true,
        "message"    => "Kuliner berhasil disimpan ke favorit",
        "id_favorit" => $row['id_favorit']
    ]);
    exit;
}

// ============================================================
// DELETE — Hapus kuliner dari favorit
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $body      = json_decode(file_get_contents("php://input"), true);
    $id_tempat = intval($body['id_tempat'] ?? 0);

    if ($id_tempat <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "ID tempat kuliner tidak valid"
        ]);
        exit;
    }

    // Cek apakah favorit ada
    $cek = pg_query_params(
        $conn,
        'SELECT id_favorit FROM favorit WHERE id_user = $1 AND id_tempat = $2',
        [$id_user, $id_tempat]
    );

    if (!$cek || pg_num_rows($cek) === 0) {
        http_response_code(404);
        echo json_encode([
            "status"  => false,
            "message" => "Kuliner tidak ada di daftar favorit"
        ]);
        exit;
    }

    $result = pg_query_params(
        $conn,
        'DELETE FROM favorit WHERE id_user = $1 AND id_tempat = $2',
        [$id_user, $id_tempat]
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal menghapus favorit"
        ]);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        "status"  => true,
        "message" => "Kuliner berhasil dihapus dari favorit"
    ]);
    exit;
}

// Method tidak diizinkan
http_response_code(405);
echo json_encode([
    "status"  => false,
    "message" => "Method tidak diizinkan"
]);
