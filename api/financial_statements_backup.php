<?php
// Prevent multiple inclusions
if (defined('FINANCIAL_STATEMENTS_API_LOADED')) {
    return;
}
define('FINANCIAL_STATEMENTS_API_LOADED', true);

// Start session only if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/currency_helper.php';
require_once __DIR__ . '/../includes/AccountResolver.php';

// Include AccountResolver functions (not the API wrapper)
require_once __DIR__ . '/../includes/account_resolver_functions.php';

// Enable error reporting for debugging but don't display errors
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Check authentication
if (!isset($_SESSION['user_id']) || !isset($_SESSION['company_id'])) {
    error_log("Financial Statements API - Authentication failed. Session user_id: " . ($_SESSION['user_id'] ?? 'not set') . ", company_id: " . ($_SESSION['company_id'] ?? 'not set'));
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Authentication required', 'debug' => 'Session not found']);
    exit;
}

$company_id = $_SESSION['company_id'];
$action = $_GET['action'] ?? '';

// Set content type header
if (!headers_sent()) {
    header('Content-Type: application/json');
}

try {
    switch ($action) {
        case 'kpis':
            echo json_encode(getKPIs($pdo, $company_id, $_GET));
            break;
            
        case 'charts':
            echo json_encode(getChartData($pdo, $company_id, $_GET));
            break;
            
        case 'profit_loss':
            echo json_encode(getProfitLossAccountResolver($pdo, $company_id, $_GET));
            break;
            
        case 'balance_sheet':
            echo json_encode(getBalanceSheetAccountResolver($pdo, $company_id, $_GET));
            break;
            
        case 'cash_flow':
            echo json_encode(getCashFlowAccountResolver($pdo, $company_id, $_GET));
            break;
            
        case 'top_customers':
            echo json_encode(getTopCustomers($pdo, $company_id, $_GET));
            break;
            
        case 'drill_down':
            echo json_encode(getDrillDownData($pdo, $company_id, $_GET));
            break;
            
        case 'export':
            handleExport($pdo, $company_id, $_GET);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
    
} catch (Exception $e) {
    error_log("Financial Statements API Error: " . $e->getMessage() . " in " . $e->getFile() . " line " . $e->getLine());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage(),
        'debug' => [
            'action' => $action,
            'company_id' => $company_id,
            'file' => basename($e->getFile()),
            'line' => $e->getLine()
        ]
    ]);
}

