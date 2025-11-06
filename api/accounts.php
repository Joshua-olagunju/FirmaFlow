<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            // Get single account
            $stmt = $pdo->prepare("
                SELECT a.*, p.name as parent_name 
                FROM accounts a 
                LEFT JOIN accounts p ON a.parent_id = p.id 
                WHERE a.id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $account = $stmt->fetch();
            echo json_encode($account ?: []);
        } else {
            // Get all accounts with hierarchy
            $company_id = $_GET['company_id'] ?? 1;
            
            if (isset($_GET['initialize']) && $_GET['initialize'] === 'true') {
                // Initialize default chart of accounts
                initializeChartOfAccounts($pdo, $company_id);
            }
            
            $stmt = $pdo->prepare("
                SELECT a.*, p.name as parent_name,
                       COALESCE(
                           (SELECT SUM(jl.debit - jl.credit) 
                            FROM journal_lines jl 
                            INNER JOIN journal_entries je ON jl.journal_id = je.id 
                            WHERE jl.account_id = a.id AND je.company_id = ?), 0
                       ) as balance
                FROM accounts a 
                LEFT JOIN accounts p ON a.parent_id = p.id 
                WHERE a.company_id = ? 
                ORDER BY a.type, a.code
            ");
            $stmt->execute([$company_id, $company_id]);
            $accounts = $stmt->fetchAll();
            
            // Organize by type
            $organized = [
                'asset' => [],
                'liability' => [],
                'equity' => [],
                'income' => [],
                'expense' => []
            ];
            
            foreach ($accounts as $account) {
                $organized[$account['type']][] = $account;
            }
            
            echo json_encode($organized);
        }
        exit;
    }

    if ($method === 'POST') {
        $company_id = $input['company_id'] ?? 1;
        $code = $input['code'] ?? null;
        $name = $input['name'] ?? null;
        $type = $input['type'] ?? null;
        $parent_id = $input['parent_id'] ?? null;

        if (!$code || !$name || !$type) {
            http_response_code(400);
            echo json_encode(['error' => 'code, name and type required']);
            exit;
        }

        // Validate account type
        $validTypes = ['asset', 'liability', 'equity', 'income', 'expense'];
        if (!in_array($type, $validTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid account type']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO accounts (company_id, code, name, type, parent_id, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$company_id, $code, $name, $type, $parent_id]);
        $id = $pdo->lastInsertId();

        $stmt = $pdo->prepare("
            SELECT a.*, p.name as parent_name 
            FROM accounts a 
            LEFT JOIN accounts p ON a.parent_id = p.id 
            WHERE a.id = ?
        ");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
        exit;
    }

    if ($method === 'PUT') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'id required']);
            exit;
        }
        
        $id = (int)$_GET['id'];
        $fields = [];
        $params = [];
        
        foreach (['code', 'name', 'type', 'parent_id'] as $col) {
            if (isset($input[$col])) {
                $fields[] = "$col = ?";
                $params[] = $input[$col];
            }
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'no fields to update']);
            exit;
        }
        
        $params[] = $id;
        $sql = "UPDATE accounts SET " . implode(',', $fields) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare("
            SELECT a.*, p.name as parent_name 
            FROM accounts a 
            LEFT JOIN accounts p ON a.parent_id = p.id 
            WHERE a.id = ?
        ");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
        exit;
    }

    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'id required']);
            exit;
        }
        
        $id = (int)$_GET['id'];
        
        // Check if account has transactions
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM journal_lines WHERE account_id = ?");
        $stmt->execute([$id]);
        $transactionCount = $stmt->fetchColumn();
        
        if ($transactionCount > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete account with existing transactions']);
            exit;
        }
        
        // Check if account has child accounts
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM accounts WHERE parent_id = ?");
        $stmt->execute([$id]);
        $childCount = $stmt->fetchColumn();
        
        if ($childCount > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete account with child accounts']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM accounts WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'method not allowed']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'exception', 'message' => $e->getMessage()]);
}

function initializeChartOfAccounts($pdo, $company_id) {
    // Check if accounts already exist
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM accounts WHERE company_id = ?");
    $stmt->execute([$company_id]);
    if ($stmt->fetchColumn() > 0) {
        return; // Already initialized
    }

    $defaultAccounts = [
        // Assets
        ['1000', 'Current Assets', 'asset', null],
        ['1100', 'Cash in Hand', 'asset', 1],
        ['1110', 'Cash at Bank', 'asset', 1],
        ['1120', 'Accounts Receivable', 'asset', 1],
        ['1130', 'Inventory', 'asset', 1],
        ['1140', 'Prepaid Expenses', 'asset', 1],
        
        ['1500', 'Fixed Assets', 'asset', null],
        ['1510', 'Equipment', 'asset', 6],
        ['1520', 'Furniture & Fixtures', 'asset', 6],
        ['1530', 'Accumulated Depreciation', 'asset', 6],
        
        // Liabilities  
        ['2000', 'Current Liabilities', 'liability', null],
        ['2100', 'Accounts Payable', 'liability', 10],
        ['2110', 'Accrued Expenses', 'liability', 10],
        ['2120', 'Tax Payable', 'liability', 10],
        ['2130', 'Short-term Loans', 'liability', 10],
        
        ['2500', 'Long-term Liabilities', 'liability', null],
        ['2510', 'Long-term Loans', 'liability', 15],
        
        // Equity
        ['3000', 'Owner\'s Equity', 'equity', null],
        ['3100', 'Capital', 'equity', 17],
        ['3200', 'Retained Earnings', 'equity', 17],
        ['3300', 'Drawings', 'equity', 17],
        
        // Income
        ['4000', 'Revenue', 'income', null],
        ['4100', 'Sales Revenue', 'income', 21],
        ['4200', 'Service Revenue', 'income', 21],
        ['4300', 'Other Income', 'income', 21],
        
        // Expenses
        ['5000', 'Cost of Goods Sold', 'expense', null],
        ['5100', 'Purchases', 'expense', 25],
        ['5200', 'Direct Labor', 'expense', 25],
        
        ['6000', 'Operating Expenses', 'expense', null],
        ['6100', 'Salaries & Wages', 'expense', 28],
        ['6200', 'Rent Expense', 'expense', 28],
        ['6300', 'Utilities', 'expense', 28],
        ['6400', 'Office Supplies', 'expense', 28],
        ['6500', 'Marketing & Advertising', 'expense', 28],
        ['6600', 'Professional Fees', 'expense', 28],
        ['6700', 'Insurance', 'expense', 28],
        ['6800', 'Depreciation Expense', 'expense', 28],
        ['6900', 'Miscellaneous Expenses', 'expense', 28]
    ];

    $stmt = $pdo->prepare("
        INSERT INTO accounts (company_id, code, name, type, parent_id, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $accountIds = [];
    
    foreach ($defaultAccounts as $i => $account) {
        list($code, $name, $type, $parentIndex) = $account;
        $parentId = $parentIndex ? $accountIds[$parentIndex] : null;
        
        $stmt->execute([$company_id, $code, $name, $type, $parentId]);
        $accountIds[$i + 1] = $pdo->lastInsertId();
    }
}
?>
