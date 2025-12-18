<?php
// Clean output buffer and suppress errors to ensure JSON output
if (ob_get_level()) {
    ob_clean();
}
error_reporting(0);
ini_set('display_errors', 0);

// Start session first
session_start();
header('Content-Type: application/json');

// CORS Headers - allow credentials
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowed_origins, true)) {
    header('Vary: Origin');
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/AccountResolver.php';
require_once __DIR__ . '/journal_helpers.php';
require_once __DIR__ . '/../includes/company_settings_helper.php';

/**
 * Map incoming frontend payment method values to DB enum values.
 * Frontend may send 'bank_transfer', 'credit_card', 'cheque', 'cash', 'other'
 * DB enum: ('cash','bank','card','cheque')
 */
function normalizePaymentMethod(string $pm): string {
    $pm = strtolower(trim($pm));
    return match ($pm) {
        'bank', 'bank_transfer', 'banktransfer' => 'bank',
        'card', 'credit_card', 'creditcard' => 'card',
        'cheque', 'check' => 'cheque',
        'mobile_money', 'mobilemoney', 'mobile' => 'cash', // Map mobile money to cash for now
        'cash' => 'cash',
        default => 'cash',
    };
}

// Check authentication
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

$company_id = (int) $_SESSION['company_id'];
$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true) ?? [];

