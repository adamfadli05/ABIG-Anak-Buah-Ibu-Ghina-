<?php
session_start();
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Validasi autentikasi
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'user') {
    http_response_code(401);
    echo json_encode([
        "status"  => false,
        "message" => "Anda harus login untuk mengakses profil"
    ]);
    exit;
}

$id_user = $_SESSION['id_user'];

// ============================================================
// GET — Ambil data profil pengguna
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $result = pg_query_params(
        $conn,
        'SELECT id_user, nama, email, foto_profil FROM users WHERE id_user = $1',
        [$id_user]
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal mengambil data profil"
        ]);
        exit;
    }

    $data = pg_fetch_assoc($result);

    if (!$data) {
        http_response_code(404);
        echo json_encode([
            "status"  => false,
            "message" => "Profil tidak ditemukan"
        ]);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        "status" => true,
        "data"   => [
            "id_user"    => $data['id_user'],
            "nama"       => $data['nama'],
            "email"      => $data['email'],
            "foto_profil"=> $data['foto_profil']
        ]
    ]);
    exit;
}

// ============================================================
// PUT — Perbarui nama dan/atau foto profil
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {

    $body      = json_decode(file_get_contents("php://input"), true);
    $nama      = isset($body['nama'])       ? trim($body['nama'])       : null;
    $foto_profil = isset($body['foto_profil']) ? trim($body['foto_profil']) : null;

    // Validasi minimal satu field diisi
    if (($nama === null || $nama === '') && $foto_profil === null) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "Tidak ada data yang diubah"
        ]);
        exit;
    }

    // Validasi nama jika diisi
    if ($nama !== null && $nama !== '') {
        if (mb_strlen($nama) < 2) {
            http_response_code(400);
            echo json_encode([
                "status"  => false,
                "message" => "Nama minimal 2 karakter"
            ]);
            exit;
        }
        if (mb_strlen($nama) > 100) {
            http_response_code(400);
            echo json_encode([
                "status"  => false,
                "message" => "Nama maksimal 100 karakter"
            ]);
            exit;
        }
    }

    // Validasi foto_profil jika diisi — harus URL valid
    if ($foto_profil !== null && $foto_profil !== '') {
        if (!filter_var($foto_profil, FILTER_VALIDATE_URL)) {
            http_response_code(400);
            echo json_encode([
                "status"  => false,
                "message" => "Format URL foto profil tidak valid"
            ]);
            exit;
        }
    }

    // Ambil data lama sebagai fallback
    $cek = pg_query_params(
        $conn,
        'SELECT nama, foto_profil FROM users WHERE id_user = $1',
        [$id_user]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal memeriksa data profil"
        ]);
        exit;
    }

    $data_lama   = pg_fetch_assoc($cek);
    $nama_baru   = ($nama !== null && $nama !== '') ? $nama : $data_lama['nama'];
    $foto_baru   = ($foto_profil !== null) ? ($foto_profil !== '' ? $foto_profil : null) : $data_lama['foto_profil'];

    // Update profil — email tidak bisa diubah lewat endpoint ini
    $result = pg_query_params(
        $conn,
        'UPDATE users SET nama = $1, foto_profil = $2 WHERE id_user = $3 RETURNING id_user, nama, email, foto_profil',
        [$nama_baru, $foto_baru, $id_user]
    );

    if (!$result || pg_num_rows($result) === 0) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal memperbarui profil"
        ]);
        exit;
    }

    $data = pg_fetch_assoc($result);

    // Update session nama dan foto_profil
    $_SESSION['nama']       = $data['nama'];
    $_SESSION['foto_profil'] = $data['foto_profil'];

    http_response_code(200);
    echo json_encode([
        "status"  => true,
        "message" => "Profil berhasil diperbarui",
        "data"    => [
            "id_user"     => $data['id_user'],
            "nama"        => $data['nama'],
            "email"       => $data['email'],
            "foto_profil" => $data['foto_profil']
        ]
    ]);
    exit;
}

// ============================================================
// POST — Ubah kata sandi pengguna
// Task 28.3: Validasi password lama, password baru min 8 karakter.
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $body             = json_decode(file_get_contents("php://input"), true);
    $password_lama    = $body['password_lama']    ?? '';
    $password_baru    = $body['password_baru']    ?? '';
    $konfirmasi_baru  = $body['konfirmasi_baru']  ?? '';

    // Validasi field kosong
    if (empty($password_lama) || empty($password_baru) || empty($konfirmasi_baru)) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "Semua field kata sandi wajib diisi"
        ]);
        exit;
    }

    // Validasi password baru minimal 8 karakter
    if (strlen($password_baru) < 8) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "Kata sandi baru minimal 8 karakter"
        ]);
        exit;
    }

    // Validasi konfirmasi password baru
    if ($password_baru !== $konfirmasi_baru) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "Konfirmasi kata sandi tidak cocok"
        ]);
        exit;
    }

    // Ambil password lama dari database
    $cek = pg_query_params(
        $conn,
        'SELECT password FROM users WHERE id_user = $1',
        [$id_user]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal memeriksa data pengguna"
        ]);
        exit;
    }

    $data = pg_fetch_assoc($cek);

    // Validasi user tidak punya password (akun Google)
    if (empty($data['password'])) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "Akun Google tidak dapat mengubah kata sandi melalui fitur ini"
        ]);
        exit;
    }

    // Validasi password lama
    if (!password_verify($password_lama, $data['password'])) {
        http_response_code(401);
        echo json_encode([
            "status"  => false,
            "message" => "Kata sandi lama tidak sesuai"
        ]);
        exit;
    }

    // Hash password baru dan update
    $hash = password_hash($password_baru, PASSWORD_DEFAULT);
    $result = pg_query_params(
        $conn,
        'UPDATE users SET password = $1 WHERE id_user = $2',
        [$hash, $id_user]
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal mengubah kata sandi"
        ]);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        "status"  => true,
        "message" => "Kata sandi berhasil diubah"
    ]);
    exit;
}

// Method tidak diizinkan
http_response_code(405);
echo json_encode([
    "status"  => false,
    "message" => "Method tidak diizinkan"
]);
