<?php
require_once __DIR__ . '/../../env.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/middleware.php';

header('Content-Type: application/json');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => false, "message" => "Method harus GET"]);
    exit;
}

$id = trim($_GET['id'] ?? '');
$q  = trim($_GET['q']  ?? '');

// =============================================================================
// GET Detail — berdasarkan id_user
// =============================================================================
if ($id !== '') {

    if (!ctype_digit($id)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "ID pengguna tidak valid"]);
        exit;
    }

    $result = pg_query_params(
        $conn,
        "SELECT
            id_user,
            nama,
            email,
            foto_profil,
            CASE WHEN google_id IS NOT NULL AND google_id != '' THEN true ELSE false END AS is_google
        FROM users
        WHERE id_user = $1",
        [$id]
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal mengambil data pengguna"]);
        exit;
    }

    $data = pg_fetch_assoc($result);

    if (!$data) {
        http_response_code(404);
        echo json_encode(["status" => false, "message" => "Pengguna tidak ditemukan"]);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        "status" => true,
        "data"   => [
            "id_user"    => (int)$data['id_user'],
            "nama"       => $data['nama'],
            "email"      => $data['email'],
            "foto_profil"=> $data['foto_profil'],
            "is_google"  => $data['is_google'] === 't'
        ]
    ]);
    exit;
}

// =============================================================================
// GET Daftar — semua user, dengan pencarian opsional by nama atau email
// =============================================================================
if ($q !== '') {
    $result = pg_query_params(
        $conn,
        "SELECT
            id_user,
            nama,
            email,
            foto_profil,
            CASE WHEN google_id IS NOT NULL AND google_id != '' THEN true ELSE false END AS is_google
        FROM users
        WHERE LOWER(nama) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1)
        ORDER BY id_user ASC",
        ['%' . $q . '%']
    );
} else {
    $result = pg_query(
        $conn,
        "SELECT
            id_user,
            nama,
            email,
            foto_profil,
            CASE WHEN google_id IS NOT NULL AND google_id != '' THEN true ELSE false END AS is_google
        FROM users
        ORDER BY id_user ASC"
    );
}

if (!$result) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data pengguna"]);
    exit;
}

$data = [];
while ($row = pg_fetch_assoc($result)) {
    $data[] = [
        "id_user"     => (int)$row['id_user'],
        "nama"        => $row['nama'],
        "email"       => $row['email'],
        "foto_profil" => $row['foto_profil'],
        "is_google"   => $row['is_google'] === 't'
    ];
}

if (empty($data)) {
    http_response_code(200);
    echo json_encode([
        "status"  => true,
        "message" => $q !== '' ? "Tidak ada pengguna yang cocok dengan pencarian" : "Belum ada pengguna",
        "data"    => []
    ]);
    exit;
}

http_response_code(200);
echo json_encode(["status" => true, "data" => $data]);
