<?php
require_once __DIR__ . '/../config/database.php';
header('Content-Type: application/json');

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
    tk.no_telepon,
    tk.foto_tempat,
    tk.foto AS foto,
    tk.harga
FROM tempat_kuliner tk
JOIN kuliner k
    ON tk.id_kuliner = k.id_kuliner
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
