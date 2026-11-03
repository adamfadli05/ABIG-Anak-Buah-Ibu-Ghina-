<?php

/**
 * Middleware validasi role admin.
 * Di-include di setiap endpoint admin sebelum logic utama.
 * Langsung return 401 atau 403 kalau tidak valid.
 */
function requireAdmin(): void
{
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
