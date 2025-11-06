<?php
// Start session first
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

// Check authentication
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

try {
    $company_id = $_SESSION['company_id'];
    
    // TODAY'S SALES (resets daily at midnight)
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total), 0) as today_sales,
               COUNT(*) as today_invoices
        FROM sales_invoices 
        WHERE company_id = ? 
        AND DATE(invoice_date) = CURDATE()
        AND status != 'cancelled'
    ");
    $stmt->execute([$company_id]);
    $today_sales = $stmt->fetch();
    
    // TODAY'S PAYMENTS RECEIVED (actual cash collected today)
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as today_payments
        FROM payments 
        WHERE company_id = ? 
        AND type = 'received'
        AND DATE(payment_date) = CURDATE()
        AND status = 'completed'
    ");
    $stmt->execute([$company_id]);
    $today_payments = $stmt->fetch();
    
    // Total Sales (all time - for comparison)
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total), 0) as total_sales,
               COUNT(*) as total_invoices
        FROM sales_invoices 
        WHERE company_id = ? AND status != 'cancelled'
    ");
    $stmt->execute([$company_id]);
    $total_sales = $stmt->fetch();
    
    // Total Purchases
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total), 0) as total_purchases,
               COUNT(*) as total_bills
        FROM purchase_bills 
        WHERE company_id = ? AND status != 'cancelled'
    ");
    $stmt->execute([$company_id]);
    $purchases = $stmt->fetch();
    
    // Total Customers
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_customers FROM customers WHERE company_id = ?");
    $stmt->execute([$company_id]);
    $customers = $stmt->fetch();
    
    // Total Products
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_products FROM products WHERE company_id = ?");
    $stmt->execute([$company_id]);
    $products = $stmt->fetch();
    
    // Outstanding Receivables
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total - amount_paid), 0) as outstanding_receivables
        FROM sales_invoices 
        WHERE company_id = ? AND status != 'cancelled' AND status != 'paid'
    ");
    $stmt->execute([$company_id]);
    $receivables = $stmt->fetch();
    
    // Outstanding Payables
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total - amount_paid), 0) as outstanding_payables
        FROM purchase_bills 
        WHERE company_id = ? AND status != 'cancelled' AND status != 'paid'
    ");
    $stmt->execute([$company_id]);
    $payables = $stmt->fetch();
    
    // Recent sales data for chart (last 7 days) - shows daily pattern
    $stmt = $pdo->prepare("
        SELECT DATE(invoice_date) as date, 
               COALESCE(SUM(total), 0) as amount,
               COUNT(*) as invoices
        FROM sales_invoices 
        WHERE company_id = ? 
        AND invoice_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND status != 'cancelled'
        GROUP BY DATE(invoice_date)
        ORDER BY date
    ");
    $stmt->execute([$company_id]);
    $chart_data = $stmt->fetchAll();
    
    // Low stock products
    $stmt = $pdo->prepare("
        SELECT name, stock_quantity, reorder_level 
        FROM products 
        WHERE company_id = ? 
        AND track_inventory = 1 
        AND stock_quantity <= reorder_level
        ORDER BY stock_quantity ASC
        LIMIT 5
    ");
    $stmt->execute([$company_id]);
    $low_stock = $stmt->fetchAll();
    
    // Recent invoices
    $stmt = $pdo->prepare("
        SELECT si.*, c.name as customer_name
        FROM sales_invoices si
        INNER JOIN customers c ON si.customer_id = c.id
        WHERE si.company_id = ?
        ORDER BY si.created_at DESC
        LIMIT 5
    ");
    $stmt->execute([$company_id]);
    $recent_invoices = $stmt->fetchAll();
    
    // Account balances (simplified - just show main account types)
    $stmt = $pdo->prepare("
        SELECT a.type, 
               COALESCE(SUM(
                   CASE 
                   WHEN a.type IN ('asset', 'expense') THEN jl.debit - jl.credit
                   ELSE jl.credit - jl.debit
                   END
               ), 0) as balance
        FROM accounts a
        LEFT JOIN journal_lines jl ON a.id = jl.account_id
        WHERE a.company_id = ? AND a.is_active = 1
        GROUP BY a.type
    ");
    $stmt->execute([$company_id]);
    $account_balances = [];
    while ($row = $stmt->fetch()) {
        $account_balances[$row['type']] = floatval($row['balance']);
    }
    
    echo json_encode([
        // TODAY'S METRICS (resets daily)
        'today_sales' => floatval($today_sales['today_sales']),
        'today_invoices' => intval($today_sales['today_invoices']),
        'today_payments' => floatval($today_payments['today_payments']),
        
        // ALL-TIME TOTALS (for comparison)
        'total_sales' => floatval($total_sales['total_sales']),
        'total_invoices' => intval($total_sales['total_invoices']),
        'total_purchases' => floatval($purchases['total_purchases']),
        'total_customers' => intval($customers['total_customers']),
        'total_products' => intval($products['total_products']),
        'total_bills' => intval($purchases['total_bills']),
        
        // OUTSTANDING AMOUNTS
        'outstanding_receivables' => floatval($receivables['outstanding_receivables']),
        'outstanding_payables' => floatval($payables['outstanding_payables']),
        
        // CHARTS AND LISTS
        'chart_data' => $chart_data,
        'low_stock' => $low_stock,
        'recent_invoices' => $recent_invoices,
        'account_balances' => $account_balances,
        
        // Legacy compatibility (now shows today's data)
        'customers' => intval($customers['total_customers']),
        'products' => intval($products['total_products']),
        'recent_sales' => $chart_data
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'failed', 'message' => $e->getMessage()]);
}
