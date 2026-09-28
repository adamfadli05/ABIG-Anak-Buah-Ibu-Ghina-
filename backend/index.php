<?php
session_start();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Mangan Yukkk</title>
</head>
<body>

<h1>Mangan Yukkk</h1>

<?php if (isset($_SESSION['id_user'])): ?>

    <h2>Halo, <?= htmlspecialchars($_SESSION['nama']) ?></h2>

    <p>Email: <?= htmlspecialchars($_SESSION['email']) ?></p>

    <img 
        src="<?= htmlspecialchars($_SESSION['foto_profil']) ?>" 
        width="100"
    >

    <br><br>

    <a href="logout.php">
        <button>Logout</button>
    </a>

<?php else: ?>

    <a href="login.php">
        <button>Login dengan Google</button>
    </a>

<?php endif; ?>

</body>
</html>