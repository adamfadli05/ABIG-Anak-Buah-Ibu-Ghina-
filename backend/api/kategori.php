<?php
require_once __DIR__ . '/../config/database.php';
header('Content-Type: application/json');

$sql = "SELECT * FROM kategori ORDER BY id_kategori ASC";
$result = pg_query($conn, $sql);

$data = [];
while ($row = pg_fetch_assoc($result)) {
    $data[] = $row;
}

echo json_encode([
    "status" => true,
    "data" => $data
]);
