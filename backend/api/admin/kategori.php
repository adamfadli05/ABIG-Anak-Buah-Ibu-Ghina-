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

$method = $_SERVER['REQUEST_METHOD'];

// =============================================================================
// GET — Daftar semua kategori / detail satu kategori
// =============================================================================
if ($method === 'GET') {

    $id = trim($_GET['id'] ?? '');

    if ($id !== '') {
        if (!ctype_digit($id)) {
            http_response_code(400);
            echo json_encode(["status" => false, "message" => "ID kategori tidak valid"]);
            exit;
        }

        $result = pg_query_params(
            $conn,
            "SELECT
                ka.id_kategori,
                ka.nama_kategori,
                COUNT(k.id_kuliner) AS total_kuliner
            FROM kategori ka
            LEFT JOIN kuliner k ON k.id_kategori = ka.id_kategori
            WHERE ka.id_kategori = $1
            GROUP BY ka.id_kategori, ka.nama_kategori",
            [$id]
        );

        if (!$result) {
            http_response_code(500);
            echo json_encode(["status" => false, "message" => "Gagal mengambil data kategori"]);
            exit;
        }

        $data = pg_fetch_assoc($result);

        if (!$data) {
            http_response_code(404);
            echo json_encode(["status" => false, "message" => "Kategori tidak ditemukan"]);
            exit;
        }

        http_response_code(200);
        echo json_encode(["status" => true, "data" => $data]);
        exit;
    }

    $result = pg_query(
        $conn,
        "SELECT
            ka.id_kategori,
            ka.nama_kategori,
            COUNT(k.id_kuliner) AS total_kuliner
        FROM kategori ka
        LEFT JOIN kuliner k ON k.id_kategori = ka.id_kategori
        GROUP BY ka.id_kategori, ka.nama_kategori
        ORDER BY ka.id_kategori ASC"
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal mengambil data kategori"]);
        exit;
    }

    $data = [];
    while ($row = pg_fetch_assoc($result)) {
        $data[] = $row;
    }

    if (empty($data)) {
        http_response_code(200);
        echo json_encode(["status" => true, "message" => "Belum ada kategori", "data" => []]);
        exit;
    }

    http_response_code(200);
    echo json_encode(["status" => true, "data" => $data]);
    exit;
}

// =============================================================================
// POST — Tambah kategori baru (hanya Admin)
// =============================================================================
if ($method === 'POST') {

    requireAdmin();

    $body          = json_decode(file_get_contents("php://input"), true) ?? [];
    $nama_kategori = trim($body['nama_kategori'] ?? '');

    if (empty($nama_kategori)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Nama kategori wajib diisi"]);
        exit;
    }

    if (mb_strlen($nama_kategori) > 100) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Nama kategori maksimal 100 karakter"]);
        exit;
    }

    $cek_duplikat = pg_query_params(
        $conn,
        'SELECT id_kategori FROM kategori WHERE LOWER(nama_kategori) = LOWER($1)',
        [$nama_kategori]
    );

    if (!$cek_duplikat) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memeriksa duplikasi kategori"]);
        exit;
    }

    if (pg_num_rows($cek_duplikat) > 0) {
        http_response_code(409);
        echo json_encode(["status" => false, "message" => "Nama kategori sudah ada"]);
        exit;
    }

    $result = pg_query_params(
        $conn,
        'INSERT INTO kategori (nama_kategori) VALUES ($1) RETURNING id_kategori, nama_kategori',
        [$nama_kategori]
    );

    if (!$result || pg_num_rows($result) === 0) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal menyimpan kategori"]);
        exit;
    }

    $data = pg_fetch_assoc($result);

    http_response_code(201);
    echo json_encode([
        "status"  => true,
        "message" => "Kategori berhasil ditambahkan",
        "data"    => [
            "id_kategori"   => (int)$data['id_kategori'],
            "nama_kategori" => $data['nama_kategori'],
            "total_kuliner" => 0
        ]
    ]);
    exit;
}

