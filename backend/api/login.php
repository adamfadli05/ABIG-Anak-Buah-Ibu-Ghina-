<?php

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

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
        "message" => "Email dan password wajib diisi"
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

/*
|--------------------------------------------------------------------------
| Cek Admin
|--------------------------------------------------------------------------
*/

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

    echo json_encode([
        "status" => true,
        "message" => "Login admin berhasil",
        "role" => "admin",
        "data" => [
            "id_admin" => $admin['id_admin'],
            "nama" => $admin['nama'],
            "email" => $admin['email']
        ]
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Cek User
|--------------------------------------------------------------------------
*/

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
        "message" => "Email atau password salah"
    ]);
    exit;
}

if (empty($user['password']) || !password_verify($password, $user['password'])) {
    echo json_encode([
        "status" => false,
        "message" => "Email atau password salah"
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| Login Berhasil
|--------------------------------------------------------------------------
*/

echo json_encode([
    "status" => true,
    "message" => "Login berhasil",
    "role" => "user",
    "data" => [
        "id_user" => $user['id_user'],
        "nama" => $user['nama'],
        "email" => $user['email'],
        "foto_profil" => $user['foto_profil']
    ]
]);