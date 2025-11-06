<?php
// Clean Reports API - Fixed and Complete
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/subscription_helper.php';

// For testing, allow bypassing authentication if test parameter is set
$is_test = isset($_GET['test']) && $_GET['test'] === 'true';

// Authentication check
if (!$is_test && !isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

// Use test company ID if testing, otherwise use session
$company_id = $is_test ? 13 : $_SESSION['company_id'];
$user_id = $is_test ? 1 : ($_SESSION['user_id'] ?? 0);
$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

// Check subscription access for reports (if not testing)
if (!$is_test && $user_id > 0) {
    $subscriptionInfo = getUserSubscriptionInfo($user_id);
    $plan = $subscriptionInfo['subscription_plan'] ?? 'free';
    
    // Define report access by plan
    $reportAccess = [
        'free' => ['profit_loss', 'balance_sheet', 'sales_summary', 'inventory_summary'],
        'starter' => ['profit_loss', 'balance_sheet', 'sales_summary', 'inventory_summary'],
        'professional' => ['profit_loss', 'balance_sheet', 'trial_balance', 'cash_flow', 'sales_summary', 'inventory_summary'],
        'enterprise' => ['profit_loss', 'balance_sheet', 'trial_balance', 'cash_flow', 'sales_summary', 'inventory_summary']
    ];
    
    $allowedReports = $reportAccess[$plan] ?? $reportAccess['free'];
    
    // Check if requested report is allowed
    $report_type = $_GET['type'] ?? '';
    if ($report_type && !in_array($report_type, $allowedReports)) {
        http_response_code(403);
        $upgradeMessage = ($plan === 'free') 
            ? 'Upgrade to Starter plan or higher to access this report.'
            : 'Upgrade to Professional plan to access advanced financial reports.';
        echo json_encode([
            'error' => 'Report access restricted for your current plan.',
            'message' => $upgradeMessage,
            'plan' => $plan,
            'required_plan' => ($report_type === 'trial_balance' || $report_type === 'cash_flow') ? 'professional' : 'starter'
        ]);
        exit;
    }
}

try {
    if ($method === 'GET') {
        $report_type = $_GET['type'] ?? '';
        $start_date = $_GET['start_date'] ?? date('Y-m-01');
        $end_date = $_GET['end_date'] ?? date('Y-m-t');
        
        switch ($report_type) {
            case 'trial_balance':
                echo json_encode(getTrialBalance($pdo, $company_id, $end_date));
                break;
                
            case 'profit_loss':
                echo json_encode(getProfitLoss($pdo, $company_id, $start_date, $end_date));
                break;
                
            case 'balance_sheet':
                echo json_encode(getBalanceSheet($pdo, $company_id, $end_date));
                break;
                
            case 'cash_flow':
                echo json_encode(getCashFlow($pdo, $company_id, $start_date, $end_date));
                break;
                
            case 'accounts_receivable':
                echo json_encode(getAccountsReceivable($pdo, $company_id));
                break;
                
            case 'accounts_payable':
                echo json_encode(getAccountsPayable($pdo, $company_id));
                break;
                
            case 'sales_report':
                echo json_encode(getSalesReport($pdo, $company_id, $start_date, $end_date));
                break;
                
            case 'purchase_report':
                echo json_encode(getPurchaseReport($pdo, $company_id, $start_date, $end_date));
                break;
                
            case 'inventory_report':
                echo json_encode(getInventoryReport($pdo, $company_id));
                break;
                
            case 'sales_summary':
                echo json_encode(getSalesReport($pdo, $company_id, $start_date, $end_date));
                break;
                
            case 'inventory_summary':
                echo json_encode(getInventoryReport($pdo, $company_id));
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid report type']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'exception', 'message' => $e->getMessage()]);
}

function getTrialBalance($pdo, $company_id, $as_of_date) {
    // Get all accounts with their total debits, credits, and balances from journal entries
    $stmt = $pdo->prepare("
        SELECT 
            a.id,
            a.code,
            a.name,
            a.type,
            COALESCE(SUM(jl.debit), 0) as total_debits,
            COALESCE(SUM(jl.credit), 0) as total_credits,
            CASE 
                WHEN a.type IN ('asset', 'expense') THEN COALESCE(SUM(jl.debit - jl.credit), 0)
                WHEN a.type IN ('liability', 'equity', 'income') THEN COALESCE(SUM(jl.credit - jl.debit), 0)
                ELSE 0
            END as balance
        FROM accounts a
        LEFT JOIN journal_lines jl ON a.id = jl.account_id
        LEFT JOIN journal_entries je ON jl.journal_id = je.id
        WHERE a.company_id = ?
            AND a.is_active = 1
            AND (je.entry_date IS NULL OR je.entry_date <= ?)
        GROUP BY a.id, a.code, a.name, a.type
        ORDER BY a.type, a.code
    ");
    $stmt->execute([$company_id, $as_of_date]);
    $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $trial_balance = [];
    $grand_total_debits = 0;
    $grand_total_credits = 0;
    
    // Separate accounts by type for better organization
    $asset_accounts = [];
    $liability_accounts = [];
    $equity_accounts = [];
    $income_accounts = [];
    $expense_accounts = [];
    
    foreach ($accounts as $account) {
        $account_debits = floatval($account['total_debits']);
        $account_credits = floatval($account['total_credits']);
        $account_balance = floatval($account['balance']);
        
        $account_data = [
            'id' => $account['id'],
            'code' => $account['code'],
            'name' => $account['name'],
            'type' => $account['type'],
            'total_debits' => $account_debits,
            'total_credits' => $account_credits,
            'balance' => $account_balance
        ];
        
        // Add to appropriate category
        switch ($account['type']) {
            case 'asset':
                $asset_accounts[] = $account_data;
                break;
            case 'liability':
                $liability_accounts[] = $account_data;
                break;
            case 'equity':
                $equity_accounts[] = $account_data;
                break;
            case 'income':
                $income_accounts[] = $account_data;
                break;
            case 'expense':
                $expense_accounts[] = $account_data;
                break;
        }
        
        // Add to main trial balance
        $trial_balance[] = $account_data;
        
        // Calculate grand totals (sum of all debit and credit amounts)
        $grand_total_debits += $account_debits;
        $grand_total_credits += $account_credits;
    }
    
    // Check if books are balanced (total debits should equal total credits)
    $books_balanced = abs($grand_total_debits - $grand_total_credits) < 0.01;
    $balance_difference = $grand_total_debits - $grand_total_credits;
    
    return [
        'title' => 'Trial Balance',
        'as_of_date' => $as_of_date,
        'accounts' => $trial_balance,
        'asset_accounts' => $asset_accounts,
        'liability_accounts' => $liability_accounts,
        'equity_accounts' => $equity_accounts,
        'income_accounts' => $income_accounts,
        'expense_accounts' => $expense_accounts,
        'total_debits' => $grand_total_debits,
        'total_credits' => $grand_total_credits,
        'books_balanced' => $books_balanced,
        'balance_difference' => $balance_difference,
        'method' => 'journal_entries_direct'
    ];
}

function getProfitLoss($pdo, $company_id, $start_date, $end_date) {
    // Use AccountResolver to get the specific accounts used by the system
    require_once __DIR__ . '/../includes/AccountResolver.php';
    $resolver = new AccountResolver($pdo, $company_id);
    
    // Get the actual account IDs being used by the system
    $sales_account_id = $resolver->sales(false); // Don't create if missing
    $cogs_account_id = $resolver->cogs(false);
    
    $income_accounts = [];
    $expense_accounts = [];
    $total_income = 0;
    $total_expenses = 0;
    
    // Get Sales Revenue account data if it exists
    if ($sales_account_id) {
        $stmt = $pdo->prepare("
            SELECT 
                a.code,
                a.name,
                a.type,
                COALESCE(SUM(jl.credit - jl.debit), 0) as balance
            FROM accounts a
            LEFT JOIN journal_lines jl ON a.id = jl.account_id
            LEFT JOIN journal_entries je ON jl.journal_id = je.id
            WHERE a.id = ?
                AND (je.entry_date IS NULL OR je.entry_date BETWEEN ? AND ?)
            GROUP BY a.id, a.code, a.name, a.type
        ");
        $stmt->execute([$sales_account_id, $start_date, $end_date]);
        $sales_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($sales_data) {
            $balance = floatval($sales_data['balance']);
            $income_accounts[] = [
                'code' => $sales_data['code'],
                'name' => $sales_data['name'],
                'type' => $sales_data['type'],
                'balance' => $balance,
                'category' => 'Sales Revenue'
            ];
            $total_income += $balance;
        }
    }
    
    // Get Cost of Goods Sold account data if it exists
    if ($cogs_account_id) {
        $stmt = $pdo->prepare("
            SELECT 
                a.code,
                a.name,
                a.type,
                COALESCE(SUM(jl.debit - jl.credit), 0) as balance
            FROM accounts a
            LEFT JOIN journal_lines jl ON a.id = jl.account_id
            LEFT JOIN journal_entries je ON jl.journal_id = je.id
            WHERE a.id = ?
                AND (je.entry_date IS NULL OR je.entry_date BETWEEN ? AND ?)
            GROUP BY a.id, a.code, a.name, a.type
        ");
        $stmt->execute([$cogs_account_id, $start_date, $end_date]);
        $cogs_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($cogs_data) {
            $balance = floatval($cogs_data['balance']);
            $expense_accounts[] = [
                'code' => $cogs_data['code'],
                'name' => $cogs_data['name'],
                'type' => $cogs_data['type'],
                'balance' => $balance,
                'category' => 'Cost of Goods Sold'
            ];
            $total_expenses += $balance;
        }
    }
    
    // Also get any other expense accounts that have transactions
    $other_expenses_stmt = $pdo->prepare("
        SELECT 
            a.code,
            a.name,
            a.type,
            COALESCE(SUM(jl.debit - jl.credit), 0) as balance
        FROM accounts a
        LEFT JOIN journal_lines jl ON a.id = jl.account_id
        LEFT JOIN journal_entries je ON jl.journal_id = je.id
        WHERE a.company_id = ?
            AND a.is_active = 1
            AND a.type = 'expense'
            AND a.id != ?
            AND (je.entry_date IS NULL OR je.entry_date BETWEEN ? AND ?)
        GROUP BY a.id, a.code, a.name, a.type
        HAVING ABS(balance) > 0.01
        ORDER BY a.code
    ");
    $other_expenses_stmt->execute([$company_id, $cogs_account_id ?: 0, $start_date, $end_date]);
    $other_expenses_data = $other_expenses_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($other_expenses_data as $expense) {
        $balance = floatval($expense['balance']);
        $expense_accounts[] = [
            'code' => $expense['code'],
            'name' => $expense['name'],
            'type' => $expense['type'],
            'balance' => $balance,
            'category' => 'Operating Expenses'
        ];
        $total_expenses += $balance;
    }
    
    // Calculate totals
    $gross_profit = $total_income - ($cogs_data['balance'] ?? 0);
    $net_income = $total_income - $total_expenses;

    return [
        'title' => 'Profit & Loss Statement (AccountResolver)',
        'period' => "$start_date to $end_date", 
        'income_accounts' => $income_accounts,
        'expense_accounts' => $expense_accounts,
        'sales_account_id' => $sales_account_id,
        'cogs_account_id' => $cogs_account_id,
        'total_income' => $total_income,
        'total_expenses' => $total_expenses,
        'gross_profit' => $gross_profit,
        'net_income' => $net_income,
        'is_profitable' => $net_income > 0,
        'method' => 'account_resolver_focused'
    ];
}

function getBalanceSheet($pdo, $company_id, $as_of_date) {
    // Use AccountResolver to get the specific accounts used by the system
    require_once __DIR__ . '/../includes/AccountResolver.php';
    $resolver = new AccountResolver($pdo, $company_id);
    
    // Get the actual account IDs being used by the system
    $cash_account_id = $resolver->cash(false);
    $ar_account_id = $resolver->ar(false);
    $inventory_account_id = $resolver->inventory(false);
    $ap_account_id = $resolver->ap(false);
    $retained_account_id = $resolver->retained(false);
    
    $current_assets = [];
    $current_liabilities = [];
    $equity_accounts = [];
    
    $total_current_assets = 0;
    $total_current_liabilities = 0;
    $total_equity = 0;
    
    // Get Cash & Bank account
    if ($cash_account_id) {
        $stmt = $pdo->prepare("
            SELECT 
                a.code,
                a.name,
                a.type,
                COALESCE(SUM(jl.debit - jl.credit), 0) as balance
            FROM accounts a
            LEFT JOIN journal_lines jl ON a.id = jl.account_id
            LEFT JOIN journal_entries je ON jl.journal_id = je.id
            WHERE a.id = ?
                AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY a.id, a.code, a.name, a.type
        ");
        $stmt->execute([$cash_account_id, $as_of_date]);
        $cash_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($cash_data) {
            $balance = floatval($cash_data['balance']);
            $current_assets[] = [
                'code' => $cash_data['code'],
                'name' => $cash_data['name'],
                'type' => $cash_data['type'],
                'balance' => $balance,
                'category' => 'Cash & Bank'
            ];
            $total_current_assets += $balance;
        }
    }
    
    // Get Accounts Receivable account
    if ($ar_account_id) {
        $stmt = $pdo->prepare("
            SELECT 
                a.code,
                a.name,
                a.type,
                COALESCE(SUM(jl.debit - jl.credit), 0) as balance
            FROM accounts a
            LEFT JOIN journal_lines jl ON a.id = jl.account_id
            LEFT JOIN journal_entries je ON jl.journal_id = je.id
            WHERE a.id = ?
                AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY a.id, a.code, a.name, a.type
        ");
        $stmt->execute([$ar_account_id, $as_of_date]);
        $ar_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($ar_data) {
            $balance = floatval($ar_data['balance']);
            $current_assets[] = [
                'code' => $ar_data['code'],
                'name' => $ar_data['name'],
                'type' => $ar_data['type'],
                'balance' => $balance,
                'category' => 'Receivables'
            ];
            $total_current_assets += $balance;
        }
    }
    
    // Get Inventory account
    if ($inventory_account_id) {
        $stmt = $pdo->prepare("
            SELECT 
                a.code,
                a.name,
                a.type,
                COALESCE(SUM(jl.debit - jl.credit), 0) as balance
            FROM accounts a
            LEFT JOIN journal_lines jl ON a.id = jl.account_id
            LEFT JOIN journal_entries je ON jl.journal_id = je.id
            WHERE a.id = ?
                AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY a.id, a.code, a.name, a.type
        ");
        $stmt->execute([$inventory_account_id, $as_of_date]);
        $inventory_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($inventory_data) {
            $balance = floatval($inventory_data['balance']);
            $current_assets[] = [
                'code' => $inventory_data['code'],
                'name' => $inventory_data['name'],
                'type' => $inventory_data['type'],
                'balance' => $balance,
                'category' => 'Inventory'
            ];
            $total_current_assets += $balance;
        }
    }
    
    // Get Accounts Payable account
    if ($ap_account_id) {
        $stmt = $pdo->prepare("
            SELECT 
                a.code,
                a.name,
                a.type,
                COALESCE(SUM(jl.credit - jl.debit), 0) as balance
            FROM accounts a
            LEFT JOIN journal_lines jl ON a.id = jl.account_id
            LEFT JOIN journal_entries je ON jl.journal_id = je.id
            WHERE a.id = ?
                AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY a.id, a.code, a.name, a.type
        ");
        $stmt->execute([$ap_account_id, $as_of_date]);
        $ap_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($ap_data) {
            $balance = floatval($ap_data['balance']);
            $current_liabilities[] = [
                'code' => $ap_data['code'],
                'name' => $ap_data['name'],
                'type' => $ap_data['type'],
                'balance' => $balance,
                'category' => 'Payables'
            ];
            $total_current_liabilities += $balance;
        }
    }
    
    // Get Retained Earnings account
    if ($retained_account_id) {
        $stmt = $pdo->prepare("
            SELECT 
                a.code,
                a.name,
                a.type,
                COALESCE(SUM(jl.credit - jl.debit), 0) as balance
            FROM accounts a
            LEFT JOIN journal_lines jl ON a.id = jl.account_id
            LEFT JOIN journal_entries je ON jl.journal_id = je.id
            WHERE a.id = ?
                AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY a.id, a.code, a.name, a.type
        ");
        $stmt->execute([$retained_account_id, $as_of_date]);
        $retained_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($retained_data) {
            $balance = floatval($retained_data['balance']);
            $equity_accounts[] = [
                'code' => $retained_data['code'],
                'name' => $retained_data['name'],
                'type' => $retained_data['type'],
                'balance' => $balance,
                'category' => 'Retained Earnings'
            ];
            $total_equity += $balance;
        }
    }
    
    // Calculate current year earnings from P&L (AccountResolver version)
    $current_year_start = date('Y-01-01', strtotime($as_of_date));
    $pl_result = getProfitLoss($pdo, $company_id, $current_year_start, $as_of_date);
    $current_year_earnings = $pl_result['net_income'];
    
    if (abs($current_year_earnings) > 0.01) {
        $equity_accounts[] = [
            'code' => '3999',
            'name' => 'Current Year Earnings',
            'type' => 'equity',
            'balance' => $current_year_earnings,
            'category' => 'Current Year'
        ];
        $total_equity += $current_year_earnings;
    }
    
    // Calculate totals
    $total_assets = $total_current_assets;
    $total_liabilities = $total_current_liabilities;
    $total_liabilities_equity = $total_liabilities + $total_equity;
    
    return [
        'title' => 'Balance Sheet (AccountResolver)',
        'as_of_date' => $as_of_date,
        'current_assets' => $current_assets,
        'fixed_assets' => [], // Not used in AccountResolver structure
        'current_liabilities' => $current_liabilities,
        'long_term_liabilities' => [], // Not used in AccountResolver structure
        'equity_accounts' => $equity_accounts,
        'account_ids' => [
            'cash' => $cash_account_id,
            'ar' => $ar_account_id,
            'inventory' => $inventory_account_id,
            'ap' => $ap_account_id,
            'retained' => $retained_account_id
        ],
        'total_current_assets' => $total_current_assets,
        'total_fixed_assets' => 0,
        'total_assets' => $total_assets,
        'total_current_liabilities' => $total_current_liabilities,
        'total_long_term_liabilities' => 0,
        'total_liabilities' => $total_liabilities,
        'total_equity' => $total_equity,
        'total_liabilities_equity' => $total_liabilities_equity,
        'is_balanced' => abs($total_assets - $total_liabilities_equity) < 0.01,
        'balance_difference' => $total_assets - $total_liabilities_equity,
        'method' => 'account_resolver_focused'
    ];
    
    // Calculate current year earnings from P&L (AccountResolver version)
    $current_year_start = date('Y-01-01', strtotime($as_of_date));
    $pl_result = getProfitLoss($pdo, $company_id, $current_year_start, $as_of_date);
    $current_year_earnings = $pl_result['net_income'];
    
    if (abs($current_year_earnings) > 0.01) {
        $equity_accounts[] = [
            'code' => '3999',
            'name' => 'Current Year Earnings',
            'type' => 'equity',
            'balance' => $current_year_earnings,
            'category' => 'Current Year'
        ];
        $total_equity += $current_year_earnings;
    }
    
    // Calculate totals
    $total_assets = $total_current_assets;
    $total_liabilities = $total_current_liabilities;
    $total_liabilities_equity = $total_liabilities + $total_equity;
    
    return [
        'title' => 'Balance Sheet (AccountResolver)',
        'as_of_date' => $as_of_date,
        'current_assets' => $current_assets,
        'fixed_assets' => [], // Not used in AccountResolver structure
        'current_liabilities' => $current_liabilities,
        'long_term_liabilities' => [], // Not used in AccountResolver structure
        'equity_accounts' => $equity_accounts,
        'account_ids' => [
            'cash' => $cash_account_id,
            'ar' => $ar_account_id,
            'inventory' => $inventory_account_id,
            'ap' => $ap_account_id,
            'retained' => $retained_account_id
        ],
        'total_current_assets' => $total_current_assets,
        'total_fixed_assets' => 0,
        'total_assets' => $total_assets,
        'total_current_liabilities' => $total_current_liabilities,
        'total_long_term_liabilities' => 0,
        'total_liabilities' => $total_liabilities,
        'total_equity' => $total_equity,
        'total_liabilities_equity' => $total_liabilities_equity,
        'is_balanced' => abs($total_assets - $total_liabilities_equity) < 0.01,
        'balance_difference' => $total_assets - $total_liabilities_equity,
        'method' => 'account_resolver_focused'
    ];
}

function getCashFlow($pdo, $company_id, $start_date, $end_date) {
    // Cash Flow Statement using Indirect Method - Analyze all cash/bank account movements
    
    // Get all cash/bank accounts
    $cash_accounts_stmt = $pdo->prepare("
        SELECT id, code, name 
        FROM accounts 
        WHERE company_id = ? 
        AND type = 'asset'
        AND (LOWER(name) LIKE '%cash%' OR LOWER(name) LIKE '%bank%')
        AND is_active = 1
    ");
    $cash_accounts_stmt->execute([$company_id]);
    $cash_accounts = $cash_accounts_stmt->fetchAll(PDO::FETCH_ASSOC);
    $cash_account_ids = array_column($cash_accounts, 'id');
    
    if (empty($cash_account_ids)) {
        return [
            'title' => 'Cash Flow Statement (Indirect Method)',
            'period' => "$start_date to $end_date",
            'error' => 'No cash or bank accounts found',
            'method' => 'journal_entries_direct'
        ];
    }
    
    // Get all cash movements (both debits and credits)
    $cash_movements_stmt = $pdo->prepare("
        SELECT 
            je.id as journal_id,
            je.entry_date,
            je.narration,
            je.reference_type,
            je.reference_id,
            a.code as account_code,
            a.name as account_name,
            jl.debit,
            jl.credit,
            (jl.debit - jl.credit) as net_amount
        FROM journal_entries je
        INNER JOIN journal_lines jl ON je.id = jl.journal_id
        INNER JOIN accounts a ON jl.account_id = a.id
        WHERE je.company_id = ?
        AND je.entry_date BETWEEN ? AND ?
        AND jl.account_id IN (" . implode(',', array_fill(0, count($cash_account_ids), '?')) . ")
        ORDER BY je.entry_date, je.id
    ");
    $params = array_merge([$company_id, $start_date, $end_date], $cash_account_ids);
    $cash_movements_stmt->execute($params);
    $movements = $cash_movements_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Categorize cash flows into Operating, Investing, and Financing
    $operating_activities = [];
    $investing_activities = [];
    $financing_activities = [];
    
    $operating_inflows = 0;
    $operating_outflows = 0;
    $investing_inflows = 0;
    $investing_outflows = 0;
    $financing_inflows = 0;
    $financing_outflows = 0;
    
    foreach ($movements as $movement) {
        $amount = floatval($movement['net_amount']);
        $reference_type = $movement['reference_type'];
        $description = $movement['narration'];
        
        $activity = [
            'date' => $movement['entry_date'],
            'description' => $description,
            'account' => $movement['account_code'] . ' - ' . $movement['account_name'],
            'amount' => $amount,
            'debit' => floatval($movement['debit']),
            'credit' => floatval($movement['credit'])
        ];
        
        // Categorize based on reference type and description
        if (in_array($reference_type, ['payment', 'expense', 'purchase_receipt']) || 
            stripos($description, 'sales') !== false || 
            stripos($description, 'expense') !== false ||
            stripos($description, 'payment') !== false ||
            stripos($description, 'supplier') !== false ||
            stripos($description, 'customer') !== false) {
            
            // Operating Activities
            $operating_activities[] = $activity;
            if ($amount > 0) {
                $operating_inflows += $amount;
            } else {
                $operating_outflows += abs($amount);
            }
            
        } elseif (stripos($description, 'equipment') !== false || 
                  stripos($description, 'asset') !== false ||
                  stripos($description, 'investment') !== false ||
                  $reference_type === 'asset_purchase') {
            
            // Investing Activities
            $investing_activities[] = $activity;
            if ($amount > 0) {
                $investing_inflows += $amount;
            } else {
                $investing_outflows += abs($amount);
            }
            
        } elseif (stripos($description, 'loan') !== false || 
                  stripos($description, 'capital') !== false ||
                  stripos($description, 'equity') !== false ||
                  stripos($description, 'dividend') !== false ||
                  $reference_type === 'capital_injection') {
            
            // Financing Activities
            $financing_activities[] = $activity;
            if ($amount > 0) {
                $financing_inflows += $amount;
            } else {
                $financing_outflows += abs($amount);
            }
            
        } else {
            // Default to Operating Activities
            $operating_activities[] = $activity;
            if ($amount > 0) {
                $operating_inflows += $amount;
            } else {
                $operating_outflows += abs($amount);
            }
        }
    }
    
    // Calculate net cash flows
    $net_operating_cash = $operating_inflows - $operating_outflows;
    $net_investing_cash = $investing_inflows - $investing_outflows;
    $net_financing_cash = $financing_inflows - $financing_outflows;
    $net_change_in_cash = $net_operating_cash + $net_investing_cash + $net_financing_cash;
    
    // Get opening and closing cash balances
    $opening_date = date('Y-m-d', strtotime($start_date . ' -1 day'));
    $opening_cash_stmt = $pdo->prepare("
        SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as balance
        FROM journal_lines jl
        INNER JOIN journal_entries je ON jl.journal_id = je.id
        WHERE je.company_id = ?
        AND je.entry_date <= ?
        AND jl.account_id IN (" . implode(',', array_fill(0, count($cash_account_ids), '?')) . ")
    ");
    $opening_params = array_merge([$company_id, $opening_date], $cash_account_ids);
    $opening_cash_stmt->execute($opening_params);
    $opening_cash = floatval($opening_cash_stmt->fetchColumn());
    
    $closing_cash_stmt = $pdo->prepare("
        SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as balance
        FROM journal_lines jl
        INNER JOIN journal_entries je ON jl.journal_id = je.id
        WHERE je.company_id = ?
        AND je.entry_date <= ?
        AND jl.account_id IN (" . implode(',', array_fill(0, count($cash_account_ids), '?')) . ")
    ");
    $closing_params = array_merge([$company_id, $end_date], $cash_account_ids);
    $closing_cash_stmt->execute($closing_params);
    $closing_cash = floatval($closing_cash_stmt->fetchColumn());
    
    return [
        'title' => 'Cash Flow Statement (Indirect Method)',
        'period' => "$start_date to $end_date",
        'operating_activities' => $operating_activities,
        'investing_activities' => $investing_activities,
        'financing_activities' => $financing_activities,
        'operating_inflows' => $operating_inflows,
        'operating_outflows' => $operating_outflows,
        'net_operating_cash' => $net_operating_cash,
        'investing_inflows' => $investing_inflows,
        'investing_outflows' => $investing_outflows,
        'net_investing_cash' => $net_investing_cash,
        'financing_inflows' => $financing_inflows,
        'financing_outflows' => $financing_outflows,
        'net_financing_cash' => $net_financing_cash,
        'net_change_in_cash' => $net_change_in_cash,
        'opening_cash_balance' => $opening_cash,
        'closing_cash_balance' => $closing_cash,
        'cash_accounts' => $cash_accounts,
        'reconciliation_check' => abs(($opening_cash + $net_change_in_cash) - $closing_cash) < 0.01,
        'method' => 'journal_entries_direct'
    ];
}

function getAccountsReceivable($pdo, $company_id) {
    $stmt = $pdo->prepare("
        SELECT 
            c.name as customer_name,
            si.invoice_number,
            si.invoice_date,
            si.due_date,
            si.total,
            COALESCE(payments_sum.paid_amount, 0) as paid_amount,
            (si.total - COALESCE(payments_sum.paid_amount, 0)) as outstanding_amount,
            DATEDIFF(CURDATE(), si.due_date) as days_overdue
        FROM sales_invoices si
        JOIN customers c ON si.customer_id = c.id
        LEFT JOIN (
            SELECT 
                sales_invoice_id,
                SUM(amount) as paid_amount
            FROM payments 
            WHERE payment_type = 'receipt'
            GROUP BY sales_invoice_id
        ) payments_sum ON si.id = payments_sum.sales_invoice_id
        WHERE si.company_id = ?
        AND si.status != 'cancelled'
        HAVING outstanding_amount > 0.01
        ORDER BY si.due_date
    ");
    $stmt->execute([$company_id]);
    $receivables = $stmt->fetchAll();
    
    $total_outstanding = array_sum(array_column($receivables, 'outstanding_amount'));
    
    return [
        'title' => 'Accounts Receivable',
        'receivables' => $receivables,
        'total_outstanding' => $total_outstanding
    ];
}

function getAccountsPayable($pdo, $company_id) {
    $stmt = $pdo->prepare("
        SELECT 
            s.name as supplier_name,
            pi.invoice_number,
            pi.invoice_date,
            pi.due_date,
            pi.total,
            COALESCE(payments_sum.paid_amount, 0) as paid_amount,
            (pi.total - COALESCE(payments_sum.paid_amount, 0)) as outstanding_amount,
            DATEDIFF(CURDATE(), pi.due_date) as days_overdue
        FROM purchase_invoices pi
        JOIN suppliers s ON pi.supplier_id = s.id
        LEFT JOIN (
            SELECT 
                purchase_invoice_id,
                SUM(amount) as paid_amount
            FROM payments 
            WHERE payment_type = 'payment'
            GROUP BY purchase_invoice_id
        ) payments_sum ON pi.id = payments_sum.purchase_invoice_id
        WHERE pi.company_id = ?
        AND pi.status != 'cancelled'
        HAVING outstanding_amount > 0.01
        ORDER BY pi.due_date
    ");
    $stmt->execute([$company_id]);
    $payables = $stmt->fetchAll();
    
    $total_outstanding = array_sum(array_column($payables, 'outstanding_amount'));
    
    return [
        'title' => 'Accounts Payable',
        'payables' => $payables,
        'total_outstanding' => $total_outstanding
    ];
}

function getSalesReport($pdo, $company_id, $start_date, $end_date) {
    $stmt = $pdo->prepare("
        SELECT 
            si.invoice_date,
            si.invoice_no,
            si.reference,
            c.name as customer_name,
            c.phone as customer_phone,
            c.email as customer_email,
            si.subtotal,
            si.tax,
            si.total,
            si.amount_paid,
            (si.total - si.amount_paid) as outstanding_amount,
            si.status,
            si.due_date,
            si.customer_id,
            CASE 
                WHEN si.amount_paid >= si.total THEN 'Fully Paid'
                WHEN si.amount_paid > 0 THEN 'Partially Paid'
                ELSE 'Unpaid'
            END as payment_status,
            CASE 
                WHEN si.due_date < CURDATE() AND si.amount_paid < si.total THEN DATEDIFF(CURDATE(), si.due_date)
                ELSE 0
            END as days_overdue
        FROM sales_invoices si
        LEFT JOIN customers c ON si.customer_id = c.id
        WHERE si.company_id = ?
        AND si.invoice_date BETWEEN ? AND ?
        AND si.status != 'cancelled'
        ORDER BY si.invoice_date DESC
    ");
    $stmt->execute([$company_id, $start_date, $end_date]);
    $sales = $stmt->fetchAll();
    
    // Get total customers count for this company (all time, not just period)
    $customer_stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT id) as total_customers 
        FROM customers 
        WHERE company_id = ? AND is_active = 1
    ");
    $customer_stmt->execute([$company_id]);
    $customer_data = $customer_stmt->fetch();
    $total_customers = intval($customer_data['total_customers'] ?? 0);
    
    // Calculate business-focused summary statistics
    $total_invoices = count($sales); // All recorded sales (draft, sent, paid)
    $total_sales_amount = 0; // Total amount sold
    $total_paid_amount = 0;
    $draft_count = 0;
    $sent_count = 0;
    $paid_count = 0;
    $unique_customers_in_period = [];
    
    foreach ($sales as $sale) {
        $total_sales_amount += floatval($sale['total']); // This is total sold amount
        $total_paid_amount += floatval($sale['amount_paid']);
        
        // Count unique customers in this period
        if ($sale['customer_id']) {
            $unique_customers_in_period[$sale['customer_id']] = true;
        }
        
        // Count by status (all are recorded sales)
        switch ($sale['status']) {
            case 'draft':
                $draft_count++;
                break;
            case 'sent':
                $sent_count++;
                break;
            case 'paid':
            case 'partially_paid':
                $paid_count++;
                break;
        }
    }
    
    // Calculate average sale value
    $average_sale_value = $total_invoices > 0 ? ($total_sales_amount / $total_invoices) : 0;
    
    // Count customers who bought in this period
    $customers_in_period = count($unique_customers_in_period);
    
    return [
        'title' => 'Sales Summary Report',
        'period' => "$start_date to $end_date",
        'sales' => $sales,
        'summary' => [
            // Core business metrics as requested
            'total_invoices' => $total_invoices, // All recorded sales (draft, sent, paid)
            'total_sales_amount' => $total_sales_amount, // Total amount sold
            'average_sale_value' => round($average_sale_value, 2), // Average per invoice
            'total_customers_in_system' => $total_customers, // All customers for this company
            'customers_who_bought_in_period' => $customers_in_period, // Customers in this period
            
            // Additional breakdown
            'status_breakdown' => [
                'draft_invoices' => $draft_count,
                'sent_invoices' => $sent_count,
                'paid_invoices' => $paid_count
            ],
            
            // Payment analysis
            'payment_analysis' => [
                'total_paid_amount' => $total_paid_amount,
                'total_outstanding_amount' => ($total_sales_amount - $total_paid_amount),
                'collection_rate' => $total_sales_amount > 0 ? round(($total_paid_amount / $total_sales_amount) * 100, 2) : 0
            ]
        ],
        'metadata' => [
            'currency' => '₦',
            'generated_at' => date('Y-m-d H:i:s'),
            'company_id' => $company_id,
            'explanation' => [
                'total_invoices' => 'All recorded sales regardless of status (draft, sent, paid)',
                'total_sales_amount' => 'Total monetary value of all sales made',
                'average_sale_value' => 'Average value per sale (Total Sales ÷ Total Invoices)',
                'total_customers_in_system' => 'Total active customers for this company'
            ]
        ],
        'status' => 'success'
    ];
}

function getPurchaseReport($pdo, $company_id, $start_date, $end_date) {
    $stmt = $pdo->prepare("
        SELECT 
            pi.invoice_date,
            pi.invoice_number,
            s.name as supplier_name,
            pi.subtotal,
            pi.tax_amount,
            pi.total,
            pi.status,
            COALESCE(payments_sum.paid_amount, 0) as paid_amount,
            (pi.total - COALESCE(payments_sum.paid_amount, 0)) as outstanding_amount
        FROM purchase_invoices pi
        JOIN suppliers s ON pi.supplier_id = s.id
        LEFT JOIN (
            SELECT 
                purchase_invoice_id,
                SUM(amount) as paid_amount
            FROM payments 
            WHERE payment_type = 'payment'
            GROUP BY purchase_invoice_id
        ) payments_sum ON pi.id = payments_sum.purchase_invoice_id
        WHERE pi.company_id = ?
        AND pi.invoice_date BETWEEN ? AND ?
        ORDER BY pi.invoice_date DESC
    ");
    $stmt->execute([$company_id, $start_date, $end_date]);
    $purchases = $stmt->fetchAll();
    
    $total_purchases = array_sum(array_column($purchases, 'total'));
    $total_paid = array_sum(array_column($purchases, 'paid_amount'));
    $total_outstanding = array_sum(array_column($purchases, 'outstanding_amount'));
    
    return [
        'title' => 'Purchase Report',
        'period' => "$start_date to $end_date",
        'purchases' => $purchases,
        'total_purchases' => $total_purchases,
        'total_paid' => $total_paid,
        'total_outstanding' => $total_outstanding
    ];
}

function getInventoryReport($pdo, $company_id) {
    $stmt = $pdo->prepare("
        SELECT 
            p.name,
            p.sku,
            p.stock_quantity,
            p.cost_price,
            p.selling_price,
            (p.stock_quantity * p.cost_price) as inventory_value,
            CASE 
                WHEN p.stock_quantity <= 0 THEN 'Out of Stock'
                WHEN p.stock_quantity <= COALESCE(p.reorder_level, 5) THEN 'Low Stock'
                ELSE 'In Stock'
            END as status
        FROM products p
        WHERE p.company_id = ?
        AND p.track_inventory = 1
        ORDER BY p.name
    ");
    $stmt->execute([$company_id]);
    $inventory = $stmt->fetchAll();
    
    $total_inventory_value = array_sum(array_column($inventory, 'inventory_value'));
    $low_stock_items = array_filter($inventory, function($item) {
        return $item['status'] === 'Low Stock' || $item['status'] === 'Out of Stock';
    });
    
    return [
        'title' => 'Inventory Report',
        'inventory' => $inventory,
        'total_inventory_value' => $total_inventory_value,
        'low_stock_count' => count($low_stock_items),
        'total_items' => count($inventory)
    ];
}
?>
