<?php
// db.php - Database configuration for local development only
// XAMPP localhost configuration

// Local XAMPP development settings
$DB_HOST = 'localhost';   // MySQL host
$DB_NAME = 'ledgerly';    // Database name
$DB_USER = 'root';        // Default XAMPP MySQL user
$DB_PASS = 'root';            // Default XAMPP MySQL password (empty) 

try {
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed', 'message' => $e->getMessage()]);
    exit;
}
// Always use UTC for consistency (dynamic and global)
date_default_timezone_set('UTC');
$pdo->exec("SET time_zone = '+00:00'");