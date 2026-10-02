<?php

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => false, "message" => "Method harus POST"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$nama             = trim($data['nama'] ?? '');
$email            = strtolower(trim($data['email'] ?? ''));
$password         = $data['password'] ?? '';
$konfirmasi       = $data['konfirmasi_password'] ?? '';

if ($nama === '' || $email === '' || $password === '') {
    echo json_encode(["status" => false, "message" => "Semua kolom wajib diisi"]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => false, "message" => "Format email tidak valid"]);
    exit;
}

if (!preg_match('/@gmail\.com$/i', $email)) {
    echo json_encode(["status" => false, "message" => "Gunakan email yang berakhiran @gmail.com"]);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode(["status" => false, "message" => "Password minimal 8 karakter"]);
    exit;
}

if ($password !== $konfirmasi) {
    echo json_encode(["status" => false, "message" => "Konfirmasi password tidak cocok"]);
    exit;
}

$cek = pg_query_params($conn, 'SELECT id_user FROM users WHERE email = $1', [$email]);

if (!$cek) {
    echo json_encode(["status" => false, "message" => "Terjadi kesalahan saat memeriksa akun"]);
    exit;
}

if (pg_num_rows($cek) > 0) {
    echo json_encode(["status" => false, "message" => "Email sudah terdaftar. Silakan login"]);
    exit;
}

$hash   = password_hash($password, PASSWORD_DEFAULT);
$result = pg_query_params(
    $conn,
    'INSERT INTO users (nama, email, password) VALUES ($1, $2, $3) RETURNING id_user',
    [$nama, $email, $hash]
);

if ($result && pg_num_rows($result) > 0) {
    echo json_encode(["status" => true, "message" => "Registrasi berhasil. Silakan login"]);
} else {
    echo json_encode(["status" => false, "message" => "Registrasi gagal. Silakan coba lagi"]);
}
