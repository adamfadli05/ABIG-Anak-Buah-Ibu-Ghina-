<?php
session_start();

require_once __DIR__ . '/vendor/autoload.php';

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

$loginUrl = $client->createAuthUrl();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Login - Mangan Yukkk</title>
</head>
<body>

<h2>Login Mangan Yukkk</h2>

<a href="<?= htmlspecialchars($loginUrl) ?>">
    <button>Login dengan Google</button>
</a>

</body>
</html>