// One-time cleanup: Fix any existing floating point precision errors in amounts
// This runs on every request but only updates rows that need fixing (very fast)
try {
    $pdo->exec("UPDATE expenses SET amount = ROUND(amount, 2) WHERE amount != ROUND(amount, 2)");
} catch (Exception $e) {
    error_log('Amount cleanup warning: ' . $e->getMessage());
}

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $id = (int) $_GET['id'];
            $stmt = $pdo->prepare("SELECT *, reference as reference_number, notes as additional_notes FROM expenses WHERE id = ? AND company_id = ?");
            $stmt->execute([$id, $company_id]);
            $expense = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($expense ?: []);
            exit;
        }

        // List all expenses (optional search)
        $search = trim($_GET['search'] ?? '');
        $sql = "SELECT *, reference as reference_number, notes as additional_notes FROM expenses WHERE company_id = ?";
        $params = [$company_id];

        if ($search !== '') {
            $sql .= " AND (reference LIKE ? OR category LIKE ? OR description LIKE ? OR payee_name LIKE ? OR receipt_number LIKE ?)";
            $like = "%$search%";
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        $sql .= " ORDER BY expense_date DESC, created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($expenses);
        exit;
    }

    elseif ($method === 'POST') {
        // Map inputs from frontend/modal to DB columns
        // Frontend sends: reference_number, payee_name, category, description, amount, expense_date, payment_method, additional_notes
        $reference = isset($input['reference_number']) ? trim((string)$input['reference_number']) : (isset($input['reference']) ? trim((string)$input['reference']) : '');
        $payee_name = isset($input['payee_name']) ? trim((string)$input['payee_name']) : '';
        $category = trim((string)($input['category'] ?? $input['expense_category'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $amount = round((float) ($input['amount'] ?? 0), 2);
        $expense_date = $input['expense_date'] ?? date('Y-m-d');
        $payment_method = normalizePaymentMethod((string)($input['payment_method'] ?? 'cash'));
        $notes = isset($input['additional_notes']) ? trim((string)$input['additional_notes']) : (isset($input['notes']) ? trim((string)$input['notes']) : null);
        $receipt_number = isset($input['receipt_number']) ? trim((string)$input['receipt_number']) : null;

        // Validation
        if ($reference === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Reference is required']);
            exit;
        }
        if ($payee_name === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Payee name is required']);
            exit;
        }
        if ($category === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Category is required']);
            exit;
        }
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Amount must be greater than 0']);
            exit;
        }

        // Ensure reference uniqueness for this company
        $chk = $pdo->prepare("SELECT id FROM expenses WHERE reference = ? AND company_id = ? LIMIT 1");
        $chk->execute([$reference, $company_id]);
        if ($chk->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Reference number already exists']);
            exit;
        }

        // Resolve accounts (expense & payment) using AccountResolver
        try {
            $resolver = new AccountResolver($pdo, $company_id);

            // Find or create an expense account for this category
            $stmt = $pdo->prepare("
                SELECT id FROM accounts
                WHERE company_id = ? AND type = 'expense' AND is_active = 1
                AND (name LIKE ? OR name LIKE ?)
                LIMIT 1
            ");
            $stmt->execute([$company_id, "%$category%", "%Expense%"]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row) {
                $expense_account_id = (int)$row['id'];
            } else {
                $accountName = $category . " Expense";
                $accountCode = "5" . str_pad(rand(100, 999), 3, '0', STR_PAD_LEFT);
                $ins = $pdo->prepare("
                    INSERT INTO accounts (company_id, code, name, type, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, 'expense', 1, NOW(), NOW())
                ");
                $ins->execute([$company_id, $accountCode, $accountName]);
                $expense_account_id = (int)$pdo->lastInsertId();
            }

            // Payment account via resolver (use cash account for expenses as per accounting principles)
            // Expenses are always paid immediately in cash/bank
            $payment_account_id = $resolver->cash(false); // Use existing cash account
            
            if (!$payment_account_id) {
                throw new Exception("Cash account not found - ensure company has been properly set up through signup");
            }

            if (!$expense_account_id) {
                throw new Exception("Failed to resolve expense account");
            }
            if (!$payment_account_id) {
                throw new Exception("Failed to resolve payment account");
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Account resolution failed: ' . $e->getMessage()]);
            exit;
        }

        // Insert the expense + create journal entry inside a transaction
        $pdo->beginTransaction();
        try {
            $insert = $pdo->prepare("
                INSERT INTO expenses
                (reference, company_id, category, payee_name, description, amount, expense_date, payment_method, receipt_number, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $insert->execute([
                $reference,
                $company_id,
                $category,
                $payee_name,
                $description,
                $amount,
                $expense_date,
                $payment_method,
                $receipt_number,
                $notes
            ]);

            $expense_id = (int)$pdo->lastInsertId();

            // Create journal lines: debit expense account, credit payment account
            $journal_lines = [
                [
                    'account_id' => $expense_account_id,
                    'debit' => $amount,
                    'credit' => 0
                ],
                [
                    'account_id' => $payment_account_id,
                    'debit' => 0,
                    'credit' => $amount
                ]
            ];

            $entry_description = "Expense - {$reference} ({$payee_name})";

            $journal_entry_id = createAutomaticJournalEntry(
                $pdo,
                $company_id,
                'expense',
                $expense_id,
                $entry_description,
                $journal_lines,
                $expense_date
            );

            if (!$journal_entry_id) {
                throw new Exception('Failed to create journal entry');
            }

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'id' => $expense_id,
                'journal_entry_id' => $journal_entry_id,
                'reference' => $reference,
                'message' => 'Expense recorded and journal posted',
                'amount' => $amount
            ]);
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log('Expense insert error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to record expense', 'message' => $e->getMessage()]);
            exit;
        }
    }

    elseif ($method === 'PUT') {
        // Update expense (frontend may call this later)
        $id = (int) ($input['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid expense id']);
            exit;
        }

        // verify ownership
        $stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ? AND company_id = ?");
        $stmt->execute([$id, $company_id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['error' => 'Expense not found']);
            exit;
        }

        // map inputs (allow partial updates)
        $reference = array_key_exists('reference_number', $input) ? trim((string)$input['reference_number']) : (array_key_exists('reference', $input) ? trim((string)$input['reference']) : $existing['reference']);
        $payee_name = array_key_exists('payee_name', $input) ? trim((string)$input['payee_name']) : $existing['payee_name'];
        $category = array_key_exists('category', $input) ? trim((string)$input['category']) : (array_key_exists('expense_category', $input) ? trim((string)$input['expense_category']) : $existing['category']);
        $description = array_key_exists('description', $input) ? trim((string)$input['description']) : $existing['description'];
        $amount = array_key_exists('amount', $input) ? round((float)$input['amount'], 2) : round((float)$existing['amount'], 2);
        $expense_date = $input['expense_date'] ?? $existing['expense_date'];
        $payment_method = isset($input['payment_method']) ? normalizePaymentMethod((string)$input['payment_method']) : $existing['payment_method'];
        $receipt_number = array_key_exists('receipt_number', $input) ? trim((string)$input['receipt_number']) : $existing['receipt_number'];
        $notes = array_key_exists('additional_notes', $input) ? trim((string)$input['additional_notes']) : (array_key_exists('notes', $input) ? trim((string)$input['notes']) : $existing['notes']);

        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Amount must be greater than 0']);
            exit;
        }

        // If reference changed, ensure uniqueness
        if ($reference !== $existing['reference']) {
            $chk = $pdo->prepare("SELECT id FROM expenses WHERE reference = ? AND company_id = ? LIMIT 1");
            $chk->execute([$reference, $company_id]);
            if ($chk->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Reference number already exists']);
                exit;
            }
        }

        $update = $pdo->prepare("
            UPDATE expenses SET
              reference = ?, category = ?, payee_name = ?, description = ?, amount = ?,
              expense_date = ?, payment_method = ?, receipt_number = ?, notes = ?, updated_at = NOW()
            WHERE id = ? AND company_id = ?
        ");
        $update->execute([
            $reference, $category, $payee_name, $description, $amount,
            $expense_date, $payment_method, $receipt_number, $notes,
            $id, $company_id
        ]);

        // return updated row with success flag
        $stmt = $pdo->prepare("SELECT *, reference as reference_number, notes as additional_notes FROM expenses WHERE id = ? AND company_id = ?");
        $stmt->execute([$id, $company_id]);
        $expense = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'expense' => $expense]);
        exit;
    }

    elseif ($method === 'DELETE') {
        // Accept id from either query string or request body
        $id = (int)($_GET['id'] ?? $input['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid expense id']);
            exit;
        }

        // verify ownership
        $stmt = $pdo->prepare("SELECT id FROM expenses WHERE id = ? AND company_id = ?");
        $stmt->execute([$id, $company_id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Expense not found']);
            exit;
        }

        $pdo->beginTransaction();
        try {
            // remove journal lines & entries referencing this expense
            $deleteJournalLines = $pdo->prepare("
                DELETE jl FROM journal_lines jl
                JOIN journal_entries je ON jl.journal_id = je.id
                WHERE je.reference_type = 'expense' AND je.reference_id = ?
            ");
            $deleteJournalLines->execute([$id]);

            $deleteJournalEntries = $pdo->prepare("
                DELETE FROM journal_entries WHERE reference_type = 'expense' AND reference_id = ?
            ");
            $deleteJournalEntries->execute([$id]);

            $del = $pdo->prepare("DELETE FROM expenses WHERE id = ? AND company_id = ?");
            $del->execute([$id, $company_id]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Expense deleted successfully']);
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete expense', 'message' => $e->getMessage()]);
            exit;
        }
    }

    else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
} catch (Exception $e) {
    error_log('Expenses API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
    exit;
}
