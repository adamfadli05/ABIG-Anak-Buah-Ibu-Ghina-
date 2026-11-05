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

$sql = "SELECT * FROM kategori ORDER BY id_kategori ASC";
$result = pg_query($conn, $sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data kategori"]);
    exit;
}

$data = [];
while ($row = pg_fetch_assoc($result)) {
    $data[] = $row;
}

http_response_code(200);
echo json_encode(["status" => true, "data" => $data]);
