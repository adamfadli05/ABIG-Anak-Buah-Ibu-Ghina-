<?php

require_once __DIR__ . '/vendor/autoload.php';

$client = new Google\Client();
$client->setAuthConfig(__DIR__ . '/client_secret.json');
$client->setRedirectUri(
    'http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/backend/callback.php'
);
$client->addScope(['openid', 'email', 'profile']);

// Langsung redirect ke halaman pilih akun Google
header('Location: ' . $client->createAuthUrl());
exit;
