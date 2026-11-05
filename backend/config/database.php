<?php

require_once __DIR__ . '/../env.php';

$host     = getenv('DB_HOST');
$port     = getenv('DB_PORT');
$dbname   = getenv('DB_NAME');
$user     = getenv('DB_USER');
$password = getenv('DB_PASSWORD');

if (!$host || !$user || !$password || !$dbname) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["status" => false, "message" => "Konfigurasi database tidak lengkap."]);
    exit;
}

$port = $port ?: '5432';

$conn = pg_connect(
    "host=$host port=$port dbname=$dbname user=$user password=$password sslmode=require"
);

if (!$conn) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["status" => false, "message" => "Koneksi database gagal."]);
    exit;
}
