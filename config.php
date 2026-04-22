<?php
// ─────────────────────────────────────────────
//  SUSANA STORE — Database Configuration
//  Edit DB_USER and DB_PASS to match your MySQL
// ─────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'susana_store');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

$conn->set_charset('utf8mb4');

// Upload settings
define('UPLOAD_DIR',  __DIR__ . '/uploads/');
define('UPLOAD_URL',  'uploads/');
define('MAX_IMG_SIZE', 5 * 1024 * 1024); // 5 MB
define('ALLOWED_MIME', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
?>
