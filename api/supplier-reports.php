<?php
// Supplier Reports API
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

// Check authentication
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

$company_id = $_SESSION['company_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $supplier_id = $_GET['supplier_id'] ?? null;
        $report_type = $_GET['report_type'] ?? '';
        $start_date = $_GET['start_date'] ?? date('Y-m-01'); // First day of current month
        $end_date = $_GET['end_date'] ?? date('Y-m-t'); // Last day of current month
        
        if (!$supplier_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Supplier ID is required']);
            exit;
        }
        
        switch ($report_type) {
            case 'purchase-report':
                echo json_encode(getSupplierPurchaseReport($pdo, $company_id, $supplier_id, $start_date, $end_date));
                break;
                
            case 'payment-history':
                echo json_encode(getSupplierPaymentHistory($pdo, $company_id, $supplier_id, $start_date, $end_date));
                break;
                
            case 'supplier-statement':
                echo json_encode(getSupplierStatement($pdo, $company_id, $supplier_id, $start_date, $end_date));
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
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

function getSupplierPurchaseReport($pdo, $company_id, $supplier_id, $start_date, $end_date) {
    // Get all purchase bills for this supplier
    $stmt = $pdo->prepare("
        SELECT 
            pb.reference,
            pb.bill_date as date,
            pb.total_amount as amount,
            pb.status,
            pb.notes as description,
            COALESCE(SUM(p.amount), 0) as amount_paid
        FROM purchase_bills pb
        LEFT JOIN payments p ON pb.id = p.purchase_bill_id AND p.company_id = ?
        WHERE pb.company_id = ? 
        AND pb.supplier_id = ?
        AND pb.bill_date BETWEEN ? AND ?
        GROUP BY pb.id, pb.reference, pb.bill_date, pb.total_amount, pb.status, pb.notes
        ORDER BY pb.bill_date DESC
    ");
    $stmt->execute([$company_id, $company_id, $supplier_id, $start_date, $end_date]);
    $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate totals
    $total_amount = array_sum(array_column($purchases, 'amount'));
    $total_paid = array_sum(array_column($purchases, 'amount_paid'));
    $balance_due = $total_amount - $total_paid;
    
    return [
        'supplier_id' => $supplier_id,
        'period' => "$start_date to $end_date",
        'purchases' => $purchases,
        'total_amount' => $total_amount,
        'amount_paid' => $total_paid,
        'balance_due' => $balance_due,
        'purchase_count' => count($purchases)
    ];
}

function getSupplierPaymentHistory($pdo, $company_id, $supplier_id, $start_date, $end_date) {
    // Get all payments made to this supplier
    $stmt = $pdo->prepare("
        SELECT 
            p.payment_date as date,
            p.reference,
            p.amount,
            p.payment_method as method,
            p.notes,
            pb.reference as bill_reference
        FROM payments p
        LEFT JOIN purchase_bills pb ON p.purchase_bill_id = pb.id
        WHERE p.company_id = ? 
        AND pb.supplier_id = ?
        AND p.payment_date BETWEEN ? AND ?
        ORDER BY p.payment_date DESC
    ");
    $stmt->execute([$company_id, $supplier_id, $start_date, $end_date]);
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate totals
    $total_paid = array_sum(array_column($payments, 'amount'));
    $avg_payment = count($payments) > 0 ? $total_paid / count($payments) : 0;
    
    return [
        'supplier_id' => $supplier_id,
        'period' => "$start_date to $end_date",
        'payments' => $payments,
        'total_paid' => $total_paid,
        'avg_payment' => $avg_payment,
        'payment_count' => count($payments)
    ];
}

function getSupplierStatement($pdo, $company_id, $supplier_id, $start_date, $end_date) {
    // Get opening balance (before start date)
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(pb.total_amount), 0) - COALESCE(SUM(p.amount), 0) as opening_balance
        FROM purchase_bills pb
        LEFT JOIN payments p ON pb.id = p.purchase_bill_id AND p.company_id = ?
        WHERE pb.company_id = ? 
        AND pb.supplier_id = ?
        AND pb.bill_date < ?
    ");
    $stmt->execute([$company_id, $company_id, $supplier_id, $start_date]);
    $opening_balance = $stmt->fetchColumn() ?: 0;
    
    // Get all transactions (purchases and payments) for the period
    $stmt = $pdo->prepare("
        (SELECT 
            pb.bill_date as date,
            'purchase' as type,
            pb.reference,
            pb.total_amount as amount,
            pb.notes as description
        FROM purchase_bills pb
        WHERE pb.company_id = ? 
        AND pb.supplier_id = ?
        AND pb.bill_date BETWEEN ? AND ?)
        
        UNION ALL
        
        (SELECT 
            p.payment_date as date,
            'payment' as type,
            p.reference,
            p.amount,
            p.notes as description
        FROM payments p
        JOIN purchase_bills pb ON p.purchase_bill_id = pb.id
        WHERE p.company_id = ? 
        AND pb.supplier_id = ?
        AND p.payment_date BETWEEN ? AND ?)
        
        ORDER BY date ASC
    ");
    $stmt->execute([
        $company_id, $supplier_id, $start_date, $end_date,
        $company_id, $supplier_id, $start_date, $end_date
    ]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate running balances
    $running_balance = $opening_balance;
    $total_purchases = 0;
    $total_payments = 0;
    
    foreach ($transactions as &$txn) {
        if ($txn['type'] === 'purchase') {
            $running_balance += $txn['amount'];
            $total_purchases += $txn['amount'];
        } else {
            $running_balance -= $txn['amount'];
            $total_payments += $txn['amount'];
        }
        $txn['running_balance'] = $running_balance;
    }
    
    return [
        'supplier_id' => $supplier_id,
        'period' => "$start_date to $end_date",
        'opening_balance' => $opening_balance,
        'closing_balance' => $running_balance,
        'total_purchases' => $total_purchases,
        'total_payments' => $total_payments,
        'transactions' => $transactions
    ];
}
?>
