<?php
/**
 * SuperAdmin Authentication API
 * Handles login, logout, and session management for SuperAdmin
 */

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

function logSuperAdminAction($username, $action, $details = null, $targetType = null, $targetId = null) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            INSERT INTO superadmin_logs (username, action, target_type, target_id, details, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $username,
            $action,
            $targetType,
            $targetId,
            $details,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    } catch (Exception $e) {
        error_log("Failed to log superadmin action: " . $e->getMessage());
    }
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'check_session':
        handleCheckSession();
        break;
    case 'update_profile':
        handleUpdateProfile();
        break;
    case 'change_password':
        handleChangePassword();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

function handleLogin() {
    global $pdo;
    
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $remember = isset($_POST['remember']) && $_POST['remember'] === 'true';
    
    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password are required']);
        return;
    }

    try {
        // First check staff_accounts table
        $stmt = $pdo->prepare("
            SELECT id, username, email, password_hash, full_name, role, department, is_active, last_login
            FROM staff_accounts 
            WHERE (username = ? OR email = ?) AND is_active = 1
        ");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Fallback to hardcoded demo accounts
        if (!$user) {
            $demoAccounts = [
                'superadmin' => [
                    'id' => 1,
                    'username' => 'superadmin',
                    'email' => 'superadmin@firmaflow.com',
                    'password_hash' => password_hash('SuperAdmin123!', PASSWORD_DEFAULT),
                    'full_name' => 'Super Administrator',
                    'role' => 'superadmin',
                    'department' => 'System Administration',
                    'is_active' => 1,
                    'last_login' => null
                ],
                'admin' => [
                    'id' => 2,
                    'username' => 'admin',
                    'email' => 'admin@firmaflow.com',
                    'password_hash' => password_hash('Admin123!', PASSWORD_DEFAULT),
                    'full_name' => 'System Administrator',
                    'role' => 'admin',
                    'department' => 'Administration',
                    'is_active' => 1,
                    'last_login' => null
                ]
            ];

            if (isset($demoAccounts[$username])) {
                $user = $demoAccounts[$username];
            }
        }

        if (!$user || !password_verify($password, $user['password_hash'])) {
            logSuperAdminAction($username, 'LOGIN_FAILED', 'Invalid credentials');
            echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
            return;
        }

        if (!in_array($user['role'], ['superadmin', 'admin', 'manager'])) {
            logSuperAdminAction($username, 'LOGIN_FAILED', 'Insufficient privileges');
            echo json_encode(['success' => false, 'message' => 'Insufficient privileges to access SuperAdmin']);
            return;
        }

        // Create session
        session_start();
        session_regenerate_id(true);
        
        $_SESSION['superadmin_logged_in'] = true;
        $_SESSION['superadmin_user'] = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'role' => $user['role'],
            'department' => $user['department']
        ];
        $_SESSION['superadmin_login_time'] = time();

        // Update last login
        if (isset($user['id']) && $user['id'] > 2) { // Only update real database records
            $updateStmt = $pdo->prepare("UPDATE staff_accounts SET last_login = NOW() WHERE id = ?");
            $updateStmt->execute([$user['id']]);
        }

        // Set remember me cookie if requested
        if ($remember) {
            $token = bin2hex(random_bytes(32));
            setcookie('superadmin_remember', $token, time() + (30 * 24 * 60 * 60), '/', '', true, true);
        }

        logSuperAdminAction($user['username'], 'LOGIN_SUCCESS', 'User logged in successfully');

        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'role' => $user['role'],
                'department' => $user['department']
            ],
            'redirect' => '/superadmin/'
        ]);

    } catch (Exception $e) {
        error_log("SuperAdmin login error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred during login']);
    }
}

function handleLogout() {
    session_start();
    
    $username = $_SESSION['superadmin_user']['username'] ?? 'unknown';
    
    // Clear session
    $_SESSION = [];
    session_destroy();
    
    // Clear remember me cookie
    if (isset($_COOKIE['superadmin_remember'])) {
        setcookie('superadmin_remember', '', time() - 3600, '/', '', true, true);
    }
    
    logSuperAdminAction($username, 'LOGOUT', 'User logged out');
    
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully',
        'redirect' => '/superadmin/login.php'
    ]);
}

function handleCheckSession() {
    session_start();
    
    if (!isSuperAdmin()) {
        echo json_encode(['success' => false, 'authenticated' => false]);
        return;
    }
    
    $user = getSuperAdminUser();
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'user' => $user,
        'session_time_remaining' => 3600 - (time() - ($_SESSION['superadmin_login_time'] ?? time()))
    ]);
}

function handleUpdateProfile() {
    requireSuperAdmin();
    global $pdo;
    
    $user = getSuperAdminUser();
    $fullName = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $department = trim($_POST['department'] ?? '');
    
    if (empty($fullName) || empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Full name and email are required']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }
    
    try {
        // Check if this is a demo account
        if ($user['id'] <= 2) {
            echo json_encode(['success' => false, 'message' => 'Demo accounts cannot be modified']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE staff_accounts 
            SET full_name = ?, email = ?, department = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$fullName, $email, $department, $user['id']]);
        
        // Update session
        $_SESSION['superadmin_user']['full_name'] = $fullName;
        $_SESSION['superadmin_user']['email'] = $email;
        $_SESSION['superadmin_user']['department'] = $department;
        
        logSuperAdminAction($user['username'], 'PROFILE_UPDATED', 'Profile information updated');
        
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $_SESSION['superadmin_user']
        ]);
        
    } catch (Exception $e) {
        error_log("Profile update error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to update profile']);
    }
}

function handleChangePassword() {
    requireSuperAdmin();
    global $pdo;
    
    $user = getSuperAdminUser();
    $currentPassword = $_POST['current_password'] ?? '';
    $newPassword = $_POST['new_password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    
    if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
        echo json_encode(['success' => false, 'message' => 'All password fields are required']);
        return;
    }
    
    if ($newPassword !== $confirmPassword) {
        echo json_encode(['success' => false, 'message' => 'New passwords do not match']);
        return;
    }
    
    if (strlen($newPassword) < 8) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long']);
        return;
    }
    
    try {
        // Check if this is a demo account
        if ($user['id'] <= 2) {
            echo json_encode(['success' => false, 'message' => 'Demo account passwords cannot be changed']);
            return;
        }
        
        // Verify current password
        $stmt = $pdo->prepare("SELECT password_hash FROM staff_accounts WHERE id = ?");
        $stmt->execute([$user['id']]);
        $currentHash = $stmt->fetchColumn();
        
        if (!password_verify($currentPassword, $currentHash)) {
            echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
            return;
        }
        
        // Update password
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("
            UPDATE staff_accounts 
            SET password_hash = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$newHash, $user['id']]);
        
        logSuperAdminAction($user['username'], 'PASSWORD_CHANGED', 'Password changed successfully');
        
        echo json_encode([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Password change error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to change password']);
    }
}
?>