<?php

$host = "localhost";
$port = "5432";
$dbname = "mangan_yukkk";
$user = "postgres";
$password = "abigselaludidepan";

$conn = pg_connect(
    "host=$host port=$port dbname=$dbname user=$user password=$password"
);

if (!$conn) {
    die("Koneksi database gagal.");
}