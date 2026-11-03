<?php
require_once __DIR__ . '/../../env.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/middleware.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
$total_kuliner = pg_fetch_assoc(pg_query($conn, 'SELECT COUNT(*) AS total FROM kuliner'));

// Total tempat kuliner
$total_tempat = pg_fetch_assoc(pg_query($conn, 'SELECT COUNT(*) AS total FROM tempat_kuliner'));

// Total user
$total_user = pg_fetch_assoc(pg_query($conn, 'SELECT COUNT(*) AS total FROM users'));

// Total ulasan
$total_ulasan = pg_fetch_assoc(pg_query($conn, 'SELECT COUNT(*) AS total FROM ulasan'));

// Rata-rata rating
$rata_rating = pg_fetch_assoc(pg_query($conn, 'SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS rata_rata FROM ulasan WHERE rating IS NOT NULL'));

// Total kategori
$total_kategori = pg_fetch_assoc(pg_query($conn, 'SELECT COUNT(*) AS total FROM kategori'));

// Kuliner paling banyak diulas
$kuliner_populer = pg_fetch_assoc(pg_query($conn,
    "SELECT k.nama_kuliner, COUNT(u.id_ulasan) AS jumlah_ulasan
     FROM kuliner k
     JOIN tempat_kuliner tk ON tk.id_kuliner = k.id_kuliner
     LEFT JOIN ulasan u ON u.id_tempat = tk.id_tempat
     GROUP BY k.id_kuliner, k.nama_kuliner
     ORDER BY jumlah_ulasan DESC
     LIMIT 1"
));

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

$ulasan_terbaru = [];
if ($ulasan_terbaru_result) {
    while ($row = pg_fetch_assoc($ulasan_terbaru_result)) {
        $ulasan_terbaru[] = $row;
    }
}

// 5 user terbaru
$user_terbaru_result = pg_query($conn,
    "SELECT id_user, nama, email, foto_profil
     FROM users
     ORDER BY id_user DESC
     LIMIT 5"
);

$user_terbaru = [];
if ($user_terbaru_result) {
    while ($row = pg_fetch_assoc($user_terbaru_result)) {
        $user_terbaru[] = $row;
    }
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
