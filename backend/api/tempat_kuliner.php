<?php
require_once __DIR__ . '/../config/database.php';
header('Content-Type: application/json');

$sql = "SELECT
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
    tk.harga
FROM tempat_kuliner tk
JOIN kuliner k
    ON tk.id_kuliner = k.id_kuliner
ORDER BY tk.id_tempat ASC";

$result = pg_query($conn, $sql);

$data = [];
while ($row = pg_fetch_assoc($result)) {
    $data[] = $row;
}

echo json_encode([
    "status" => true,
    "data" => $data
]);