// AccountResolver wrapper functions for consistent API interface
if (!function_exists('getProfitLossAccountResolver')) {
function getProfitLossAccountResolver($pdo, $company_id, $params) {
    $from_date = $params['from'] ?? date('Y-m-01');
    $to_date = $params['to'] ?? date('Y-m-d');
    
    try {
        $data = getAccountResolverProfitLoss($pdo, $company_id, $from_date, $to_date);
        
        // Transform to expected format for frontend
        return [
            'success' => true,
            'data' => $data,
            'revenue' => [
                'total' => $data['total_income'],
                'accounts' => $data['income_accounts']
            ],
            'expenses' => [
                'total' => $data['total_expenses'],
                'accounts' => $data['expense_accounts']
            ],
            'net_income' => $data['net_income'],
            'period' => $data['period'],
            'method' => 'account_resolver'
        ];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}
}

if (!function_exists('getBalanceSheetAccountResolver')) {
function getBalanceSheetAccountResolver($pdo, $company_id, $params) {
    $to_date = $params['to'] ?? date('Y-m-d');
    
    try {
        $data = getAccountResolverBalanceSheet($pdo, $company_id, $to_date);
        
        // Transform to expected format for frontend
        return [
            'success' => true,
            'data' => $data,
            'assets' => [
                'current' => [
                    'total' => $data['total_current_assets'],
                    'accounts' => $data['current_assets']
                ],
                'fixed' => [
                    'total' => $data['total_fixed_assets'],
                    'accounts' => $data['fixed_assets']
                ]
            ],
            'liabilities' => [
                'current' => [
                    'total' => $data['total_current_liabilities'],
                    'accounts' => $data['current_liabilities']
                ],
                'long_term' => [
                    'total' => $data['total_long_term_liabilities'],
                    'accounts' => $data['long_term_liabilities']
                ]
            ],
            'equity' => [
                'total' => $data['total_equity'],
                'accounts' => $data['equity_accounts']
            ],
            'total_assets' => $data['total_assets'],
            'total_liabilities_equity' => $data['total_liabilities_equity'],
            'is_balanced' => $data['is_balanced'],
            'as_of_date' => $data['as_of_date'],
            'method' => 'account_resolver'
        ];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}
}

if (!function_exists('getCashFlowAccountResolver')) {
function getCashFlowAccountResolver($pdo, $company_id, $params) {
    $from_date = $params['from'] ?? date('Y-m-01');
    $to_date = $params['to'] ?? date('Y-m-d');
    
    try {
        $data = getAccountResolverCashFlow($pdo, $company_id, $from_date, $to_date);
        
        // Transform to expected format for frontend
        return [
            'success' => true,
            'data' => $data,
            'operating' => $data['operating'],
            'investing' => $data['investing'],
            'financing' => $data['financing'],
            'summary' => $data['summary'],
            'balances' => $data['balances'],
            'period' => $data['period'],
            'method' => 'account_resolver'
        ];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}
}

if (!function_exists('getKPIs')) {
function getKPIs($pdo, $company_id, $params) {
    $from_date = $params['from'] ?? date('Y-m-01');
    $to_date = $params['to'] ?? date('Y-m-d');
    $comparison = $params['comparison'] ?? '';
    
    // Get system currency with error handling
    $currency = getSystemCurrency($pdo, $company_id);
    
    // Current period calculations using AccountResolver
    try {
        // Get P&L data from AccountResolver
        $pl_data = getAccountResolverProfitLoss($pdo, $company_id, $from_date, $to_date);
        $revenue = $pl_data['total_income'];
        $expenses = $pl_data['total_expenses'];
        $profit = $pl_data['net_income'];
        
        // Get Cash Flow data from AccountResolver
        $cf_data = getAccountResolverCashFlow($pdo, $company_id, $from_date, $to_date);
        $cashFlow = $cf_data['summary']['net_cash_flow'];
    } catch (Exception $e) {
        // Return zero values if database error occurs
        $revenue = 0;
        $expenses = 0;
        $profit = 0;
        $cashFlow = 0;
    }
    
    $result = [
        'success' => true,
        'currency' => $currency,
        'revenue' => $revenue,
        'expenses' => $expenses,
        'profit' => $profit,
        'cashFlow' => $cashFlow,
        'revenueFormatted' => formatCurrency($revenue, $currency),
        'expensesFormatted' => formatCurrency($expenses, $currency),
        'profitFormatted' => formatCurrency($profit, $currency),
        'cashFlowFormatted' => formatCurrency($cashFlow, $currency),
        'revenueChange' => 0,
        'expensesChange' => 0,
        'profitChange' => 0,
        'cashFlowChange' => 0
    ];
    
    // Calculate changes if comparison is requested
    if ($comparison) {
        $compareParams = getComparisonDates($from_date, $to_date, $comparison);
        
        $prevRevenue = getTotalRevenue($pdo, $company_id, $compareParams['from'], $compareParams['to']);
        $prevExpenses = getTotalExpenses($pdo, $company_id, $compareParams['from'], $compareParams['to']);
        $prevProfit = $prevRevenue - $prevExpenses;
        $prevCashFlow = getCashFlowTotal($pdo, $company_id, $compareParams['from'], $compareParams['to']);
        
        $result['revenueChange'] = calculatePercentageChange($prevRevenue, $revenue);
        $result['expensesChange'] = calculatePercentageChange($prevExpenses, $expenses);
        $result['profitChange'] = calculatePercentageChange($prevProfit, $profit);
        $result['cashFlowChange'] = calculatePercentageChange($prevCashFlow, $cashFlow);
    }
    
    return $result;
}
}

if (!function_exists('getChartData')) {
function getChartData($pdo, $company_id, $params) {
    $from_date = $params['from'] ?? date('Y-m-01');
    $to_date = $params['to'] ?? date('Y-m-d');
    
    // Get system currency
    $currency = getSystemCurrency($pdo, $company_id);
    
    return [
        'success' => true,
        'currency' => $currency,
        'revenueExpenses' => getRevenueExpensesChart($pdo, $company_id, $from_date, $to_date),
        'revenueSources' => getRevenueSourcesChart($pdo, $company_id, $from_date, $to_date),
        'monthlyPerformance' => getMonthlyPerformanceChart($pdo, $company_id, $from_date, $to_date)
    ];
}
}

if (!function_exists('getProfitLoss')) {
function getProfitLoss($pdo, $company_id, $params) {
    $from_date = $params['from'] ?? date('Y-m-01');
    $to_date = $params['to'] ?? date('Y-m-d');
    $comparison = $params['comparison'] ?? '';
    
    $statement = [];
    
    // Revenue Section
    $revenue = getTotalRevenue($pdo, $company_id, $from_date, $to_date);
    $salesRevenue = getSalesRevenue($pdo, $company_id, $from_date, $to_date);
    $otherRevenue = $revenue - $salesRevenue;
    
    $statement[] = ['account' => 'REVENUE', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'revenue'];
    $statement[] = ['account' => 'Sales Revenue', 'current' => $salesRevenue, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'account_type' => 'sales'];
    if ($otherRevenue > 0) {
        $statement[] = ['account' => 'Other Revenue', 'current' => $otherRevenue, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'account_type' => 'other_revenue'];
    }
    $statement[] = ['account' => 'Total Revenue', 'current' => $revenue, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'total_revenue'];
    
    // Cost of Goods Sold
    $cogs = getCostOfGoodsSold($pdo, $company_id, $from_date, $to_date);
    if ($cogs > 0) {
        $statement[] = ['account' => 'Cost of Goods Sold', 'current' => $cogs, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'account_type' => 'cogs'];
    }
    
    $grossProfit = $revenue - $cogs;
    $statement[] = ['account' => 'Gross Profit', 'current' => $grossProfit, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'gross_profit'];
    
    // Operating Expenses
    $expenses = getTotalExpenses($pdo, $company_id, $from_date, $to_date);
    $statement[] = ['account' => 'OPERATING EXPENSES', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'expenses'];
    
    // Get expense breakdown
    $expenseBreakdown = getExpenseBreakdown($pdo, $company_id, $from_date, $to_date);
    foreach ($expenseBreakdown as $expense) {
        $statement[] = [
            'account' => $expense['category'],
            'current' => $expense['amount'],
            'previous' => 0,
            'change' => 0,
            'percent_change' => '0.0',
            'is_total' => false,
            'account_type' => 'expense_' . strtolower(str_replace(' ', '_', $expense['category']))
        ];
    }
    
    $statement[] = ['account' => 'Total Operating Expenses', 'current' => $expenses, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'total_expenses'];
    
    // Net Income
    $netIncome = $grossProfit - $expenses;
    $statement[] = ['account' => 'Net Income', 'current' => $netIncome, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'net_income'];
    
    // Add comparison data if requested
    if ($comparison) {
        $compareParams = getComparisonDates($from_date, $to_date, $comparison);
        addProfitLossComparison($pdo, $company_id, $statement, $compareParams['from'], $compareParams['to']);
    }
    
    return ['success' => true, 'statement' => $statement];
}

function getBalanceSheet($pdo, $company_id, $params) {
    $from_date = $params['from'] ?? date('Y-m-01');
    $to_date = $params['to'] ?? date('Y-m-d');
    $comparison = $params['comparison'] ?? '';
    
    $statement = [];
    
    // ASSETS
    $statement[] = ['account' => 'ASSETS', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'assets'];
    
    // Current Assets
    $cash = getCashBalance($pdo, $company_id, $to_date);
    $accountsReceivable = getAccountsReceivable($pdo, $company_id, $to_date);
    $inventory = getInventoryValue($pdo, $company_id, $to_date);
    
    $statement[] = ['account' => 'Current Assets', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'current_assets'];
    $statement[] = ['account' => '  Cash & Cash Equivalents', 'current' => $cash, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'account_type' => 'cash'];
    $statement[] = ['account' => '  Accounts Receivable', 'current' => $accountsReceivable, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'account_type' => 'receivables'];
    $statement[] = ['account' => '  Inventory', 'current' => $inventory, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'account_type' => 'inventory'];
    
    $totalCurrentAssets = $cash + $accountsReceivable + $inventory;
    $statement[] = ['account' => 'Total Current Assets', 'current' => $totalCurrentAssets, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'total_current_assets'];
    
    $totalAssets = $totalCurrentAssets;
    $statement[] = ['account' => 'TOTAL ASSETS', 'current' => $totalAssets, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'total_assets'];
    
    // LIABILITIES & EQUITY
    $statement[] = ['account' => 'LIABILITIES & EQUITY', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'liabilities_equity'];
    
    // Current Liabilities
    $accountsPayable = getAccountsPayable($pdo, $company_id, $to_date);
    $statement[] = ['account' => 'Current Liabilities', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'current_liabilities'];
    $statement[] = ['account' => '  Accounts Payable', 'current' => $accountsPayable, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'account_type' => 'payables'];
    
    $totalLiabilities = $accountsPayable;
    $statement[] = ['account' => 'Total Liabilities', 'current' => $totalLiabilities, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'total_liabilities'];
    
    // Equity
    $retainedEarnings = getRetainedEarnings($pdo, $company_id, $to_date);
    $netIncomeYTD = getNetIncomeYTD($pdo, $company_id, $to_date);
    
    $statement[] = ['account' => 'Equity', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'equity'];
    $statement[] = ['account' => '  Retained Earnings', 'current' => $retainedEarnings, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'account_type' => 'retained_earnings'];
    $statement[] = ['account' => '  Net Income (YTD)', 'current' => $netIncomeYTD, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'account_type' => 'net_income_ytd'];
    
    $totalEquity = $retainedEarnings + $netIncomeYTD;
    $statement[] = ['account' => 'Total Equity', 'current' => $totalEquity, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'total_equity'];
    
    $totalLiabilitiesEquity = $totalLiabilities + $totalEquity;
    $statement[] = ['account' => 'TOTAL LIABILITIES & EQUITY', 'current' => $totalLiabilitiesEquity, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'account_type' => 'total_liabilities_equity'];
    
    // Add comparison data if requested
    if ($comparison) {
        $compareParams = getComparisonDates($from_date, $to_date, $comparison);
        addBalanceSheetComparison($pdo, $company_id, $statement, $compareParams['to']);
    }
    
    return ['success' => true, 'statement' => $statement];
}

function getCashFlow($pdo, $company_id, $params) {
    $from_date = $params['from'] ?? date('Y-m-01');
    $to_date = $params['to'] ?? date('Y-m-d');
    $comparison = $params['comparison'] ?? '';
    
    $statement = [];
    
    // Operating Activities
    $netIncome = getNetIncome($pdo, $company_id, $from_date, $to_date);
    $accountsReceivableChange = getAccountsReceivableChange($pdo, $company_id, $from_date, $to_date);
    $inventoryChange = getInventoryChange($pdo, $company_id, $from_date, $to_date);
    $accountsPayableChange = getAccountsPayableChange($pdo, $company_id, $from_date, $to_date);
    
    $statement[] = ['activity' => 'OPERATING ACTIVITIES', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'activity_type' => 'operating'];
    $statement[] = ['activity' => '  Net Income', 'current' => $netIncome, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'activity_type' => 'net_income'];
    $statement[] = ['activity' => '  Changes in Assets & Liabilities:', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'activity_type' => 'changes_header'];
    $statement[] = ['activity' => '    Accounts Receivable', 'current' => -$accountsReceivableChange, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'activity_type' => 'receivables_change'];
    $statement[] = ['activity' => '    Inventory', 'current' => -$inventoryChange, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'activity_type' => 'inventory_change'];
    $statement[] = ['activity' => '    Accounts Payable', 'current' => $accountsPayableChange, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => false, 'activity_type' => 'payables_change'];
    
    $operatingCashFlow = $netIncome - $accountsReceivableChange - $inventoryChange + $accountsPayableChange;
    $statement[] = ['activity' => 'Net Cash from Operating Activities', 'current' => $operatingCashFlow, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'activity_type' => 'operating_total'];
    
    // Investing Activities (simplified for basic system)
    $statement[] = ['activity' => 'INVESTING ACTIVITIES', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'activity_type' => 'investing'];
    $statement[] = ['activity' => 'Net Cash from Investing Activities', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'activity_type' => 'investing_total'];
    
    // Financing Activities (simplified for basic system)
    $statement[] = ['activity' => 'FINANCING ACTIVITIES', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'activity_type' => 'financing'];
    $statement[] = ['activity' => 'Net Cash from Financing Activities', 'current' => 0, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'activity_type' => 'financing_total'];
    
    // Net Change in Cash
    $netCashChange = $operatingCashFlow;
    $statement[] = ['activity' => 'Net Change in Cash', 'current' => $netCashChange, 'previous' => 0, 'change' => 0, 'percent_change' => '0.0', 'is_total' => true, 'activity_type' => 'net_change'];
    
    // Add comparison data if requested
    if ($comparison) {
        $compareParams = getComparisonDates($from_date, $to_date, $comparison);
        addCashFlowComparison($pdo, $company_id, $statement, $compareParams['from'], $compareParams['to']);
    }
    
    return ['success' => true, 'statement' => $statement];
}

function getTopCustomers($pdo, $company_id, $params) {
    $from_date = $params['from'] ?? date('Y-m-01');
    $to_date = $params['to'] ?? date('Y-m-d');
    
    $sql = "SELECT c.id, c.name, 
                   COUNT(si.id) as transaction_count,
                   COALESCE(SUM(si.total), 0) as total_sales
            FROM customers c
            LEFT JOIN sales_invoices si ON c.id = si.customer_id 
                AND si.invoice_date BETWEEN ? AND ?
                AND si.company_id = ? 
                AND si.status IN ('paid', 'partially_paid')
            WHERE c.company_id = ?
            GROUP BY c.id, c.name
            HAVING total_sales > 0
            ORDER BY total_sales DESC
            LIMIT 10";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$from_date, $to_date, $company_id, $company_id]);
    
    return ['success' => true, 'customers' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getDrillDownData($pdo, $company_id, $params) {
    $type = $params['type'] ?? '';
    $id = $params['id'] ?? '';
    $from_date = $params['from'] ?? date('Y-m-01');
    $to_date = $params['to'] ?? date('Y-m-d');
    
    $details = [];
    
    switch ($type) {
        case 'customer':
            $sql = "SELECT s.sale_date as date, s.invoice_number as reference, 
                           CONCAT('Sale to ', c.name) as description, s.total_amount as amount
                    FROM sales s
                    JOIN customers c ON s.customer_id = c.id
                    WHERE s.customer_id = ? AND s.company_id = ? 
                      AND s.sale_date BETWEEN ? AND ?
                    ORDER BY s.sale_date DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id, $company_id, $from_date, $to_date]);
            $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
            
        case 'sales':
            $sql = "SELECT s.sale_date as date, s.invoice_number as reference,
                           CONCAT('Sale to ', c.name) as description, s.total_amount as amount
                    FROM sales s
                    JOIN customers c ON s.customer_id = c.id
                    WHERE s.company_id = ? AND s.sale_date BETWEEN ? AND ?
                    ORDER BY s.sale_date DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$company_id, $from_date, $to_date]);
            $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
            
        case 'expenses':
            $sql = "SELECT e.expense_date as date, e.reference_number as reference,
                           e.description, e.amount
                    FROM expenses e
                    WHERE e.company_id = ? AND e.expense_date BETWEEN ? AND ?
                    ORDER BY e.expense_date DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$company_id, $from_date, $to_date]);
            $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
    }
    
    return ['success' => true, 'details' => $details];
}

