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
        'anjing', 'anjir', 'anying', 'anj1ng', 'anj!ng', '4nj1ng', '4njing', '4nj!ng',
        'babi', 'b4bi', 'bab1', 'b4b1',
        'bangsat', 'b4ngsat', 'bangz4t', 'b4ngs4t',
        'bajingan', 'b4jingan', 'bajing4n', 'b4jing4n',
        'bedebah', 'bed3bah', 'b3debah', 'b3d3bah',
        'brengsek', 'br3ngsek', 'brengs3k', 'br3ngs3k',
        'celeng', 'c3leng', 'cel3ng',
        'keparat', 'k3parat', 'kep4rat', 'k3p4rat',
        'sialan', 'si4lan', 's1alan', 's14lan', 's1al4n',
        'sial', 's14l', 's1al',
        'goblok', 'g0blok', 'goblog', 'g0blog', 'g0bl0k', 'g0bl0g',
        'bodoh', 'b0doh', 'b0d0h',
        'tolol', 't0lol', 'tol0l', 't0l0l',
        'idiot', '1diot', 'idi0t', '1di0t',
        'dungu', 'd0ngu', 'dung0', 'd0ng0',
        'kampret', 'k4mpret', 'k@mpret', 'k4mpr3t',
        'kurang ajar', 'kur4ng ajar', 'kur4ng 4j4r',
        'monyet', 'm0nyet', 'mony3t', 'm0ny3t',
        'tai', 't41', 't4i',
        'tahi', 't4hi', 'tah1', 't4h1',
        'asu', '4su', 'a5u', '45u',

        // Kata seksual / vulgar
        'cok', 'c0k',
        'cuki', 'cuk1', 'c0ki', 'c0k1',
        'kontol', 'k0ntol', 'kont0l', 'k0nt0l', 'k0nt01', 'k0ntol',
        'memek', 'm3mek', 'mem3k', 'm3m3k',
        'pepek', 'p3pek', 'pep3k', 'p3p3k',
        'ngentot', 'ng3ntot', 'ngent0t', 'ng3nt0t', 'ng3nt0t', 'ng3nto7',
        'ngentod', 'ng3ntod', 'ng3nt0d',
        'entot', '3ntot', 'ent0t', '3nt0t',
        'ngewe', 'ng3we', 'ngew3', 'ng3w3', 'ng€we',
        'ngwe', 'ng\/e',
        'ewe', '3we', 'ew3', '3w3',
        'jancok', 'j4ncok', 'janc0k', 'j4nc0k', 'j4nc0k',
        'jancuk', 'j4ncuk', 'janc0k', 'j4ncuk', 'j4nc0k',
        'ndasmu', 'nd4smu', 'nd4sm0',
        'jembut', 'j3mbut', 'jemb0t', 'j3mb0t',
        'mbut', 'mb0t',
        'matamu', 'm4tamu', 'm4t4mu', 'mat4mu',
        'matane', 'm4tane', 'm4t4ne',
        'dancok', 'd4ncok', 'danc0k', 'd4nc0k',
        'raimu', 'r41mu', 'r4imu', 'ra1mu',
        'kimak', 'k1mak', 'k!mak', 'k1m4k', 'k!m4k',
        'pukimak', 'puk1mak', 'p0kimak', 'p0k1mak', 'puk1m4k',
        'puki', 'puk1', 'p0ki', 'p0k1',
        'lancau', 'l4ncau', 'lanc4u', 'l4nc4u',
        'pantat', 'p4ntat', 'pant4t', 'p4nt4t', 'p@ntat', 'p@nt@t',
        'silit', 's1lit', 'sil1t', 's1l1t', 's!lit', 's!l!t',
        'titit', 't1tit', 'tit1t', 't1t1t',
        'toket', 't0ket', 'tok3t', 't0k3t',
        'memek', 'm3mek', 'mem3k', 'm3m3k',
        'coli', 'c0li', 'col1', 'c0l1',
        'ngocok', 'ng0cok', 'ngoc0k', 'ng0c0k',
        'masturbasi', 'm4sturbasi', 'masturb4si', 'm4sturb4si',
        'seks', 's3ks', 's€ks',
        'bokong', 'b0kong', 'bok0ng', 'b0k0ng',
        'bugil', 'bug1l', 'bug!l', 'b0gil', 'b0g1l',
        'telanjang', 't3lanjang', 'tel4njang', 't3l4nj4ng',

        // Kata kasar / hinaan lanjutan
        'bejat', 'b3jat', 'bej4t', 'b3j4t',
        'sundal', 'sund4l', 's0ndal', 's0nd4l',
        'pelacur', 'pel4cur', 'p3lacur', 'p3l4cur', 'p3l4c0r',
        'lonte', 'l0nte', 'lont3', 'l0nt3',
        'jalang', 'j4lang', 'jal4ng', 'j4l4ng',
        'bangke', 'b4ngke', 'bangk3', 'b4ngk3',
        'bangkai', 'b4ngkai', 'b4ngk4i',
        'setan', 's3tan', 'set4n', 's3t4n',
        'iblis', '1blis', 'ibl1s', '1bl1s',
        'kafir', 'k4fir', 'kaf1r', 'k4f1r',
        'biadab', 'bi4dab', 'biad4b', 'bi4d4b', 'b14d4b',
        'laknat', 'l4knat', 'lakn4t', 'l4kn4t',
        'terkutuk', 't3rkutuk', 't3rk0tuk',
        'sinapret', 's1napret', 's1napr3t',
        'semprul', 's3mprul', 's3mpr0l',
        'pekok', 'p3kok', 'pek0k', 'p3k0k',
        'mbahmu', 'mb4hmu', 'mb4hm0',
        'kirik', 'k1rik', 'kir1k', 'k1r1k', 'k!r!k',
        'kepala batu', 'k3pala batu', 'kep4la b4tu',
        'oon', '00n', 'o0n',
        'peot', 'pe0t', 'p3ot', 'p3o7',
        'blo\'on', 'bloon', 'bl0on', 'bl00n',
        'geblek', 'g3blek', 'gebl3k', 'g3bl3k',
        'bongol', 'b0ngol', 'bong0l', 'b0ng0l',

        // Kondisi/hinaan mental/fisik kasar
        'budek', 'bud3k', 'bud3g',
        'buta', 'but4',
        'cacat', 'c4cat', 'cac4t', 'c4c4t',
        'gila', 'g1la', 'gil4', 'g1l4',
        'edan', '3dan', 'ed4n', '3d4n',
        'ora waras', '0ra waras', '0r4 w4r4s',
        'tidak waras', 'tdk waras',
        'sarap', 's4rap', 'sar4p', 's4r4p',
        'sinting', 's1nting', 'sint1ng', 's1nt1ng',
        'lolol', 'l0lol', 'l0l0l',
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
//
// Cara kerja:
// 1. Normalisasi teks asli → teksNormal
// 2. Jalankan regex pencarian di teksNormal (karena leet-speak sudah
//    dinormalisasi menjadi huruf biasa di sana)
// 3. Ganti setiap kemunculan di teksNormal dengan bintang, lalu kembalikan
//    teksNormal yang sudah disensor sebagai output.
//    (Teks asli tidak dipakai karena pengguna yang sengaja memakai leet-speak
//    tetap harus tersensor — hasilnya berupa bintang, bukan teks asli.)
// =============================================================================
function sensorKataTerlarang(string $teks): string
{
    $daftarKata = getKataTerlarang();
    // Kerja di teks ternormalisasi agar leet-speak (4nj1ng, dll) ikut tertangkap
    $teksNormal = normalisasiTeks($teks);

    foreach ($daftarKata as $kata) {
        $kataNormal = normalisasiTeks($kata);
        // Gunakan word boundary — di teks ternormalisasi semua sudah huruf/spasi
        $pattern = '/\b' . preg_quote($kataNormal, '/') . '\b/u';
        $teksNormal = preg_replace_callback($pattern, function ($matches) {
            return str_repeat('*', mb_strlen($matches[0]));
        }, $teksNormal);
    }

    return $teksNormal;
}
