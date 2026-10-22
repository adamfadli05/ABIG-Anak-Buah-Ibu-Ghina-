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

// Ambil data kuliner diurutkan berdasarkan rating rata-rata tertinggi
// lalu jumlah ulasan terbanyak sebagai prioritas kedua
$sql = "SELECT
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
    ka.nama_kategori
ORDER BY
    rata_rata_rating DESC,
    jumlah_ulasan DESC
LIMIT 10";

$result = pg_query($conn, $sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data rekomendasi"]);
    exit;
}

$data = [];
while ($row = pg_fetch_assoc($result)) {
    if (empty($row['latitude']) || empty($row['longitude'])) {
        continue;
    }
    $data[] = $row;
}

if (empty($data)) {
    http_response_code(200);
    echo json_encode(["status" => true, "message" => "Belum ada data rekomendasi", "data" => []]);
    exit;
}

http_response_code(200);
echo json_encode(["status" => true, "data" => $data]);
