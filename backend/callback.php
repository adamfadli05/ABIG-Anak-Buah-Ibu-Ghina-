
<?php
session_start();

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/database.php';

$client = new Google\Client();
$client->setAuthConfig(__DIR__ . '/client_secret.json');
$client->setRedirectUri(
    'https://parcel-departmental-tmp-bonds.trycloudflare.com/ABIG-Anak-Buah-Ibu-Ghina-/backend/callback.php'
);
$client->addScope(['openid', 'email', 'profile']);

if (!isset($_GET['code'])) {
    exit('Login Google gagal.');
}

$token = $client->fetchAccessTokenWithAuthCode($_GET['code']);

if (isset($token['error'])) {
    exit('Gagal mendapatkan token Google.');
}

$client->setAccessToken($token);

$oauth = new Google\Service\Oauth2($client);
$googleUser = $oauth->userinfo->get();

$google_id = $googleUser->id;
$nama = $googleUser->name;
$email = strtolower(trim($googleUser->email));
$foto_profil = $googleUser->picture;

if (
    empty($googleUser->verifiedEmail) ||
    !preg_match('/@gmail\.com$/i', $email)
) {
    exit('Gunakan akun Google dengan email Gmail yang terverifikasi.');
}

// Cari berdasarkan ID Google terlebih dahulu.
$result = pg_query_params(
    $conn,
    'SELECT * FROM users WHERE google_id = $1',
    [$google_id]
);

if (!$result) {
    exit('Gagal memeriksa akun.');
}

$user = pg_fetch_assoc($result);

if (!$user) {
    // Jika email sudah terdaftar lewat Register, hubungkan akun Google.
    $result = pg_query_params(
        $conn,
        'SELECT * FROM users WHERE email = $1',
        [$email]
    );

    if (!$result) {
        exit('Gagal memeriksa email akun.');
    }

    $user = pg_fetch_assoc($result);

    if ($user) {
        if (!empty($user['google_id'])) {
            exit('Email ini sudah terhubung ke akun Google lain.');
        }

        $result = pg_query_params(
            $conn,
            'UPDATE users
             SET google_id = $1, nama = $2, foto_profil = $3
             WHERE id_user = $4
             RETURNING *',
            [$google_id, $nama, $foto_profil, $user['id_user']]
        );

        if (!$result) {
            exit('Gagal menghubungkan akun Google.');
        }

        $user = pg_fetch_assoc($result);
    } else {
        // Akun benar-benar baru.
        $result = pg_query_params(
            $conn,
            'INSERT INTO users
             (google_id, nama, email, foto_profil)
             VALUES ($1, $2, $3, $4)
             RETURNING *',
            [$google_id, $nama, $email, $foto_profil]
        );

        if (!$result) {
            exit('Gagal menyimpan akun Google.');
        }

        $user = pg_fetch_assoc($result);
    }
}

session_regenerate_id(true);

// Cek apakah email terdaftar sebagai admin
$admin_result = pg_query_params(
    $conn,
    'SELECT * FROM admin WHERE email = $1',
    [$email]
);

if (!$admin_result) {
    exit('Gagal memeriksa role akun.');
}

$admin = pg_fetch_assoc($admin_result);

if ($admin) {
    // Login sebagai admin
    $_SESSION['role'] = 'admin';
    $_SESSION['id_admin'] = $admin['id_admin'];
    $_SESSION['nama'] = $admin['nama'];
    $_SESSION['email'] = $admin['email'];

    header('Location: http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/frontend/admin.html');
    exit;
}

// Jika bukan admin, login sebagai user
$_SESSION['role'] = 'user';
$_SESSION['id_user'] = $user['id_user'];
$_SESSION['nama'] = $user['nama'];
$_SESSION['email'] = $user['email'];
$_SESSION['foto_profil'] = $user['foto_profil'];

header('Location: http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/frontend/index.html');
exit;