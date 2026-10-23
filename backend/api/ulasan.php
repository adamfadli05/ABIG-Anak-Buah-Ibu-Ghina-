<?php
session_start();
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        "status"  => false,
        "message" => "Method harus GET"
    ]);
    exit;
}

$id_tempat = trim($_GET['id_tempat'] ?? '');
$milik_saya = isset($_GET['milik_saya']) && $_GET['milik_saya'] === '1';

// ============================================================
// Mode 1: Ulasan berdasarkan id_tempat (publik)
// ============================================================
if ($id_tempat !== '') {

    if (!is_numeric($id_tempat)) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "ID tempat kuliner tidak valid"
        ]);
        exit;
    }

    $result = pg_query_params(
        $conn,
        "SELECT
            u.id_ulasan,
            u.id_user,
            u.id_tempat,
            u.rating,
            u.komentar AS review_text,
            u.tanggal  AS created_at,
            us.nama    AS nama_user,
            us.foto_profil,
            k.nama_kuliner,
            tk.nama_tempat,
            tk.foto    AS photo_url
        FROM ulasan u
        JOIN users us ON u.id_user = us.id_user
        JOIN tempat_kuliner tk ON u.id_tempat = tk.id_tempat
        JOIN kuliner k ON tk.id_kuliner = k.id_kuliner
        WHERE u.id_tempat = $1
        ORDER BY u.tanggal DESC",
        [$id_tempat]
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal mengambil data ulasan"
        ]);
        exit;
    }

    $data = [];
    while ($row = pg_fetch_assoc($result)) {
        $data[] = $row;
    }

    if (empty($data)) {
        http_response_code(200);
        echo json_encode([
            "status"  => true,
            "message" => "Belum ada ulasan untuk kuliner ini",
            "data"    => []
        ]);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        "status" => true,
        "data"   => $data
    ]);
    exit;
}

// ============================================================
// Mode 2: Ulasan pribadi (harus login)
// ============================================================
if ($milik_saya) {

    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'user') {
        http_response_code(401);
        echo json_encode([
            "status"  => false,
            "message" => "Anda harus login untuk melihat ulasan pribadi"
        ]);
        exit;
    }

    $id_user = $_SESSION['id_user'];

    $result = pg_query_params(
        $conn,
        "SELECT
            u.id_ulasan,
            u.id_user,
            u.id_tempat,
            u.rating,
            u.komentar AS review_text,
            u.tanggal  AS created_at,
            k.nama_kuliner,
            tk.nama_tempat,
            tk.alamat,
            tk.foto    AS photo_url
        FROM ulasan u
        JOIN tempat_kuliner tk ON u.id_tempat = tk.id_tempat
        JOIN kuliner k ON tk.id_kuliner = k.id_kuliner
        WHERE u.id_user = $1
        ORDER BY u.tanggal DESC",
        [$id_user]
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal mengambil data ulasan"
        ]);
        exit;
    }

    $data = [];
    while ($row = pg_fetch_assoc($result)) {
        $data[] = $row;
    }

    if (empty($data)) {
        http_response_code(200);
        echo json_encode([
            "status"  => true,
            "message" => "Belum ada ulasan yang dibuat",
            "data"    => []
        ]);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        "status" => true,
        "data"   => $data
    ]);
    exit;
}

// Tidak ada parameter yang diberikan
http_response_code(400);
echo json_encode([
    "status"  => false,
    "message" => "Parameter tidak valid. Gunakan ?id_tempat=X atau ?milik_saya=1"
]);
