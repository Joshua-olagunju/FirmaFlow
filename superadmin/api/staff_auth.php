<?php
// Staff Authentication API
// Handles staff login, logout, and session management

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Ensure session is started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include database connection
require_once '../includes/db.php';

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get database connection
function getDB() {
    try {
        return getSuperAdminDB();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed']);
        exit;
    }
}

// Main request handling
try {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    // Route requests
    switch ($method) {
        case 'GET':
            handleGetRequest($action);
            break;
        case 'POST':
            handlePostRequest();
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}

function handleGetRequest($action) {
    switch ($action) {
        case 'verify_session':
            verifyStaffSession();
            break;
        case 'get_current_staff':
            getCurrentStaff();
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

function handlePostRequest() {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'login':
            staffLogin($input);
            break;
        case 'logout':
            staffLogout();
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

// Staff login
function staffLogin($data) {
    $pdo = getDB();
    
    try {
        // Validate required fields
        if (empty($data['username']) || empty($data['password'])) {
            echo json_encode(['success' => false, 'error' => 'Username and password are required']);
            return;
        }
        
        // Find staff member
        $stmt = $pdo->prepare("
            SELECT id, full_name, username, email, password_hash, role, status, permissions
            FROM staff_members 
            WHERE username = ? AND status = 'active'
        ");
        $stmt->execute([$data['username']]);
        $staff = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$staff) {
            echo json_encode(['success' => false, 'error' => 'Invalid username or password']);
            return;
        }
        
        // Verify password
        if (!password_verify($data['password'], $staff['password_hash'])) {
            echo json_encode(['success' => false, 'error' => 'Invalid username or password']);
            return;
        }
        
        // Create session
        $sessionToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+8 hours'));
        
        // Clean up old sessions for this staff member
        $stmt = $pdo->prepare("DELETE FROM staff_sessions WHERE staff_id = ? OR expires_at < NOW()");
        $stmt->execute([$staff['id']]);
        
        // Insert new session
        $stmt = $pdo->prepare("
            INSERT INTO staff_sessions (staff_id, session_token, expires_at)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$staff['id'], $sessionToken, $expiresAt]);
        
        // Update last login
        $stmt = $pdo->prepare("UPDATE staff_members SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$staff['id']]);
        
        // Set session data
        $_SESSION['staff_id'] = $staff['id'];
        $_SESSION['staff_username'] = $staff['username'];
        $_SESSION['staff_full_name'] = $staff['full_name'];
        $_SESSION['staff_role'] = $staff['role'];
        $_SESSION['staff_permissions'] = json_decode($staff['permissions'], true);
        $_SESSION['staff_session_token'] = $sessionToken;
        
        // Remove sensitive data before returning
        unset($staff['password_hash']);
        $staff['permissions'] = json_decode($staff['permissions'], true);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Login successful',
            'staff' => $staff,
            'session_token' => $sessionToken
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Login failed: ' . $e->getMessage()]);
    }
}

// Staff logout
function staffLogout() {
    $pdo = getDB();
    
    try {
        // Delete session from database if exists
        if (isset($_SESSION['staff_session_token'])) {
            $stmt = $pdo->prepare("DELETE FROM staff_sessions WHERE session_token = ?");
            $stmt->execute([$_SESSION['staff_session_token']]);
        }
        
        // Clear session data
        unset($_SESSION['staff_id']);
        unset($_SESSION['staff_username']);
        unset($_SESSION['staff_full_name']);
        unset($_SESSION['staff_role']);
        unset($_SESSION['staff_permissions']);
        unset($_SESSION['staff_session_token']);
        
        echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Logout failed: ' . $e->getMessage()]);
    }
}

// Verify staff session
function verifyStaffSession() {
    $pdo = getDB();
    
    try {
        if (!isset($_SESSION['staff_id']) || !isset($_SESSION['staff_session_token'])) {
            echo json_encode(['success' => false, 'error' => 'No active session']);
            return;
        }
        
        // Check if session exists and is valid
        $stmt = $pdo->prepare("
            SELECT s.*, sm.status, sm.full_name, sm.permissions
            FROM staff_sessions s
            JOIN staff_members sm ON s.staff_id = sm.id
            WHERE s.session_token = ? AND s.expires_at > NOW() AND sm.status = 'active'
        ");
        $stmt->execute([$_SESSION['staff_session_token']]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$session) {
            // Clear invalid session
            unset($_SESSION['staff_id']);
            unset($_SESSION['staff_username']);
            unset($_SESSION['staff_full_name']);
            unset($_SESSION['staff_role']);
            unset($_SESSION['staff_permissions']);
            unset($_SESSION['staff_session_token']);
            
            echo json_encode(['success' => false, 'error' => 'Session expired or invalid']);
            return;
        }
        
        // Update session expiry
        $newExpiresAt = date('Y-m-d H:i:s', strtotime('+8 hours'));
        $stmt = $pdo->prepare("UPDATE staff_sessions SET expires_at = ? WHERE session_token = ?");
        $stmt->execute([$newExpiresAt, $_SESSION['staff_session_token']]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Session valid',
            'staff' => [
                'id' => $_SESSION['staff_id'],
                'username' => $_SESSION['staff_username'],
                'full_name' => $_SESSION['staff_full_name'],
                'role' => $_SESSION['staff_role'],
                'permissions' => $_SESSION['staff_permissions']
            ]
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Session verification failed: ' . $e->getMessage()]);
    }
}

// Get current staff
function getCurrentStaff() {
    if (!isset($_SESSION['staff_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }
    
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, full_name, username, email, role, status, permissions, last_login
            FROM staff_members 
            WHERE id = ?
        ");
        $stmt->execute([$_SESSION['staff_id']]);
        $staff = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$staff) {
            echo json_encode(['success' => false, 'error' => 'Staff not found']);
            return;
        }
        
        $staff['permissions'] = json_decode($staff['permissions'], true);
        
        echo json_encode(['success' => true, 'staff' => $staff]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to get staff: ' . $e->getMessage()]);
    }
}

// Helper function to check if staff is authenticated
function isStaffAuthenticated() {
    return isset($_SESSION['staff_id']) && isset($_SESSION['staff_session_token']);
}

// Helper function to check if staff has permission
function hasPermission($permission) {
    if (!isStaffAuthenticated()) {
        return false;
    }
    
    $permissions = $_SESSION['staff_permissions'] ?? [];
    return in_array($permission, $permissions);
}

// Helper function to require authentication
function requireStaffAuth() {
    if (!isStaffAuthenticated()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authentication required']);
        exit;
    }
}

// Helper function to require specific permission
function requirePermission($permission) {
    requireStaffAuth();
    
    if (!hasPermission($permission)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Permission denied']);
        exit;
    }
}
?>