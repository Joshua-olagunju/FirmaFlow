<?php
// SuperAdmin Revenue API
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once '../includes/auth.php';

// Check if user is SuperAdmin (more flexible check)
if (!isset($_SESSION['superadmin_username']) && !isset($_SESSION['superadmin_logged_in'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    // Use the PDO connection from the included auth file
    
    switch ($action) {
        case 'get_payments':
            getPayments($pdo);
            break;
            
        case 'export_payments':
            exportPayments($pdo);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    error_log("Revenue API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function getPayments($pdo) {
    $month = $_GET['month'] ?? '';
    $status = $_GET['status'] ?? '';
    
    // Build WHERE clause for filters
    $whereConditions = [];
    $params = [];
    
    if (!empty($month)) {
        $whereConditions[] = "DATE_FORMAT(sp.created_at, '%Y-%m') = ?";
        $params[] = $month;
    }
    
    if (!empty($status)) {
        $whereConditions[] = "sp.status = ?";
        $params[] = $status;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Get subscription payments with company and user information
    $sql = "
        SELECT 
            sp.id,
            sp.transaction_id,
            sp.tx_ref,
            sp.amount,
            sp.currency,
            sp.status,
            sp.payment_method,
            sp.plan_type,
            sp.subscription_start,
            sp.subscription_end,
            sp.created_at,
            c.name as company_name,
            CONCAT(u.first_name, ' ', u.last_name) as user_name,
            u.email as user_email
        FROM subscription_payments sp
        LEFT JOIN companies c ON sp.company_id = c.id
        LEFT JOIN users u ON sp.user_id = u.id
        {$whereClause}
        ORDER BY sp.created_at DESC
        LIMIT 100
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $payments = $stmt->fetchAll();
    
    // Get subscription payment statistics
    $statsWhere = $whereClause;
    $statsSql = "
        SELECT 
            COUNT(*) as total_payments,
            AVG(amount) as avg_amount,
            SUM(CASE WHEN status = 'successful' THEN 1 ELSE 0 END) as successful_payments,
            SUM(CASE WHEN status = 'successful' THEN amount ELSE 0 END) as total_revenue,
            COUNT(DISTINCT company_id) as unique_companies,
            COUNT(DISTINCT plan_type) as plan_types
        FROM subscription_payments sp
        {$statsWhere}
    ";
    
    $stmt = $pdo->prepare($statsSql);
    $stmt->execute($params);
    $statsRow = $stmt->fetch();
    
    $stats = [
        'total_payments' => (int)$statsRow['total_payments'],
        'avg_amount' => round((float)$statsRow['avg_amount'], 2),
        'successful_payments' => (int)$statsRow['successful_payments'],
        'total_revenue' => round((float)$statsRow['total_revenue'], 2),
        'unique_companies' => (int)$statsRow['unique_companies'],
        'plan_types' => (int)$statsRow['plan_types'],
        'success_rate' => $statsRow['total_payments'] > 0 ? 
            round(($statsRow['successful_payments'] / $statsRow['total_payments']) * 100, 1) : 0
    ];
    
    // Get plan distribution
    $planSql = "
        SELECT 
            plan_type,
            COUNT(*) as count,
            SUM(amount) as revenue
        FROM subscription_payments sp
        {$statsWhere}
        GROUP BY plan_type
        ORDER BY revenue DESC
    ";
    
    $stmt = $pdo->prepare($planSql);
    $stmt->execute($params);
    $planDistribution = $stmt->fetchAll();
    
    // Get monthly revenue trend (last 6 months)
    $trendSql = "
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as payment_count,
            SUM(CASE WHEN status = 'successful' THEN amount ELSE 0 END) as revenue
        FROM subscription_payments
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
    ";
    
    $stmt = $pdo->prepare($trendSql);
    $stmt->execute();
    $monthlyTrend = $stmt->fetchAll();
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'payments' => $payments,
        'stats' => $stats,
        'plan_distribution' => $planDistribution,
        'monthly_trend' => $monthlyTrend
    ]);
}

function exportPayments($pdo) {
    $month = $_GET['month'] ?? '';
    $status = $_GET['status'] ?? '';
    
    // Build WHERE clause for filters
    $whereConditions = [];
    $params = [];
    
    if (!empty($month)) {
        $whereConditions[] = "DATE_FORMAT(sp.created_at, '%Y-%m') = ?";
        $params[] = $month;
    }
    
    if (!empty($status)) {
        $whereConditions[] = "sp.status = ?";
        $params[] = $status;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Get all subscription payments for export
    $sql = "
        SELECT 
            sp.transaction_id,
            sp.tx_ref,
            sp.amount,
            sp.currency,
            sp.status,
            sp.payment_method,
            sp.plan_type,
            sp.subscription_start,
            sp.subscription_end,
            sp.created_at,
            c.name as company_name,
            CONCAT(u.first_name, ' ', u.last_name) as user_name,
            u.email as user_email
        FROM subscription_payments sp
        LEFT JOIN companies c ON sp.company_id = c.id
        LEFT JOIN users u ON sp.user_id = u.id
        {$whereClause}
        ORDER BY sp.created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $payments = $stmt->fetchAll();
    
    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="subscription_payments_export_' . date('Y-m-d') . '.csv"');
    
    // Create CSV output
    $output = fopen('php://output', 'w');
    
    // CSV headers
    fputcsv($output, [
        'Transaction ID',
        'TX Reference',
        'Company',
        'User Name',
        'User Email',
        'Plan Type',
        'Amount',
        'Currency',
        'Status',
        'Payment Method',
        'Subscription Start',
        'Subscription End',
        'Payment Date'
    ]);
    
    // CSV data
    foreach ($payments as $payment) {
        fputcsv($output, [
            $payment['transaction_id'],
            $payment['tx_ref'],
            $payment['company_name'] ?? 'N/A',
            $payment['user_name'] ?? 'N/A',
            $payment['user_email'] ?? 'N/A',
            $payment['plan_type'],
            $payment['amount'],
            $payment['currency'],
            $payment['status'],
            $payment['payment_method'] ?? 'N/A',
            date('Y-m-d H:i:s', strtotime($payment['subscription_start'])),
            date('Y-m-d H:i:s', strtotime($payment['subscription_end'])),
            date('Y-m-d H:i:s', strtotime($payment['created_at']))
        ]);
    }
    
    fclose($output);
}
?>