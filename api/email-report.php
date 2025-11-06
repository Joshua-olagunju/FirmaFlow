<?php
// Email Report API
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
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $to = $input['to'] ?? '';
        $subject = $input['subject'] ?? 'Supplier Report';
        $message = $input['message'] ?? '';
        $supplier_name = $input['supplier_name'] ?? 'Supplier';
        $report_type = $input['report_type'] ?? 'report';
        $report_data = $input['report_data'] ?? [];
        
        if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid email address is required']);
            exit;
        }
        
        $result = sendReportEmail($to, $subject, $message, $supplier_name, $report_type, $report_data);
        
        if ($result['success']) {
            echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => $result['message']]);
        }
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

function sendReportEmail($to, $subject, $message, $supplier_name, $report_type, $report_data) {
    try {
        // Generate HTML report content
        $report_html = generateReportHTML($supplier_name, $report_type, $report_data);
        
        // Create email content
        $email_body = generateEmailBody($message, $report_html, $supplier_name, $report_type);
        
        // Email headers
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: Firmaflow <noreply@firmaflow.com>',
            'Reply-To: noreply@firmaflow.com',
            'X-Mailer: PHP/' . phpversion()
        ];
        
        // Send email using PHP's mail function
        // Note: In production, you should use a proper email service like PHPMailer, Swiftmailer, or a service like SendGrid
        $success = mail($to, $subject, $email_body, implode("\r\n", $headers));
        
        if ($success) {
            return ['success' => true];
        } else {
            return ['success' => false, 'message' => 'Failed to send email. Please check your email configuration.'];
        }
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Email error: ' . $e->getMessage()];
    }
}

