<?php
// SuperAdmin Logout Handler
session_start();

// Security headers (only if headers not sent)
if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
}

// Log the logout action with more details
if (isset($_SESSION['superadmin_user']['username'])) {
    require_once __DIR__ . '/includes/db.php';
    try {
        $stmt = $pdo->prepare("INSERT INTO superadmin_logs (username, action, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([
            $_SESSION['superadmin_user']['username'], 
            'logout', 
            $_SERVER['REMOTE_ADDR'] ?? 'unknown', 
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    } catch (Exception $e) {
        // Log errors silently - don't stop logout process
        error_log("SuperAdmin logout logging error: " . $e->getMessage());
    }
}

// Store username for goodbye message
$username = $_SESSION['superadmin_user']['username'] ?? 'SuperAdmin';

// Clear ALL superadmin session data
unset($_SESSION['superadmin_logged_in']);
unset($_SESSION['superadmin_user']);
unset($_SESSION['superadmin_login_time']);
unset($_SESSION['superadmin_last_activity']);

// Clear any other potential session data related to superadmin
foreach ($_SESSION as $key => $value) {
    if (strpos($key, 'superadmin') !== false || strpos($key, 'admin') !== false) {
        unset($_SESSION[$key]);
    }
}

// Destroy entire session if empty or force destroy for security
session_unset();
session_destroy();

// Start a new clean session for the logout message
session_start();
session_regenerate_id(true);

// Set logout success message
$_SESSION['logout_success'] = "Goodbye " . htmlspecialchars($username) . "! You have been successfully logged out.";

// Redirect to login with logged out status
header('Location: login.php?logged_out=1');
exit;
?>