function handleExport($pdo, $company_id, $params) {
    $format = $params['format'] ?? 'pdf';
    $report = $params['report'] ?? 'all';
    $from_date = $params['from'] ?? date('Y-m-01');
    $to_date = $params['to'] ?? date('Y-m-d');
    
    // For now, return a simple CSV export
    // In a full implementation, you would use libraries like TCPDF, PhpSpreadsheet, etc.
    
    // Get company information for export
    $companyInfo = getCompanyInfo($pdo, $company_id);
    $dateRange = ['from' => $from_date, 'to' => $to_date];
    
    // Get data based on report type
    $exportData = [];
    switch ($report) {
        case 'pl':
        case 'profit_loss':
            $exportData = getProfitLoss($pdo, $company_id, $params);
            break;
        case 'bs':
        case 'balance_sheet':
            $exportData = getBalanceSheet($pdo, $company_id, $params);
            break;
        case 'cf':
        case 'cash_flow':
            $exportData = getCashFlow($pdo, $company_id, $params);
            break;
        default:
            $exportData = getKPIs($pdo, $company_id, $params);
            $report = 'kpis';
    }
    
    // Include export helpers
    require_once __DIR__ . '/../includes/export_helpers.php';
    
    $filename = 'financial_report_' . $report . '_' . $from_date . '_' . $to_date;
    
    try {
        switch ($format) {
            case 'excel':
            case 'xlsx':
                $content = exportToExcel($exportData, $report, $companyInfo, $dateRange);
                header('Content-Type: ' . getExportMimeType('xlsx'));
                header('Content-Disposition: attachment; filename="' . $filename . '.xlsx"');
                echo $content;
                break;
                
            case 'csv':
                $content = exportToCSV($exportData, $report, $companyInfo, $dateRange);
                header('Content-Type: ' . getExportMimeType('csv'));
                header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
                echo $content;
                break;
                
            case 'pdf':
                $content = exportToPDF($exportData, $report, $companyInfo, $dateRange);
                header('Content-Type: ' . getExportMimeType('pdf'));
                header('Content-Disposition: attachment; filename="' . $filename . '.pdf"');
                echo $content;
                break;
                
            default:
                // Default to CSV if unknown format
                $content = exportToCSV($exportData, $report, $companyInfo, $dateRange);
                header('Content-Type: ' . getExportMimeType('csv'));
                header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
                echo $content;
        }
        
        exit;
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Export failed: ' . $e->getMessage()]);
    }
}

