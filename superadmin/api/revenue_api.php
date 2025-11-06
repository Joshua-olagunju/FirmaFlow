<?php
/**
 * Revenue Analytics API
 * Handles monthly revenue data requests for SuperAdmin dashboard
 */

// Start output buffering to prevent header issues
ob_start();

// Only set headers if they haven't been sent
if (!headers_sent()) {
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
}

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

// Check if user is logged in as super admin
if (!isSuperAdmin()) {
    // Clean any output buffer
    if (ob_get_length()) ob_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    ob_end_flush();
    exit;
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'get_revenue_data':
            handleGetRevenueData();
            break;
        case 'get_transaction':
            handleGetTransaction();
            break;
        case 'export':
            handleExport();
            break;
        default:
            // Clean any output buffer
            if (ob_get_length()) ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
            ob_end_flush();
            break;
    }
} catch (Exception $e) {
    // Clean any output buffer
    if (ob_get_length()) ob_clean();
    error_log("Revenue API error: " . $e->getMessage() . " | File: " . $e->getFile() . " | Line: " . $e->getLine());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
    ob_end_flush();
}

function handleGetRevenueData() {
    global $pdo;
    
    // Get filters
    $filters = [
        'month' => $_GET['month'] ?? '',
        'status' => $_GET['status'] ?? '',
        'plan' => $_GET['plan'] ?? '',
        'billing' => $_GET['billing'] ?? '',
        'page' => max(1, intval($_GET['page'] ?? 1))
    ];
    
    $limit = 20;
    $offset = ($filters['page'] - 1) * $limit;
    
    // Build WHERE clauses
    $whereConditions = [];
    $params = [];
    
    if (!empty($filters['month'])) {
        $whereConditions[] = "DATE_FORMAT(sp.created_at, '%Y-%m') = ?";
        $params[] = $filters['month'];
    }
    
    if (!empty($filters['status'])) {
        $whereConditions[] = "sp.status = ?";
        $params[] = $filters['status'];
    }
    
    if (!empty($filters['plan'])) {
        $whereConditions[] = "sp.plan_type = ?";
        $params[] = $filters['plan'];
    }
    
    if (!empty($filters['billing'])) {
        $whereConditions[] = "sp.billing_type = ?";
        $params[] = $filters['billing'];
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Get statistics
    $stats = getRevenueStats($whereClause, $params);
    
    // Get chart data
    $charts = getChartData($whereClause, $params);
    
    // Get transactions
    $transactions = getTransactions($whereClause, $params, $limit, $offset);
    
    // Get pagination info
    $totalRecords = getTotalRecords($whereClause, $params);
    $totalPages = ceil($totalRecords / $limit);
    
    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'charts' => $charts,
        'transactions' => $transactions,
        'pagination' => [
            'current_page' => $filters['page'],
            'total_pages' => $totalPages,
            'total_records' => $totalRecords,
            'per_page' => $limit
        ]
    ]);
    
    // Clean and flush output buffer
    ob_end_flush();
}

function getRevenueStats($whereClause, $params) {
    global $pdo;
    
    $sql = "
        SELECT 
            COUNT(*) as total_transactions,
            SUM(CASE WHEN sp.status = 'completed' THEN sp.amount ELSE 0 END) as total_revenue,
            AVG(CASE WHEN sp.status = 'completed' THEN sp.amount ELSE NULL END) as average_revenue,
            (COUNT(CASE WHEN sp.status = 'completed' THEN 1 END) * 100.0 / COUNT(*)) as success_rate
        FROM subscription_payments sp
        $whereClause
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return [
        'total_transactions' => intval($result['total_transactions'] ?? 0),
        'total_revenue' => floatval($result['total_revenue'] ?? 0),
        'average_revenue' => floatval($result['average_revenue'] ?? 0),
        'success_rate' => round(floatval($result['success_rate'] ?? 0), 1)
    ];
}

