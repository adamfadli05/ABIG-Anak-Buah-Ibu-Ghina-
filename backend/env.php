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
