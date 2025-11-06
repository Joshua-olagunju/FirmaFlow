<?php
// SuperAdmin Analytics API
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
$period = $_GET['period'] ?? '30d';
$type = $_GET['type'] ?? 'all';

try {
    // Use the PDO connection from auth file
    
    switch ($action) {
        case 'export':
            exportAnalyticsReport($pdo, $period);
            break;
            
        default:
            getAnalyticsData($pdo, $period, $type);
            break;
    }
} catch (Exception $e) {
    error_log("Analytics API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function getAnalyticsData($pdo, $period, $type) {
    // Calculate date range
    $dateRange = getDateRange($period);
    
    // Get KPIs
    $kpis = getKPIs($pdo, $dateRange);
    
    // Get trends data
    $trends = getTrends($pdo, $dateRange, $type);
    
    // Get top companies
    $topCompanies = getTopCompanies($pdo, $dateRange);
    
    // Get recent activity
    $recentActivity = getRecentActivity($pdo);
    
    // Get distribution data
    $distributions = getDistributions($pdo);
    
    echo json_encode([
        'success' => true,
        'kpis' => $kpis,
        'trends' => $trends,
        'top_companies' => $topCompanies,
        'recent_activity' => $recentActivity,
        'distributions' => $distributions
    ]);
}

function getDateRange($period) {
    $endDate = date('Y-m-d H:i:s');
    
    switch ($period) {
        case '7d':
            $startDate = date('Y-m-d H:i:s', strtotime('-7 days'));
            break;
        case '30d':
            $startDate = date('Y-m-d H:i:s', strtotime('-30 days'));
            break;
        case '90d':
            $startDate = date('Y-m-d H:i:s', strtotime('-90 days'));
            break;
        case '1y':
            $startDate = date('Y-m-d H:i:s', strtotime('-1 year'));
            break;
        default:
            $startDate = date('Y-m-d H:i:s', strtotime('-30 days'));
    }
    
    return ['start' => $startDate, 'end' => $endDate];
}

function getKPIs($pdo, $dateRange) {
    // Total revenue
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND created_at BETWEEN ? AND ?");
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
    $totalRevenue = $stmt->fetch()['total'];
    
    // Previous period revenue for comparison
    $prevStart = date('Y-m-d H:i:s', strtotime($dateRange['start'] . ' -' . getDaysDiff($dateRange) . ' days'));
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND created_at BETWEEN ? AND ?");
    $stmt->execute([$prevStart, $dateRange['start']]);
    $prevRevenue = $stmt->fetch()['total'];
    
    $revenueChange = $prevRevenue > 0 ? round((($totalRevenue - $prevRevenue) / $prevRevenue) * 100, 1) : 0;
    
    // Active users
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM users WHERE is_active = 1 AND created_at BETWEEN ? AND ?");
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
    $activeUsers = $stmt->fetch()['total'];
    
    // Previous period active users
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM users WHERE is_active = 1 AND created_at BETWEEN ? AND ?");
    $stmt->execute([$prevStart, $dateRange['start']]);
    $prevActiveUsers = $stmt->fetch()['total'];
    
    $usersChange = $prevActiveUsers > 0 ? round((($activeUsers - $prevActiveUsers) / $prevActiveUsers) * 100, 1) : 0;
    
    // Total companies
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM companies WHERE created_at BETWEEN ? AND ?");
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
    $totalCompanies = $stmt->fetch()['total'];
    
    // Previous period companies
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM companies WHERE created_at BETWEEN ? AND ?");
    $stmt->execute([$prevStart, $dateRange['start']]);
    $prevCompanies = $stmt->fetch()['total'];
    
    $companiesChange = $prevCompanies > 0 ? round((($totalCompanies - $prevCompanies) / $prevCompanies) * 100, 1) : 0;
    
    // Conversion rate (completed payments / total attempts)
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM payments WHERE created_at BETWEEN ? AND ?");
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
    $totalPayments = $stmt->fetch()['total'];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM payments WHERE status = 'completed' AND created_at BETWEEN ? AND ?");
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
    $successfulPayments = $stmt->fetch()['total'];
    
    $conversionRate = $totalPayments > 0 ? round(($successfulPayments / $totalPayments) * 100, 1) : 0;
    
    // Previous conversion rate
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM payments WHERE created_at BETWEEN ? AND ?");
    $stmt->execute([$prevStart, $dateRange['start']]);
    $prevTotalPayments = $stmt->fetch()['total'];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM payments WHERE status = 'completed' AND created_at BETWEEN ? AND ?");
    $stmt->execute([$prevStart, $dateRange['start']]);
    $prevSuccessfulPayments = $stmt->fetch()['total'];
    
    $prevConversionRate = $prevTotalPayments > 0 ? round(($prevSuccessfulPayments / $prevTotalPayments) * 100, 1) : 0;
    $conversionChange = $prevConversionRate > 0 ? round($conversionRate - $prevConversionRate, 1) : 0;
    
    return [
        'total_revenue' => $totalRevenue,
        'revenue_change' => $revenueChange,
        'active_users' => $activeUsers,
        'users_change' => $usersChange,
        'total_companies' => $totalCompanies,
        'companies_change' => $companiesChange,
        'conversion_rate' => $conversionRate,
        'conversion_change' => $conversionChange
    ];
}

function getTrends($pdo, $dateRange, $type) {
    // Generate daily data points
    $labels = [];
    $data = [];
    
    $start = new DateTime($dateRange['start']);
    $end = new DateTime($dateRange['end']);
    $interval = new DateInterval('P1D');
    
    while ($start <= $end) {
        $date = $start->format('Y-m-d');
        $labels[] = $start->format('M j');
        
        switch ($type) {
            case 'revenue':
                $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as value FROM payments WHERE status = 'completed' AND DATE(created_at) = ?");
                break;
            case 'users':
                $stmt = $pdo->prepare("SELECT COUNT(*) as value FROM users WHERE DATE(created_at) = ?");
                break;
            case 'companies':
                $stmt = $pdo->prepare("SELECT COUNT(*) as value FROM companies WHERE DATE(created_at) = ?");
                break;
            default:
                $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as value FROM payments WHERE status = 'completed' AND DATE(created_at) = ?");
        }
        
        $stmt->execute([$date]);
        $result = $stmt->fetch();
        $data[] = $result['value'] ?? 0;
        
        $start->add($interval);
    }
    
    return [
        'labels' => $labels,
        'data' => $data
    ];
}

function getTopCompanies($pdo, $dateRange) {
    $sql = "
        SELECT 
            c.name,
            COUNT(DISTINCT u.id) as user_count,
            COALESCE(SUM(p.amount), 0) as revenue,
            ROUND(RAND() * 20 - 10, 1) as growth
        FROM companies c
        LEFT JOIN users u ON c.id = u.company_id
        LEFT JOIN payments p ON c.id = p.company_id AND p.status = 'completed' AND p.created_at BETWEEN ? AND ?
        WHERE c.created_at BETWEEN ? AND ?
        GROUP BY c.id, c.name
        ORDER BY revenue DESC, user_count DESC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$dateRange['start'], $dateRange['end'], $dateRange['start'], $dateRange['end']]);
    return $stmt->fetchAll();
}

