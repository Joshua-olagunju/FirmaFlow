<?php
// Start session first
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
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
            
            // Debug logging
            error_log("Payments API - Company ID: $company_id, User Role: $userRole, Is Admin: " . ($isAdmin ? 'Yes' : 'No'));
            error_log("Payments API - Found " . count($payments) . " payments");
            if (!$isAdmin) {
                error_log("Payments API - Supplier payments filtered out for non-admin user");
            }
            
            echo json_encode($payments);
        }
    } else if ($method === 'POST') {
        // Handle both JSON and form data (for file uploads)
        if (isset($_POST['reference_type'])) {
            // Form data with potential file upload
            $reference_type = $_POST['reference_type'] ?? '';
            $reference_id = $_POST['reference_id'] ?? null;
            $amount = floatval($_POST['amount'] ?? 0);
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
            $amount = floatval($input['amount'] ?? 0);
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

            // Insert payment with balance information stored at time of payment
            $payment_type = ($reference_type === 'customer') ? 'received' : 'sent';
            
            // Calculate balance at time of payment
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
            
            // Store payment with balance information
            $stmt = $pdo->prepare("
                INSERT INTO payments (company_id, reference, reference_type, reference_id, type, party_type, party_id, amount, method, payment_date, status, notes, receipt_path, invoice_total, balance_before, balance_after, invoice_number, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$company_id, $reference, $reference_type, $reference_id, $payment_type, $reference_type, $reference_id, $amount, $payment_method, $payment_date, $notes, $receipt_path, $invoice_total, $balance_before, $balance_after, $invoice_number]);
            
            $payment_id = $pdo->lastInsertId();
            
            // Update related invoice first (before storing items)
            if ($invoice_id && $reference_type === 'customer') {
                // Get current invoice details
                $stmt = $pdo->prepare("SELECT total, amount_paid, status FROM sales_invoices WHERE id = ?");
                $stmt->execute([$invoice_id]);
                $invoice = $stmt->fetch();
                
                if ($invoice) {
                    $total = floatval($invoice['total']);
                    $currentPaid = floatval($invoice['amount_paid']);
                    $newAmountPaid = $currentPaid + $amount;
                    
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
                    $newStatus = ($newAmountPaid >= $total) ? 'paid' : (($newAmountPaid > 0) ? 'partially_paid' : 'pending');
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
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Payment recorded successfully with ' . count($invoice_lines) . ' items stored',
                    'payment_id' => $payment_id,
                    'items_stored' => count($invoice_lines)
                ]);
                exit;
            } else {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Payment recorded successfully',
                    'payment_id' => $payment_id
                ]);
                exit;
            }

            // Update related invoice or bill
            if ($invoice_id && $reference_type === 'customer') {
                // Get current invoice details
                $stmt = $pdo->prepare("SELECT total, amount_paid, status FROM sales_invoices WHERE id = ?");
                $stmt->execute([$invoice_id]);
                $invoice = $stmt->fetch();
                
                if ($invoice) {
                    $total = floatval($invoice['total']);
                    $currentPaid = floatval($invoice['amount_paid']);
                    $newAmountPaid = $currentPaid + $amount;
                    
                    // Prevent overpayment
                    if ($newAmountPaid > $total) {
                        throw new Exception('Payment amount exceeds invoice balance');
                    }
                    
                    // Update amount paid
                    $stmt = $pdo->prepare("UPDATE sales_invoices SET amount_paid = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$newAmountPaid, $invoice_id]);
                    
                    // Determine and update status
                    $newStatus = 'draft'; // default
                    if ($newAmountPaid >= $total) {
                        $newStatus = 'paid';
                    } elseif ($newAmountPaid > 0) {
                        $newStatus = 'partially_paid';
                    } else {
                        // Keep current status if no payments
                        $newStatus = $invoice['status'] ?: 'draft';
                    }
                    
                    $stmt = $pdo->prepare("UPDATE sales_invoices SET status = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$newStatus, $invoice_id]);
                    
                    // Store invoice-payment link in notes for now (we can create a proper table later)
                    $notes = $notes . " [Invoice: " . $invoice_id . "]";
                    $stmt = $pdo->prepare("UPDATE payments SET notes = ? WHERE id = ?");
                    $stmt->execute([$notes, $payment_id]);
                }
            }
            
            if ($bill_id && $reference_type === 'supplier') {
                $stmt = $pdo->prepare("UPDATE purchase_bills SET amount_paid = amount_paid + ? WHERE id = ?");
                $stmt->execute([$amount, $bill_id]);
                
                // Update status if fully paid
                $stmt = $pdo->prepare("UPDATE purchase_bills SET status = 'paid' WHERE id = ? AND amount_paid >= total");
                $stmt->execute([$bill_id]);
            }

            // 🎯 Smart Defaults: Use AccountResolver for guaranteed account access
            $resolver = new AccountResolver($pdo, $company_id);
            
            // Get all required accounts using Smart Defaults
            $cashAccountId = $resolver->get('cash');
            $arAccountId = $resolver->get('ar');
            $apAccountId = $resolver->get('ap');
            $salesAccountId = $resolver->get('sales');
            
            error_log("🔥 Smart Defaults - Payment Processing:");
            error_log("Cash Account ID: $cashAccountId");
            error_log("AR Account ID: $arAccountId");
            error_log("AP Account ID: $apAccountId");
            error_log("Payment Type: $reference_type, Amount: $amount");

            if ($cashAccountId && $arAccountId) {
                $journal_lines = [];
                $entity_name = '';
                
                if ($reference_type === 'customer') {
                    // 🎯 Smart Defaults: Customer payment received
                    // Dr Cash/Bank, Cr Accounts Receivable (payment received)
                    $customerStmt = $pdo->prepare("SELECT name FROM customers WHERE id = ?");
                    $customerStmt->execute([$reference_id]);
                    $customer = $customerStmt->fetch();
                    $entity_name = $customer ? $customer['name'] : 'Customer';
                    
                    // Simple, guaranteed journal entry using Smart Defaults
                    $journal_lines = [
                        [
                            'account_id' => $cashAccountId, // Cash/Bank account (guaranteed by Smart Defaults)
                            'debit' => $amount,
                            'credit' => 0
                        ],
                        [
                            'account_id' => $arAccountId, // Accounts Receivable (guaranteed by Smart Defaults)
                            'debit' => 0,
                            'credit' => $amount
                        ]
                    ];
                    
                } elseif ($reference_type === 'supplier') {
                    // 🎯 Smart Defaults: Supplier payment sent
                    // Dr Accounts Payable, Cr Cash/Bank (payment made)
                    $supplierStmt = $pdo->prepare("SELECT name FROM suppliers WHERE id = ?");
                    $supplierStmt->execute([$reference_id]);
                    $supplier = $supplierStmt->fetch();
                    $entity_name = $supplier ? $supplier['name'] : 'Supplier';
                    
                    // Simple, guaranteed journal entry using Smart Defaults  
                    $journal_lines = [
                        [
                            'account_id' => $apAccountId, // Accounts Payable (guaranteed by Smart Defaults)
                            'debit' => $amount,
                            'credit' => 0
                        ],
                        [
                            'account_id' => $cashAccountId, // Cash/Bank account (guaranteed by Smart Defaults)
                            'debit' => 0,
                            'credit' => $amount
                        ]
                    ];
                }

                // 🚀 Smart Defaults: Create single, balanced journal entry
                if (!empty($journal_lines)) {
                    try {
                        $invoiceInfo = $invoice_id ? " for Invoice #$invoice_id" : '';
                        $billInfo = $bill_id ? " for Bill #$bill_id" : '';
                        $description = ($reference_type === 'customer') ? 
                            "Payment received from $entity_name - $reference$invoiceInfo" : 
                            "Payment made to $entity_name - $reference$billInfo";
                            
                        error_log("🎯 Smart Defaults: Creating journal entry for $reference_type payment: " . json_encode($journal_lines));
                        
                        $journalId = createAutomaticJournalEntry(
                            $pdo,
                            $company_id,
                            'payment',
                            $payment_id,
                            $description,
                            $journal_lines,
                            $payment_date
                        );
                        
                        error_log("✅ Smart Defaults: Successfully created journal entry $journalId for payment $payment_id");
                        
                    } catch (Exception $e) {
                        error_log("❌ Smart Defaults: Journal entry failed for payment $payment_id: " . $e->getMessage());
                        // Payment still succeeds, but journal entry failed
                    }
                } else {
                    error_log("⚠️ Smart Defaults: No journal entry created - required accounts not available");
                }
            }

            // Update customer balance when payment is received
            if ($reference_type === 'customer' && $reference_id) {
                $updateCustomerBalanceStmt = $pdo->prepare("
                    UPDATE customers 
                    SET balance = balance - ?, updated_at = NOW() 
                    WHERE id = ? AND company_id = ?
                ");
                $updateCustomerBalanceStmt->execute([$amount, $reference_id, $company_id]);
                
                // Log the balance update for debugging
                error_log("Payments API: Updated customer $reference_id balance by -$amount for payment $reference");
            }

            // Get payment details for dashboard notification
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
                WHERE p.id = ?
            ");
            $stmt->execute([$payment_id]);
            $payment = $stmt->fetch();

            // Send dashboard-only notification (no email)
            if ($payment) {
                require_once __DIR__ . '/../includes/notification_helpers.php';
                
                // Get invoice details if linked
                $invoice_number = '';
                if ($invoice_id && $reference_type === 'customer') {
                    $stmt = $pdo->prepare("SELECT invoice_no FROM sales_invoices WHERE id = ?");
                    $stmt->execute([$invoice_id]);
                    $invoice = $stmt->fetch();
                    $invoice_number = $invoice ? $invoice['invoice_no'] : '';
                }
                
                // Queue browser notification for dashboard only
                if ($payment_type === 'received') {
                    // Customer payment received - show in dashboard
                    queueBrowserNotification(
                        'Payment Received',
                        "Payment of ₦" . number_format($amount, 2) . " received from " . $payment['entity_name'] . ($invoice_number ? " for invoice " . $invoice_number : ''),
                        'payment',
                        [
                            'payment_id' => $payment_id,
                            'reference' => $reference,
                            'amount' => $amount,
                            'customer_name' => $payment['entity_name'],
                            'payment_method' => $payment_method,
                            'invoice_number' => $invoice_number
                        ]
                    );
                } else {
                    // Supplier payment sent - show in dashboard
                    queueBrowserNotification(
                        'Payment Sent',
                        "Payment of ₦" . number_format($amount, 2) . " sent to " . $payment['entity_name'],
                        'payment',
                        [
                            'payment_id' => $payment_id,
                            'reference' => $reference,
                            'amount' => $amount,
                            'supplier_name' => $payment['entity_name'],
                            'payment_method' => $payment_method
                        ]
                    );
                }
            }

            // Commit the transaction after all operations are complete
            $pdo->commit();

            // Return the created payment

            echo json_encode($payment);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
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
            SET amount = ?, payment_method = ?, payment_date = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$amount, $payment_method, $payment_date, $notes, $id]);

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
            WHERE p.id = ?
        ");
        $stmt->execute([$id]);
        $payment = $stmt->fetch();
        
        echo json_encode($payment);
        
    } else if ($method === 'DELETE') {
        $id = $_GET['id'] ?? 0;
        
        $pdo->beginTransaction();
        
        try {
            // Get payment details before deletion
            $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ?");
            $stmt->execute([$id]);
            $payment = $stmt->fetch();
            
            if ($payment) {
                // Reverse customer balance update when payment is deleted
                if ($payment['reference_type'] === 'customer' && $payment['reference_id']) {
                    $reverseCustomerBalanceStmt = $pdo->prepare("
                        UPDATE customers 
                        SET balance = balance + ?, updated_at = NOW() 
                        WHERE id = ? AND company_id = ?
                    ");
                    $reverseCustomerBalanceStmt->execute([$payment['amount'], $payment['reference_id'], $company_id]);
                    
                    // Log the balance reversal for debugging
                    error_log("Payments API: Reversed customer {$payment['reference_id']} balance by +{$payment['amount']} for deleted payment {$payment['reference']}");
                }
                
                // Reverse any invoice/bill payment updates
                // Note: This is simplified - in a real system you'd want more sophisticated tracking
                
                // Delete related journal entries
                $deleteJournalStmt = $pdo->prepare("DELETE FROM journal_lines WHERE journal_id IN (SELECT id FROM journal_entries WHERE reference_type = 'payment' AND reference_id = ?)");
                $deleteJournalStmt->execute([$id]);
                
                $deleteJournalEntriesStmt = $pdo->prepare("DELETE FROM journal_entries WHERE reference_type = 'payment' AND reference_id = ?");
                $deleteJournalEntriesStmt->execute([$id]);
            }
            
            // Delete payment
            $stmt = $pdo->prepare("DELETE FROM payments WHERE id = ?");
            $stmt->execute([$id]);
            
            $pdo->commit();
            echo json_encode(['success' => true]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'exception', 'message' => $e->getMessage()]);
}
?>