// Helper Functions

function getTotalRevenue($pdo, $company_id, $from_date, $to_date) {
    try {
        $sql = "SELECT COALESCE(SUM(total), 0) FROM sales_invoices 
                WHERE company_id = ? AND invoice_date BETWEEN ? AND ? AND status IN ('paid', 'partially_paid')";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$company_id, $from_date, $to_date]);
        return (float) $stmt->fetchColumn();
    } catch (Exception $e) {
        error_log("Error in getTotalRevenue: " . $e->getMessage());
        return 0.0;
    }
}

function getTotalExpenses($pdo, $company_id, $from_date, $to_date) {
    try {
        $sql = "SELECT COALESCE(SUM(amount), 0) FROM expenses 
                WHERE company_id = ? AND expense_date BETWEEN ? AND ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$company_id, $from_date, $to_date]);
        return (float) $stmt->fetchColumn();
    } catch (Exception $e) {
        error_log("Error in getTotalExpenses: " . $e->getMessage());
        return 0.0;
    }
}

function getCashFlowTotal($pdo, $company_id, $from_date, $to_date) {
    // Simplified: Revenue - Expenses for cash flow approximation
    return getTotalRevenue($pdo, $company_id, $from_date, $to_date) - 
           getTotalExpenses($pdo, $company_id, $from_date, $to_date);
}