// =============================================================================
// PUT — Ubah nama kategori berdasarkan id_kategori (hanya Admin)
// =============================================================================
if ($method === 'PUT') {

    requireAdmin();

    $id = trim($_GET['id'] ?? '');

    if (empty($id) || !ctype_digit($id)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "ID kategori tidak valid"]);
        exit;
    }

    // Cek kategori ada
    $cek = pg_query_params(
        $conn,
        'SELECT id_kategori, nama_kategori FROM kategori WHERE id_kategori = $1',
        [$id]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memeriksa data kategori"]);
        exit;
    }

    if (pg_num_rows($cek) === 0) {
        http_response_code(404);
        echo json_encode(["status" => false, "message" => "Kategori tidak ditemukan"]);
        exit;
    }

    $body          = json_decode(file_get_contents("php://input"), true) ?? [];
    $nama_kategori = trim($body['nama_kategori'] ?? '');

    if (empty($nama_kategori)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Nama kategori wajib diisi"]);
        exit;
    }

    if (mb_strlen($nama_kategori) > 100) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Nama kategori maksimal 100 karakter"]);
        exit;
    }

    // Cek duplikasi nama, kecuali kategori yang sedang diubah
    $cek_duplikat = pg_query_params(
        $conn,
        'SELECT id_kategori FROM kategori WHERE LOWER(nama_kategori) = LOWER($1) AND id_kategori != $2',
        [$nama_kategori, $id]
    );

    if (!$cek_duplikat) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memeriksa duplikasi kategori"]);
        exit;
    }

    if (pg_num_rows($cek_duplikat) > 0) {
        http_response_code(409);
        echo json_encode(["status" => false, "message" => "Nama kategori sudah ada"]);
        exit;
    }

    $result = pg_query_params(
        $conn,
        'UPDATE kategori SET nama_kategori = $1 WHERE id_kategori = $2 RETURNING id_kategori, nama_kategori',
        [$nama_kategori, $id]
    );

    if (!$result || pg_num_rows($result) === 0) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memperbarui kategori"]);
        exit;
    }

    $data = pg_fetch_assoc($result);

    // Ambil total_kuliner setelah update
    $total = pg_query_params(
        $conn,
        'SELECT COUNT(*) AS total FROM kuliner WHERE id_kategori = $1',
        [$id]
    );
    $total_kuliner = $total ? (int)pg_fetch_assoc($total)['total'] : 0;

    http_response_code(200);
    echo json_encode([
        "status"  => true,
        "message" => "Kategori berhasil diperbarui",
        "data"    => [
            "id_kategori"   => (int)$data['id_kategori'],
            "nama_kategori" => $data['nama_kategori'],
            "total_kuliner" => $total_kuliner
        ]
    ]);
    exit;
}

// =============================================================================
// DELETE — Hapus kategori berdasarkan id_kategori (hanya Admin)
// Menolak penghapusan jika kategori masih digunakan oleh data kuliner
// =============================================================================
if ($method === 'DELETE') {

    requireAdmin();

    $id = trim($_GET['id'] ?? '');

    if (empty($id) || !ctype_digit($id)) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "ID kategori tidak valid"]);
        exit;
    }

    // Cek kategori ada
    $cek = pg_query_params(
        $conn,
        'SELECT id_kategori FROM kategori WHERE id_kategori = $1',
        [$id]
    );

    if (!$cek) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memeriksa data kategori"]);
        exit;
    }

    if (pg_num_rows($cek) === 0) {
        http_response_code(404);
        echo json_encode(["status" => false, "message" => "Kategori tidak ditemukan"]);
        exit;
    }

    // Cek relasi dengan kuliner — tolak jika masih digunakan
    $cek_relasi = pg_query_params(
        $conn,
        'SELECT id_kuliner FROM kuliner WHERE id_kategori = $1 LIMIT 1',
        [$id]
    );

    if (!$cek_relasi) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal memeriksa relasi kategori"]);
        exit;
    }

    if (pg_num_rows($cek_relasi) > 0) {
        http_response_code(409);
        echo json_encode([
            "status"  => false,
            "message" => "Kategori tidak dapat dihapus karena masih digunakan oleh data kuliner"
        ]);
        exit;
    }

    $result = pg_query_params(
        $conn,
        'DELETE FROM kategori WHERE id_kategori = $1',
        [$id]
    );

    if (!$result) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Gagal menghapus kategori"]);
        exit;
    }

    http_response_code(200);
    echo json_encode(["status" => true, "message" => "Kategori berhasil dihapus"]);
    exit;
}

// =============================================================================
// Method tidak diizinkan
// =============================================================================
http_response_code(405);
echo json_encode(["status" => false, "message" => "Method tidak diizinkan"]);
