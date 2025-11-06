<?php
// db.php - Database configuration with environment detection
// Check if we're in local development or production

// Try to detect environment - suppress warnings
$serverName = $_SERVER['SERVER_NAME'] ?? '';
$httpHost = $_SERVER['HTTP_HOST'] ?? '';

// Enhanced local environment detection for mobile access
$isLocal = (
    $serverName === 'localhost' || 
    $serverName === '127.0.0.1' || 
    strpos($serverName, 'localhost') !== false ||
    strpos($httpHost, '192.168.') !== false ||  // Local IP range
    strpos($httpHost, '10.0.') !== false ||     // Local IP range  
    strpos($httpHost, '172.16.') !== false ||   // Local IP range
    preg_match('/^192\.168\.\d+\.\d+/', $httpHost) ||
    preg_match('/^10\.\d+\.\d+\.\d+/', $httpHost) ||
    preg_match('/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/', $httpHost) ||
    empty($serverName) // CLI mode
);

if ($isLocal) {
    // Local XAMPP development settings - allow network access
    $DB_HOST = '127.0.0.1';  // Keep as localhost for MySQL connection
    $DB_NAME = 'ledgerly';   // Using the existing 'ledgerly' database
    $DB_USER = 'root';
    $DB_PASS = '';
} else {
    // Production settings  
    $DB_HOST = 'localhost';
    $DB_NAME = 'wiyzwzpp_Ghost';
    $DB_USER = 'wiyzwzpp_tayo';
    $DB_PASS = 'TemiladeLov1';
} 

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
