
<?php
session_start();
require_once __DIR__ . '/config/database.php';

$error = '';
$nama = '';
$email = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nama = trim($_POST['nama'] ?? '');
    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';
    $konfirmasi = $_POST['konfirmasi_password'] ?? '';

    if ($nama === '' || $email === '' || $password === '') {
        $error = 'Semua kolom wajib diisi.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Format email tidak valid.';
    } elseif (!preg_match('/@gmail\.com$/i', $email)) {
        $error = 'Gunakan email yang berakhiran @gmail.com.';
    } elseif (strlen($password) < 8) {
        $error = 'Password minimal 8 karakter.';
    } elseif ($password !== $konfirmasi) {
        $error = 'Konfirmasi password tidak cocok.';
    } else {
        $cek = pg_query_params(
            $conn,
            'SELECT id_user FROM users WHERE email = $1',
            [$email]
        );

        if (!$cek) {
            $error = 'Terjadi kesalahan saat memeriksa akun.';
        } elseif (pg_num_rows($cek) > 0) {
            $error = 'Email sudah terdaftar. Silakan login.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);

            $result = pg_query_params(
                $conn,
                'INSERT INTO users (nama, email, password)
                 VALUES ($1, $2, $3)
                 RETURNING id_user',
                [$nama, $email, $hash]
            );

            if ($result && pg_num_rows($result) > 0) {
                header('Location: login.php?registered=1');
                exit;
            } else {
                $error = 'Registrasi gagal. Silakan coba lagi.';
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
    <title>Register - Mangan Yukkk</title>
</head>
<body>
    <h2>Daftar Mangan Yukkk</h2>

    <?php if ($error !== ''): ?>
        <p style="color:red">
            <?= htmlspecialchars($error) ?>
        </p>
    <?php endif; ?>

    <form method="POST" action="">
        <label>Nama</label><br>
        <input
            type="text"
            name="nama"
            value="<?= htmlspecialchars($nama) ?>"
            required
        ><br><br>

        <label>Email Gmail</label><br>
        <input
            type="email"
            name="email"
            value="<?= htmlspecialchars($email) ?>"
            placeholder="nama@gmail.com"
            required
        ><br><br>

        <label>Password (minimal 8 karakter)</label><br>
        <input type="password" name="password" minlength="8" required>
        <br><br>

        <label>Konfirmasi Password</label><br>
        <input
            type="password"
            name="konfirmasi_password"
            minlength="8"
            required
        ><br><br>

        <button type="submit">Daftar</button>
    </form>
	
	<a href="index.php">
    <button type="button">Kembali</button>
</a>

    <p>Sudah punya akun?
        <a href="login_email.php">Login</a>
    </p>
	
<hr>

<p>Atau daftar dengan:</p>

<a href="login.php">
    <button type="button">Daftar dengan Google</button>
</a>
</body>
</html>