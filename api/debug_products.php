<?php
session_start();
header('Content-Type: application/json');

// CORS Headers
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowed_origins, true)) {
    header('Vary: Origin');
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}

require_once __DIR__ . '/../includes/db.php';

if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$company_id = $_SESSION['company_id'];

try {
    // Get all products for this company
    $stmt = $pdo->prepare("SELECT id, name, sku, company_id, track_inventory, stock_quantity, is_active, created_at FROM products WHERE company_id = ? ORDER BY created_at DESC LIMIT 20");
    $stmt->execute([$company_id]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count
    $count_stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE company_id = ?");
    $count_stmt->execute([$company_id]);
    $total_count = $count_stmt->fetchColumn();
    
    // Get all products (any company) for debugging
    $all_stmt = $pdo->query("SELECT id, name, sku, company_id, created_at FROM products ORDER BY created_at DESC LIMIT 10");
    $all_products = $all_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'session_company_id' => $company_id,
        'total_products_in_company' => $total_count,
        'products_for_this_company' => $products,
        'recent_products_all_companies' => $all_products,
        'session_data' => [
            'user_id' => $_SESSION['user_id'] ?? null,
            'user_email' => $_SESSION['user_email'] ?? null,
            'company_name' => $_SESSION['company_name'] ?? null
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
