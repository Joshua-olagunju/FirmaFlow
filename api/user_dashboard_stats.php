<?php
// api/user_dashboard_stats.php - API endpoint for basic user dashboard data
session_start();

// CORS headers - support both dev ports
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once __DIR__ . '/../includes/db.php';
    
    // Simple authentication check
    if (!isset($_SESSION['company_id']) || !isset($_SESSION['user_id'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'User not authenticated']);
        exit;
    }
    
    $companyId = $_SESSION['company_id'];
    $userId = $_SESSION['user_id'];
    
    // Debug info
    $debug = [
        'company_id' => $companyId,
        'user_id' => $userId,
        'user_role' => $_SESSION['user_role'] ?? 'unknown',
        'user_name' => $_SESSION['user_name'] ?? 'unknown'
    ];
    
    // Get products count
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM products WHERE company_id = ?");
    $stmt->execute([$companyId]);
    $productsCount = $stmt->fetchColumn();
    
    // Get low stock count - check if the table has stock_quantity column
    $lowStockCount = 0;
    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM products
            WHERE company_id = ?
            AND stock_quantity <= COALESCE(reorder_level, 5)
        ");
        $stmt->execute([$companyId]);
        $lowStockCount = $stmt->fetchColumn();
    } catch (Exception $e) {
        // If stock_quantity doesn't exist, try quantity
        try {
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count
                FROM products
                WHERE company_id = ?
                AND quantity <= COALESCE(min_stock, 5)
            ");
            $stmt->execute([$companyId]);
            $lowStockCount = $stmt->fetchColumn();
        } catch (Exception $e2) {
            $lowStockCount = 0;
        }
    }
    
    // Get today's sales total - DAILY RESET AT MIDNIGHT
    $todaySales = 0;
    $todaySalesCount = 0;
    $todayPayments = 0;
    $pendingPayments = 0;
    
    try {
        // TODAY'S SALES (by current user only - resets daily)
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(total_amount), 0) as total,
                COUNT(*) as count
            FROM sales
            WHERE company_id = ?
            AND user_id = ?
            AND DATE(created_at) = CURDATE()
        ");
        $stmt->execute([$companyId, $userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $todaySales = $result['total'];
        $todaySalesCount = $result['count'];
        
        // Debug log
        error_log("User Dashboard: User $userId today's sales: $todaySales (count: $todaySalesCount)");
        
        // TODAY'S PAYMENTS RECEIVED (actual cash collected today by this user)
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(total_amount), 0) as total
            FROM sales
            WHERE company_id = ?
            AND user_id = ?
            AND payment_status = 'paid'
            AND DATE(created_at) = CURDATE()
        ");
        $stmt->execute([$companyId, $userId]);
        $todayPayments = $stmt->fetchColumn();
        
        // Get pending payments count for this user
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM sales
            WHERE company_id = ?
            AND user_id = ?
            AND payment_status IN ('pending', 'partial', 'unpaid', 'invoiced')
        ");
        $stmt->execute([$companyId, $userId]);
        $pendingPayments = $stmt->fetchColumn();
        
    } catch (Exception $e) {
        // Log the error for debugging
        error_log("Error fetching user sales data: " . $e->getMessage());
        $todaySales = 0;
        $todaySalesCount = 0;
        $todayPayments = 0;
        $pendingPayments = 0;
    }
    
    // Get products for the table - try different column combinations
    $products = [];
    try {
        // Try with stock_quantity first
        $stmt = $pdo->prepare("
            SELECT
                id,
                name,
                description,
                sku,
                stock_quantity,
                selling_price,
                reorder_level,
                is_active
            FROM products
            WHERE company_id = ?
            ORDER BY name ASC
            LIMIT 50
        ");
        $stmt->execute([$companyId]);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        try {
            // Try with quantity if stock_quantity doesn't exist
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    name,
                    description,
                    sku,
                    quantity as stock_quantity,
                    selling_price,
                    min_stock as reorder_level,
                    is_active
                FROM products
                WHERE company_id = ?
                ORDER BY name ASC
                LIMIT 50
            ");
            $stmt->execute([$companyId]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e2) {
            // Just get basic product info
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    name,
                    description,
                    sku,
                    0 as stock_quantity,
                    selling_price,
                    0 as reorder_level,
                    is_active
                FROM products
                WHERE company_id = ?
                ORDER BY name ASC
                LIMIT 50
            ");
            $stmt->execute([$companyId]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    // Get recent activity from sales - prioritize current user's sales
    $recentActivity = [];
    try {
        // Get recent sales by current user
        $stmt = $pdo->prepare("
            SELECT
                s.id,
                s.total_amount,
                s.created_at,
                s.payment_status,
                c.name as customer_name
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.company_id = ?
            AND s.user_id = ?
            ORDER BY s.created_at DESC
            LIMIT 5
        ");
        $stmt->execute([$companyId, $userId]);
        $recentSales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($recentSales as $sale) {
            $paymentStatusText = '';
            if (isset($sale['payment_status'])) {
                switch ($sale['payment_status']) {
                    case 'pending':
                    case 'partial':
                    case 'unpaid':
                    case 'invoiced':
                        $paymentStatusText = ' (Pending Payment)';
                        break;
                    case 'paid':
                        $paymentStatusText = ' (Paid)';
                        break;
                }
            }
            
            $recentActivity[] = [
                'icon' => 'receipt',
                'description' => 'Sale #' . $sale['id'] . ' - ' . ($sale['customer_name'] ?: 'Walk-in customer') . ' - ₦' . number_format($sale['total_amount'], 2) . $paymentStatusText,
                'time' => date('M j, g:i A', strtotime($sale['created_at']))
            ];
        }
    } catch (Exception $e) {
        error_log("Error fetching recent sales for user $userId: " . $e->getMessage());
    }
    
    // Add some default activities if none found
    if (empty($recentActivity)) {
        $recentActivity = [
            [
                'icon' => 'login',
                'description' => 'Logged into dashboard',
                'time' => date('M j, g:i A')
            ],
            [
                'icon' => 'box',
                'description' => 'Viewed products catalog',
                'time' => date('M j, g:i A', time() - 300)
            ]
        ];
    }

    // Get low stock items (same as admin dashboard)
    $lowStockItems = [];
    try {
        $stmt = $pdo->prepare("
            SELECT 
                id,
                name,
                sku,
                COALESCE(stock_quantity, quantity, 0) as stock_quantity,
                COALESCE(reorder_level, min_stock, 5) as reorder_level,
                COALESCE(selling_price, price, 0) as price
            FROM products
            WHERE company_id = ?
            AND COALESCE(stock_quantity, quantity, 0) <= COALESCE(reorder_level, min_stock, 5)
            ORDER BY COALESCE(stock_quantity, quantity, 0) ASC, name ASC
            LIMIT 50
        ");
        $stmt->execute([$companyId]);
        $lowStockItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Error fetching low stock items: " . $e->getMessage());
        $lowStockItems = [];
    }

    // Response data
    $response = [
        'success' => true,
        'products_count' => (int)$productsCount,
        'low_stock_count' => (int)$lowStockCount,
        
        // DAILY METRICS (resets at midnight)
        'today_sales' => (float)$todaySales,
        'today_sales_count' => (int)$todaySalesCount,
        'today_payments' => (float)$todayPayments,
        
        // OTHER METRICS
        'pending_payments' => (int)$pendingPayments,
        'products' => $products,
        'low_stock_items' => array_map(function($row) {
            $qty = isset($row['stock_quantity']) ? (int)$row['stock_quantity'] : 0;
            $reorder = isset($row['reorder_level']) ? (int)$row['reorder_level'] : 0;
            return [
                'id' => (int)($row['id'] ?? 0),
                'name' => $row['name'] ?? 'Unknown',
                'sku' => $row['sku'] ?? null,
                'stock_quantity' => $qty,
                'reorder_level' => $reorder,
                'status' => $qty <= 0 ? 'out-of-stock' : ($qty <= $reorder ? 'low' : 'ok'),
                'price' => isset($row['price']) ? (float)$row['price'] : 0.0,
                'selling_price' => isset($row['price']) ? (float)$row['price'] : 0.0
            ];
        }, $lowStockItems),
        'recent_activity' => $recentActivity,
        'debug_info' => $debug,
        'timestamp' => date('Y-m-d H:i:s'),
        'current_date' => date('Y-m-d'),
        'daily_reset_time' => '00:00:00'
    ];
    
    echo json_encode($response);

} catch (Exception $e) {
    error_log("User Dashboard API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?>
