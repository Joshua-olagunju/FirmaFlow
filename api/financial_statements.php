<?php
// Clean Financial Statements API for Advanced Reports
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/currency_helper.php';
require_once __DIR__ . '/../includes/account_resolver_functions.php';

// Disable error output to prevent JSON corruption
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Set JSON header
if (!headers_sent()) {
    header('Content-Type: application/json');
}

// Check authentication
if (!isset($_SESSION['user_id']) || !isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

$company_id = $_SESSION['company_id'];
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'kpis':
            $from_date = $_GET['from'] ?? date('Y-m-01');
            $to_date = $_GET['to'] ?? date('Y-m-d');
            
            // Get data from AccountResolver
            $pl_data = getAccountResolverProfitLoss($pdo, $company_id, $from_date, $to_date);
            $cf_data = getAccountResolverCashFlow($pdo, $company_id, $from_date, $to_date);
            
            $currency = getSystemCurrency($pdo, $company_id);
            
            echo json_encode([
                'success' => true,
                'currency' => $currency,
                'revenue' => $pl_data['total_income'],
                'expenses' => $pl_data['total_expenses'],
                'profit' => $pl_data['net_income'],
                'cashFlow' => $cf_data['summary']['net_cash_flow'],
                'revenueFormatted' => formatCurrency($pl_data['total_income'], $currency),
                'expensesFormatted' => formatCurrency($pl_data['total_expenses'], $currency),
                'profitFormatted' => formatCurrency($pl_data['net_income'], $currency),
                'cashFlowFormatted' => formatCurrency($cf_data['summary']['net_cash_flow'], $currency),
                'revenueChange' => 0,
                'expensesChange' => 0,
                'profitChange' => 0,
                'cashFlowChange' => 0
            ]);
            break;
            
        case 'charts':
            $from_date = $_GET['from'] ?? date('Y-m-01');
            $to_date = $_GET['to'] ?? date('Y-m-d');
            
            $currency = getSystemCurrency($pdo, $company_id);
            
            // Get monthly performance data
            $months = [];
            $revenues = [];
            $expenses = [];
            $profits = [];
            
            // Generate last 6 months
            for ($i = 5; $i >= 0; $i--) {
                $month_start = date('Y-m-01', strtotime("-$i months"));
                $month_end = date('Y-m-t', strtotime("-$i months"));
                
                $month_pl = getAccountResolverProfitLoss($pdo, $company_id, $month_start, $month_end);
                
                $months[] = date('M Y', strtotime($month_start));
                $revenues[] = $month_pl['total_income'];
                $expenses[] = $month_pl['total_expenses'];
                $profits[] = $month_pl['net_income'];
            }
            
            echo json_encode([
                'success' => true,
                'currency' => $currency,
                'revenueExpenses' => [
                    'labels' => $months,
                    'datasets' => [
                        [
                            'label' => 'Revenue',
                            'data' => $revenues,
                            'borderColor' => '#667eea',
                            'backgroundColor' => 'rgba(102, 126, 234, 0.1)'
                        ],
                        [
                            'label' => 'Expenses',
                            'data' => $expenses,
                            'borderColor' => '#f093fb',
                            'backgroundColor' => 'rgba(240, 147, 251, 0.1)'
                        ]
                    ]
                ],
                'revenueSources' => [
                    'labels' => ['Sales Revenue'],
                    'datasets' => [
                        [
                            'data' => [$pl_data['total_income'] ?? 0],
                            'backgroundColor' => ['#667eea']
                        ]
                    ]
                ],
                'monthlyPerformance' => [
                    'labels' => $months,
                    'datasets' => [
                        [
                            'label' => 'Net Income',
                            'data' => $profits,
                            'borderColor' => '#43e97b',
                            'backgroundColor' => 'rgba(67, 233, 123, 0.1)',
                            'fill' => true,
                            'tension' => 0.4
                        ]
                    ]
                ]
            ]);
            break;
            
        case 'profit_loss':
            $from_date = $_GET['from'] ?? date('Y-m-01');
            $to_date = $_GET['to'] ?? date('Y-m-d');
            
            $data = getAccountResolverProfitLoss($pdo, $company_id, $from_date, $to_date);
            
            echo json_encode([
                'success' => true,
                'data' => $data,
                'statement' => [
                    ['account' => 'REVENUE', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true],
                    ['account' => 'Sales Revenue', 'current' => $data['total_income'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false],
                    ['account' => 'Total Revenue', 'current' => $data['total_income'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true],
                    ['account' => 'EXPENSES', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true],
                    ['account' => 'Total Expenses', 'current' => $data['total_expenses'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true],
                    ['account' => 'Net Income', 'current' => $data['net_income'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true]
                ]
            ]);
            break;
            
        case 'balance_sheet':
            $to_date = $_GET['to'] ?? date('Y-m-d');
            
            $data = getAccountResolverBalanceSheet($pdo, $company_id, $to_date);
            
            echo json_encode([
                'success' => true,
                'data' => $data,
                'statement' => [
                    ['account' => 'ASSETS', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true],
                    ['account' => 'Current Assets', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true],
                    ['account' => 'Total Assets', 'current' => $data['total_assets'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true],
                    ['account' => 'LIABILITIES', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true],
                    ['account' => 'Total Liabilities', 'current' => $data['total_liabilities'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true],
                    ['account' => 'EQUITY', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true],
                    ['account' => 'Total Equity', 'current' => $data['total_equity'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true]
                ]
            ]);
            break;
            
        case 'cash_flow':
            $from_date = $_GET['from'] ?? date('Y-m-01');
            $to_date = $_GET['to'] ?? date('Y-m-d');
            
            $data = getAccountResolverCashFlow($pdo, $company_id, $from_date, $to_date);
            
            echo json_encode([
                'success' => true,
                'data' => $data,
                'statement' => [
                    ['account' => 'OPERATING ACTIVITIES', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'operating'],
                    ['account' => 'Net Operating Cash Flow', 'current' => $data['operating']['total'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'operating_total'],
                    ['account' => 'INVESTING ACTIVITIES', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'investing'],
                    ['account' => 'Net Investing Cash Flow', 'current' => $data['investing']['total'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'investing_total'],
                    ['account' => 'FINANCING ACTIVITIES', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'financing'],
                    ['account' => 'Net Financing Cash Flow', 'current' => $data['financing']['total'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'financing_total'],
                    ['account' => 'Net Cash Flow', 'current' => $data['summary']['net_cash_flow'], 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'net_cash_flow']
                ]
            ]);
            break;
            
        case 'top_customers':
            $from_date = $_GET['from'] ?? date('Y-m-01');
            $to_date = $_GET['to'] ?? date('Y-m-d');
            
            // Get top customers from sales invoices
            $stmt = $pdo->prepare("
                SELECT 
                    c.name as customer_name,
                    COUNT(si.id) as invoice_count,
                    SUM(si.total) as total_sales,
                    AVG(si.total) as average_sale
                FROM sales_invoices si
                LEFT JOIN customers c ON si.customer_id = c.id
                WHERE si.company_id = ? 
                    AND si.invoice_date BETWEEN ? AND ?
                    AND si.status != 'draft'
                GROUP BY c.id, c.name
                HAVING total_sales > 0
                ORDER BY total_sales DESC
                LIMIT 10
            ");
            $stmt->execute([$company_id, $from_date, $to_date]);
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'customers' => $customers
            ]);
            break;
            
        case 'revenue_sources':
            $from_date = $_GET['from'] ?? date('Y-m-01');
            $to_date = $_GET['to'] ?? date('Y-m-d');
            
            // Get top 10 selling products by revenue
            $stmt = $pdo->prepare("
                SELECT 
                    COALESCE(p.name, 'Unknown Product') as product_name,
                    SUM(sil.quantity * sil.unit_price) as revenue,
                    SUM(sil.quantity) as total_quantity,
                    COUNT(DISTINCT si.id) as invoice_count
                FROM sales_invoice_lines sil
                LEFT JOIN products p ON sil.product_id = p.id
                JOIN sales_invoices si ON sil.invoice_id = si.id
                WHERE si.company_id = ? 
                    AND si.invoice_date BETWEEN ? AND ?
                    AND si.status != 'draft'
                GROUP BY p.id, p.name
                HAVING revenue > 0
                ORDER BY revenue DESC
                LIMIT 10
            ");
            $stmt->execute([$company_id, $from_date, $to_date]);
            $sources = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Calculate total revenue for percentage calculation
            $total_revenue = array_sum(array_column($sources, 'revenue'));
            
            // Add percentage to each source
            foreach ($sources as &$source) {
                $source['percentage'] = $total_revenue > 0 ? round(($source['revenue'] / $total_revenue) * 100, 1) : 0;
            }
            
            echo json_encode([
                'success' => true,
                'sources' => $sources,
                'total_revenue' => $total_revenue
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
    
} catch (Exception $e) {
    error_log("Financial Statements API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error']);
}
?>