function getChartData($whereClause, $params) {
    global $pdo;
    
    // Revenue trend (last 12 months)
    $revenueTrendSql = "
        SELECT 
            DATE_FORMAT(sp.created_at, '%Y-%m') as month,
            SUM(CASE WHEN sp.status = 'completed' THEN sp.amount ELSE 0 END) as revenue
        FROM subscription_payments sp
        WHERE sp.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(sp.created_at, '%Y-%m')
        ORDER BY month ASC
    ";
    
    $stmt = $pdo->prepare($revenueTrendSql);
    $stmt->execute();
    $revenueTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Plan distribution
    $planSql = "
        SELECT 
            sp.plan_type,
            SUM(CASE WHEN sp.status = 'completed' THEN sp.amount ELSE 0 END) as revenue
        FROM subscription_payments sp
        $whereClause
        GROUP BY sp.plan_type
        ORDER BY revenue DESC
    ";
    
    $stmt = $pdo->prepare($planSql);
    $stmt->execute($params);
    $planDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Billing type distribution
    $billingSql = "
        SELECT 
            sp.billing_type,
            SUM(CASE WHEN sp.status = 'completed' THEN sp.amount ELSE 0 END) as revenue
        FROM subscription_payments sp
        $whereClause
        GROUP BY sp.billing_type
    ";
    
    $stmt = $pdo->prepare($billingSql);
    $stmt->execute($params);
    $billingDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Status distribution
    $statusSql = "
        SELECT 
            sp.status,
            COUNT(*) as count
        FROM subscription_payments sp
        $whereClause
        GROUP BY sp.status
    ";
    
    $stmt = $pdo->prepare($statusSql);
    $stmt->execute($params);
    $statusDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'revenue_trend' => [
            'labels' => array_column($revenueTrend, 'month'),
            'data' => array_column($revenueTrend, 'revenue')
        ],
        'plan_distribution' => [
            'labels' => array_column($planDistribution, 'plan_type'),
            'data' => array_column($planDistribution, 'revenue')
        ],
        'billing_type' => [
            'monthly' => floatval(array_column(array_filter($billingDistribution, fn($item) => $item['billing_type'] === 'monthly'), 'revenue')[0] ?? 0),
            'yearly' => floatval(array_column(array_filter($billingDistribution, fn($item) => $item['billing_type'] === 'yearly'), 'revenue')[0] ?? 0)
        ],
        'status_distribution' => [
            'completed' => intval(array_column(array_filter($statusDistribution, fn($item) => $item['status'] === 'completed'), 'count')[0] ?? 0),
            'pending' => intval(array_column(array_filter($statusDistribution, fn($item) => $item['status'] === 'pending'), 'count')[0] ?? 0),
            'failed' => intval(array_column(array_filter($statusDistribution, fn($item) => $item['status'] === 'failed'), 'count')[0] ?? 0)
        ]
    ];
}

function getTransactions($whereClause, $params, $limit, $offset) {
    global $pdo;
    
    $sql = "
        SELECT 
            sp.*,
            c.name as company_name
        FROM subscription_payments sp
        LEFT JOIN companies c ON sp.company_id = c.id
        $whereClause
        ORDER BY sp.created_at DESC
        LIMIT $limit OFFSET $offset
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getTotalRecords($whereClause, $params) {
    global $pdo;
    
    $sql = "SELECT COUNT(*) FROM subscription_payments sp $whereClause";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return intval($stmt->fetchColumn());
}

function handleGetTransaction() {
    global $pdo;
    
    $transactionId = $_GET['id'] ?? '';
    
    if (empty($transactionId)) {
        echo json_encode(['success' => false, 'error' => 'Transaction ID required']);
        ob_end_flush();
        return;
    }
    
    $sql = "
        SELECT 
            sp.*,
            c.name as company_name,
            u.username
        FROM subscription_payments sp
        LEFT JOIN companies c ON sp.company_id = c.id
        LEFT JOIN users u ON sp.user_id = u.id
        WHERE sp.id = ?
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$transactionId]);
    $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$transaction) {
        echo json_encode(['success' => false, 'error' => 'Transaction not found']);
        ob_end_flush();
        return;
    }
    
    echo json_encode([
        'success' => true,
        'transaction' => $transaction
    ]);
    ob_end_flush();
}

function handleExport() {
    global $pdo;
    
    // Get filters
    $filters = [
        'month' => $_GET['month'] ?? '',
        'status' => $_GET['status'] ?? '',
        'plan' => $_GET['plan'] ?? '',
        'billing' => $_GET['billing'] ?? ''
    ];
    
    // Build WHERE clauses
    $whereConditions = [];
    $params = [];
    
    if (!empty($filters['month'])) {
        $whereConditions[] = "DATE_FORMAT(sp.created_at, '%Y-%m') = ?";
        $params[] = $filters['month'];
    }
    
    if (!empty($filters['status'])) {
        $whereConditions[] = "sp.status = ?";
        $params[] = $filters['status'];
    }
    
    if (!empty($filters['plan'])) {
        $whereConditions[] = "sp.plan_type = ?";
        $params[] = $filters['plan'];
    }
    
    if (!empty($filters['billing'])) {
        $whereConditions[] = "sp.billing_type = ?";
        $params[] = $filters['billing'];
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    $sql = "
        SELECT 
            sp.id,
            sp.transaction_id,
            sp.tx_ref,
            c.name as company_name,
            sp.amount,
            sp.currency,
            sp.status,
            sp.payment_method,
            sp.plan_type,
            sp.billing_type,
            sp.subscription_start,
            sp.subscription_end,
            sp.created_at
        FROM subscription_payments sp
        LEFT JOIN companies c ON sp.company_id = c.id
        $whereClause
        ORDER BY sp.created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="revenue_report_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // CSV headers
    fputcsv($output, [
        'ID',
        'Transaction ID',
        'Reference',
        'Company',
        'Amount',
        'Currency',
        'Status',
        'Payment Method',
        'Plan Type',
        'Billing Type',
        'Subscription Start',
        'Subscription End',
        'Created At'
    ]);
    
    // CSV data
    foreach ($transactions as $transaction) {
        fputcsv($output, [
            $transaction['id'],
            $transaction['transaction_id'],
            $transaction['tx_ref'],
            $transaction['company_name'] ?? 'N/A',
            $transaction['amount'],
            $transaction['currency'],
            $transaction['status'],
            $transaction['payment_method'] ?? 'N/A',
            $transaction['plan_type'],
            $transaction['billing_type'],
            $transaction['subscription_start'],
            $transaction['subscription_end'],
            $transaction['created_at']
        ]);
    }
    
    fclose($output);
    exit;
}
?>