<?php

session_start();

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
    echo json_encode([
        "status" => false,
        "message" => "Method harus POST"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$email = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode([
        "status" => false,
        "message" => "Email dan kata sandi wajib diisi"
    ]);
    exit;
}

if (!preg_match('/@gmail\.com$/i', $email)) {
    echo json_encode([
        "status" => false,
        "message" => "Gunakan email Gmail"
    ]);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode([
        "status" => false,
        "message" => "Password minimal 8 karakter"
    ]);
    exit;
}

// Cek Admin

$result = pg_query_params(
    $conn,
    'SELECT * FROM admin WHERE email = $1',
    [$email]
);

if (!$result) {
    echo json_encode([
        "status" => false,
        "message" => "Gagal memeriksa akun admin"
    ]);
    exit;
}

$admin = pg_fetch_assoc($result);

if ($admin && password_verify($password, $admin['password'])) {

    session_regenerate_id(true);
    $_SESSION['role']     = 'admin';
    $_SESSION['id_admin'] = $admin['id_admin'];
    $_SESSION['nama']     = $admin['nama'];
    $_SESSION['email']    = $admin['email'];

    echo json_encode([
        "status" => true,
        "message" => "Admin berhasil masuk.",
        "role" => "admin",
        "data" => [
            "id_admin" => $admin['id_admin'],
            "nama" => $admin['nama'],
            "email" => $admin['email']
        ]
    ]);

    exit;
}

// Cek User

$result = pg_query_params(
    $conn,
    'SELECT * FROM users WHERE email = $1',
    [$email]
);

if (!$result) {
    echo json_encode([
        "status" => false,
        "message" => "Gagal memeriksa akun user"
    ]);
    exit;
}

$user = pg_fetch_assoc($result);

if (!$user) {
    echo json_encode([
        "status" => false,
        "message" => "Email atau kata sandi salah"
    ]);
    exit;
}

if (empty($user['password']) || !password_verify($password, $user['password'])) {
    echo json_encode([
        "status" => false,
        "message" => "Email atau kata sandi salah"
    ]);
    exit;
}

// Login Berhasil

session_regenerate_id(true);
$_SESSION['role']       = 'user';
$_SESSION['id_user']    = $user['id_user'];
$_SESSION['nama']       = $user['nama'];
$_SESSION['email']      = $user['email'];
$_SESSION['foto_profil'] = $user['foto_profil'] ?? null;

echo json_encode([
    "status" => true,
    "message" => "Berhasil masuk.",
    "role" => "user",
    "data" => [
        "id_user" => $user['id_user'],
        "nama" => $user['nama'],
        "email" => $user['email'],
        "foto_profil" => $user['foto_profil']
    ]
]);