<?php
// api/admin_dashboard_stats.php - Comprehensive admin dashboard data
session_start();

// CORS Headers - Allow multiple localhost ports
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../includes/db.php';
    
    // Check authentication and admin access
    if (!isset($_SESSION['company_id']) || !isset($_SESSION['user_id'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'User not authenticated']);
        exit;
    }
    
    // Check if user has admin/manager role access
    $userRole = $_SESSION['user_role'] ?? 'user';
    
    // Allow user role access for low stock data requests
    $isLowStockRequest = isset($_GET['low_stock_only']) || isset($_POST['low_stock_only']);
    
    if (!in_array($userRole, ['admin', 'manager']) && !$isLowStockRequest) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied - Admin/Manager role required']);
        exit;
    }
    
    $companyId = $_SESSION['company_id'];
    
    // === SALES OVERVIEW ===
    $salesStats = [];
    try {
        // Try sales_invoices table first (existing structure)
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(total), 0) as total_sales,
                COUNT(*) as total_invoices,
                COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END), 0) as today_sales,
                COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_invoices
            FROM sales_invoices 
            WHERE company_id = ? AND status != 'cancelled'
        ");
        $stmt->execute([$companyId]);
        $salesStats = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        // Fallback to sales table
        try {
            $stmt = $pdo->prepare("
                SELECT 
                    COALESCE(SUM(total_amount), 0) as total_sales,
                    COUNT(*) as total_invoices,
                    COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END), 0) as today_sales,
                    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_invoices
                FROM sales 
                WHERE company_id = ?
            ");
            $stmt->execute([$companyId]);
            $salesStats = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e2) {
            $salesStats = ['total_sales' => 0, 'total_invoices' => 0, 'today_sales' => 0, 'today_invoices' => 0];
        }
    }
    
    // === PURCHASE OVERVIEW ===
    $purchaseStats = [];
    try {
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(total), 0) as total_purchases,
                COUNT(*) as total_bills,
                COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END), 0) as today_purchases
            FROM purchase_bills 
            WHERE company_id = ? AND status != 'cancelled'
        ");
        $stmt->execute([$companyId]);
        $purchaseStats = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $purchaseStats = ['total_purchases' => 0, 'total_bills' => 0, 'today_purchases' => 0];
    }
    
    // === CUSTOMER METRICS ===
    $customerStats = [];
    try {
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_customers,
                COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as new_customers_30d
            FROM customers 
            WHERE company_id = ?
        ");
        $stmt->execute([$companyId]);
        $customerStats = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $customerStats = ['total_customers' => 0, 'new_customers_30d' => 0];
    }
    
    // === PRODUCT METRICS ===
    $productStats = [];
    try {
        // Get inventory settings first
        $settingsStmt = $pdo->prepare("
            SELECT setting_key, setting_value 
            FROM company_settings 
            WHERE company_id = ? 
            AND setting_key IN ('inventory_use_global_threshold', 'inventory_global_low_stock_threshold')
        ");
        $settingsStmt->execute([$companyId]);
        $settingsData = $settingsStmt->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
        
        $useGlobalThreshold = ($settingsData['inventory_use_global_threshold'] ?? 'false') === '1';
        $globalThreshold = intval($settingsData['inventory_global_low_stock_threshold'] ?? 10);
        
        // Build low stock condition based on settings
        if ($useGlobalThreshold) {
            $lowStockCondition = "stock_quantity <= GREATEST(COALESCE(reorder_level, 5), $globalThreshold)";
        } else {
            $lowStockCondition = "stock_quantity <= COALESCE(reorder_level, 5)";
        }
        
        // Try stock_quantity first with settings integration
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN $lowStockCondition THEN 1 END) as low_stock_products,
                COUNT(CASE WHEN stock_quantity <= 0 THEN 1 END) as out_of_stock_products
            FROM products 
            WHERE company_id = ? AND is_active = 1
        ");
        $stmt->execute([$companyId]);
        $productStats = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        try {
            // Fallback to quantity
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_products,
                    COUNT(CASE WHEN quantity <= COALESCE(min_stock, 5) THEN 1 END) as low_stock_products,
                    COUNT(CASE WHEN quantity <= 0 THEN 1 END) as out_of_stock_products
                FROM products 
                WHERE company_id = ? AND is_active = 1
            ");
            $stmt->execute([$companyId]);
            $productStats = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e2) {
            $productStats = ['total_products' => 0, 'low_stock_products' => 0, 'out_of_stock_products' => 0];
        }
    }
    
    // === LOW STOCK ITEMS LIST ===
    $lowStockItems = [];
    try {
        // First, get inventory settings to determine low stock threshold logic
        $settingsStmt = $pdo->prepare("
            SELECT setting_key, setting_value 
            FROM company_settings 
            WHERE company_id = ? 
            AND setting_key IN ('inventory_use_global_threshold', 'inventory_global_low_stock_threshold')
        ");
        $settingsStmt->execute([$companyId]);
        $settingsData = $settingsStmt->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
        
        $useGlobalThreshold = ($settingsData['inventory_use_global_threshold'] ?? 'false') === '1';
        $globalThreshold = intval($settingsData['inventory_global_low_stock_threshold'] ?? 10);
        
        // Build the low stock condition based on settings
        if ($useGlobalThreshold) {
            $lowStockCondition = "stock_quantity <= GREATEST(COALESCE(reorder_level, 5), $globalThreshold)";
        } else {
            $lowStockCondition = "stock_quantity <= COALESCE(reorder_level, 5)";
        }
        
        // Primary schema: stock_quantity/reorder_level with settings integration
        $stmt = $pdo->prepare("
            SELECT 
                id,
                name,
                sku,
                COALESCE(stock_quantity, 0) AS stock_quantity,
                COALESCE(reorder_level, 5) AS reorder_level,
                COALESCE(selling_price, 0) AS price,
                CASE 
                    WHEN ? THEN GREATEST(COALESCE(reorder_level, 5), ?)
                    ELSE COALESCE(reorder_level, 5)
                END as effective_threshold
            FROM products
            WHERE company_id = ? AND is_active = 1
              AND stock_quantity <= GREATEST(COALESCE(reorder_level, 5), 
                   CASE WHEN ? THEN ? ELSE 5 END)
            ORDER BY stock_quantity ASC, name ASC
            LIMIT 200
        ");
        $stmt->execute([
            $useGlobalThreshold ? 1 : 0,
            $globalThreshold,
            $companyId,
            $useGlobalThreshold ? 1 : 0,
            $globalThreshold
        ]);
        $lowStockItems = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Exception $eLS1) {
        $lowStockItems = [];
    }
    if (empty($lowStockItems)) {
        try {
            // Fallback schema: quantity/min_stock
            $stmt = $pdo->prepare("
                SELECT 
                    id,
                    name,
                    sku,
                    COALESCE(quantity, 0) AS stock_quantity,
                    COALESCE(min_stock, 5) AS reorder_level,
                    COALESCE(selling_price, 0) AS price
                FROM products
                WHERE company_id = ? AND is_active = 1
                  AND (quantity <= COALESCE(min_stock, 5) OR quantity <= 0)
                ORDER BY quantity ASC, name ASC
                LIMIT 200
            ");
            $stmt->execute([$companyId]);
            $lowStockItems = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $eLS2) {
            $lowStockItems = [];
        }
    }
    
    // === OUTSTANDING RECEIVABLES ===
    $receivables = 0;
    try {
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(total - amount_paid), 0) as outstanding_receivables
            FROM sales_invoices 
            WHERE company_id = ? AND status = 'sent' AND amount_paid < total
        ");
        $stmt->execute([$companyId]);
        $receivables = $stmt->fetchColumn();
    } catch (Exception $e) {
        // Try with sales table
        try {
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as outstanding_receivables
                FROM sales 
                WHERE company_id = ? AND payment_status IN ('pending', 'partial', 'unpaid', 'invoiced')
            ");
            $stmt->execute([$companyId]);
            $receivables = $stmt->fetchColumn();
        } catch (Exception $e2) {
            $receivables = 0;
        }
    }
    
    // === RECENT SALES TRENDS (Last 7 days) ===
    $salesTrend = [];
    try {
        // Try sales_invoices table first
        $stmt = $pdo->prepare("
            SELECT 
                DATE(created_at) as sale_date,
                COALESCE(SUM(total), 0) as daily_sales,
                COUNT(*) as daily_transactions
            FROM sales_invoices 
            WHERE company_id = ? AND status != 'cancelled'
            AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY sale_date ASC
        ");
        $stmt->execute([$companyId]);
        $salesTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If no data, try sales table
        if (empty($salesTrend)) {
            $stmt = $pdo->prepare("
                SELECT 
                    DATE(created_at) as sale_date,
                    COALESCE(SUM(total_amount), 0) as daily_sales,
                    COUNT(*) as daily_transactions
                FROM sales 
                WHERE company_id = ? 
                AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY sale_date ASC
            ");
            $stmt->execute([$companyId]);
            $salesTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Transform existing data to expected format
        $salesTrend = array_map(function($row) {
            return [
                'date' => $row['sale_date'],
                'total' => floatval($row['daily_sales']),
                'transactions' => intval($row['daily_transactions'])
            ];
        }, $salesTrend);
        
        // If still no real data, fill gaps for missing days with zero values
        if (count($salesTrend) < 7) {
            $existingDates = array_column($salesTrend, 'date');
            $allTrend = [];
            
            for ($i = 6; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i days"));
                $existingIndex = array_search($date, $existingDates);
                
                if ($existingIndex !== false) {
                    $allTrend[] = $salesTrend[$existingIndex];
                } else {
                    $allTrend[] = [
                        'date' => $date,
                        'total' => 0,
                        'transactions' => 0
                    ];
                }
            }
            $salesTrend = $allTrend;
        }
    } catch (Exception $e) {
        // If database error, return empty data - no fake data
        $salesTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $salesTrend[] = [
                'date' => $date,
                'total' => 0,
                'transactions' => 0
            ];
        }
    }
    
    // === TOP 10 SELLING PRODUCTS (Sales breakdown for pie chart) ===
    // Calculate dynamically from recent sales items; fallback gracefully if tables differ
    $topProducts = [];
    try {
        $rangeDays = isset($_GET['range_days']) ? max(1, min(365, (int)$_GET['range_days'])) : 30;

        // Attempt 1: sales_items joined to sales_invoices (preferred structure)
        try {
            $stmt = $pdo->prepare("
                SELECT 
                    p.id,
                    p.name,
                    p.sku,
                    COALESCE(p.stock_quantity, 0) AS stock_quantity,
                    SUM(si.quantity) AS total_quantity,
                    SUM(si.quantity * si.unit_price) AS total_revenue,
                    MAX(inv.created_at) AS last_sale
                FROM sales_items si
                INNER JOIN sales_invoices inv ON inv.id = si.sales_invoice_id
                INNER JOIN products p ON p.id = si.product_id
                WHERE inv.company_id = ?
                  AND (inv.status IS NULL OR inv.status != 'cancelled')
                  AND DATE(inv.created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY p.id, p.name, p.sku, p.stock_quantity
                ORDER BY total_revenue DESC
                LIMIT 10
            ");
            $stmt->execute([$companyId, $rangeDays]);
            $topProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e1) {
            $topProducts = [];
        }

        // Attempt 2: sales_invoice_lines joined to sales_invoices (another common naming)
        if (empty($topProducts)) {
            try {
                $stmt = $pdo->prepare("
                    SELECT 
                        p.id,
                        p.name,
                        p.sku,
                        COALESCE(p.stock_quantity, 0) AS stock_quantity,
                        SUM(l.quantity) AS total_quantity,
                        SUM(l.quantity * l.unit_price) AS total_revenue,
                        MAX(inv.created_at) AS last_sale
                    FROM sales_invoice_lines l
                    INNER JOIN sales_invoices inv ON inv.id = l.invoice_id
                    INNER JOIN products p ON p.id = l.product_id
                    WHERE inv.company_id = ?
                      AND (inv.status IS NULL OR inv.status != 'cancelled')
                      AND DATE(inv.created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    GROUP BY p.id, p.name, p.sku, p.stock_quantity
                    ORDER BY total_revenue DESC
                    LIMIT 10
                ");
                $stmt->execute([$companyId, $rangeDays]);
                $topProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e2a) {
                $topProducts = [];
            }
        }

        // Attempt 3: invoice_items joined to sales_invoices (alternate naming)
        if (empty($topProducts)) {
            try {
                $stmt = $pdo->prepare("
                    SELECT 
                        p.id,
                        p.name,
                        p.sku,
                        COALESCE(p.stock_quantity, 0) AS stock_quantity,
                        SUM(ii.quantity) AS total_quantity,
                        SUM(ii.quantity * ii.unit_price) AS total_revenue,
                        MAX(inv.created_at) AS last_sale
                    FROM invoice_items ii
                    INNER JOIN sales_invoices inv ON inv.id = ii.invoice_id
                    INNER JOIN products p ON p.id = ii.product_id
                    WHERE inv.company_id = ?
                      AND (inv.status IS NULL OR inv.status != 'cancelled')
                      AND DATE(inv.created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    GROUP BY p.id, p.name, p.sku, p.stock_quantity
                    ORDER BY total_revenue DESC
                    LIMIT 10
                ");
                $stmt->execute([$companyId, $rangeDays]);
                $topProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e2) {
                $topProducts = [];
            }
        }

    // Attempt 4: Fallback to top products by inventory value if no sales lines exist
        if (empty($topProducts)) {
            $stmt = $pdo->prepare("
                SELECT 
                    p.id,
                    p.name,
                    p.sku,
                    COALESCE(p.stock_quantity, 0) AS stock_quantity,
                    0 AS total_quantity,
                    0 AS total_revenue,
                    NULL AS last_sale,
                    COALESCE(p.selling_price, COALESCE(p.price, p.unit_price, 0)) AS selling_price
                FROM products p
                WHERE p.company_id = ? AND p.is_active = 1
                ORDER BY selling_price DESC
                LIMIT 10
            ");
            $stmt->execute([$companyId]);
            $fallback = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $topProducts = array_map(function($row) {
                // Normalize fields
                return [
                    'id' => (int)$row['id'],
                    'name' => $row['name'] ?? 'Unknown Product',
                    'sku' => $row['sku'] ?? ('PRD-' . $row['id']),
                    'stock_quantity' => isset($row['stock_quantity']) ? (int)$row['stock_quantity'] : 0,
                    'total_quantity' => 0,
                    'total_revenue' => 0.0,
                    'last_sale' => $row['last_sale'] ?? null
                ];
            }, $fallback);
        } else {
            // Normalize numeric fields and compute percentage share
            $grandTotal = 0.0;
            foreach ($topProducts as $r) {
                $grandTotal += (float)$r['total_revenue'];
            }
            $topProducts = array_map(function($row) use ($grandTotal) {
                $revenue = (float)($row['total_revenue'] ?? 0);
                return [
                    'id' => (int)$row['id'],
                    'name' => $row['name'] ?? 'Unknown Product',
                    'sku' => $row['sku'] ?? ('PRD-' . $row['id']),
                    'stock_quantity' => isset($row['stock_quantity']) ? (int)$row['stock_quantity'] : 0,
                    'total_quantity' => (int)($row['total_quantity'] ?? 0),
                    'total_revenue' => $revenue,
                    'percentage' => $grandTotal > 0 ? round(($revenue / $grandTotal) * 100, 2) : 0,
                    'last_sale' => $row['last_sale'] ?? null
                ];
            }, $topProducts);

            // For each top product, try to find the top seller (user) within range
            foreach ($topProducts as &$prod) {
                $pid = (int)$prod['id'];
                $topSeller = null;

                // Attempt via sales_items -> sales_invoices.created_by
                try {
                    $qs = $pdo->prepare("
                        SELECT inv.created_by AS user_id,
                               COUNT(*) AS lines_count,
                               COALESCE(SUM(si.quantity), 0) AS qty,
                               COALESCE(SUM(si.quantity * si.unit_price), 0) AS revenue,
                               MAX(inv.created_at) AS last_sale
                        FROM sales_items si
                        INNER JOIN sales_invoices inv ON inv.id = si.sales_invoice_id
                        WHERE inv.company_id = ?
                          AND si.product_id = ?
                          AND (inv.status IS NULL OR inv.status != 'cancelled')
                          AND DATE(inv.created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                        GROUP BY inv.created_by
                        ORDER BY revenue DESC
                        LIMIT 1
                    ");
                    $qs->execute([$companyId, $pid, $rangeDays]);
                    $topSeller = $qs->fetch(PDO::FETCH_ASSOC) ?: null;
                } catch (Exception $eSI) {
                    $topSeller = null;
                }

                // Attempt via sales_invoice_lines -> sales_invoices.created_by
                if (!$topSeller) {
                    try {
                        $qs = $pdo->prepare("
                            SELECT inv.created_by AS user_id,
                                   COUNT(*) AS lines_count,
                                   COALESCE(SUM(l.quantity), 0) AS qty,
                                   COALESCE(SUM(l.quantity * l.unit_price), 0) AS revenue,
                                   MAX(inv.created_at) AS last_sale
                            FROM sales_invoice_lines l
                            INNER JOIN sales_invoices inv ON inv.id = l.invoice_id
                            WHERE inv.company_id = ?
                              AND l.product_id = ?
                              AND (inv.status IS NULL OR inv.status != 'cancelled')
                              AND DATE(inv.created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                            GROUP BY inv.created_by
                            ORDER BY revenue DESC
                            LIMIT 1
                        ");
                        $qs->execute([$companyId, $pid, $rangeDays]);
                        $topSeller = $qs->fetch(PDO::FETCH_ASSOC) ?: null;
                    } catch (Exception $eL) {
                        $topSeller = null;
                    }
                }

                if ($topSeller && !empty($topSeller['user_id'])) {
                    $uid = (int)$topSeller['user_id'];
                    $sellerName = 'User #' . $uid;
                    try {
                        $u = $pdo->prepare("SELECT name, first_name, last_name FROM users WHERE id = ? AND company_id = ? LIMIT 1");
                        $u->execute([$uid, $companyId]);
                        if ($ud = $u->fetch(PDO::FETCH_ASSOC)) {
                            $display = trim(($ud['name'] ?? '') . ' ' . ($ud['last_name'] ?? ''));
                            if ($display !== '') $sellerName = $display;
                        }
                    } catch (Exception $eUN) { /* ignore */ }

                    $prod['top_seller'] = [
                        'user_id' => $uid,
                        'name' => $sellerName,
                        'quantity' => (int)($topSeller['qty'] ?? 0),
                        'revenue' => (float)($topSeller['revenue'] ?? 0),
                        'lines' => (int)($topSeller['lines_count'] ?? 0),
                        'last_sale' => $topSeller['last_sale'] ?? null
                    ];
                }
            }
        }
        // Compute top sellers (users with most revenue in the same period)
        $topSellers = [];
        try {
            // Primary attempt: sales table with user_id
            $stmt = $pdo->prepare("
                SELECT 
                    s.user_id,
                    COUNT(*) AS sales_count,
                    COALESCE(SUM(s.total_amount), 0) AS total_revenue,
                    MAX(s.created_at) AS last_sale
                FROM sales s
                WHERE s.company_id = ?
                  AND DATE(s.created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY s.user_id
                ORDER BY total_revenue DESC
                LIMIT 10
            ");
            $stmt->execute([$companyId, $rangeDays]);
            $topSellers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Attach user names if available
            foreach ($topSellers as &$row) {
                $uid = (int)($row['user_id'] ?? 0);
                if ($uid > 0) {
                    try {
                        $u = $pdo->prepare("SELECT name, first_name, last_name FROM users WHERE id = ? AND company_id = ? LIMIT 1");
                        $u->execute([$uid, $companyId]);
                        $ud = $u->fetch(PDO::FETCH_ASSOC);
                        $display = $ud ? trim(($ud['name'] ?? '') . ' ' . ($ud['last_name'] ?? '')) : ('User #' . $uid);
                        $row['name'] = $display !== '' ? $display : ('User #' . $uid);
                    } catch (Exception $eName) { /* ignore */ }
                }
            }
        } catch (Exception $eTS) {
            $topSellers = [];
        }

    } catch (Exception $e) {
        $topProducts = [];
        $topSellers = [];
    }
    
    // === TOP CUSTOMERS (Best customers by total spend) ===
    $topCustomers = [];
    try {
        $rows = [];

        // Attempt 1: Prefer invoices — sum amount_paid and count paid invoices
        try {
            $stmt = $pdo->prepare("
                SELECT 
                    si.customer_id AS id,
                    COUNT(*) AS invoices_count,
                    COUNT(CASE WHEN COALESCE(si.amount_paid, 0) > 0 THEN 1 END) AS paid_invoices_count,
                    COALESCE(SUM(COALESCE(si.amount_paid, 0)), 0) AS total_spent,
                    MAX(si.created_at) AS last_purchase
                FROM sales_invoices si
                WHERE si.company_id = ?
                  AND (si.status IS NULL OR si.status NOT IN ('cancelled'))
                  AND si.customer_id IS NOT NULL AND si.customer_id <> 0
                GROUP BY si.customer_id
                HAVING total_spent > 0 OR invoices_count > 0
                ORDER BY total_spent DESC
                LIMIT 5
            ");
            $stmt->execute([$companyId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $eInvPref) {
            $rows = [];
        }

        // Attempt 2: Fallback to payments (sum payments by customer)
        if (empty($rows)) {
            try {
                $stmt = $pdo->prepare("
                    SELECT 
                        p.customer_id AS id,
                        COUNT(*) AS payments_count,
                        COALESCE(SUM(COALESCE(p.amount, 0)), 0) AS total_spent,
                        MAX(p.created_at) AS last_purchase
                    FROM payments p
                    WHERE p.company_id = ?
                      AND p.customer_id IS NOT NULL AND p.customer_id <> 0
                    GROUP BY p.customer_id
                    ORDER BY total_spent DESC
                    LIMIT 5
                ");
                $stmt->execute([$companyId]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            } catch (Exception $ePay) {
                $rows = [];
            }
        }

        // Attempt 3: Fallback to sales table (sum totals, count sales)
        if (empty($rows)) {
            try {
                $stmt = $pdo->prepare("
                    SELECT 
                        s.customer_id AS id,
                        COUNT(*) AS sales_count,
                        COALESCE(SUM(COALESCE(s.total_amount, s.total, s.amount, 0)), 0) AS total_spent,
                        MAX(s.created_at) AS last_purchase
                    FROM sales s
                    WHERE s.company_id = ?
                      AND s.customer_id IS NOT NULL AND s.customer_id <> 0
                    GROUP BY s.customer_id
                    ORDER BY total_spent DESC
                    LIMIT 5
                ");
                $stmt->execute([$companyId]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            } catch (Exception $eSales) {
                $rows = [];
            }
        }

        if (!empty($rows)) {
            foreach ($rows as $r) {
                $cid = (int)($r['id'] ?? 0);
                $name = 'Customer #' . $cid;
                $contact = 'N/A';
                if ($cid > 0) {
                    try {
                        $c = $pdo->prepare("SELECT name, email, phone FROM customers WHERE id = ? AND company_id = ? LIMIT 1");
                        $c->execute([$cid, $companyId]);
                        if ($cd = $c->fetch(PDO::FETCH_ASSOC)) {
                            $name = $cd['name'] ?: $name;
                            $contact = $cd['email'] ?? ($cd['phone'] ?? 'N/A');
                        }
                    } catch (Exception $eC) { /* ignore */ }
                }

                // Prefer paid invoices count, else payments_count, else sales_count, else invoices_count
                $orders = (int)($r['paid_invoices_count'] ?? $r['payments_count'] ?? $r['sales_count'] ?? $r['invoices_count'] ?? 0);
                $spent = (float)($r['total_spent'] ?? 0);
                $avg = $orders > 0 ? ($spent / $orders) : 0.0;

                $topCustomers[] = [
                    'id' => $cid,
                    'name' => $name,
                    'contact' => $contact,
                    'total_orders' => $orders,
                    'total_spent' => $spent,
                    'avg_order_value' => $avg,
                    'last_purchase' => $r['last_purchase'] ?? null
                ];
            }
        } else {
            // Last resort: return the most recent customers with zeroed metrics
            try {
                $stmt = $pdo->prepare("SELECT id, name, email, phone, created_at FROM customers WHERE company_id = ? ORDER BY created_at DESC LIMIT 5");
                $stmt->execute([$companyId]);
                $customersData = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
                foreach ($customersData as $customer) {
                    $topCustomers[] = [
                        'id' => (int)$customer['id'],
                        'name' => $customer['name'] ?? 'Unknown Customer',
                        'contact' => $customer['email'] ?? ($customer['phone'] ?? 'N/A'),
                        'total_orders' => 0,
                        'total_spent' => 0.0,
                        'avg_order_value' => 0.0,
                        'last_purchase' => $customer['created_at'] ?? null
                    ];
                }
            } catch (Exception $eCust) {
                $topCustomers = [];
            }
        }
    } catch (Exception $e) {
        $topCustomers = [];
    }
    
    // === USER ACTIVITY ===
    $userActivity = [];
    try {
        // Get recent user sales activity
        $stmt = $pdo->prepare("
            SELECT 
                s.user_id,
                COUNT(*) as sales_count,
                COALESCE(SUM(s.total_amount), 0) as total_sales,
                MAX(s.created_at) as last_sale
            FROM sales s
            WHERE s.company_id = ?
            AND DATE(s.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY s.user_id
            ORDER BY total_sales DESC
            LIMIT 5
        ");
        $stmt->execute([$companyId]);
        $userActivity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $userActivity = [];
    }
    
    // === CASH FLOW SUMMARY ===
    $cashFlow = [];
    try {
        $stmt = $pdo->prepare("
            SELECT 
                'inflow' as type,
                COALESCE(SUM(total_amount), 0) as amount
            FROM sales 
            WHERE company_id = ? 
            AND payment_status = 'paid'
            AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $stmt->execute([$companyId]);
        $inflow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->prepare("
            SELECT 
                'outflow' as type,
                COALESCE(SUM(total), 0) as amount
            FROM purchase_bills 
            WHERE company_id = ? 
            AND status = 'paid'
            AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $stmt->execute([$companyId]);
        $outflow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $cashFlow = [
            'inflow' => $inflow['amount'] ?? 0,
            'outflow' => $outflow['amount'] ?? 0,
            'net_flow' => ($inflow['amount'] ?? 0) - ($outflow['amount'] ?? 0)
        ];
    } catch (Exception $e) {
        $cashFlow = ['inflow' => 0, 'outflow' => 0, 'net_flow' => 0];
    }
    
    // === RECENT SALES (Payment-focused transactions) ===
    $recentSales = [];
    try {
        // Start with most basic sales query possible
        $stmt = $pdo->prepare("SELECT * FROM sales WHERE company_id = ? ORDER BY created_at DESC LIMIT 15");
        $stmt->execute([$companyId]);
        $salesData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format the data properly
        foreach ($salesData as $sale) {
            $total = $sale['total_amount'] ?? $sale['total'] ?? $sale['amount'] ?? 0;
            $customer = $sale['customer_name'] ?? 'Walk-in Customer';
            
            // Try to get customer name if customer_id exists
            if (!empty($sale['customer_id'])) {
                try {
                    $custStmt = $pdo->prepare("SELECT name FROM customers WHERE id = ? AND company_id = ?");
                    $custStmt->execute([$sale['customer_id'], $companyId]);
                    $custData = $custStmt->fetch(PDO::FETCH_ASSOC);
                    if ($custData) {
                        $customer = $custData['name'];
                    }
                } catch (Exception $e) {
                    // Keep original customer name
                }
            }
            
            $recentSales[] = [
                'id' => $sale['id'],
                'total' => floatval($total),
                'date' => $sale['created_at'] ?? date('Y-m-d H:i:s'),
                'customer' => $customer,
                'payment_method' => $sale['payment_method'] ?? 'Cash',
                'reference_number' => 'Sale-' . $sale['id'],
                'payment_status' => $sale['payment_status'] ?? $sale['status'] ?? 'completed',
                'transaction_type' => 'sale'
            ];
        }
        
        // If no sales data, try other tables
        if (empty($recentSales)) {
            // Try payments table
            try {
                $stmt = $pdo->prepare("SELECT * FROM payments WHERE company_id = ? ORDER BY created_at DESC LIMIT 15");
                $stmt->execute([$companyId]);
                $paymentsData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($paymentsData as $payment) {
                    $recentSales[] = [
                        'id' => $payment['id'],
                        'total' => floatval($payment['amount'] ?? 0),
                        'date' => $payment['created_at'] ?? date('Y-m-d H:i:s'),
                        'customer' => $payment['customer_name'] ?? 'Walk-in Customer',
                        'payment_method' => $payment['payment_method'] ?? 'Cash',
                        'reference_number' => $payment['reference_number'] ?? 'Pay-' . $payment['id'],
                        'payment_status' => $payment['status'] ?? 'completed',
                        'transaction_type' => 'payment'
                    ];
                }
            } catch (Exception $e) {
                // Payments table might not exist
            }
        }
        
        // If still no data, try sales_invoices
        if (empty($recentSales)) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM sales_invoices WHERE company_id = ? ORDER BY created_at DESC LIMIT 15");
                $stmt->execute([$companyId]);
                $invoicesData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($invoicesData as $invoice) {
                    $recentSales[] = [
                        'id' => $invoice['id'],
                        'total' => floatval($invoice['total'] ?? $invoice['total_amount'] ?? 0),
                        'date' => $invoice['created_at'] ?? date('Y-m-d H:i:s'),
                        'customer' => $invoice['customer_name'] ?? 'Walk-in Customer',
                        'payment_method' => $invoice['payment_method'] ?? 'Cash',
                        'reference_number' => $invoice['invoice_number'] ?? 'INV-' . $invoice['id'],
                        'payment_status' => $invoice['status'] ?? 'completed',
                        'transaction_type' => 'invoice'
                    ];
                }
            } catch (Exception $e) {
                // Sales_invoices table might not exist
            }
        }
        
    } catch (Exception $e) {
        $recentSales = [];
    }
    
    // === COMPILE RESPONSE ===
    
    // If this is a low stock only request from user role, return limited data
    if ($isLowStockRequest && $userRole === 'user') {
        $lowStockResponse = [
            'success' => true,
            'company_id' => $companyId,
            'user_role' => $userRole,
            'timestamp' => date('Y-m-d H:i:s'),
            'low_stock_items' => array_map(function($row) use ($useGlobalThreshold, $globalThreshold) {
                $qty = isset($row['stock_quantity']) ? (int)$row['stock_quantity'] : 0;
                $reorder = isset($row['reorder_level']) ? (int)$row['reorder_level'] : 0;
                $effectiveThreshold = $useGlobalThreshold ? max($reorder, $globalThreshold) : $reorder;
                return [
                    'id' => (int)($row['id'] ?? 0),
                    'name' => $row['name'] ?? 'Unknown',
                    'sku' => $row['sku'] ?? null,
                    'stock_quantity' => $qty,
                    'reorder_level' => $reorder,
                    'status' => $qty <= 0 ? 'out-of-stock' : ($qty <= $effectiveThreshold ? 'low' : 'ok'),
                    'price' => isset($row['price']) ? (float)$row['price'] : 0.0
                ];
            }, $lowStockItems),
            'alerts' => [
                'low_stock_count' => $productStats['low_stock_products'] ?? 0,
                'out_of_stock_count' => $productStats['out_of_stock_products'] ?? 0
            ],
            'inventory_settings' => [
                'useGlobal' => $useGlobalThreshold,
                'globalThreshold' => $globalThreshold
            ]
        ];
        echo json_encode($lowStockResponse);
        exit;
    }
    
    $response = [
        'success' => true,
        'company_id' => $companyId,
        'user_role' => $userRole,
        'timestamp' => date('Y-m-d H:i:s'),
        
        // Main stats
        'sales' => $salesStats,
        'purchases' => $purchaseStats,
        'customers' => $customerStats,
        'products' => $productStats,
        'outstanding_receivables' => $receivables,
        
        // Detailed analytics
        'sales_trend' => $salesTrend,
        'recent_sales' => $recentSales,
        'top_products' => $topProducts,
        'top_customers' => $topCustomers,
        'top_sellers' => $topSellers ?? [],
        'low_stock_items' => array_map(function($row) use ($useGlobalThreshold, $globalThreshold) {
            $qty = isset($row['stock_quantity']) ? (int)$row['stock_quantity'] : 0;
            $reorder = isset($row['reorder_level']) ? (int)$row['reorder_level'] : 0;
            $effectiveThreshold = $useGlobalThreshold ? max($reorder, $globalThreshold) : $reorder;
            return [
                'id' => (int)($row['id'] ?? 0),
                'name' => $row['name'] ?? 'Unknown',
                'sku' => $row['sku'] ?? null,
                'stock_quantity' => $qty,
                'reorder_level' => $reorder,
                'status' => $qty <= 0 ? 'out-of-stock' : ($qty <= $effectiveThreshold ? 'low' : 'ok'),
                'price' => isset($row['price']) ? (float)$row['price'] : 0.0
            ];
        }, $lowStockItems),
        'user_activity' => $userActivity,
        'cash_flow' => $cashFlow,
        
        // Alerts and notifications
        'alerts' => [
            'low_stock_count' => $productStats['low_stock_products'] ?? 0,
            'out_of_stock_count' => $productStats['out_of_stock_products'] ?? 0,
            'pending_receivables' => $receivables > 0,
            'new_customers' => $customerStats['new_customers_30d'] ?? 0
        ]
    ];
    
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Admin Dashboard API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred',
        'debug' => [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?>
