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
require_once __DIR__ . '/journal_helpers.php';
require_once __DIR__ . '/../includes/AccountResolver.php';
require_once __DIR__ . '/journal_helpers.php';
require_once __DIR__ . '/../includes/company_settings_helper.php';
require_once __DIR__ . '/../includes/AccountResolver.php';

// Check authentication
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

$company_id = $_SESSION['company_id'];
$userRole = $_SESSION['user_role'] ?? $_SESSION['role'] ?? 'user';
$isAdmin = ($userRole === 'admin');
$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            // Get single payment
            $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ? AND company_id = ?");
            $stmt->execute([$_GET['id'], $company_id]);
            $payment = $stmt->fetch();
            
            if ($payment) {
                // Get stored payment items
                $stmt = $pdo->prepare("SELECT * FROM payment_items WHERE payment_id = ? ORDER BY id");
                $stmt->execute([$_GET['id']]);
                $payment['stored_items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get related entity name
                if ($payment['reference_type'] === 'customer') {
                    $stmt = $pdo->prepare("SELECT name FROM customers WHERE id = ?");
                    $stmt->execute([$payment['reference_id']]);
                    $entity = $stmt->fetch();
                    $payment['entity_name'] = $entity ? $entity['name'] : '';
                } elseif ($payment['reference_type'] === 'supplier') {
                    $stmt = $pdo->prepare("SELECT name FROM suppliers WHERE id = ?");
                    $stmt->execute([$payment['reference_id']]);
                    $entity = $stmt->fetch();
                    $payment['entity_name'] = $entity ? $entity['name'] : '';
                }
            }
            
            echo json_encode($payment ?: []);
        } else {
            // Get all payments
            $reference_type = $_GET['reference_type'] ?? '';
            $search = $_GET['search'] ?? '';
            
            $sql = "
                SELECT p.*,
                       CASE 
                           WHEN p.reference_type = 'customer' THEN c.name
                           WHEN p.reference_type = 'supplier' THEN s.name
                           ELSE ''
                       END as entity_name
                FROM payments p
                LEFT JOIN customers c ON p.reference_type = 'customer' AND p.reference_id = c.id
                LEFT JOIN suppliers s ON p.reference_type = 'supplier' AND p.reference_id = s.id
                WHERE p.company_id = ?
            ";
            
            $params = [$company_id];
            
            if ($reference_type) {
                $sql .= " AND p.reference_type = ?";
                $params[] = $reference_type;
            }
            
            if (!empty($search)) {
                $sql .= " AND (c.name LIKE ? OR s.name LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            // Filter supplier payments - only admin can see them
            if (!$isAdmin) {
                $sql .= " AND p.reference_type != 'supplier'";
            }
            
            $sql .= " ORDER BY p.payment_date DESC, p.id DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $payments = $stmt->fetchAll();
            
            echo json_encode($payments);
        }
    } else if ($method === 'POST') {
        // Handle refund action
        if (isset($_GET['action']) && $_GET['action'] === 'refund') {
            $invoice_id = $input['invoice_id'] ?? 0;
            $refund_amount = floatval($input['amount'] ?? 0);
            $reason = $input['reason'] ?? '';
            $is_full_refund = $input['is_full_refund'] ?? false;
            
            if ($refund_amount <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Refund amount must be greater than 0']);
                exit;
            }
            
            if (!$invoice_id) {
                http_response_code(400);
                echo json_encode(['error' => 'Invoice ID is required']);
                exit;
            }
            
            // Get invoice details
            $stmt = $pdo->prepare("SELECT * FROM sales_invoices WHERE id = ? AND company_id = ?");
            $stmt->execute([$invoice_id, $company_id]);
            $invoice = $stmt->fetch();
            
            if (!$invoice) {
                http_response_code(404);
                echo json_encode(['error' => 'Invoice not found']);
                exit;
            }
            
            $amount_paid = floatval($invoice['amount_paid']);
            
            if ($refund_amount > $amount_paid) {
                http_response_code(400);
                echo json_encode(['error' => 'Refund amount cannot exceed paid amount']);
                exit;
            }
            
            $pdo->beginTransaction();
            
            try {
                // Generate refund reference
                $stmt = $pdo->prepare("SELECT COALESCE(MAX(CAST(SUBSTRING(reference, 4) AS UNSIGNED)), 0) + 1 as next_number FROM payments WHERE company_id = ? AND reference LIKE 'REF%'");
                $stmt->execute([$company_id]);
                $next_number = $stmt->fetch()['next_number'];
                $reference = 'REF' . str_pad($next_number, 4, '0', STR_PAD_LEFT);
                
                // Create refund payment record
                $stmt = $pdo->prepare("
                    INSERT INTO payments (company_id, reference, reference_type, reference_id, type, party_type, party_id, amount, method, payment_date, status, notes, created_at, updated_at) 
                    VALUES (?, ?, 'customer', ?, 'refund', 'customer', ?, ?, 'refund', NOW(), 'completed', ?, NOW(), NOW())
                ");
                $stmt->execute([
                    $company_id,
                    $reference,
                    $invoice['customer_id'],
                    $invoice['customer_id'],
                    $refund_amount,
                    "Refund for Invoice #{$invoice['invoice_no']}" . ($reason ? " - Reason: $reason" : "")
                ]);
                
                $refund_id = $pdo->lastInsertId();
                
                // Update invoice - reduce amount_paid
                $new_amount_paid = $amount_paid - $refund_amount;
                $new_status = $new_amount_paid <= 0 ? 'unpaid' : ($new_amount_paid >= floatval($invoice['total']) ? 'paid' : 'partial');
                
                $stmt = $pdo->prepare("UPDATE sales_invoices SET amount_paid = ?, status = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$new_amount_paid, $new_status, $invoice_id]);
                
                // Update original payment status if full refund
                if ($is_full_refund || $refund_amount >= $amount_paid) {
                    // Find and update original payments for this invoice
                    $stmt = $pdo->prepare("
                        UPDATE payments 
                        SET status = 'refunded', updated_at = NOW() 
                        WHERE company_id = ? AND reference_type = 'customer' AND type = 'received'
                        AND notes LIKE ?
                    ");
                    $stmt->execute([$company_id, "%Invoice: {$invoice['invoice_no']}%"]);
                }
                
                // CREATE JOURNAL ENTRY FOR REFUND (Reverses the payment)
                try {
                    $resolver = new AccountResolver($pdo, $company_id);
                    $cash_account_id = $resolver->cash();
                    $ar_account_id = $resolver->ar();
                    
                    if ($cash_account_id && $ar_account_id) {
                        $journal_lines = [
                            [
                                'account_id' => $ar_account_id,
                                'debit' => $refund_amount,  // DEBIT Accounts Receivable (increases what customer owes)
                                'credit' => 0
                            ],
                            [
                                'account_id' => $cash_account_id,
                                'debit' => 0,
                                'credit' => $refund_amount  // CREDIT Cash (decreases cash - money going out)
                            ]
                        ];
                        
                        createAutomaticJournalEntry(
                            $pdo,
                            $company_id,
                            'payment_refund',
                            $refund_id,
                            "Refund for Invoice #{$invoice['invoice_no']}" . ($reason ? " - $reason" : ""),
                            $journal_lines,
                            date('Y-m-d')
                        );
                        
                        error_log("✅ Refund journal entry created for Invoice #{$invoice['invoice_no']}, Amount: ₦$refund_amount");
                    }
                } catch (Exception $je) {
                    error_log("⚠️ Failed to create journal entry for refund: " . $je->getMessage());
                    // Don't fail the refund if journal entry fails
                }
                
                $pdo->commit();
                
                echo json_encode([
                    'success' => true,
                    'id' => $refund_id,
                    'reference' => $reference,
                    'message' => 'Refund processed successfully'
                ]);
                exit;
                
            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500);
                echo json_encode(['error' => 'Failed to process refund: ' . $e->getMessage()]);
                exit;
            }
        }
        
        // Handle both JSON and form data (for file uploads)
        if (isset($_POST['reference_type'])) {
            // Form data with potential file upload
            $reference_type = $_POST['reference_type'] ?? '';
            $reference_id = $_POST['reference_id'] ?? null;
            $amount = round(floatval($_POST['amount'] ?? 0), 2);
            $payment_method = $_POST['payment_method'] ?? 'cash';
            $payment_date = $_POST['payment_date'] ?? date('Y-m-d');
            $notes = $_POST['notes'] ?? '';
            $invoice_id = $_POST['invoice_id'] ?? null;
            $bill_id = $_POST['bill_id'] ?? null;
            $reference = $_POST['reference'] ?? null;
        } else {
            // JSON data (backward compatibility)
            $reference_type = $input['reference_type'] ?? '';
            $reference_id = $input['reference_id'] ?? null;
            $amount = round(floatval($input['amount'] ?? 0), 2);
            $payment_method = $input['payment_method'] ?? 'cash';
            $payment_date = $input['payment_date'] ?? date('Y-m-d');
            $notes = $input['notes'] ?? '';
            $invoice_id = $input['invoice_id'] ?? null;
            $bill_id = $input['bill_id'] ?? null;
            $reference = $input['reference'] ?? null;
        }

        // Handle receipt file upload
        $receipt_path = null;
        if (isset($_FILES['receipt']) && $_FILES['receipt']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = __DIR__ . '/../uploads/receipts/';
            
            // Create upload directory if it doesn't exist
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }
            
            $file = $_FILES['receipt'];
            $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowed_extensions = ['jpg', 'jpeg', 'png', 'pdf'];
            
            // Validate file type
            if (!in_array($file_extension, $allowed_extensions)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid file type. Only JPG, PNG, and PDF files are allowed.']);
                exit;
            }
            
            // Validate file size (5MB limit)
            if ($file['size'] > 5 * 1024 * 1024) {
                http_response_code(400);
                echo json_encode(['error' => 'File size too large. Maximum size is 5MB.']);
                exit;
            }
            
            // Generate unique filename
            $timestamp = time();
            $random = bin2hex(random_bytes(8));
            $new_filename = "receipt_{$timestamp}_{$random}.{$file_extension}";
            $upload_path = $upload_dir . $new_filename;
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $upload_path)) {
                $receipt_path = "uploads/receipts/{$new_filename}";
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to upload receipt file.']);
                exit;
            }
        }

        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Amount must be greater than 0']);
            exit;
        }

        $pdo->beginTransaction();

        try {
            // Generate payment reference if not provided
            if (!$reference) {
                $stmt = $pdo->prepare("SELECT COALESCE(MAX(CAST(SUBSTRING(reference, 4) AS UNSIGNED)), 0) + 1 as next_number FROM payments WHERE company_id = ?");
                $stmt->execute([$company_id]);
                $next_number = $stmt->fetch()['next_number'];
                $reference = 'PAY' . str_pad($next_number, 4, '0', STR_PAD_LEFT);
            }

            // Calculate balance at time of payment for permanent storage
            $payment_type = ($reference_type === 'customer') ? 'received' : 'sent';
            $balance_before = 0;
            $balance_after = 0;
            $invoice_total = 0;
            $invoice_number = '';
            
            if ($invoice_id && $reference_type === 'customer') {
                // Get invoice details to calculate balance
                $stmt = $pdo->prepare("SELECT total, amount_paid, invoice_no FROM sales_invoices WHERE id = ?");
                $stmt->execute([$invoice_id]);
                $invoice = $stmt->fetch();
                
                if ($invoice) {
                    $invoice_total = floatval($invoice['total']);
                    $current_paid = floatval($invoice['amount_paid']);
                    $balance_before = $invoice_total - $current_paid;
                    $balance_after = $balance_before - $amount;
                    $invoice_number = $invoice['invoice_no'];
                }
            }
            
            // Insert payment with balance information stored permanently
            $stmt = $pdo->prepare("
                INSERT INTO payments (company_id, reference, reference_type, reference_id, type, party_type, party_id, amount, method, payment_date, status, notes, receipt_path, invoice_total, balance_before, balance_after, invoice_number, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$company_id, $reference, $reference_type, $reference_id, $payment_type, $reference_type, $reference_id, $amount, $payment_method, $payment_date, $notes, $receipt_path, $invoice_total, $balance_before, $balance_after, $invoice_number]);
            
            $payment_id = $pdo->lastInsertId();
            
            // Create journal entry for payment according to accounting principles
            try {
                $resolver = new AccountResolver($pdo, $company_id);
                $cash_account_id = $resolver->cash(false); // Use existing account
                
                if ($payment_type === 'received' && $reference_type === 'customer') {
                    // Customer payment received: Dr. Cash, Cr. Accounts Receivable
                    $ar_account_id = $resolver->ar(false); // Use existing account
                    
                    if ($cash_account_id && $ar_account_id) {
                        $journal_lines = [
                            [
                                'account_id' => $cash_account_id,
                                'debit' => $amount,
                                'credit' => 0
                            ],
                            [
                                'account_id' => $ar_account_id,
                                'debit' => 0,
                                'credit' => $amount
                            ]
                        ];
                        
                        $journal_description = "Customer payment received - Reference: $reference";
                        if ($invoice_number) {
                            $journal_description .= " (Invoice: $invoice_number)";
                        }
                        
                        $journal_entry_id = createAutomaticJournalEntry(
                            $pdo,
                            $company_id,
                            'payment',
                            $payment_id,
                            $journal_description,
                            $journal_lines,
                            $payment_date
                        );
                        
                        error_log("✅ Customer payment journal entry created (ID: $journal_entry_id): Dr. Cash $amount, Cr. AR $amount for Payment $reference");
                    } else {
                        error_log("❌ Cannot create customer payment journal: Cash account ($cash_account_id) or AR account ($ar_account_id) not found");
                    }
                } elseif ($payment_type === 'made' && $reference_type === 'supplier') {
                    // Supplier payment made: Dr. Accounts Payable, Cr. Cash
                    $ap_account_id = $resolver->ap(false); // Use existing account
                    
                    if ($cash_account_id && $ap_account_id) {
                        $journal_lines = [
                            [
                                'account_id' => $ap_account_id,
                                'debit' => $amount,
                                'credit' => 0
                            ],
                            [
                                'account_id' => $cash_account_id,
                                'debit' => 0,
                                'credit' => $amount
                            ]
                        ];
                        
                        $journal_description = "Supplier payment made - Reference: $reference";
                        
                        $journal_entry_id = createAutomaticJournalEntry(
                            $pdo,
                            $company_id,
                            'payment',
                            $payment_id,
                            $journal_description,
                            $journal_lines,
                            $payment_date
                        );
                        
                        error_log("✅ Supplier payment journal entry created (ID: $journal_entry_id): Dr. AP $amount, Cr. Cash $amount for Payment $reference");
                    } else {
                        error_log("❌ Cannot create supplier payment journal: Cash account ($cash_account_id) or AP account ($ap_account_id) not found");
                    }
                } else {
                    error_log("ℹ️ No journal entry created for payment type: $payment_type, reference type: $reference_type");
                }
            } catch (Exception $journal_error) {
                error_log("❌ Payment journal entry failed for Payment $reference: " . $journal_error->getMessage());
                // Continue with payment processing even if journal entry fails
            }

            // Update related purchase bill when supplier payment is made
            if ($bill_id && $reference_type === 'supplier') {
                // Get current purchase bill details
                $stmt = $pdo->prepare("SELECT total, amount_paid, status FROM purchase_bills WHERE id = ? AND company_id = ?");
                $stmt->execute([$bill_id, $company_id]);
                $bill = $stmt->fetch();
                
                if ($bill) {
                    $total = round(floatval($bill['total']), 2);
                    $currentPaid = round(floatval($bill['amount_paid']), 2);
                    $newAmountPaid = round($currentPaid + $amount, 2);
                    
                    // Calculate remaining balance
                    $balance = round($total - $newAmountPaid, 2);
                    
                    // If balance is very small (less than 1 cent), snap to exact total
                    if (abs($balance) < 0.01) {
                        $newAmountPaid = $total;
                        $balance = 0;
                    }
                    
                    // Prevent overpayment
                    if ($newAmountPaid > $total) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Payment amount exceeds purchase bill balance']);
                        exit;
                    }
                    
                    // Update purchase bill amount_paid
                    $stmt = $pdo->prepare("UPDATE purchase_bills SET amount_paid = ? WHERE id = ?");
                    $stmt->execute([$newAmountPaid, $bill_id]);
                    
                    // Update purchase bill status
                    if ($balance < 0.01) {
                        $newStatus = 'paid';
                    } elseif ($newAmountPaid > 0) {
                        $newStatus = 'partially_paid';
                    } else {
                        $newStatus = 'received';
                    }
                    
                    $stmt = $pdo->prepare("UPDATE purchase_bills SET status = ? WHERE id = ?");
                    $stmt->execute([$newStatus, $bill_id]);
                    
                    error_log("✅ Purchase bill updated: ID $bill_id, Amount Paid: $newAmountPaid, Status: $newStatus, Balance: $balance");
                } else {
                    error_log("❌ Purchase bill not found: ID $bill_id for company $company_id");
                }
            }
            
            // Update related invoice first (before storing items)
            if ($invoice_id && $reference_type === 'customer') {
                // Get current invoice details
                $stmt = $pdo->prepare("SELECT total, amount_paid, status FROM sales_invoices WHERE id = ?");
                $stmt->execute([$invoice_id]);
                $invoice = $stmt->fetch();
                
                if ($invoice) {
                    $total = round(floatval($invoice['total']), 2);
                    $currentPaid = round(floatval($invoice['amount_paid']), 2);
                    $newAmountPaid = round($currentPaid + $amount, 2);
                    
                    // Calculate remaining balance
                    $balance = round($total - $newAmountPaid, 2);
                    
                    // If balance is very small (less than 1 cent), snap to exact total
                    if (abs($balance) < 0.01) {
                        $newAmountPaid = $total;
                        $balance = 0;
                    }
                    
                    // Prevent overpayment
                    if ($newAmountPaid > $total) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Payment amount exceeds invoice balance']);
                        exit;
                    }
                    
                    // Update invoice amount_paid
                    $stmt = $pdo->prepare("UPDATE sales_invoices SET amount_paid = ? WHERE id = ?");
                    $stmt->execute([$newAmountPaid, $invoice_id]);
                    
                    // Update invoice status
                    if ($balance < 0.01) {
                        $newStatus = 'paid';
                    } elseif ($newAmountPaid > 0) {
                        $newStatus = 'partially_paid';
                    } else {
                        $newStatus = 'pending';
                    }
                    
                    $stmt = $pdo->prepare("UPDATE sales_invoices SET status = ? WHERE id = ?");
                    $stmt->execute([$newStatus, $invoice_id]);
                }
            }
            
            // Store invoice items permanently with this payment
            if ($invoice_id && $reference_type === 'customer' && $invoice_total > 0) {
                // Get invoice items/lines to store permanently
                $stmt = $pdo->prepare("
                    SELECT sil.*, p.name as product_name,
                           sil.description as description,
                           sil.quantity as quantity,
                           sil.unit_price as unit_price
                    FROM sales_invoice_lines sil 
                    LEFT JOIN products p ON sil.product_id = p.id
                    WHERE sil.invoice_id = ?
                ");
                $stmt->execute([$invoice_id]);
                $invoice_lines = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Store each item permanently
                foreach ($invoice_lines as $line) {
                    $product_name = $line['product_name'] ?: ($line['description'] ?: 'Product');
                    $description = $line['description'] ?: $line['product_name'];
                    $quantity = floatval($line['quantity'] ?: 1);
                    $unit_price = floatval($line['unit_price'] ?: 0);
                    $total_price = $quantity * $unit_price;
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO payment_items (payment_id, company_id, product_name, description, quantity, unit_price, total_price, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    ");
                    $stmt->execute([$payment_id, $company_id, $product_name, $description, $quantity, $unit_price, $total_price]);
                }
                
                $pdo->commit();
                echo json_encode([
                    'success' => true, 
                    'message' => 'Payment recorded successfully with ' . count($invoice_lines) . ' items stored',
                    'payment_id' => $payment_id,
                    'items_stored' => count($invoice_lines)
                ]);
                exit;
            } else {
                $pdo->commit();
                echo json_encode([
                    'success' => true, 
                    'message' => 'Payment recorded successfully',
                    'payment_id' => $payment_id
                ]);
                exit;
            }
            
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
            exit;
        }
        
    } else if ($method === 'PUT') {
        $id = $input['id'] ?? 0;
        $amount = floatval($input['amount'] ?? 0);
        $payment_method = $input['payment_method'] ?? 'cash';
        $payment_date = $input['payment_date'] ?? date('Y-m-d');
        $notes = $input['notes'] ?? '';

        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Amount must be greater than 0']);
            exit;
        }

        $stmt = $pdo->prepare("
            UPDATE payments 
            SET amount = ?, method = ?, payment_date = ?, notes = ?, updated_at = NOW()
            WHERE id = ? AND company_id = ?
        ");
        $stmt->execute([$amount, $payment_method, $payment_date, $notes, $id, $company_id]);

        // Get updated payment
        $stmt = $pdo->prepare("
            SELECT p.*,
                   CASE 
                       WHEN p.reference_type = 'customer' THEN c.name
                       WHEN p.reference_type = 'supplier' THEN s.name
                       ELSE ''
                   END as entity_name
            FROM payments p
            LEFT JOIN customers c ON p.reference_type = 'customer' AND p.reference_id = c.id
            LEFT JOIN suppliers s ON p.reference_type = 'supplier' AND p.reference_id = s.id
            WHERE p.id = ? AND p.company_id = ?
        ");
        $stmt->execute([$id, $company_id]);
        $payment = $stmt->fetch();
        
        echo json_encode($payment);
        
    } else if ($method === 'DELETE') {
        $id = $_GET['id'] ?? 0;
        
        $pdo->beginTransaction();
        
        try {
            // Get payment details before deletion
            $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ? AND company_id = ?");
            $stmt->execute([$id, $company_id]);
            $payment = $stmt->fetch();
            
            if ($payment) {
                // Delete related payment items
                $stmt = $pdo->prepare("DELETE FROM payment_items WHERE payment_id = ?");
                $stmt->execute([$id]);
                
                // Delete payment
                $stmt = $pdo->prepare("DELETE FROM payments WHERE id = ? AND company_id = ?");
                $stmt->execute([$id, $company_id]);
            }
            
            $pdo->commit();
            echo json_encode(['success' => true]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
            exit;
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}