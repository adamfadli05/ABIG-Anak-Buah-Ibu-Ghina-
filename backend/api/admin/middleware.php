<?php

/**
 * Middleware validasi role admin.
 */
function requireAdmin(): void
{
    require_once __DIR__ . '/../../env.php';
    configureSession();
    session_start();

    header('Content-Type: application/json');

    if (!isset($_SESSION['role'])) {
        http_response_code(401);
        echo json_encode([
            "status"  => false,
            "message" => "Anda harus login untuk mengakses halaman ini"
        ]);
        exit;
    }

    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode([
            "status"  => false,
            "message" => "Akses ditolak. Halaman ini hanya untuk admin"
        ]);
        exit;
    }
}