function getSalesRevenue($pdo, $company_id, $from_date, $to_date) {
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total), 0) as total FROM sales_invoices WHERE company_id = ? AND invoice_date BETWEEN ? AND ? AND status IN ('paid', 'partially_paid')");
    $stmt->execute([$company_id, $from_date, $to_date]);
    return $stmt->fetchColumn();
}

function getCostOfGoodsSold($pdo, $company_id, $from_date, $to_date) {
    // Simplified COGS calculation - in a real system this would be more complex
    $sql = "SELECT COALESCE(SUM(p.cost_price * sil.quantity), 0)
            FROM sales_invoices si
            JOIN sales_invoice_lines sil ON si.id = sil.sales_invoice_id
            JOIN products p ON sil.product_id = p.id
            WHERE si.company_id = ? AND si.invoice_date BETWEEN ? AND ? AND si.status IN ('paid', 'partially_paid')";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $from_date, $to_date]);
    return (float) $stmt->fetchColumn();
}

function getExpenseBreakdown($pdo, $company_id, $from_date, $to_date) {
    $sql = "SELECT expense_category as category, COALESCE(SUM(amount), 0) as amount
            FROM expenses 
            WHERE company_id = ? AND expense_date BETWEEN ? AND ?
            GROUP BY expense_category
            ORDER BY amount DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $from_date, $to_date]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getRevenueExpensesChart($pdo, $company_id, $from_date, $to_date) {
    // Get monthly data for the chart
    $sql = "SELECT DATE_FORMAT(invoice_date, '%Y-%m') as month,
                   COALESCE(SUM(total), 0) as revenue
            FROM sales_invoices 
            WHERE company_id = ? AND invoice_date BETWEEN ? AND ? AND status IN ('paid', 'partially_paid')
            GROUP BY DATE_FORMAT(invoice_date, '%Y-%m')
            ORDER BY month";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $from_date, $to_date]);
    $revenueData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $sql = "SELECT DATE_FORMAT(expense_date, '%Y-%m') as month,
                   COALESCE(SUM(amount), 0) as expenses
            FROM expenses 
            WHERE company_id = ? AND expense_date BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
            ORDER BY month";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $from_date, $to_date]);
    $expenseData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Combine data for chart
    $labels = [];
    $revenue = [];
    $expenses = [];
    
    $revenueMap = array_column($revenueData, 'revenue', 'month');
    $expenseMap = array_column($expenseData, 'expenses', 'month');
    
    $allMonths = array_unique(array_merge(array_keys($revenueMap), array_keys($expenseMap)));
    sort($allMonths);
    
    foreach ($allMonths as $month) {
        $labels[] = date('M Y', strtotime($month . '-01'));
        $revenue[] = $revenueMap[$month] ?? 0;
        $expenses[] = $expenseMap[$month] ?? 0;
    }
    
    return [
        'labels' => $labels,
        'revenue' => $revenue,
        'expenses' => $expenses
    ];
}

