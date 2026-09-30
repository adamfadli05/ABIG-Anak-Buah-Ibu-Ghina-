<?php
session_start();

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header('Location: login.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Admin - Mangan Yukkk</title>
</head>
<body>

    <h1>Halaman Admin</h1>

    <p>Selamat datang, <?= htmlspecialchars($_SESSION['nama']) ?></p>

    <p>
        Role:
        <?= htmlspecialchars($_SESSION['role']) ?>
    </p>

    <a href="logout.php">Logout</a>

</body>
</html>