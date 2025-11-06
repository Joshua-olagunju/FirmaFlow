<?php
session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/AccountResolver.php';

header('Content-Type: application/json');

// Check user session
$user = getCurrentUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$company_id = $user['company_id'];

// Get request parameters
$type = $_GET['type'] ?? '';
$from_date = $_GET['from_date'] ?? date('Y-01-01');
$to_date = $_GET['to_date'] ?? date('Y-12-31');
$print_mode = isset($_GET['print']) && $_GET['print'] == '1';

try {
    switch ($type) {
        case 'profit_loss':
            $result = getAccountResolverProfitLoss($pdo, $company_id, $from_date, $to_date);
            break;
            
        case 'balance_sheet':
            $result = getAccountResolverBalanceSheet($pdo, $company_id, $to_date);
            break;
            
        case 'trial_balance':
            $result = getAccountResolverTrialBalance($pdo, $company_id, $to_date);
            break;
            
        case 'cash_flow':
            $result = getAccountResolverCashFlow($pdo, $company_id, $from_date, $to_date, $print_mode);
            break;
            
        case 'sales_summary':
            $result = getAccountResolverSalesSummary($pdo, $company_id, $from_date, $to_date, $print_mode);
            break;
            
        case 'inventory':
        case 'inventory_summary':
            $result = getAccountResolverInventorySummary($pdo, $company_id, $from_date, $to_date, $print_mode);
            break;
            
        default:
            throw new Exception('Invalid report type');
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Get P&L using AccountResolver - focus only on accounts used by the system
 */
function getAccountResolverProfitLoss($pdo, $company_id, $start_date, $end_date) {
    $resolver = new AccountResolver($pdo, $company_id);
    
    // Get the actual account IDs being used by the system
    $sales_account_id = $resolver->sales(false);
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
    
    // Get other expense accounts that have transactions
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

/**
 * Get Balance Sheet using AccountResolver - focus only on accounts used by the system
 */
function getAccountResolverBalanceSheet($pdo, $company_id, $as_of_date) {
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
    $pl_result = getAccountResolverProfitLoss($pdo, $company_id, $current_year_start, $as_of_date);
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

/**
 * Get Trial Balance using AccountResolver - focus only on accounts with actual journal entries
 */
function getAccountResolverTrialBalance($pdo, $company_id, $as_of_date) {
    $resolver = new AccountResolver($pdo, $company_id);
    
    // Get all AccountResolver accounts
    $account_map = [
        'cash' => $resolver->cash(false),
        'ar' => $resolver->ar(false),
        'inventory' => $resolver->inventory(false),
        'ap' => $resolver->ap(false),
        'sales' => $resolver->sales(false),
        'cogs' => $resolver->cogs(false),
        'retained' => $resolver->retained(false)
    ];
    
    $trial_balance = [];
    $total_debits = 0;
    $total_credits = 0;
    
    foreach ($account_map as $key => $account_id) {
        if (!$account_id) continue;
        
        $stmt = $pdo->prepare("
            SELECT 
                a.code,
                a.name,
                a.type,
                COALESCE(SUM(jl.debit), 0) as total_debits,
                COALESCE(SUM(jl.credit), 0) as total_credits,
                CASE 
                    WHEN a.type IN ('asset', 'expense') THEN COALESCE(SUM(jl.debit - jl.credit), 0)
                    WHEN a.type IN ('liability', 'equity', 'revenue', 'income') THEN COALESCE(SUM(jl.credit - jl.debit), 0)
                    ELSE 0
                END as balance
            FROM accounts a
            LEFT JOIN journal_lines jl ON a.id = jl.account_id
            LEFT JOIN journal_entries je ON jl.journal_id = je.id
            WHERE a.id = ?
                AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY a.id, a.code, a.name, a.type
            HAVING COALESCE(SUM(jl.debit), 0) > 0 OR COALESCE(SUM(jl.credit), 0) > 0
        ");
        $stmt->execute([$account_id, $as_of_date]);
        $account_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($account_data) {
            $balance = floatval($account_data['balance']);
            $debit_balance = 0;
            $credit_balance = 0;
            
            // Determine debit or credit balance based on account type and actual balance
            if ($account_data['type'] == 'asset' || $account_data['type'] == 'expense') {
                if ($balance >= 0) {
                    $debit_balance = $balance;
                } else {
                    $credit_balance = abs($balance);
                }
            } else { // liability, equity, revenue, income
                if ($balance >= 0) {
                    $credit_balance = $balance;
                } else {
                    $debit_balance = abs($balance);
                }
            }
            
            // Include all accounts that have had journal activity (even if balance is zero)
            $trial_balance[] = [
                'code' => $account_data['code'],
                'name' => $account_data['name'],
                'type' => $account_data['type'],
                'resolver_key' => $key,
                'total_debits' => floatval($account_data['total_debits']),
                'total_credits' => floatval($account_data['total_credits']),
                'debit_balance' => $debit_balance,
                'credit_balance' => $credit_balance,
                'balance' => $balance
            ];
            
            $total_debits += $debit_balance;
            $total_credits += $credit_balance;
        }
    }
    
    // Get ALL accounts with journal activity (not just AccountResolver accounts)
    $all_accounts_stmt = $pdo->prepare("
        SELECT 
            a.id,
            a.code,
            a.name,
            a.type,
            COALESCE(SUM(jl.debit), 0) as total_debits,
            COALESCE(SUM(jl.credit), 0) as total_credits,
            CASE 
                WHEN a.type IN ('asset', 'expense') THEN COALESCE(SUM(jl.debit - jl.credit), 0)
                WHEN a.type IN ('liability', 'equity', 'revenue', 'income') THEN COALESCE(SUM(jl.credit - jl.debit), 0)
                ELSE 0
            END as balance
        FROM accounts a
        INNER JOIN journal_lines jl ON a.id = jl.account_id
        INNER JOIN journal_entries je ON jl.journal_id = je.id
        WHERE a.company_id = ?
            AND a.is_active = 1
            AND je.entry_date <= ?
            AND a.id NOT IN (" . implode(',', array_filter($account_map, function($id) { return $id !== null; })) . ")
        GROUP BY a.id, a.code, a.name, a.type
        HAVING COALESCE(SUM(jl.debit), 0) > 0 OR COALESCE(SUM(jl.credit), 0) > 0
        ORDER BY a.code
    ");
    
    $filter_account_ids = array_filter($account_map, function($id) { return $id !== null; });
    if (!empty($filter_account_ids)) {
        $all_accounts_stmt->execute([$company_id, $as_of_date]);
        $other_accounts = $all_accounts_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($other_accounts as $account) {
            $balance = floatval($account['balance']);
            $debit_balance = 0;
            $credit_balance = 0;
            
            // Determine debit or credit balance based on account type
            if ($account['type'] == 'asset' || $account['type'] == 'expense') {
                if ($balance >= 0) {
                    $debit_balance = $balance;
                } else {
                    $credit_balance = abs($balance);
                }
            } else { // liability, equity, revenue, income
                if ($balance >= 0) {
                    $credit_balance = $balance;
                } else {
                    $debit_balance = abs($balance);
                }
            }
            
            // Include all accounts with journal activity (even if balance is zero)
            $trial_balance[] = [
                'code' => $account['code'],
                'name' => $account['name'],
                'type' => $account['type'],
                'resolver_key' => 'other',
                'total_debits' => floatval($account['total_debits']),
                'total_credits' => floatval($account['total_credits']),
                'debit_balance' => $debit_balance,
                'credit_balance' => $credit_balance,
                'balance' => $balance
            ];
            
            $total_debits += $debit_balance;
            $total_credits += $credit_balance;
        }
    }
    
    // Sort by account code
    usort($trial_balance, function($a, $b) {
        return strcmp($a['code'], $b['code']);
    });
    
    return [
        'title' => 'Trial Balance (AccountResolver)',
        'as_of_date' => $as_of_date,
        'accounts' => $trial_balance,
        'account_map' => $account_map,
        'total_debits' => $total_debits,
        'total_credits' => $total_credits,
        'is_balanced' => abs($total_debits - $total_credits) < 0.01,
        'balance_difference' => $total_debits - $total_credits,
        'accounts_with_activity' => count($trial_balance),
        'method' => 'account_resolver_focused'
    ];
}

/**
 * Get Cash Flow using AccountResolver - focus only on cash account movements
 */
function getAccountResolverCashFlow($pdo, $company_id, $start_date, $end_date, $print_mode = false) {
    $resolver = new AccountResolver($pdo, $company_id);
    
    // Get cash account ID
    $cash_account_id = $resolver->cash(false);
    
    if (!$cash_account_id) {
        return [
            'title' => 'Cash Flow Statement (AccountResolver)',
            'period' => "$start_date to $end_date",
            'error' => 'No cash account found in AccountResolver',
            'method' => 'account_resolver_focused'
        ];
    }
    
    // Get all cash movements
    $stmt = $pdo->prepare("
        SELECT 
            je.id as journal_id,
            je.entry_date,
            je.narration,
            je.reference_type,
            je.reference_id,
            jl.debit,
            jl.credit,
            (jl.debit - jl.credit) as net_amount
        FROM journal_entries je
        INNER JOIN journal_lines jl ON je.id = jl.journal_id
        WHERE je.company_id = ?
            AND je.entry_date BETWEEN ? AND ?
            AND jl.account_id = ?
        ORDER BY je.entry_date, je.id
    ");
    $stmt->execute([$company_id, $start_date, $end_date, $cash_account_id]);
    $cash_movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Categorize cash flows
    $operating_activities = [];
    $investing_activities = [];
    $financing_activities = [];
    
    $operating_total = 0;
    $investing_total = 0;
    $financing_total = 0;
    
    foreach ($cash_movements as $movement) {
        $amount = floatval($movement['net_amount']);
        $reference_type = $movement['reference_type'];
        
        $activity = [
            'date' => $movement['entry_date'],
            'description' => $movement['narration'],
            'reference_type' => $reference_type,
            'reference_id' => $movement['reference_id'],
            'amount' => $amount,
            'type' => $amount > 0 ? 'inflow' : 'outflow'
        ];
        
        // Categorize based on reference type and description
        // Include all transactions that actually move cash (including expenses)
        if (in_array($reference_type, ['sales_invoice', 'payment', 'purchase', 'expense'])) {
            $operating_activities[] = $activity;
            $operating_total += $amount;
        } elseif (strpos(strtolower($movement['narration']), 'equipment') !== false ||
                  strpos(strtolower($movement['narration']), 'asset') !== false) {
            $investing_activities[] = $activity;
            $investing_total += $amount;
        } else {
            // Default to operating for AccountResolver transactions
            $operating_activities[] = $activity;
            $operating_total += $amount;
        }
    }
    
    // Get opening and closing cash balances
    $opening_stmt = $pdo->prepare("
        SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as balance
        FROM journal_lines jl
        INNER JOIN journal_entries je ON jl.journal_id = je.id
        WHERE jl.account_id = ?
            AND je.company_id = ?
            AND je.entry_date < ?
    ");
    $opening_stmt->execute([$cash_account_id, $company_id, $start_date]);
    $opening_balance = floatval($opening_stmt->fetch(PDO::FETCH_ASSOC)['balance']);
    
    $closing_stmt = $pdo->prepare("
        SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as balance
        FROM journal_lines jl
        INNER JOIN journal_entries je ON jl.journal_id = je.id
        WHERE jl.account_id = ?
            AND je.company_id = ?
            AND je.entry_date <= ?
    ");
    $closing_stmt->execute([$cash_account_id, $company_id, $end_date]);
    $closing_balance = floatval($closing_stmt->fetch(PDO::FETCH_ASSOC)['balance']);
    
    $net_change = $closing_balance - $opening_balance;
    
    // Calculate cash flows by direction - from all actual cash movements
    $cash_inflows = 0;
    $cash_outflows = 0;
    foreach ($cash_movements as $movement) {
        $amount = floatval($movement['net_amount']);
        if ($amount > 0) {
            $cash_inflows += $amount;
        } else {
            $cash_outflows += abs($amount);
        }
    }
    
    return [
        'title' => 'Cash Flow Statement (AccountResolver)',
        'period' => "$start_date to $end_date",
        'cash_account_id' => $cash_account_id,
        'operating' => [
            'activities' => $operating_activities,
            'total' => $operating_total
        ],
        'investing' => [
            'activities' => $investing_activities,
            'total' => $investing_total
        ],
        'financing' => [
            'activities' => $financing_activities,
            'total' => $financing_total
        ],
        'summary' => [
            'total_inflows' => $cash_inflows,
            'total_outflows' => $cash_outflows,
            'net_cash_flow' => $cash_inflows - $cash_outflows
        ],
        'balances' => [
            'opening' => $opening_balance,
            'closing' => $closing_balance,
            'net_change' => $net_change
        ],
        'total_transactions' => count($cash_movements),
        'method' => 'account_resolver_focused'
    ];
}

/**
 * Get Sales Summary using AccountResolver - analyze all sales transactions
 */
function getAccountResolverSalesSummary($pdo, $company_id, $start_date, $end_date, $print_mode = false) {
    $resolver = new AccountResolver($pdo, $company_id);
    
    // Get key account IDs
    $sales_account_id = $resolver->sales(false);
    $ar_account_id = $resolver->ar(false);
    $cash_account_id = $resolver->cash(false);
    
    if (!$sales_account_id) {
        return [
            'title' => 'Sales Summary (AccountResolver)',
            'period' => "$start_date to $end_date",
            'error' => 'No sales account found in AccountResolver',
            'method' => 'account_resolver_focused'
        ];
    }
    
    // Get all sales transactions (credits to sales account)
    $stmt = $pdo->prepare("
        SELECT 
            je.id as journal_id,
            je.entry_date,
            je.narration,
            je.reference_type,
            je.reference_id,
            jl.credit as sales_amount,
            jl.debit as sales_return
        FROM journal_entries je
        INNER JOIN journal_lines jl ON je.id = jl.journal_id
        WHERE je.company_id = ?
            AND je.entry_date BETWEEN ? AND ?
            AND jl.account_id = ?
            AND (jl.credit > 0 OR jl.debit > 0)
        ORDER BY je.entry_date DESC, je.id DESC
    ");
    $stmt->execute([$company_id, $start_date, $end_date, $sales_account_id]);
    $sales_transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sales invoices with customer details
    $stmt = $pdo->prepare("
        SELECT 
            si.id,
            si.invoice_no,
            COALESCE(c.name, 'Unknown Customer') as customer_name,
            si.total,
            si.status,
            si.invoice_date,
            si.amount_paid,
            CASE 
                WHEN si.status = 'paid' THEN si.total
                ELSE si.amount_paid
            END as paid_amount,
            CASE 
                WHEN si.status IN ('draft', 'sent') THEN si.total - si.amount_paid
                ELSE 0
            END as pending_amount
        FROM sales_invoices si
        LEFT JOIN customers c ON si.customer_id = c.id
        WHERE si.company_id = ?
            AND si.invoice_date BETWEEN ? AND ?
        ORDER BY si.invoice_date DESC
    ");
    $stmt->execute([$company_id, $start_date, $end_date]);
    $sales_invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate totals
    $total_sales = 0;
    $total_paid = 0;
    $total_pending = 0;
    $customer_summary = [];
    
    foreach ($sales_invoices as $invoice) {
        $amount = floatval($invoice['total']);
        $paid = floatval($invoice['paid_amount']);
        $pending = floatval($invoice['pending_amount']);
        
        $total_sales += $amount;
        $total_paid += $paid;
        $total_pending += $pending;
        
        // Customer summary
        $customer = $invoice['customer_name'];
        if (!isset($customer_summary[$customer])) {
            $customer_summary[$customer] = [
                'customer_name' => $customer,
                'total_sales' => 0,
                'total_paid' => 0,
                'total_pending' => 0,
                'invoice_count' => 0
            ];
        }
        
        $customer_summary[$customer]['total_sales'] += $amount;
        $customer_summary[$customer]['total_paid'] += $paid;
        $customer_summary[$customer]['total_pending'] += $pending;
        $customer_summary[$customer]['invoice_count']++;
    }
    
    // Get payment collections for the period
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.payment_date,
            p.amount,
            p.method,
            p.reference_type,
            p.reference_id,
            CASE 
                WHEN p.party_type = 'customer' THEN COALESCE(c.name, 'Unknown Customer')
                WHEN p.reference_type = 'sales_invoice' THEN COALESCE(c2.name, 'Unknown Customer')
                ELSE 'Unknown Customer'
            END as customer_name,
            CASE 
                WHEN p.reference_type = 'sales_invoice' THEN COALESCE(si.invoice_no, 'Direct Payment')
                WHEN p.party_type = 'customer' THEN CONCAT('Payment #', p.id)
                ELSE CONCAT('Payment #', p.id)
            END as invoice_no
        FROM payments p
        LEFT JOIN customers c ON p.party_id = c.id AND p.party_type = 'customer'
        LEFT JOIN sales_invoices si ON p.reference_id = si.id AND p.reference_type = 'sales_invoice'
        LEFT JOIN customers c2 ON si.customer_id = c2.id
        WHERE p.company_id = ?
            AND p.payment_date BETWEEN ? AND ?
            AND p.type = 'received'
        ORDER BY p.payment_date DESC
    ");
    $stmt->execute([$company_id, $start_date, $end_date]);
    $payments_received = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $total_collections = 0;
    foreach ($payments_received as $payment) {
        $total_collections += floatval($payment['amount']);
    }
    
    return [
        'title' => 'Sales Summary (AccountResolver)',
        'period' => "$start_date to $end_date",
        'sales_account_id' => $sales_account_id,
        'ar_account_id' => $ar_account_id,
        'cash_account_id' => $cash_account_id,
        'summary' => [
            'total_sales' => $total_sales,
            'total_paid' => $total_paid,
            'total_pending' => $total_pending,
            'total_collections' => $total_collections,
            'invoice_count' => count($sales_invoices),
            'payment_count' => count($payments_received)
        ],
        'sales_invoices' => $sales_invoices,
        'payments_received' => $payments_received,
        'customer_summary' => array_values($customer_summary),
        'sales_transactions' => $sales_transactions,
        'method' => 'account_resolver_focused'
    ];
}

function getAccountResolverInventorySummary($pdo, $company_id, $from_date, $to_date, $print_mode = false) {
    try {
        $resolver = new AccountResolver($pdo, $company_id);
        
        // Use to_date as the as_of_date for inventory calculation
        $as_of_date = $to_date;
        
        // Get all active products for the company
        $stmt = $pdo->prepare("
            SELECT 
                id,
                sku,
                name,
                description,
                unit,
                cost_price,
                selling_price,
                stock_quantity,
                reorder_level,
                (stock_quantity * cost_price) as stock_value
            FROM products 
            WHERE company_id = ? AND is_active = 1 
            ORDER BY name
        ");
        $stmt->execute([$company_id]);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate inventory account balance from journal entries
        $stmt = $pdo->prepare("
            SELECT 
                SUM(jl.debit - jl.credit) as inventory_balance
            FROM journal_lines jl
            JOIN journal_entries je ON jl.journal_id = je.id
            WHERE jl.account_id = 119 AND je.company_id = ? AND je.entry_date <= ?
        ");
        $stmt->execute([$company_id, $as_of_date]);
        $balance_result = $stmt->fetch(PDO::FETCH_ASSOC);
        $inventory_account_balance = $balance_result['inventory_balance'] ?? 0;
        
        // Get recent inventory movements (grouped by transaction to avoid duplicates)
        $stmt = $pdo->prepare("
            SELECT 
                je.entry_date,
                je.reference_type,
                je.reference_id,
                je.narration,
                SUM(CASE WHEN jl.account_id = 119 THEN jl.debit - jl.credit ELSE 0 END) as inventory_impact,
                SUM(CASE WHEN jl.account_id = 118 THEN jl.debit - jl.credit ELSE 0 END) as cogs_impact,
                CASE 
                    WHEN je.reference_type = 'purchase' THEN 'Stock Purchase'
                    WHEN je.reference_type = 'sales_invoice' THEN 'Stock Reduction'
                    WHEN je.reference_type = 'product_opening' THEN 'Opening Stock'
                    ELSE 'Inventory Adjustment'
                END as movement_type,
                -- For display, use the inventory impact (account 119) as the main amount
                SUM(CASE WHEN jl.account_id = 119 THEN jl.debit - jl.credit ELSE 0 END) as debit,
                0 as credit
            FROM journal_lines jl
            JOIN journal_entries je ON jl.journal_id = je.id
            WHERE je.company_id = ? 
            AND jl.account_id IN (119, 118)
            AND je.entry_date <= ?
            GROUP BY je.id, je.entry_date, je.reference_type, je.reference_id, je.narration
            HAVING (SUM(CASE WHEN jl.account_id = 119 THEN ABS(jl.debit - jl.credit) ELSE 0 END) > 0 
                    OR SUM(CASE WHEN jl.account_id = 118 THEN ABS(jl.debit - jl.credit) ELSE 0 END) > 0)
            ORDER BY je.entry_date DESC 
            " . ($print_mode ? "" : "LIMIT 20") . "
        ");
        $stmt->execute([$company_id, $as_of_date]);
        $inventory_movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate totals
        $total_products = count($products);
        $total_stock_value = 0;
        $total_stock_quantity = 0;
        $low_stock_items = 0;
        
        foreach ($products as $product) {
            $total_stock_value += floatval($product['stock_value']);
            $total_stock_quantity += floatval($product['stock_quantity']);
            
            if (floatval($product['stock_quantity']) <= floatval($product['reorder_level']) && floatval($product['reorder_level']) > 0) {
                $low_stock_items++;
            }
        }
        
        // Get top products by value
        $top_products = $products;
        usort($top_products, function($a, $b) {
            return floatval($b['stock_value']) <=> floatval($a['stock_value']);
        });
        if (!$print_mode) {
            $top_products = array_slice($top_products, 0, 10);
        }
        
        // Get cost of goods sold for the period
        $stmt = $pdo->prepare("
            SELECT 
                SUM(jl.debit) as total_cogs
            FROM journal_lines jl
            JOIN journal_entries je ON jl.journal_id = je.id
            WHERE jl.account_id = 118 AND je.company_id = ? AND je.entry_date <= ?
        ");
        $stmt->execute([$company_id, $as_of_date]);
        $cogs_result = $stmt->fetch(PDO::FETCH_ASSOC);
        $total_cogs = $cogs_result['total_cogs'] ?? 0;
        
        return [
            'success' => true,
            'report_date' => $as_of_date,
            'company_id' => $company_id,
            'summary' => [
                'total_products' => $total_products,
                'total_stock_quantity' => $total_stock_quantity,
                'total_stock_value' => $total_stock_value,
                'inventory_account_balance' => $inventory_account_balance,
                'low_stock_items' => $low_stock_items,
                'total_cogs' => $total_cogs
            ],
            'products' => $products,
            'top_products_by_value' => $top_products,
            'inventory_movements' => $inventory_movements,
            'account_info' => [
                'inventory_account_id' => 119,
                'cogs_account_id' => 118
            ],
            'method' => 'account_resolver_inventory'
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'method' => 'account_resolver_inventory'
        ];
    }
}
?>
