<?php
require_once __DIR__ . '/../env.php';
configureSession();
session_start();
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_SESSION['role'])) {
    http_response_code(401);
    echo json_encode(["status" => false, "message" => "Belum masuk"]);
    exit;
}

if ($_SESSION['role'] === 'admin') {
    http_response_code(200);
    echo json_encode([
        "status" => true,
        "role"   => "admin",
        "data"   => [
            "id_admin"    => $_SESSION['id_admin'],
            "nama"        => $_SESSION['nama'],
            "email"       => $_SESSION['email'],
            "foto_profil" => null
        ]
    ]);
} else {
    http_response_code(200);
    echo json_encode([
        "status" => true,
        "role"   => "user",
        "data"   => [
            "id_user"     => $_SESSION['id_user'],
            "nama"        => $_SESSION['nama'],
            "email"       => $_SESSION['email'],
            "foto_profil" => $_SESSION['foto_profil'] ?? null
        ]
    ]);
}