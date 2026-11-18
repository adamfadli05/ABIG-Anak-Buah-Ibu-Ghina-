<?php

/**
 * Profanity Filter — Penyaringan kata terlarang pada ulasan
 *
 * Fitur:
 * - Daftar kata terlarang bahasa Indonesia
 * - Normalisasi teks (angka → huruf, karakter berulang, spasi berlebih)
 * - Pencocokan batas kata agar kata normal tidak tersaring
 * - Penyamaran kata terlarang dengan ***
 */

// =============================================================================
// Daftar kata terlarang
// =============================================================================
function getKataTerlarang(): array
{
    return [
        // Kata kasar umum
        'anjing', 'anjir', 'anying', 'anj1ng', 'anJ1ng',
        'babi', 'b4bi', 'bab1',
        'bangsat', 'b4ngsat', 'bangz4t',
        'bajingan', 'b4jingan', 'bajing4n',
        'bedebah', 'bed3bah',
        'brengsek', 'br3ngsek', 'brengs3k',
        'celeng',
        'keparat', 'k3parat', 'kep4rat',
        'sialan', 'si4lan', 's1alan',
        'sial',
        'goblok', 'g0blok', 'goblog', 'g0blog',
        'bodoh', 'b0doh',
        'tolol', 't0lol', 'tol0l',
        'idiot', '1diot', 'idi0t',
        'dungu', 'd0ngu',
        'kampret', 'k4mpret', 'k@mpret',
        'kurang ajar', 'kur4ng ajar',
        'monyet', 'm0nyet', 'mony3t',
        'tai', 't41', 't4i',
        'tahi', 't4hi', 'tah1',
        'asu', '4su', 'a5u',
        'cok', 'c0k',
        'cuki', 'cuk1',
        'kontol', 'k0ntol', 'kont0l', 'k0nt0l',
        'memek', 'm3mek', 'mem3k',
        'pepek', 'p3pek', 'pep3k',
        'ngentot', 'ng3ntot', 'ngent0t', 'ng3nt0t',
        'ngentod', 'ng3ntod',
        'entot', '3ntot', 'ent0t',
        'jancok', 'j4ncok', 'janc0k', 'j4nc0k',
        'jancuk', 'j4ncuk', 'janc0k',
        'ndasmu', 'nd4smu',
        'asu', '4su',
        'matamu', 'm4tamu',
        'matane', 'm4tane',
        'dancok', 'd4ncok',
        'raimu', 'r41mu',
        'kimak', 'k1mak', 'k!mak',
        'pukimak', 'puk1mak',
        'puki', 'puk1',
        'lancau', 'l4ncau',
        'bejat', 'b3jat', 'bej4t',
        'sundal', 'sund4l',
        'pelacur', 'pel4cur', 'p3lacur',
        'lonte', 'l0nte', 'lont3',
        'jalang', 'j4lang', 'jal4ng',
        'bangke', 'b4ngke', 'bangk3',
        'bangkai', 'b4ngkai',
        'setan', 's3tan', 'set4n',
        'iblis', '1blis', 'ibl1s',
        'kafir', 'k4fir', 'kaf1r',
        'biadab', 'bi4dab', 'biad4b',
        'laknat', 'l4knat', 'lakn4t',
        'terkutuk', 't3rkutuk',
        'sinapret', 's1napret',
        'semprul', 's3mprul',
        'pekok', 'p3kok', 'pek0k',
        'mbahmu', 'mb4hmu',
        'lolol', 'l0lol',
        'budek', 'bud3k', 'bud3g',
        'buta', 'but4',
        'cacat', 'c4cat', 'cac4t',
        'gila', 'g1la', 'gil4',
        'edan', '3dan', 'ed4n',
        'ora waras', '0ra waras',
        'tidak waras', 'tdk waras',
        'sarap', 's4rap', 'sar4p',
        'sinting', 's1nting', 'sint1ng',
    ];
}

// =============================================================================
// Normalisasi teks: angka → huruf, huruf berulang, lowercase
// =============================================================================
function normalisasiTeks(string $teks): string
{
    $teks = mb_strtolower($teks);

    // Ganti angka yang sering dipakai sebagai pengganti huruf
    $map = [
        '0' => 'o',
        '1' => 'i',
        '3' => 'e',
        '4' => 'a',
        '5' => 's',
        '6' => 'g',
        '7' => 't',
        '8' => 'b',
        '@' => 'a',
        '!' => 'i',
        '$' => 's',
        '+' => 't',
    ];

    foreach ($map as $angka => $huruf) {
        $teks = str_replace($angka, $huruf, $teks);
    }

    // Hapus karakter berulang lebih dari 2x (cth: "aaanjing" → "aanjing")
    $teks = preg_replace('/(.)\1{2,}/', '$1$1', $teks);

    // Hapus tanda baca yang disisipkan di antara huruf (cth: "a.n.j.i.n.g" → "anjing")
    $teks = preg_replace('/([a-z])[^a-z0-9\s](?=[a-z])/u', '$1', $teks);

    return $teks;
}

// =============================================================================
// Deteksi apakah teks mengandung kata terlarang
// =============================================================================
function mengandungKataTerlarang(string $teks): bool
{
    $teksNormal = normalisasiTeks($teks);
    $daftarKata = getKataTerlarang();

    foreach ($daftarKata as $kata) {
        $kataNormal = normalisasiTeks($kata);
        // Gunakan word boundary agar tidak salah saring kata normal
        $pattern = '/\b' . preg_quote($kataNormal, '/') . '\b/u';
        if (preg_match($pattern, $teksNormal)) {
            return true;
        }
    }

    return false;
}

// =============================================================================
// Sensor kata terlarang dalam teks — ganti dengan ***
// =============================================================================
function sensorKataTerlarang(string $teks): string
{
    $daftarKata = getKataTerlarang();

    foreach ($daftarKata as $kata) {
        // Sensor di teks asli berdasarkan kata yang sudah dinormalisasi
        $kataNormal = normalisasiTeks($kata);
        $teksNormal = normalisasiTeks($teks);

        if (mb_strpos($teksNormal, $kataNormal) !== false) {
            // Cari posisi kata di teks normal lalu sensor di teks asli
            $pattern = '/\b' . preg_quote($kataNormal, '/') . '\b/ui';
            $teks = preg_replace_callback($pattern, function ($matches) {
                return str_repeat('*', mb_strlen($matches[0]));
            }, $teks);
        }
    }

    return $teks;
}