function getRevenueSourcesChart($pdo, $company_id, $from_date, $to_date) {
    // Break down by top customers from sales_invoices
    $sql = "SELECT c.name, COALESCE(SUM(si.total), 0) as amount
            FROM sales_invoices si
            LEFT JOIN customers c ON si.customer_id = c.id
            WHERE si.company_id = ? AND si.invoice_date BETWEEN ? AND ? AND si.status IN ('paid', 'partially_paid')
            GROUP BY c.id, c.name
            ORDER BY amount DESC
            LIMIT 5";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $from_date, $to_date]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Handle cases where customer name might be null
    $labels = [];
    $amounts = [];
    foreach ($data as $row) {
        $labels[] = $row['name'] ?: 'Direct Sales';
        $amounts[] = (float) $row['amount'];
    }
    
    return [
        'labels' => $labels,
        'data' => $amounts
    ];
}

function getMonthlyPerformanceChart($pdo, $company_id, $from_date, $to_date) {
    // Calculate monthly net income using proper table structure
    $sql = "SELECT months.month,
                   COALESCE(SUM(si.total), 0) - COALESCE(SUM(e.amount), 0) as net_income
            FROM (
                SELECT DISTINCT DATE_FORMAT(invoice_date, '%Y-%m') as month 
                FROM sales_invoices 
                WHERE company_id = ? AND invoice_date BETWEEN ? AND ?
                UNION
                SELECT DISTINCT DATE_FORMAT(expense_date, '%Y-%m') as month 
                FROM expenses 
                WHERE company_id = ? AND expense_date BETWEEN ? AND ?
            ) months
            LEFT JOIN sales_invoices si ON DATE_FORMAT(si.invoice_date, '%Y-%m') = months.month 
                AND si.company_id = ? AND si.status IN ('paid', 'partially_paid')
            LEFT JOIN expenses e ON DATE_FORMAT(e.expense_date, '%Y-%m') = months.month 
                AND e.company_id = ?
            GROUP BY months.month
            ORDER BY months.month";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $from_date, $to_date, $company_id, $from_date, $to_date, $company_id, $company_id]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'labels' => array_map(function($row) { 
            return date('M Y', strtotime($row['month'] . '-01')); 
        }, $data),
        'data' => array_column($data, 'net_income')
    ];
}

