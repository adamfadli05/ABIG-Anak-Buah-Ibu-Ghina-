<?php
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ambil parameter id dari URL (?id=1)
$id = trim($_GET['id'] ?? '');

// Validasi parameter kosong atau bukan angka
if ($id === '' || !is_numeric($id)) {
    echo json_encode([
        "status" => false,
        "message" => "ID kuliner tidak valid"
    ]);
    exit;
}

// Ambil detail kuliner berdasarkan id_tempat
$result = pg_query_params(
    $conn,
    "SELECT
        tk.id_tempat,
        tk.id_kuliner,
        k.nama_kuliner,
        k.deskripsi,
        k.foto AS foto_kuliner,
        tk.nama_tempat,
        tk.alamat,
        tk.latitude,
        tk.longitude,
        tk.jam_buka,
        tk.jam_tutup,
        tk.foto_tempat,
        tk.foto,
        tk.harga,
        ka.nama_kategori,
        COALESCE(AVG(u.rating), 0) AS rata_rata_rating,
        COUNT(u.id_ulasan) AS jumlah_ulasan
    FROM tempat_kuliner tk
    JOIN kuliner k ON tk.id_kuliner = k.id_kuliner
    JOIN kategori ka ON k.id_kategori = ka.id_kategori
    LEFT JOIN ulasan u ON tk.id_tempat = u.id_tempat
    WHERE tk.id_tempat = $1
    GROUP BY
        tk.id_tempat,
        tk.id_kuliner,
        k.nama_kuliner,
        k.deskripsi,
        k.foto,
        tk.nama_tempat,
        tk.alamat,
        tk.latitude,
        tk.longitude,
        tk.jam_buka,
        tk.jam_tutup,
        tk.foto_tempat,
        tk.foto,
        tk.harga,
        ka.nama_kategori",
    [$id]
);

// Scenario: Pengambilan detail kuliner gagal
if (!$result) {
    echo json_encode([
        "status" => false,
        "message" => "Detail kuliner gagal dimuat"
    ]);
    exit;
}

$data = pg_fetch_assoc($result);

// Scenario: Detail kuliner tidak ditemukan
if (!$data) {
    echo json_encode([
        "status" => false,
        "message" => "Detail kuliner tidak ditemukan"
    ]);
    exit;
}

// Ambil daftar ulasan untuk kuliner ini
$ulasan_result = pg_query_params(
    $conn,
    "SELECT
        u.id_ulasan,
        u.rating,
        u.komentar,
        u.tanggal,
        us.nama AS nama_user,
        us.foto_profil
    FROM ulasan u
    JOIN users us ON u.id_user = us.id_user
    WHERE u.id_tempat = $1
    ORDER BY u.tanggal DESC",
    [$id]
);

$ulasan = [];
if ($ulasan_result) {
    while ($row = pg_fetch_assoc($ulasan_result)) {
        $ulasan[] = $row;
    }
}

// Scenario: Data detail kuliner berhasil diambil
echo json_encode([
    "status" => true,
    "data" => $data,
    "ulasan" => $ulasan
]);
