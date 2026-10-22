<?php

require_once __DIR__ . '/../env.php';

$host     = getenv('DB_HOST')     ?: 'aws-0-ap-southeast-2.pooler.supabase.com';
$port     = getenv('DB_PORT')     ?: '5432';
$dbname   = getenv('DB_NAME')     ?: 'postgres';
$user     = getenv('DB_USER')     ?: 'postgres.kppeplufcluygonkolou';
$password = getenv('DB_PASSWORD') ?: 'abigselaludidepan';

$conn = pg_connect(
    "host=$host port=$port dbname=$dbname user=$user password=$password sslmode=require"
);

if (!$conn) {
    die("Koneksi database gagal.");
}
