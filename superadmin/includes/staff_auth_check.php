<?php
// Staff Access Control Helper
// Include this file to enforce staff authentication and permissions

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if staff is authenticated
function isStaffLoggedIn() {
    return isset($_SESSION['staff_id']) && isset($_SESSION['staff_username']);
}

// Check if staff has specific permission
function hasStaffPermission($permission) {
    if (!isStaffLoggedIn()) {
        return false;
    }
    
    $permissions = $_SESSION['staff_permissions'] ?? [];
    return in_array($permission, $permissions);
}

// Require staff authentication
function requireStaffLogin($redirectUrl = 'staff_login.php') {
    if (!isStaffLoggedIn()) {
        // Check if it's an AJAX request
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
            strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Authentication required', 'redirect' => 'login']);
            exit;
        } else {
            header("Location: $redirectUrl");
            exit;
        }
    }
}

// Require specific permission
function requireStaffPermission($permission, $redirectUrl = 'staff_login.php') {
    requireStaffLogin($redirectUrl);
    
    if (!hasStaffPermission($permission)) {
        // Check if it's an AJAX request
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
            strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permission denied']);
            exit;
        } else {
            // Redirect to first available page or login
            $permissions = $_SESSION['staff_permissions'] ?? [];
            if (in_array('complaints', $permissions)) {
                header("Location: ../staff_dashboard.php?page=complaints");
            } elseif (in_array('chat', $permissions)) {
                header("Location: ../staff_dashboard.php?page=chat");
            } else {
                header("Location: $redirectUrl");
            }
            exit;
        }
    }
}

// Get current staff info
function getCurrentStaff() {
    if (!isStaffLoggedIn()) {
        return null;
    }
    
    return [
        'id' => $_SESSION['staff_id'],
        'username' => $_SESSION['staff_username'],
        'full_name' => $_SESSION['staff_full_name'] ?? '',
        'role' => $_SESSION['staff_role'] ?? 'staff',
        'permissions' => $_SESSION['staff_permissions'] ?? []
    ];
}

// Check if current page requires authentication
$currentFile = basename($_SERVER['PHP_SELF']);
$publicPages = ['staff_login.php'];

// If not a public page, require authentication
if (!in_array($currentFile, $publicPages)) {
    requireStaffLogin('../staff_login.php');
}
?>