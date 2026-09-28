<?php

session_start();

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/database.php';

$client = new Google\Client();

$client->setAuthConfig(__DIR__ . '/client_secret.json');

$client->setRedirectUri(
    'http://localhost/mangan-yukkk/callback.php'
);

$client->addScope([
    'openid',
    'email',
    'profile'
]);

if (!isset($_GET['code'])) {
    die("Login Google gagal.");
}

$token = $client->fetchAccessTokenWithAuthCode($_GET['code']);

if (isset($token['error'])) {
    die("Gagal mendapatkan token Google.");
}

$client->setAccessToken($token);

$oauth = new Google\Service\Oauth2($client);
$googleUser = $oauth->userinfo->get();

$google_id = $googleUser->id;
$nama = $googleUser->name;
$email = $googleUser->email;
$foto_profil = $googleUser->picture;

// Cek apakah user sudah ada
$sql = 'SELECT * FROM users WHERE google_id = $1';

$result = pg_query_params(
    $conn,
    $sql,
    [$google_id]
);

$user = pg_fetch_assoc($result);

// Kalau belum ada, masukkan ke database
if (!$user) {

    $sql = '
        INSERT INTO users
        (google_id, nama, email, foto_profil)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    ';

    $result = pg_query_params(
        $conn,
        $sql,
        [
            $google_id,
            $nama,
            $email,
            $foto_profil
        ]
    );

    $user = pg_fetch_assoc($result);
}

// Simpan data ke session
$_SESSION['id_user'] = $user['id_user'];
$_SESSION['nama'] = $user['nama'];
$_SESSION['email'] = $user['email'];
$_SESSION['foto_profil'] = $user['foto_profil'];

// Kembali ke halaman utama
header("Location: index.php");
exit;