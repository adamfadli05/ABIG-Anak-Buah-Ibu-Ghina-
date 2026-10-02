<?php
session_start();
session_unset();
session_destroy();

header('Location: http://localhost/ABIG-Anak-Buah-Ibu-Ghina-/frontend/index.html');
exit;