// Balance Sheet Helper Functions

function getCashBalance($pdo, $company_id, $to_date) {
    // Simplified: Total received payments minus total made payments
    $received = getTotalRevenue($pdo, $company_id, '2000-01-01', $to_date);
    $paid = getTotalExpenses($pdo, $company_id, '2000-01-01', $to_date);
    return $received - $paid;
}

function getAccountsReceivable($pdo, $company_id, $to_date) {
    // Outstanding invoices (total - amount_paid)
    $sql = "SELECT COALESCE(SUM(total - amount_paid), 0)
            FROM sales_invoices
            WHERE company_id = ? AND invoice_date <= ? AND status IN ('sent', 'partially_paid')";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $to_date]);
    return max(0, (float) $stmt->fetchColumn());
}

function getInventoryValue($pdo, $company_id, $to_date) {
    // Current stock value from products table
    $sql = "SELECT COALESCE(SUM(COALESCE(stock_quantity, 0) * COALESCE(cost_price, 0)), 0)
            FROM products 
            WHERE company_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id]);
    return (float) $stmt->fetchColumn();
}

function getAccountsPayable($pdo, $company_id, $to_date) {
    // Simplified: Outstanding purchase invoices (if we had purchases table)
    // For now, return 0
    return 0;
}

function getRetainedEarnings($pdo, $company_id, $to_date) {
    // Simplified: Accumulated earnings from previous periods
    $yearStart = date('Y-01-01', strtotime($to_date));
    $prevYearEnd = date('Y-12-31', strtotime($yearStart . ' -1 day'));
    
    $revenue = getTotalRevenue($pdo, $company_id, '2000-01-01', $prevYearEnd);
    $expenses = getTotalExpenses($pdo, $company_id, '2000-01-01', $prevYearEnd);
    
    return $revenue - $expenses;
}

function getNetIncomeYTD($pdo, $company_id, $to_date) {
    $yearStart = date('Y-01-01', strtotime($to_date));
    $revenue = getTotalRevenue($pdo, $company_id, $yearStart, $to_date);
    $expenses = getTotalExpenses($pdo, $company_id, $yearStart, $to_date);
    
    return $revenue - $expenses;
}

// Cash Flow Helper Functions

function getNetIncome($pdo, $company_id, $from_date, $to_date) {
    return getTotalRevenue($pdo, $company_id, $from_date, $to_date) - 
           getTotalExpenses($pdo, $company_id, $from_date, $to_date);
}

function getAccountsReceivableChange($pdo, $company_id, $from_date, $to_date) {
    $startBalance = getAccountsReceivable($pdo, $company_id, $from_date);
    $endBalance = getAccountsReceivable($pdo, $company_id, $to_date);
    return $endBalance - $startBalance;
}

function getInventoryChange($pdo, $company_id, $from_date, $to_date) {
    // Simplified: For now return 0 as we don't track inventory changes over time
    return 0;
}

function getAccountsPayableChange($pdo, $company_id, $from_date, $to_date) {
    // Simplified: For now return 0 as we don't have accounts payable tracking
    return 0;
}

// Comparison Helper Functions

function getComparisonDates($from_date, $to_date, $comparison) {
    $from = new DateTime($from_date);
    $to = new DateTime($to_date);
    $period = $from->diff($to)->days + 1;
    
    switch ($comparison) {
        case 'previous_period':
            $compareFrom = clone $from;
            $compareFrom->sub(new DateInterval('P' . $period . 'D'));
            $compareTo = clone $from;
            $compareTo->sub(new DateInterval('P1D'));
            break;
            
        case 'previous_year':
            $compareFrom = clone $from;
            $compareFrom->sub(new DateInterval('P1Y'));
            $compareTo = clone $to;
            $compareTo->sub(new DateInterval('P1Y'));
            break;
            
        default:
            $compareFrom = $from;
            $compareTo = $to;
    }
    
    return [
        'from' => $compareFrom->format('Y-m-d'),
        'to' => $compareTo->format('Y-m-d')
    ];
}

