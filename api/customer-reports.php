<?php
// Customer Reports API
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
        $customer_id = $_GET['customer_id'] ?? null;
        $report_type = $_GET['report_type'] ?? '';
        $start_date = $_GET['start_date'] ?? date('Y-m-01'); // First day of current month
        $end_date = $_GET['end_date'] ?? date('Y-m-t'); // Last day of current month
        
        if (!$customer_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer ID is required']);
            exit;
        }
        
        switch ($report_type) {
            case 'sales-report':
                echo json_encode(getCustomerSalesReport($pdo, $company_id, $customer_id, $start_date, $end_date));
                break;
                
            case 'payment-history':
                echo json_encode(getCustomerPaymentHistory($pdo, $company_id, $customer_id, $start_date, $end_date));
                break;
                
            case 'customer-statement':
                echo json_encode(getCustomerStatement($pdo, $company_id, $customer_id, $start_date, $end_date));
                break;
                
            case 'outstanding-balance':
                echo json_encode(getCustomerOutstandingBalance($pdo, $company_id, $customer_id));
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid report type']);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $customer_id = $input['customer_id'] ?? null;
        $action = $input['action'] ?? '';
        
        if (!$customer_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer ID is required']);
            exit;
        }
        
        if ($action === 'comprehensive_report') {
            echo json_encode(getComprehensiveCustomerReport($pdo, $company_id, $customer_id));
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

function getCustomerSalesReport($pdo, $company_id, $customer_id, $start_date, $end_date) {
    // Get all sales invoices for this customer
    $stmt = $pdo->prepare("
        SELECT 
            s.id,
            s.invoice_number as reference,
            s.sale_date as date,
            s.total_amount as amount,
            s.status,
            s.notes as description,
            COALESCE(SUM(p.amount), 0) as amount_paid,
            (s.total_amount - COALESCE(SUM(p.amount), 0)) as balance_due
        FROM sales s
        LEFT JOIN payments p ON s.id = p.sale_id AND p.company_id = ?
        WHERE s.company_id = ? 
        AND s.customer_id = ?
        AND s.sale_date BETWEEN ? AND ?
        GROUP BY s.id, s.invoice_number, s.sale_date, s.total_amount, s.status, s.notes
        ORDER BY s.sale_date DESC
    ");
    $stmt->execute([$company_id, $company_id, $customer_id, $start_date, $end_date]);
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate totals
    $total_amount = array_sum(array_column($sales, 'amount'));
    $total_paid = array_sum(array_column($sales, 'amount_paid'));
    $balance_due = $total_amount - $total_paid;
    
    return [
        'success' => true,
        'customer_id' => $customer_id,
        'period' => "$start_date to $end_date",
        'sales' => $sales,
        'total_amount' => $total_amount,
        'amount_paid' => $total_paid,
        'balance_due' => $balance_due,
        'sales_count' => count($sales)
    ];
}

function getCustomerPaymentHistory($pdo, $company_id, $customer_id, $start_date, $end_date) {
    // Get all payments received from this customer
    $stmt = $pdo->prepare("
        SELECT 
            p.payment_date as date,
            p.reference,
            p.amount,
            p.payment_method as method,
            p.notes,
            s.invoice_number as invoice_reference
        FROM payments p
        LEFT JOIN sales s ON p.sale_id = s.id
        WHERE p.company_id = ? 
        AND s.customer_id = ?
        AND p.payment_date BETWEEN ? AND ?
        ORDER BY p.payment_date DESC
    ");
    $stmt->execute([$company_id, $customer_id, $start_date, $end_date]);
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate totals
    $total_paid = array_sum(array_column($payments, 'amount'));
    $avg_payment = count($payments) > 0 ? $total_paid / count($payments) : 0;
    
    return [
        'success' => true,
        'customer_id' => $customer_id,
        'period' => "$start_date to $end_date",
        'payments' => $payments,
        'total_paid' => $total_paid,
        'avg_payment' => $avg_payment,
        'payment_count' => count($payments)
    ];
}

function getCustomerStatement($pdo, $company_id, $customer_id, $start_date, $end_date) {
    // Get opening balance (before start date)
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(s.total_amount), 0) - COALESCE(SUM(p.amount), 0) as opening_balance
        FROM sales s
        LEFT JOIN payments p ON s.id = p.sale_id AND p.company_id = ?
        WHERE s.company_id = ? 
        AND s.customer_id = ?
        AND s.sale_date < ?
    ");
    $stmt->execute([$company_id, $company_id, $customer_id, $start_date]);
    $opening_balance = $stmt->fetchColumn() ?: 0;
    
    // Get all transactions (sales and payments) for the period
    $stmt = $pdo->prepare("
        (SELECT 
            s.sale_date as date,
            'sale' as type,
            s.invoice_number as reference,
            s.total_amount as amount,
            s.notes as description,
            s.status
        FROM sales s
        WHERE s.company_id = ? 
        AND s.customer_id = ?
        AND s.sale_date BETWEEN ? AND ?)
        
        UNION ALL
        
        (SELECT 
            p.payment_date as date,
            'payment' as type,
            p.reference,
            p.amount,
            p.notes as description,
            'completed' as status
        FROM payments p
        JOIN sales s ON p.sale_id = s.id
        WHERE p.company_id = ? 
        AND s.customer_id = ?
        AND p.payment_date BETWEEN ? AND ?)
        
        ORDER BY date ASC
    ");
    $stmt->execute([
        $company_id, $customer_id, $start_date, $end_date,
        $company_id, $customer_id, $start_date, $end_date
    ]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate running balances
    $running_balance = $opening_balance;
    $total_sales = 0;
    $total_payments = 0;
    
    foreach ($transactions as &$txn) {
        if ($txn['type'] === 'sale') {
            $running_balance += $txn['amount'];
            $total_sales += $txn['amount'];
        } else {
            $running_balance -= $txn['amount'];
            $total_payments += $txn['amount'];
        }
        $txn['running_balance'] = $running_balance;
    }
    
    return [
        'success' => true,
        'customer_id' => $customer_id,
        'period' => "$start_date to $end_date",
        'opening_balance' => $opening_balance,
        'closing_balance' => $running_balance,
        'total_sales' => $total_sales,
        'total_payments' => $total_payments,
        'transactions' => $transactions
    ];
}

function getCustomerOutstandingBalance($pdo, $company_id, $customer_id) {
    // Get all unpaid/partially paid invoices
    $stmt = $pdo->prepare("
        SELECT 
            s.id,
            s.invoice_number,
            s.sale_date,
            s.total_amount,
            COALESCE(SUM(p.amount), 0) as amount_paid,
            (s.total_amount - COALESCE(SUM(p.amount), 0)) as balance_due,
            DATEDIFF(CURDATE(), s.sale_date) as days_overdue
        FROM sales s
        LEFT JOIN payments p ON s.id = p.sale_id AND p.company_id = ?
        WHERE s.company_id = ? 
        AND s.customer_id = ?
        GROUP BY s.id, s.invoice_number, s.sale_date, s.total_amount
        HAVING balance_due > 0
        ORDER BY s.sale_date ASC
    ");
    $stmt->execute([$company_id, $company_id, $customer_id]);
    $outstanding_invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate totals
    $total_outstanding = array_sum(array_column($outstanding_invoices, 'balance_due'));
    $overdue_amount = 0;
    $current_amount = 0;
    
    foreach ($outstanding_invoices as $invoice) {
        if ($invoice['days_overdue'] > 30) { // Consider 30+ days as overdue
            $overdue_amount += $invoice['balance_due'];
        } else {
            $current_amount += $invoice['balance_due'];
        }
    }
    
    return [
        'success' => true,
        'customer_id' => $customer_id,
        'outstanding_invoices' => $outstanding_invoices,
        'total_outstanding' => $total_outstanding,
        'overdue_amount' => $overdue_amount,
        'current_amount' => $current_amount,
        'invoice_count' => count($outstanding_invoices)
    ];
}

// Get comprehensive customer report with invoices and payments
function getComprehensiveCustomerReport($pdo, $company_id, $customer_id) {
    try {
        // Get customer sales/invoices
        $stmt = $pdo->prepare("
            SELECT 
                s.id,
                s.invoice_number,
                s.sale_date as date,
                s.total_amount,
                s.paid_amount,
                s.status,
                s.notes,
                s.created_at,
                (s.total_amount - COALESCE(s.paid_amount, 0)) as outstanding
            FROM sales s 
            WHERE s.company_id = ? AND s.customer_id = ?
            ORDER BY s.sale_date DESC
        ");
        $stmt->execute([$company_id, $customer_id]);
        $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get customer payments
        $stmt = $pdo->prepare("
            SELECT 
                p.id,
                p.payment_date,
                p.amount,
                p.payment_method,
                p.reference_number,
                p.transaction_id,
                p.notes,
                p.created_at
            FROM payments p 
            WHERE p.company_id = ? AND p.customer_id = ?
            ORDER BY p.payment_date DESC
        ");
        $stmt->execute([$company_id, $customer_id]);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate totals
        $total_sales = array_sum(array_column($sales, 'total_amount'));
        $total_payments = array_sum(array_column($payments, 'amount'));
        $outstanding_balance = $total_sales - $total_payments;
        
        return [
            'success' => true,
            'data' => [
                'customer_id' => $customer_id,
                'sales' => $sales,
                'payments' => $payments,
                'total_sales' => $total_sales,
                'total_payments' => $total_payments,
                'outstanding_balance' => $outstanding_balance,
                'invoice_count' => count($sales),
                'payment_count' => count($payments)
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Comprehensive customer report error: " . $e->getMessage());
        return [
            'success' => false,
            'error' => 'Failed to generate comprehensive report'
        ];
    }
}
?>
