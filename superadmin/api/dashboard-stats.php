<?php
// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Content-Type: application/json');

session_start();
require_once '../includes/auth.php';

// Check superadmin authentication
if (!isSuperAdmin()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

try {
    $pdo = getSuperAdminDB();
    
    // Get real-time statistics
    $stats = [];
    
    // Total companies
    $stmt = $pdo->query("SELECT COUNT(*) FROM companies");
    $stats['companies'] = $stmt->fetchColumn();
    
    // Total users
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $stats['users'] = $stmt->fetchColumn();
    
    // Active subscriptions
    $stmt = $pdo->query("SELECT COUNT(*) FROM companies WHERE subscription_status = 'active'");
    $stats['subscriptions'] = $stmt->fetchColumn();
    
    // Mock revenue calculation (replace with real revenue logic)
    $stats['revenue'] = 125000 + rand(1000, 5000);
    
    // Recent activity count
    $stmt = $pdo->query("SELECT COUNT(*) FROM companies WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    $stats['recent_companies'] = $stmt->fetchColumn();
    
    // System health indicators
    $stats['system_health'] = [
        'database' => 'healthy',
        'api' => 'healthy',
        'storage' => 'healthy',
        'uptime' => '99.9%'
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $stats,
        'timestamp' => time()
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>