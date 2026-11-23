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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(["status" => false, "message" => "Method harus POST"]);
    exit;
}

$frontendUrl = getenv('FRONTEND_URL') ?: 'http://localhost';

session_unset();
session_destroy();

// Hapus cookie session di browser
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}
// Selalu return JSON untuk POST request
header('Content-Type: application/json');
http_response_code(200);
echo json_encode(["status" => true, "message" => "Berhasil keluar."]);
exit;
