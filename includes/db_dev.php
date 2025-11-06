<?php
/**
 * Database Configuration for Local Development
 * Safe for version control - localhost settings only
 */

// Local Development Database Configuration
$DB_HOST = 'localhost';
$DB_NAME = 'ledgerly';
$DB_USER = 'root';
$DB_PASS = '';

// Development mode settings
$DB_DEBUG = true;
$DB_LOG_QUERIES = false; // Set to true if you want to log all queries

try {
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Development logging
    if ($DB_DEBUG) {
        error_log("[DB] Connected to development database: {$DB_NAME}");
    }
    
} catch (Exception $e) {
    error_log("[DB ERROR] Connection failed: " . $e->getMessage());
    http_response_code(500);
    
    if ($DB_DEBUG) {
        echo json_encode([
            'error' => 'Database connection failed', 
            'message' => $e->getMessage(),
            'debug' => "Trying to connect to: {$DB_HOST}/{$DB_NAME}"
        ]);
    } else {
        echo json_encode(['error' => 'Database connection failed']);
    }
    exit;
}

/**
 * DEVELOPMENT SETUP INSTRUCTIONS FOR FRONTEND TEAM:
 * 
 * 1. Install XAMPP with MySQL and Apache
 * 2. Start Apache and MySQL services in XAMPP Control Panel
 * 3. Open phpMyAdmin (http://localhost/phpmyadmin)
 * 4. Create database named 'ledgerly'
 * 5. Import the schema from database/firmaflow_complete_schema_v2.sql
 * 6. Clone this project to xampp/htdocs/firmaflow-React/
 * 7. Access the API at: http://localhost/firmaflow-React/FirmaFlow/api/
 * 
 * Database Connection Details:
 * - Host: localhost
 * - Database: ledgerly  
 * - Username: root
 * - Password: (empty)
 * - Port: 3306 (default)
 */
?>