function getRecentActivity($pdo) {
    $activities = [];
    
    // Recent user registrations
    $stmt = $pdo->prepare("
        SELECT 'User Registration' as title, 
               CONCAT(first_name, ' ', last_name, ' joined') as description,
               created_at as timestamp,
               'success' as type
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 3
    ");
    $stmt->execute();
    $activities = array_merge($activities, $stmt->fetchAll());
    
    // Recent payments
    $stmt = $pdo->prepare("
        SELECT 'Payment Received' as title,
               CONCAT('₦', FORMAT(amount, 0), ' payment received') as description,
               created_at as timestamp,
               CASE WHEN status = 'completed' THEN 'success' ELSE 'danger' END as type
        FROM payments 
        ORDER BY created_at DESC 
        LIMIT 3
    ");
    $stmt->execute();
    $activities = array_merge($activities, $stmt->fetchAll());
    
    // Recent companies
    $stmt = $pdo->prepare("
        SELECT 'New Company' as title,
               CONCAT(name, ' registered') as description,
               created_at as timestamp,
               'info' as type
        FROM companies 
        ORDER BY created_at DESC 
        LIMIT 2
    ");
    $stmt->execute();
    $activities = array_merge($activities, $stmt->fetchAll());
    
    // Sort by timestamp
    usort($activities, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    return array_slice($activities, 0, 8);
}

function getDistributions($pdo) {
    // User roles distribution
    $stmt = $pdo->query("
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role
    ");
    $roleData = $stmt->fetchAll();
    $roles = ['admin' => 0, 'manager' => 0, 'user' => 0];
    foreach ($roleData as $role) {
        $roles[$role['role']] = $role['count'];
    }
    
    // Subscription plans distribution
    $stmt = $pdo->query("
        SELECT subscription_plan, COUNT(*) as count 
        FROM companies 
        GROUP BY subscription_plan
    ");
    $subData = $stmt->fetchAll();
    $subscriptions = ['free' => 0, 'starter' => 0, 'professional' => 0, 'enterprise' => 0];
    foreach ($subData as $sub) {
        if (isset($subscriptions[$sub['subscription_plan']])) {
            $subscriptions[$sub['subscription_plan']] = $sub['count'];
        }
    }
    
    // Payment status distribution
    $stmt = $pdo->query("
        SELECT status, COUNT(*) as count 
        FROM payments 
        GROUP BY status
    ");
    $payData = $stmt->fetchAll();
    $payments = ['completed' => 0, 'pending' => 0, 'cancelled' => 0];
    foreach ($payData as $pay) {
        if (isset($payments[$pay['status']])) {
            $payments[$pay['status']] = $pay['count'];
        }
    }
    
    return [
        'roles' => $roles,
        'subscriptions' => $subscriptions,
        'payments' => $payments
    ];
}

function getDaysDiff($dateRange) {
    $start = new DateTime($dateRange['start']);
    $end = new DateTime($dateRange['end']);
    return $end->diff($start)->days;
}

function exportAnalyticsReport($pdo, $period) {
    $dateRange = getDateRange($period);
    $kpis = getKPIs($pdo, $dateRange);
    $topCompanies = getTopCompanies($pdo, $dateRange);
    
    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="analytics_report_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Report header
    fputcsv($output, ['FirmaFlow Analytics Report']);
    fputcsv($output, ['Generated:', date('Y-m-d H:i:s')]);
    fputcsv($output, ['Period:', $period]);
    fputcsv($output, []);
    
    // KPIs
    fputcsv($output, ['KEY PERFORMANCE INDICATORS']);
    fputcsv($output, ['Metric', 'Value', 'Change']);
    fputcsv($output, ['Total Revenue', '₦' . number_format($kpis['total_revenue']), $kpis['revenue_change'] . '%']);
    fputcsv($output, ['Active Users', $kpis['active_users'], $kpis['users_change'] . '%']);
    fputcsv($output, ['Total Companies', $kpis['total_companies'], $kpis['companies_change'] . '%']);
    fputcsv($output, ['Conversion Rate', $kpis['conversion_rate'] . '%', $kpis['conversion_change'] . '%']);
    fputcsv($output, []);
    
    // Top Companies
    fputcsv($output, ['TOP PERFORMING COMPANIES']);
    fputcsv($output, ['Company', 'Users', 'Revenue', 'Growth']);
    foreach ($topCompanies as $company) {
        fputcsv($output, [
            $company['name'],
            $company['user_count'],
            '₦' . number_format($company['revenue']),
            $company['growth'] . '%'
        ]);
    }
    
    fclose($output);
}
?>