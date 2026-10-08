<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_SESSION['role'])) {
    echo json_encode([
        "status"  => false,
        "message" => "Belum masuk"
    ]);
    exit;
}

if ($_SESSION['role'] === 'admin') {
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