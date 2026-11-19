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

$sql = "SELECT
    tk.id_tempat,
    tk.id_kuliner,
    k.nama_kuliner,
    k.deskripsi,
    k.foto AS foto_kuliner,
    k.id_kategori,
    ka.nama_kategori,
    tk.nama_tempat,
    tk.alamat,
    tk.latitude,
    tk.longitude,
    tk.jam_buka,
    tk.jam_tutup,
    tk.no_telepon,
    tk.foto_tempat,
    tk.foto AS foto,
    tk.harga,
    COALESCE(ROUND(AVG(u.rating)::numeric, 1), 0) AS rata_rata_rating,
    COUNT(u.id_ulasan) AS jumlah_ulasan
FROM tempat_kuliner tk
JOIN kuliner k  ON tk.id_kuliner  = k.id_kuliner
JOIN kategori ka ON k.id_kategori = ka.id_kategori
LEFT JOIN ulasan u ON tk.id_tempat = u.id_tempat
GROUP BY
    tk.id_tempat,
    tk.id_kuliner,
    k.nama_kuliner,
    k.deskripsi,
    k.foto,
    k.id_kategori,
    ka.nama_kategori,
    tk.nama_tempat,
    tk.alamat,
    tk.latitude,
    tk.longitude,
    tk.jam_buka,
    tk.jam_tutup,
    tk.no_telepon,
    tk.foto_tempat,
    tk.foto,
    tk.harga
ORDER BY tk.id_tempat ASC";

$result = pg_query($conn, $sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data kuliner"]);
    exit;
}

$data = [];
while ($row = pg_fetch_assoc($result)) {
    if (empty($row['latitude']) || empty($row['longitude'])) {
        continue;
    }
    $data[] = $row;
}

http_response_code(200);
echo json_encode(["status" => true, "data" => $data]);
