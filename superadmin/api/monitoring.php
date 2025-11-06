<?php
/**
 * SuperAdmin System Monitoring API
 * Provides real-time system statistics and monitoring data
 */

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

// Security headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Require superadmin authentication
requireSuperAdmin();

$action = $_GET['action'] ?? 'dashboard';

switch ($action) {
    case 'dashboard':
        getDashboardStats();
        break;
    case 'system_health':
        getSystemHealth();
        break;
    case 'user_activity':
        getUserActivity();
        break;
    case 'revenue_stats':
        getRevenueStats();
        break;
    case 'subscription_stats':
        getSubscriptionStats();
        break;
    case 'recent_activities':
        getRecentActivities();
        break;
    case 'server_stats':
        getServerStats();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

function getDashboardStats() {
    global $pdo;
    
    try {
        // Total companies
        $stmt = $pdo->query("SELECT COUNT(*) FROM companies");
        $totalCompanies = $stmt->fetchColumn();
        
        // Active companies (logged in last 30 days)
        $stmt = $pdo->query("
            SELECT COUNT(DISTINCT c.id) 
            FROM companies c 
            JOIN users u ON c.id = u.company_id 
            WHERE u.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        $activeCompanies = $stmt->fetchColumn();
        
        // Total users
        $stmt = $pdo->query("SELECT COUNT(*) FROM users");
        $totalUsers = $stmt->fetchColumn();
        
        // Active subscriptions
        $stmt = $pdo->query("
            SELECT COUNT(*) FROM companies 
            WHERE subscription_status = 'active'
        ");
        $activeSubscriptions = $stmt->fetchColumn();
        
        // Pending complaints
        $stmt = $pdo->query("
            SELECT COUNT(*) FROM complaints 
            WHERE status IN ('open', 'in_progress')
        ");
        $pendingComplaints = $stmt->fetchColumn();
        
        // Monthly revenue (current month)
        $stmt = $pdo->query("
            SELECT COALESCE(SUM(amount), 0) 
            FROM payments 
            WHERE YEAR(created_at) = YEAR(NOW()) 
            AND MONTH(created_at) = MONTH(NOW())
            AND status = 'completed'
        ");
        $monthlyRevenue = $stmt->fetchColumn();
        
        // Growth stats (compared to last month)
        $stmt = $pdo->query("
            SELECT 
                COUNT(CASE WHEN YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW()) THEN 1 END) as this_month,
                COUNT(CASE WHEN YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW()) - 1 THEN 1 END) as last_month
            FROM companies
        ");
        $growthData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $growthRate = 0;
        if ($growthData['last_month'] > 0) {
            $growthRate = (($growthData['this_month'] - $growthData['last_month']) / $growthData['last_month']) * 100;
        }
        
        // Chart data - companies registered over last 12 months
        $stmt = $pdo->query("
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as count
            FROM companies 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        ");
        $chartData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Revenue chart data
        $stmt = $pdo->query("
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                SUM(amount) as revenue
            FROM payments 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            AND status = 'completed'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        ");
        $revenueChart = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Subscription distribution
        $stmt = $pdo->query("
            SELECT 
                subscription_plan,
                COUNT(*) as count
            FROM companies 
            WHERE subscription_status = 'active'
            GROUP BY subscription_plan
        ");
        $subscriptionDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'total_companies' => (int)$totalCompanies,
                'active_companies' => (int)$activeCompanies,
                'total_users' => (int)$totalUsers,
                'active_subscriptions' => (int)$activeSubscriptions,
                'pending_complaints' => (int)$pendingComplaints,
                'monthly_revenue' => (float)$monthlyRevenue,
                'growth_rate' => round($growthRate, 2)
            ],
            'charts' => [
                'companies_growth' => $chartData,
                'revenue_trend' => $revenueChart,
                'subscription_distribution' => $subscriptionDistribution
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Dashboard stats error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch dashboard statistics']);
    }
}

function getSystemHealth() {
    global $pdo;
    
    try {
        $health = [
            'status' => 'healthy',
            'checks' => []
        ];
        
        // Database connectivity
        try {
            $pdo->query("SELECT 1");
            $health['checks']['database'] = ['status' => 'healthy', 'message' => 'Database connection successful'];
        } catch (Exception $e) {
            $health['status'] = 'unhealthy';
            $health['checks']['database'] = ['status' => 'error', 'message' => 'Database connection failed'];
        }
        
        // Disk space
        $diskFree = disk_free_space('/');
        $diskTotal = disk_total_space('/');
        $diskUsage = (($diskTotal - $diskFree) / $diskTotal) * 100;
        
        if ($diskUsage > 90) {
            $health['status'] = 'warning';
            $health['checks']['disk_space'] = ['status' => 'warning', 'message' => 'Disk usage above 90%', 'value' => round($diskUsage, 2)];
        } else {
            $health['checks']['disk_space'] = ['status' => 'healthy', 'message' => 'Disk usage normal', 'value' => round($diskUsage, 2)];
        }
        
        // Memory usage
        $memoryUsage = memory_get_usage(true);
        $memoryLimit = ini_get('memory_limit');
        
        if ($memoryLimit !== '-1') {
            $memoryLimitBytes = return_bytes($memoryLimit);
            $memoryPercent = ($memoryUsage / $memoryLimitBytes) * 100;
            
            if ($memoryPercent > 80) {
                $health['status'] = 'warning';
                $health['checks']['memory'] = ['status' => 'warning', 'message' => 'Memory usage above 80%', 'value' => round($memoryPercent, 2)];
            } else {
                $health['checks']['memory'] = ['status' => 'healthy', 'message' => 'Memory usage normal', 'value' => round($memoryPercent, 2)];
            }
        } else {
            $health['checks']['memory'] = ['status' => 'healthy', 'message' => 'Memory limit unlimited', 'value' => 0];
        }
        
        // Recent errors (last 24 hours)
        $errorLogPath = ini_get('error_log');
        $errorCount = 0;
        
        if ($errorLogPath && file_exists($errorLogPath)) {
            $yesterday = time() - 86400;
            $errors = file($errorLogPath);
            foreach ($errors as $error) {
                if (strtotime(substr($error, 1, 20)) > $yesterday) {
                    $errorCount++;
                }
            }
        }
        
        if ($errorCount > 100) {
            $health['status'] = 'warning';
            $health['checks']['error_rate'] = ['status' => 'warning', 'message' => 'High error rate in last 24 hours', 'value' => $errorCount];
        } else {
            $health['checks']['error_rate'] = ['status' => 'healthy', 'message' => 'Error rate normal', 'value' => $errorCount];
        }
        
        // Backup status
        $backupPath = __DIR__ . '/../../backups/';
        $latestBackup = null;
        
        if (is_dir($backupPath)) {
            $files = glob($backupPath . '*.sql');
            if (!empty($files)) {
                usort($files, function($a, $b) {
                    return filemtime($b) - filemtime($a);
                });
                $latestBackup = filemtime($files[0]);
            }
        }
        
        if ($latestBackup && (time() - $latestBackup) < 86400) {
            $health['checks']['backup'] = ['status' => 'healthy', 'message' => 'Recent backup available', 'last_backup' => date('Y-m-d H:i:s', $latestBackup)];
        } else {
            $health['status'] = 'warning';
            $health['checks']['backup'] = ['status' => 'warning', 'message' => 'No recent backup found', 'last_backup' => $latestBackup ? date('Y-m-d H:i:s', $latestBackup) : 'Never'];
        }
        
        echo json_encode(['success' => true, 'health' => $health]);
        
    } catch (Exception $e) {
        error_log("System health check error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to check system health']);
    }
}

function getUserActivity() {
    global $pdo;
    
    try {
        // Recent logins (last 24 hours)
        $stmt = $pdo->query("
            SELECT 
                u.username,
                u.email,
                c.name as company_name,
                u.last_login,
                TIMESTAMPDIFF(MINUTE, u.last_login, NOW()) as minutes_ago
            FROM users u
            JOIN companies c ON u.company_id = c.id
            WHERE u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY u.last_login DESC
            LIMIT 20
        ");
        $recentLogins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Active sessions
        $stmt = $pdo->query("
            SELECT COUNT(*) as count
            FROM users 
            WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        ");
        $activeSessions = $stmt->fetchColumn();
        
        // Daily active users trend
        $stmt = $pdo->query("
            SELECT 
                DATE(last_login) as date,
                COUNT(DISTINCT id) as active_users
            FROM users 
            WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(last_login)
            ORDER BY date ASC
        ");
        $dailyActiveUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'activity' => [
                'recent_logins' => $recentLogins,
                'active_sessions' => (int)$activeSessions,
                'daily_active_users' => $dailyActiveUsers
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("User activity error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch user activity']);
    }
}

function getRevenueStats() {
    global $pdo;
    
    try {
        // Current month revenue
        $stmt = $pdo->query("
            SELECT 
                COALESCE(SUM(amount), 0) as total,
                COUNT(*) as transactions
            FROM payments 
            WHERE YEAR(created_at) = YEAR(NOW()) 
            AND MONTH(created_at) = MONTH(NOW())
            AND status = 'completed'
        ");
        $currentMonth = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Last month revenue
        $stmt = $pdo->query("
            SELECT 
                COALESCE(SUM(amount), 0) as total,
                COUNT(*) as transactions
            FROM payments 
            WHERE YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
            AND MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
            AND status = 'completed'
        ");
        $lastMonth = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Revenue by subscription plan
        $stmt = $pdo->query("
            SELECT 
                c.subscription_plan,
                COALESCE(SUM(p.amount), 0) as revenue,
                COUNT(p.id) as transactions
            FROM companies c
            LEFT JOIN payments p ON c.id = p.company_id AND p.status = 'completed'
            WHERE c.subscription_status = 'active'
            GROUP BY c.subscription_plan
        ");
        $revenueByPlan = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Monthly recurring revenue (MRR)
        $stmt = $pdo->query("
            SELECT 
                COALESCE(SUM(CASE 
                    WHEN c.billing_cycle = 'monthly' THEN p.amount
                    WHEN c.billing_cycle = 'yearly' THEN p.amount / 12
                    ELSE p.amount
                END), 0) as mrr
            FROM companies c
            JOIN payments p ON c.id = p.company_id
            WHERE c.subscription_status = 'active'
            AND p.status = 'completed'
            AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        ");
        $mrr = $stmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'revenue' => [
                'current_month' => $currentMonth,
                'last_month' => $lastMonth,
                'revenue_by_plan' => $revenueByPlan,
                'monthly_recurring_revenue' => (float)$mrr
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Revenue stats error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch revenue statistics']);
    }
}

function getSubscriptionStats() {
    global $pdo;
    
    try {
        // Subscription status breakdown
        $stmt = $pdo->query("
            SELECT 
                subscription_status,
                COUNT(*) as count
            FROM companies 
            GROUP BY subscription_status
        ");
        $statusBreakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Plan distribution
        $stmt = $pdo->query("
            SELECT 
                subscription_plan,
                COUNT(*) as count
            FROM companies 
            WHERE subscription_status = 'active'
            GROUP BY subscription_plan
        ");
        $planDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Expiring subscriptions (next 7 days)
        $stmt = $pdo->query("
            SELECT 
                c.name as company_name,
                c.subscription_plan,
                c.subscription_end_date,
                DATEDIFF(c.subscription_end_date, NOW()) as days_until_expiry
            FROM companies c
            WHERE c.subscription_status = 'active'
            AND c.subscription_end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
            ORDER BY c.subscription_end_date ASC
        ");
        $expiringSubscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Churn rate (last 30 days)
        $stmt = $pdo->query("
            SELECT 
                COUNT(CASE WHEN subscription_status = 'cancelled' AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as cancelled,
                COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active
            FROM companies
        ");
        $churnData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $churnRate = 0;
        if ($churnData['active'] > 0) {
            $churnRate = ($churnData['cancelled'] / ($churnData['active'] + $churnData['cancelled'])) * 100;
        }
        
        echo json_encode([
            'success' => true,
            'subscriptions' => [
                'status_breakdown' => $statusBreakdown,
                'plan_distribution' => $planDistribution,
                'expiring_subscriptions' => $expiringSubscriptions,
                'churn_rate' => round($churnRate, 2)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Subscription stats error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch subscription statistics']);
    }
}

function getRecentActivities() {
    global $pdo;
    
    try {
        // Recent superadmin activities
        $stmt = $pdo->query("
            SELECT 
                username,
                action,
                details,
                created_at,
                ip_address
            FROM superadmin_logs 
            ORDER BY created_at DESC 
            LIMIT 50
        ");
        $adminActivities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Recent customer activities
        $stmt = $pdo->query("
            SELECT 
                u.username,
                c.name as company_name,
                'login' as action,
                u.last_login as created_at
            FROM users u
            JOIN companies c ON u.company_id = c.id
            WHERE u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY u.last_login DESC
            LIMIT 20
        ");
        $customerActivities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'activities' => [
                'admin_activities' => $adminActivities,
                'customer_activities' => $customerActivities
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Recent activities error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch recent activities']);
    }
}

function getServerStats() {
    try {
        $stats = [
            'php_version' => phpversion(),
            'server_time' => date('Y-m-d H:i:s'),
            'uptime' => function_exists('sys_getloadavg') ? sys_getloadavg() : null,
            'memory_usage' => [
                'current' => formatBytes(memory_get_usage(true)),
                'peak' => formatBytes(memory_get_peak_usage(true)),
                'limit' => ini_get('memory_limit')
            ],
            'disk_space' => [
                'free' => formatBytes(disk_free_space('/')),
                'total' => formatBytes(disk_total_space('/'))
            ]
        ];
        
        echo json_encode(['success' => true, 'server_stats' => $stats]);
        
    } catch (Exception $e) {
        error_log("Server stats error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch server statistics']);
    }
}

function return_bytes($val) {
    $val = trim($val);
    $last = strtolower($val[strlen($val)-1]);
    $val = (int)$val;
    switch($last) {
        case 'g':
            $val *= 1024;
        case 'm':
            $val *= 1024;
        case 'k':
            $val *= 1024;
    }
    return $val;
}

function formatBytes($size, $precision = 2) {
    $base = log($size, 1024);
    $suffixes = array('B', 'KB', 'MB', 'GB', 'TB');
    return round(pow(1024, $base - floor($base)), $precision) . ' ' . $suffixes[floor($base)];
}
?>