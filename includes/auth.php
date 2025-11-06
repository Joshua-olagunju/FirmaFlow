<?php
// Session management helper functions
require_once __DIR__ . '/subscription_helper.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit();
    }
}

function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'] ?? null,
        'email' => $_SESSION['user_email'] ?? null,
        'name' => $_SESSION['user_name'] ?? null,
        'role' => $_SESSION['user_role'] ?? null,
        'company_id' => $_SESSION['company_id'] ?? null,
        'company_name' => $_SESSION['company_name'] ?? null
    ];
}

function logout() {
    session_destroy();
    header('Location: login.php');
    exit();
}

// Check if user is trying to access protected page without login
function checkAuthentication() {
    $currentPage = basename($_SERVER['PHP_SELF']);
    $publicPages = ['login.php', 'signup.php', 'landing.php', 'index.php'];
    
    if (!in_array($currentPage, $publicPages) && !isLoggedIn()) {
        header('Location: login.php');
        exit();
    }
}

// Check subscription access (all users follow company admin's subscription)
function checkSubscriptionAccess() {
    if (!isLoggedIn()) {
        return;
    }
    
    $user = getCurrentUser();
    $userId = $user['id'] ?? 0;
    
    // Check if user can access the system based on subscription
    if (!canUserAccessSystem($userId)) {
        $currentPage = basename($_SERVER['PHP_SELF']);
        $allowedPages = ['subscription.php', 'logout.php', 'subscription-success.php'];
        
        // If user is on an unallowed page, redirect to subscription
        if (!in_array($currentPage, $allowedPages)) {
            $_SESSION['error_message'] = 'Your trial has expired. Please subscribe to continue using the system.';
            header('Location: subscription.php');
            exit();
        }
    }
}

// Check if user has access to a specific page based on their role
function checkRoleAccess($requiredRoles = ['admin', 'manager', 'user']) {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit();
    }
    
    $user = getCurrentUser();
    $userRole = $user['role'] ?? 'user';
    
    if (!in_array($userRole, $requiredRoles)) {
        // Redirect to dashboard with error message
        $_SESSION['error_message'] = 'You do not have permission to access this page.';
        header('Location: index.php');
        exit();
    }
}

// Get user role permissions
function getUserPermissions($role = null) {
    if (!$role) {
        $user = getCurrentUser();
        $role = $user['role'] ?? 'user';
    }
    
    $permissions = [
        'admin' => [
            'pages' => ['dashboard', 'customers', 'suppliers', 'products', 'sales', 'purchases', 'expenses', 'payments', 'reports', 'advanced_reports', 'settings'],
            'actions' => ['create', 'read', 'update', 'delete', 'manage_users'],
        ],
        'manager' => [
            'pages' => ['dashboard', 'customers', 'suppliers', 'products', 'sales', 'purchases', 'expenses', 'payments', 'reports', 'advanced_reports'],
            'actions' => ['create', 'read', 'update', 'delete'],
        ],
        'user' => [
            'pages' => ['dashboard', 'products', 'sales', 'payments'],
            'actions' => ['read', 'create_sales'],
        ],
    ];
    
    return $permissions[$role] ?? $permissions['user'];
}

// Complete authentication and subscription check (use this in pages)
function requireAuthAndSubscription() {
    checkAuthentication();
    checkSubscriptionAccess();
}
?>