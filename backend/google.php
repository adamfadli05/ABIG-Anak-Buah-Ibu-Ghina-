<?php

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/env.php';

$client = new Google\Client();
$client->setAuthConfig(json_decode(getenv('GOOGLE_CLIENT_SECRET'), true));

// Mengarahkan redirect URI ke callback.php di localhost
$client->setRedirectUri(
    'http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend/callback.php'
);
$client->addScope(['openid', 'email', 'profile']);

// Langsung redirect ke halaman pilih akun Google
header('Location: ' . $client->createAuthUrl());
exit;