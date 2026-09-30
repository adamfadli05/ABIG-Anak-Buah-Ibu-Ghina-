<?php
session_start();

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/database.php';

$error = '';
$email = '';

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

$googleLoginUrl = $client->createAuthUrl();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';

    if (
        !filter_var($email, FILTER_VALIDATE_EMAIL) ||
        !preg_match('/@gmail\.com$/i', $email)
    ) {
        $error = 'Gunakan email Gmail yang valid.';
    } elseif ($password === '') {
        $error = 'Password wajib diisi.';
    } else {

        // Cek apakah akun adalah ADMIN
        $adminResult = pg_query_params(
            $conn,
            'SELECT id_admin, nama, email, password
             FROM admin
             WHERE email = $1',
            [$email]
        );

        if (!$adminResult) {
            $error = 'Terjadi kesalahan saat memeriksa akun admin.';
        } else {

            $admin = pg_fetch_assoc($adminResult);

            if ($admin) {

                // Login ADMIN
                if (password_verify($password, $admin['password'])) {

                    session_regenerate_id(true);

                    $_SESSION['role'] = 'admin';
                    $_SESSION['id_admin'] = $admin['id_admin'];
                    $_SESSION['nama'] = $admin['nama'];
                    $_SESSION['email'] = $admin['email'];

                    header('Location: admin.php');
                    exit;

                } else {
                    $error = 'Email atau password salah.';
                }

            } else {

                // Kalau bukan admin, cek USER
                $userResult = pg_query_params(
                    $conn,
                    'SELECT id_user, nama, email, foto_profil, password
                     FROM users
                     WHERE email = $1',
                    [$email]
                );

                if (!$userResult) {
                    $error = 'Terjadi kesalahan saat memeriksa akun.';
                } else {

                    $user = pg_fetch_assoc($userResult);

                    if (
                        !$user ||
                        empty($user['password']) ||
                        !password_verify($password, $user['password'])
                    ) {
                        $error = 'Email atau password salah.';
                    } else {

                        session_regenerate_id(true);

                        $_SESSION['role'] = 'user';
                        $_SESSION['id_user'] = $user['id_user'];
                        $_SESSION['nama'] = $user['nama'];
                        $_SESSION['email'] = $user['email'];
                        $_SESSION['foto_profil'] = $user['foto_profil'];

                        header('Location: index.php');
                        exit;
                    }
                }
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Mangan Yukkk</title>
</head>

<body>

    <h2>Login Mangan Yukkk</h2>

    <?php if (isset($_GET['registered'])): ?>
        <p style="color: green;">
            Registrasi berhasil. Silakan login.
        </p>
    <?php endif; ?>

    <?php if ($error !== ''): ?>
        <p style="color: red;">
            <?= htmlspecialchars($error) ?>
        </p>
    <?php endif; ?>

    <form method="POST" action="">

        <label>Email Gmail</label><br>

        <input
            type="email"
            name="email"
            value="<?= htmlspecialchars($email) ?>"
            placeholder="nama@gmail.com"
            required
        >

        <br><br>

        <label>Password</label><br>

        <input
            type="password"
            name="password"
            required
        >

        <br><br>

        <button type="submit">
            Login
        </button>

    </form>

    <hr>

    <p>Atau</p>

    <a href="<?= htmlspecialchars($googleLoginUrl) ?>">
        <button type="button">
            Login dengan Google
        </button>
    </a>

    <p>
        Belum punya akun?
        <a href="register.php">Daftar</a>
    </p>

</body>

</html>