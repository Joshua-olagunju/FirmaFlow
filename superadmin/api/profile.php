<?php
/**
 * SuperAdmin Profile Management API
 * Handles profile updates and password changes
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Security headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Check if user is super admin
if (!isset($_SESSION['superadmin_logged_in']) || $_SESSION['superadmin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

require_once '../includes/db.php';

$response = ['success' => false, 'message' => ''];

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? $_POST['action'] ?? '';

    if ($action === 'change_password') {
        $current_password = $input['current_password'] ?? $_POST['current_password'] ?? '';
        $new_password = $input['new_password'] ?? $_POST['new_password'] ?? '';
        $confirm_password = $input['confirm_password'] ?? $_POST['confirm_password'] ?? '';

        // Validate inputs
        if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
            throw new Exception('All password fields are required');
        }

        if ($new_password !== $confirm_password) {
            throw new Exception('New passwords do not match');
        }

        if (strlen($new_password) < 8) {
            throw new Exception('New password must be at least 8 characters long');
        }

        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/', $new_password)) {
            throw new Exception('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
        }

        // Get current superadmin credentials
        $superadmin_users = [
            'superadmin' => [
                'password' => 'SuperAdmin123!',
                'full_name' => 'Super Administrator',
                'role' => 'superadmin',
                'department' => 'System Administration'
            ]
        ];

        $currentUser = $_SESSION['superadmin_user'];
        
        // Verify current password
        if ($current_password !== $superadmin_users[$currentUser['username']]['password']) {
            throw new Exception('Current password is incorrect');
        }

        // In a real application, you would:
        // 1. Hash the new password with password_hash()
        // 2. Update the database with the new hashed password
        // 3. Invalidate existing sessions if needed
        
        // For now, we'll simulate this by updating a password file or config
        $hashedPassword = password_hash($new_password, PASSWORD_DEFAULT);
        
        // Log the password change
        $stmt = $pdo->prepare("INSERT INTO superadmin_logs (username, action, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([
            $currentUser['username'],
            'password_changed',
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);

        // In production, you would update the credentials file or database here
        // For demonstration, we'll create a temporary password change log
        $passwordChangeLog = [
            'username' => $currentUser['username'],
            'old_password_hash' => password_hash($current_password, PASSWORD_DEFAULT),
            'new_password_hash' => $hashedPassword,
            'changed_at' => date('Y-m-d H:i:s'),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];

        file_put_contents(
            __DIR__ . '/../logs/password_changes.json', 
            json_encode($passwordChangeLog, JSON_PRETTY_PRINT) . "\n", 
            FILE_APPEND | LOCK_EX
        );

        $response = [
            'success' => true, 
            'message' => 'Password changed successfully. Please use your new password for future logins.',
            'note' => 'In production, this would update your actual login credentials.'
        ];

    } elseif ($action === 'update_profile') {
        $full_name = trim($input['full_name'] ?? $_POST['full_name'] ?? '');
        $department = trim($input['department'] ?? $_POST['department'] ?? '');

        if (empty($full_name)) {
            throw new Exception('Full name is required');
        }

        // Update session data
        $_SESSION['superadmin_user']['full_name'] = $full_name;
        $_SESSION['superadmin_user']['department'] = $department;

        // Log the profile update
        $stmt = $pdo->prepare("INSERT INTO superadmin_logs (username, action, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([
            $_SESSION['superadmin_user']['username'],
            'profile_updated',
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);

        $response = [
            'success' => true, 
            'message' => 'Profile updated successfully',
            'user' => $_SESSION['superadmin_user']
        ];

    } elseif ($action === 'get_profile') {
        // Return current profile information
        $response = [
            'success' => true,
            'user' => $_SESSION['superadmin_user'],
            'session_info' => [
                'login_time' => $_SESSION['superadmin_login_time'] ?? null,
                'last_activity' => $_SESSION['superadmin_last_activity'] ?? null
            ]
        ];

    } else {
        throw new Exception('Invalid action specified');
    }

} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
}

echo json_encode($response);
?>