function calculatePercentageChange($old, $new) {
    if ($old == 0) return $new > 0 ? 100 : 0;
    return (($new - $old) / abs($old)) * 100;
}

function addProfitLossComparison($pdo, $company_id, &$statement, $compare_from, $compare_to) {
    // Add comparison data to P&L statement
    $prevRevenue = getTotalRevenue($pdo, $company_id, $compare_from, $compare_to);
    $prevExpenses = getTotalExpenses($pdo, $company_id, $compare_from, $compare_to);
    $prevCogs = getCostOfGoodsSold($pdo, $company_id, $compare_from, $compare_to);
    
    foreach ($statement as &$row) {
        switch ($row['account_type']) {
            case 'sales':
                $row['previous'] = $prevRevenue;
                break;
            case 'total_revenue':
                $row['previous'] = $prevRevenue;
                break;
            case 'cogs':
                $row['previous'] = $prevCogs;
                break;
            case 'gross_profit':
                $row['previous'] = $prevRevenue - $prevCogs;
                break;
            case 'total_expenses':
                $row['previous'] = $prevExpenses;
                break;
            case 'net_income':
                $row['previous'] = ($prevRevenue - $prevCogs) - $prevExpenses;
                break;
        }
        
        $row['change'] = $row['current'] - $row['previous'];
        $row['percent_change'] = number_format(calculatePercentageChange($row['previous'], $row['current']), 1);
    }
}

function addBalanceSheetComparison($pdo, $company_id, &$statement, $compare_to) {
    // Add comparison data to Balance Sheet
    $prevCash = getCashBalance($pdo, $company_id, $compare_to);
    $prevReceivables = getAccountsReceivable($pdo, $company_id, $compare_to);
    $prevInventory = getInventoryValue($pdo, $company_id, $compare_to);
    $prevPayables = getAccountsPayable($pdo, $company_id, $compare_to);
    $prevRetainedEarnings = getRetainedEarnings($pdo, $company_id, $compare_to);
    $prevNetIncomeYTD = getNetIncomeYTD($pdo, $company_id, $compare_to);
    
    foreach ($statement as &$row) {
        switch ($row['account_type']) {
            case 'cash':
                $row['previous'] = $prevCash;
                break;
            case 'receivables':
                $row['previous'] = $prevReceivables;
                break;
            case 'inventory':
                $row['previous'] = $prevInventory;
                break;
            case 'payables':
                $row['previous'] = $prevPayables;
                break;
            case 'retained_earnings':
                $row['previous'] = $prevRetainedEarnings;
                break;
            case 'net_income_ytd':
                $row['previous'] = $prevNetIncomeYTD;
                break;
        }
        
        $row['change'] = $row['current'] - $row['previous'];
        $row['percent_change'] = number_format(calculatePercentageChange($row['previous'], $row['current']), 1);
    }
}

function addCashFlowComparison($pdo, $company_id, &$statement, $compare_from, $compare_to) {
    // Add comparison data to Cash Flow statement
    $prevNetIncome = getNetIncome($pdo, $company_id, $compare_from, $compare_to);
    $prevReceivablesChange = getAccountsReceivableChange($pdo, $company_id, $compare_from, $compare_to);
    $prevInventoryChange = getInventoryChange($pdo, $company_id, $compare_from, $compare_to);
    $prevPayablesChange = getAccountsPayableChange($pdo, $company_id, $compare_from, $compare_to);
    
    foreach ($statement as &$row) {
        switch ($row['activity_type']) {
            case 'net_income':
                $row['previous'] = $prevNetIncome;
                break;
            case 'receivables_change':
                $row['previous'] = -$prevReceivablesChange;
                break;
            case 'inventory_change':
                $row['previous'] = -$prevInventoryChange;
                break;
            case 'payables_change':
                $row['previous'] = $prevPayablesChange;
                break;
            case 'operating_total':
                $row['previous'] = $prevNetIncome - $prevReceivablesChange - $prevInventoryChange + $prevPayablesChange;
                break;
            case 'net_change':
                $row['previous'] = $prevNetIncome - $prevReceivablesChange - $prevInventoryChange + $prevPayablesChange;
                break;
        }
        
        $row['change'] = $row['current'] - $row['previous'];
        $row['percent_change'] = number_format(calculatePercentageChange($row['previous'], $row['current']), 1);
    }
}

function getCompanyInfo($pdo, $company_id) {
    $sql = "SELECT name FROM companies WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id]);
    $company = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return [
        'name' => $company['name'] ?? 'Company Name',
        'id' => $company_id
    ];
}
?>
