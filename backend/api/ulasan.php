<?php
session_start();
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================================
// GET — Ambil daftar ulasan
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $id_tempat  = trim($_GET['id_tempat'] ?? '');
    $milik_saya = isset($_GET['milik_saya']) && $_GET['milik_saya'] === '1';

    // Mode 1: Ulasan berdasarkan id_tempat (publik)
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
                u.komentar  AS review_text,
                u.foto_url,
                u.tanggal   AS created_at,
                us.nama     AS nama_user,
                us.foto_profil,
                k.nama_kuliner,
                tk.nama_tempat,
                tk.foto     AS photo_url
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

    // Mode 2: Ulasan pribadi (harus login)
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
                u.komentar  AS review_text,
                u.foto_url,
                u.tanggal   AS created_at,
                k.nama_kuliner,
                tk.nama_tempat,
                tk.alamat,
                tk.foto     AS photo_url
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

    // Tidak ada parameter
    http_response_code(400);
    echo json_encode([
        "status"  => false,
        "message" => "Parameter tidak valid. Gunakan ?id_tempat=X atau ?milik_saya=1"
    ]);
    exit;
}

// ============================================================
// POST — Tambah ulasan baru
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Validasi autentikasi
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'user') {
        http_response_code(401);
        echo json_encode([
            "status"  => false,
            "message" => "Anda harus login untuk memberikan ulasan"
        ]);
        exit;
    }

    $id_user   = $_SESSION['id_user'];
    $data      = json_decode(file_get_contents("php://input"), true);
    $id_tempat = intval($data['id_tempat'] ?? 0);
    $rating    = isset($data['rating'])   ? intval($data['rating'])  : null;
    $komentar  = isset($data['komentar']) ? trim($data['komentar'])  : null;
    $foto_url  = isset($data['foto_url']) ? trim($data['foto_url'])  : null;

    // Validasi id_tempat
    if ($id_tempat <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "ID tempat kuliner tidak valid"
        ]);
        exit;
    }

    // Minimal salah satu harus diisi
    if ($rating === null && ($komentar === null || $komentar === '')) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "Rating atau komentar harus diisi"
        ]);
        exit;
    }

    // Validasi rating jika diisi
    if ($rating !== null && ($rating < 1 || $rating > 5)) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "Rating harus antara 1 sampai 5"
        ]);
        exit;
    }

    // Validasi komentar jika diisi (min 5, max 100 karakter)
    if ($komentar !== null && $komentar !== '') {
        $panjang = mb_strlen($komentar);
        if ($panjang < 5) {
            http_response_code(400);
            echo json_encode([
                "status"  => false,
                "message" => "Komentar minimal 5 karakter"
            ]);
            exit;
        }
        if ($panjang > 100) {
            http_response_code(400);
            echo json_encode([
                "status"  => false,
                "message" => "Komentar maksimal 100 karakter"
            ]);
            exit;
        }
    }

    // Validasi foto jika diisi — hanya 1, harus URL valid
    if ($foto_url !== null && $foto_url !== '') {
        if (!filter_var($foto_url, FILTER_VALIDATE_URL)) {
            http_response_code(400);
            echo json_encode([
                "status"  => false,
                "message" => "Format URL foto tidak valid"
            ]);
            exit;
        }
    }

    // Cek apakah tempat kuliner ada
    $cek_tempat = pg_query_params(
        $conn,
        'SELECT id_tempat FROM tempat_kuliner WHERE id_tempat = $1',
        [$id_tempat]
    );

    if (!$cek_tempat || pg_num_rows($cek_tempat) === 0) {
        http_response_code(404);
        echo json_encode([
            "status"  => false,
            "message" => "Tempat kuliner tidak ditemukan"
        ]);
        exit;
    }

    // Cek apakah user sudah pernah ulasan tempat ini
    $cek_ulasan = pg_query_params(
        $conn,
        'SELECT id_ulasan FROM ulasan WHERE id_user = $1 AND id_tempat = $2',
        [$id_user, $id_tempat]
    );

    if (!$cek_ulasan) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal memeriksa data ulasan"
        ]);
        exit;
    }

    if (pg_num_rows($cek_ulasan) > 0) {
        http_response_code(409);
        echo json_encode([
            "status"  => false,
            "message" => "Anda sudah memberikan ulasan untuk kuliner ini"
        ]);
        exit;
    }

    // Simpan ulasan
    $result = pg_query_params(
        $conn,
        'INSERT INTO ulasan (id_user, id_tempat, rating, komentar, foto_url, tanggal)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id_ulasan',
        [$id_user, $id_tempat, $rating, $komentar, $foto_url]
    );

    if (!$result || pg_num_rows($result) === 0) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal menyimpan ulasan"
        ]);
        exit;
    }

    $row = pg_fetch_assoc($result);

    http_response_code(201);
    echo json_encode([
        "status"    => true,
        "message"   => "Ulasan berhasil disimpan",
        "id_ulasan" => $row['id_ulasan']
    ]);
    exit;
}

// ============================================================
// DELETE — Hapus ulasan milik sendiri
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {

    // Validasi autentikasi
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'user') {
        http_response_code(401);
        echo json_encode([
            "status"  => false,
            "message" => "Anda harus login untuk menghapus ulasan"
        ]);
        exit;
    }

    $id_user = $_SESSION['id_user'];
    $body    = json_decode(file_get_contents("php://input"), true);
    $id_ulasan = intval($body['id_ulasan'] ?? 0);

    if ($id_ulasan <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => false,
            "message" => "ID ulasan tidak valid"
        ]);
        exit;
    }

    // Cek apakah ulasan ada dan milik user ini
    $cek = pg_query_params(
        $conn,
        'SELECT id_ulasan FROM ulasan WHERE id_ulasan = $1 AND id_user = $2',
        [$id_ulasan, $id_user]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal memeriksa data ulasan"
        ]);
        exit;
    }

    if (pg_num_rows($cek) === 0) {
        http_response_code(404);
        echo json_encode([
            "status"  => false,
            "message" => "Ulasan tidak ditemukan atau bukan milik Anda"
        ]);
        exit;
    }

    // Hapus ulasan
    $result = pg_query_params(
        $conn,
        'DELETE FROM ulasan WHERE id_ulasan = $1 AND id_user = $2',
        [$id_ulasan, $id_user]
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode([
            "status"  => false,
            "message" => "Gagal menghapus ulasan"
        ]);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        "status"  => true,
        "message" => "Ulasan berhasil dihapus"
    ]);
    exit;
}

// Method tidak diizinkan
http_response_code(405);
echo json_encode([
    "status"  => false,
    "message" => "Method tidak diizinkan"
]);
