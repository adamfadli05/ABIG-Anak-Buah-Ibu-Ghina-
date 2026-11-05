<?php

/**
 * Load variabel dari file .env ke environment
 * Dipanggil sekali di awal aplikasi
 */
function loadEnv(string $path): void
{
    if (!file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        // Skip baris komentar
        if (str_starts_with(trim($line), '#')) {
            continue;
        }

        // Pisahkan key=value
        if (!str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value);

        // Jangan timpa env yang sudah di-set (dari Docker/server)
        if (!getenv($key)) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

// Load .env dari root project (satu level di atas folder backend)
loadEnv(__DIR__ . '/../.env');

/**
 * Konfigurasi session cookie agar bisa dikirim cross-origin (SameSite=None).
 * Dipanggil SEBELUM session_start() di setiap endpoint yang butuh session.
 */
function configureSession(): void
{
    $isSecure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isSecure,
        'httponly' => true,
        'samesite' => $isSecure ? 'None' : 'Lax',
    ]);
}

/**
 * Set CORS header berdasarkan origin request.
 * Untuk endpoint yang butuh credentials (session/cookie).
 *
 * Konfigurasi melalui env variable CORS_ALLOWED_ORIGINS (dipisah koma),
 * atau fallback ke FRONTEND_URL jika tidak di-set.
 */
function setCorsHeaders(): void
{
    $envOrigins  = getenv('CORS_ALLOWED_ORIGINS');
    $frontendUrl = getenv('FRONTEND_URL');

    if ($envOrigins) {
        $allowed_origins = array_map('trim', explode(',', $envOrigins));
    } elseif ($frontendUrl) {
        // Tambahkan variasi port umum secara otomatis dari FRONTEND_URL
        $allowed_origins = [
            rtrim($frontendUrl, '/'),
            'http://localhost',
            'http://localhost:3000',
            'http://127.0.0.1',
        ];
    } else {
        $allowed_origins = [
            'http://localhost',
            'http://localhost:3000',
            'http://127.0.0.1',
        ];
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        // Tolak origin yang tidak dikenal — gunakan origin pertama yang valid
        header('Access-Control-Allow-Origin: ' . $allowed_origins[0]);
    }

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
