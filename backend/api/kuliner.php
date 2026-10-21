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
