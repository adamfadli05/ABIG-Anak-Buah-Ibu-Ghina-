<?php
require_once __DIR__ . '/../../env.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/middleware.php';

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

// Total kuliner
$res_kuliner = pg_query($conn, 'SELECT COUNT(*) AS total FROM kuliner');
if (!$res_kuliner) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data kuliner"]);
    exit;
}
$total_kuliner = pg_fetch_assoc($res_kuliner);

// Total tempat kuliner
$res_tempat = pg_query($conn, 'SELECT COUNT(*) AS total FROM tempat_kuliner');
if (!$res_tempat) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data tempat kuliner"]);
    exit;
}
$total_tempat = pg_fetch_assoc($res_tempat);

// Total user
$res_user = pg_query($conn, 'SELECT COUNT(*) AS total FROM users');
if (!$res_user) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data pengguna"]);
    exit;
}
$total_user = pg_fetch_assoc($res_user);

// Total ulasan
$res_ulasan = pg_query($conn, 'SELECT COUNT(*) AS total FROM ulasan');
if (!$res_ulasan) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data ulasan"]);
    exit;
}
$total_ulasan = pg_fetch_assoc($res_ulasan);

// Rata-rata rating
$res_rating = pg_query($conn, 'SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS rata_rata FROM ulasan WHERE rating IS NOT NULL');
if (!$res_rating) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data rating"]);
    exit;
}
$rata_rating = pg_fetch_assoc($res_rating);

// Total kategori
$res_kategori = pg_query($conn, 'SELECT COUNT(*) AS total FROM kategori');
if (!$res_kategori) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data kategori"]);
    exit;
}
$total_kategori = pg_fetch_assoc($res_kategori);

// Kuliner paling banyak diulas
$res_populer = pg_query($conn,
    "SELECT k.nama_kuliner, COUNT(u.id_ulasan) AS jumlah_ulasan
     FROM kuliner k
     JOIN tempat_kuliner tk ON tk.id_kuliner = k.id_kuliner
     LEFT JOIN ulasan u ON u.id_tempat = tk.id_tempat
     GROUP BY k.id_kuliner, k.nama_kuliner
     ORDER BY jumlah_ulasan DESC
     LIMIT 1"
);
if (!$res_populer) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data kuliner populer"]);
    exit;
}
$kuliner_populer = pg_fetch_assoc($res_populer);

// 5 ulasan terbaru
$ulasan_terbaru_result = pg_query($conn,
    "SELECT u.id_ulasan, u.rating, u.komentar, u.tanggal,
            us.nama AS nama_user, k.nama_kuliner
     FROM ulasan u
     JOIN users us ON u.id_user = us.id_user
     JOIN tempat_kuliner tk ON u.id_tempat = tk.id_tempat
     JOIN kuliner k ON tk.id_kuliner = k.id_kuliner
     ORDER BY u.tanggal DESC
     LIMIT 5"
);
if (!$ulasan_terbaru_result) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data ulasan terbaru"]);
    exit;
}

$ulasan_terbaru = [];
while ($row = pg_fetch_assoc($ulasan_terbaru_result)) {
    $ulasan_terbaru[] = $row;
}

// 5 user terbaru
$user_terbaru_result = pg_query($conn,
    "SELECT id_user, nama, email, foto_profil
     FROM users
     ORDER BY id_user DESC
     LIMIT 5"
);
if (!$user_terbaru_result) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Gagal mengambil data pengguna terbaru"]);
    exit;
}

$user_terbaru = [];
while ($row = pg_fetch_assoc($user_terbaru_result)) {
    $user_terbaru[] = $row;
}

http_response_code(200);
echo json_encode([
    "status" => true,
    "data"   => [
        "total_kuliner"    => intval($total_kuliner['total']),
        "total_tempat"     => intval($total_tempat['total']),
        "total_user"       => intval($total_user['total']),
        "total_ulasan"     => intval($total_ulasan['total']),
        "total_kategori"   => intval($total_kategori['total']),
        "rata_rata_rating" => floatval($rata_rating['rata_rata']),
        "kuliner_populer"  => $kuliner_populer,
        "ulasan_terbaru"   => $ulasan_terbaru,
        "user_terbaru"     => $user_terbaru
    ]
]);
