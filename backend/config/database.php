<?php

$host = "aws-0-ap-southeast-2.pooler.supabase.com";
$port = "5432";
$dbname = "postgres";
$user = "postgres.kppeplufcluygonkolou";
$password = "abigselaludidepan";

$conn = pg_connect(
    "host=$host port=$port dbname=$dbname user=$user password=$password sslmode=require"
);

if (!$conn) {
    die("Koneksi database gagal.");
}