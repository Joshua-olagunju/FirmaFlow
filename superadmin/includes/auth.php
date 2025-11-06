<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Security headers (only if headers not sent)
if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
}

// Superadmin authentication and security
function isSuperAdmin() {
    return isset($_SESSION['superadmin_logged_in']) && $_SESSION['superadmin_logged_in'] === true;
}

function requireSuperAdmin() {
    if (!isSuperAdmin()) {
        header('Location: login.php');
        exit;
    }
}

function getSuperAdminUser() {
    if (isSuperAdmin() && isset($_SESSION['superadmin_user'])) {
        return $_SESSION['superadmin_user'];
    }
    return [
        'id' => 'superadmin',
        'username' => 'Super Admin',
        'full_name' => 'Super Administrator',
        'role' => 'superadmin',
        'department' => 'System Administration'
    ];
}

// Database connection for superadmin
require_once __DIR__ . '/../../includes/db.php';
?>