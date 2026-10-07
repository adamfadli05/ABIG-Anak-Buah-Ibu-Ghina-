<?php
session_start();

if (!isset($_SESSION['role'])) {
    header('Location: http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/frontend/index.html');
    exit;
}

session_unset();
session_destroy();

header('Location: http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/frontend/index.html');
exit;