<?php
require_once __DIR__ . '/env.php';
configureSession();
session_start();

setCorsHeaders();

// Handle preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$frontendUrl = getenv('FRONTEND_URL') ?: 'http://localhost';

session_unset();
session_destroy();

// Jika dipanggil via fetch (AJAX), kembalikan JSON
$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) ||
          str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

if ($isAjax) {
    header('Content-Type: application/json');
    http_response_code(200);
    echo json_encode(["status" => true, "message" => "Berhasil keluar."]);
    exit;
}

// Jika akses langsung (bukan fetch), redirect ke index
header('Location: ' . $frontendUrl . '/index.html');
exit;
