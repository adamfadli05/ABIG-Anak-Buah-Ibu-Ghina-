<?php
session_start();
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Mangan Yukkk</title>
</head>
<body>

    <h1>Mangan Yukkk</h1>

    <?php if (isset($_SESSION['role'])): ?>

        <h3>Halo, <?= htmlspecialchars($_SESSION['nama']) ?>!</h3>

        <p>Role: <?= htmlspecialchars($_SESSION['role']) ?></p>

        <a href="logout.php">
            <button>Logout</button>
        </a>

    <?php else: ?>

        <a href="login.php">
            <button>Login</button>
        </a>

        <a href="register.php">
            <button>Daftar</button>
        </a>

    <?php endif; ?>

</body>
</html>