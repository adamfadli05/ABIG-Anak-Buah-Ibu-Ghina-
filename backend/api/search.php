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

// Ambil kata kunci dari URL (?q=empal)
$q = trim($_GET['q'] ?? '');

// Validasi kata kunci kosong
if ($q === '') {
    echo json_encode([
        "status" => false,
        "message" => "Kata kunci pencarian tidak boleh kosong"
    ]);
    exit;
}

// Cari berdasarkan nama kuliner, nama tempat, atau alamat
$result = pg_query_params(
    $conn,
    "SELECT
        tk.id_tempat,
        tk.id_kuliner,
        k.nama_kuliner,
        tk.nama_tempat,
        tk.alamat,
        tk.latitude,
        tk.longitude,
        tk.jam_buka,
        tk.jam_tutup,
        tk.foto_tempat,
        tk.harga,
        ka.nama_kategori
    FROM tempat_kuliner tk
    JOIN kuliner k ON tk.id_kuliner = k.id_kuliner
    JOIN kategori ka ON k.id_kategori = ka.id_kategori
    WHERE
        LOWER(k.nama_kuliner) LIKE LOWER($1) OR
        LOWER(tk.nama_tempat) LIKE LOWER($1) OR
        LOWER(tk.alamat)      LIKE LOWER($1)
    ORDER BY tk.id_tempat ASC",
    ['%' . $q . '%']
);

if (!$result) {
    echo json_encode([
        "status" => false,
        "message" => "Gagal melakukan pencarian"
    ]);
    exit;
}

$data = [];
while ($row = pg_fetch_assoc($result)) {
    $data[] = $row;
}

// Validasi jika data tidak ditemukan
if (empty($data)) {
    echo json_encode([
        "status" => true,
        "message" => "Tidak ada kuliner yang cocok dengan pencarian",
        "data" => []
    ]);
    exit;
}

echo json_encode([
    "status" => true,
    "data" => $data
]);