function generateEmailBody($personal_message, $report_html, $supplier_name, $report_type) {
    $report_title = ucfirst(str_replace('-', ' ', $report_type));
    $current_date = date('F j, Y');
    
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>{$report_title} Report</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
            .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #007bff; margin: 0; font-size: 28px; }
            .header p { color: #666; margin: 10px 0; }
            .message-box { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #007bff; }
            .report-content { margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            .card { border: 1px solid #dee2e6; border-radius: 6px; margin-bottom: 20px; }
            .card-body { padding: 15px; }
            .card h5 { margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #007bff; }
            .card small { color: #666; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
            .table th { background-color: #f8f9fa; font-weight: 600; color: #495057; }
            .table tr:hover { background-color: #f8f9fa; }
            .text-end { text-align: right; }
            .text-center { text-align: center; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .badge.bg-success { background-color: #198754; color: white; }
            .badge.bg-warning { background-color: #ffc107; color: black; }
            .badge.bg-danger { background-color: #dc3545; color: white; }
            .row { display: flex; flex-wrap: wrap; margin: -10px; }
            .col { flex: 1; padding: 10px; min-width: 200px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>{$report_title} Report</h1>
                <p><strong>{$supplier_name}</strong></p>
                <p>Generated on {$current_date}</p>
            </div>
            
            " . ($personal_message ? "<div class='message-box'><strong>Message:</strong><br>{$personal_message}</div>" : "") . "
            
            <div class='report-content'>
                {$report_html}
            </div>
            
            <div class='footer'>
                <p><strong>Firmaflow</strong> - Business Management System</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>";
}

function generateReportHTML($supplier_name, $report_type, $data) {
    switch ($report_type) {
        case 'purchase':
            return generatePurchaseReportEmailHTML($data);
        case 'payment':
            return generatePaymentHistoryEmailHTML($data);
        case 'statement':
            return generateSupplierStatementEmailHTML($data);
        default:
            return '<p>Report data not available.</p>';
    }
}

function generatePurchaseReportEmailHTML($data) {
    $purchases = $data['purchases'] ?? [];
    
    $html = "
    <div class='row'>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>" . count($purchases) . "</h5>
                    <small>Total Orders</small>
                </div>
            </div>
        </div>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>₦" . number_format($data['total_amount'] ?? 0, 2) . "</h5>
                    <small>Total Amount</small>
                </div>
            </div>
        </div>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>₦" . number_format($data['amount_paid'] ?? 0, 2) . "</h5>
                    <small>Amount Paid</small>
                </div>
            </div>
        </div>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>₦" . number_format($data['balance_due'] ?? 0, 2) . "</h5>
                    <small>Balance Due</small>
                </div>
            </div>
        </div>
    </div>";
    
    if (!empty($purchases)) {
        $html .= "
        <table class='table'>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Description</th>
                    <th class='text-end'>Amount</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>";
        
        foreach ($purchases as $purchase) {
            $statusClass = $purchase['status'] === 'paid' ? 'bg-success' : 
                          ($purchase['status'] === 'partial' ? 'bg-warning' : 'bg-danger');
            
            $html .= "
                <tr>
                    <td>" . date('M j, Y', strtotime($purchase['date'])) . "</td>
                    <td>" . htmlspecialchars($purchase['reference'] ?? '') . "</td>
                    <td>" . htmlspecialchars($purchase['description'] ?? 'Purchase order') . "</td>
                    <td class='text-end'>₦" . number_format($purchase['amount'] ?? 0, 2) . "</td>
                    <td><span class='badge {$statusClass}'>" . ucfirst($purchase['status'] ?? 'pending') . "</span></td>
                </tr>";
        }
        
        $html .= "
            </tbody>
        </table>";
    } else {
        $html .= "<p class='text-center'>No purchases found for the selected period.</p>";
    }
    
    return $html;
}

function generatePaymentHistoryEmailHTML($data) {
    $payments = $data['payments'] ?? [];
    
    $html = "
    <div class='row'>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>" . count($payments) . "</h5>
                    <small>Total Payments</small>
                </div>
            </div>
        </div>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>₦" . number_format($data['total_paid'] ?? 0, 2) . "</h5>
                    <small>Total Paid</small>
                </div>
            </div>
        </div>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>₦" . number_format($data['avg_payment'] ?? 0, 2) . "</h5>
                    <small>Average Payment</small>
                </div>
            </div>
        </div>
    </div>";
    
    if (!empty($payments)) {
        $html .= "
        <table class='table'>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Method</th>
                    <th class='text-end'>Amount</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>";
        
        foreach ($payments as $payment) {
            $html .= "
                <tr>
                    <td>" . date('M j, Y', strtotime($payment['date'])) . "</td>
                    <td>" . htmlspecialchars($payment['reference'] ?? '') . "</td>
                    <td>" . htmlspecialchars($payment['method'] ?? 'Bank Transfer') . "</td>
                    <td class='text-end'>₦" . number_format($payment['amount'] ?? 0, 2) . "</td>
                    <td>" . htmlspecialchars($payment['notes'] ?? '') . "</td>
                </tr>";
        }
        
        $html .= "
            </tbody>
        </table>";
    } else {
        $html .= "<p class='text-center'>No payments found for the selected period.</p>";
    }
    
    return $html;
}

function generateSupplierStatementEmailHTML($data) {
    $transactions = $data['transactions'] ?? [];
    
    $html = "
    <div class='row'>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>₦" . number_format($data['opening_balance'] ?? 0, 2) . "</h5>
                    <small>Opening Balance</small>
                </div>
            </div>
        </div>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>₦" . number_format($data['total_purchases'] ?? 0, 2) . "</h5>
                    <small>Total Purchases</small>
                </div>
            </div>
        </div>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>₦" . number_format($data['total_payments'] ?? 0, 2) . "</h5>
                    <small>Total Payments</small>
                </div>
            </div>
        </div>
        <div class='col'>
            <div class='card'>
                <div class='card-body text-center'>
                    <h5>₦" . number_format($data['closing_balance'] ?? 0, 2) . "</h5>
                    <small>Current Balance</small>
                </div>
            </div>
        </div>
    </div>";
    
    if (!empty($transactions)) {
        $html .= "
        <table class='table'>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Reference</th>
                    <th class='text-end'>Debit</th>
                    <th class='text-end'>Credit</th>
                    <th class='text-end'>Balance</th>
                </tr>
            </thead>
            <tbody>";
        
        foreach ($transactions as $txn) {
            $isDebit = $txn['type'] === 'purchase';
            $badgeClass = $isDebit ? 'bg-danger' : 'bg-success';
            
            $html .= "
                <tr>
                    <td>" . date('M j, Y', strtotime($txn['date'])) . "</td>
                    <td><span class='badge {$badgeClass}'>" . ucfirst($txn['type']) . "</span></td>
                    <td>" . htmlspecialchars($txn['reference'] ?? '') . "</td>
                    <td class='text-end'>" . ($isDebit ? "₦" . number_format($txn['amount'] ?? 0, 2) : '') . "</td>
                    <td class='text-end'>" . (!$isDebit ? "₦" . number_format($txn['amount'] ?? 0, 2) : '') . "</td>
                    <td class='text-end'><strong>₦" . number_format($txn['running_balance'] ?? 0, 2) . "</strong></td>
                </tr>";
        }
        
        $html .= "
            </tbody>
        </table>";
    } else {
        $html .= "<p class='text-center'>No transactions found for the selected period.</p>";
    }
    
    return $html;
}
?>
