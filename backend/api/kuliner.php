<?php
require_once __DIR__ . '/../config/database.php';
header('Content-Type: application/json');

$sql = "SELECT
    k.id_kuliner,
    k.nama_kuliner,
    k.deskripsi,
    k.foto,
    k.id_kategori,
    ka.nama_kategori
FROM kuliner k
JOIN kategori ka
    ON k.id_kategori = ka.id_kategori
ORDER BY k.id_kuliner ASC";

$result = pg_query($conn, $sql);

$data = [];
while ($row = pg_fetch_assoc($result)) {
    $data[] = $row;
}

echo json_encode([
    "status" => true,
    "data" => $data
]);
