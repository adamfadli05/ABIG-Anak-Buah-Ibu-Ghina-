<?php

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/env.php';

$client = new Google\Client();
$client->setAuthConfig(json_decode(getenv('GOOGLE_CLIENT_SECRET'), true));

// Mengarahkan redirect URI ke callback.php
$client->setRedirectUri(
    getenv('BACKEND_URL') ? getenv('BACKEND_URL') . '/callback.php' : 'http://localhost/callback.php'
);
$client->addScope(['openid', 'email', 'profile']);

// Langsung redirect ke halaman pilih akun Google
header('Location: ' . $client->createAuthUrl());
exit;