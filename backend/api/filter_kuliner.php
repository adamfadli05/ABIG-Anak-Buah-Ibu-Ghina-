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

// Ambil parameter kategori dari URL (?kategori=makanan berat)
$kategori = trim($_GET['kategori'] ?? '');

// Validasi parameter kosong
if ($kategori === '') {
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "Pilih kategori terlebih dahulu"]);
    exit;
}

// Query kuliner berdasarkan nama kategori
$result = pg_query_params(
    $conn,
    "SELECT
        k.id_kuliner,
        k.nama_kuliner,
        k.deskripsi,
        k.foto,
        k.id_kategori,
        ka.nama_kategori
    FROM kuliner k
    JOIN kategori ka ON k.id_kategori = ka.id_kategori
    WHERE LOWER(ka.nama_kategori) = LOWER($1)
    ORDER BY k.id_kuliner ASC",
    [$kategori]
);

if (!$result) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data kuliner"]);
    exit;
}

$data = [];
while ($row = pg_fetch_assoc($result)) {
    $data[] = $row;
}

http_response_code(200);
echo json_encode(["status" => true, "data" => $data]);
