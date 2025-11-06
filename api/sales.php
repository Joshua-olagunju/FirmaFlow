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
$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            // Get single invoice with customer information
            $id = intval($_GET['id']);
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid invoice ID']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                SELECT si.*, c.name as customer_name, c.email as customer_email,
                       si.invoice_no as invoice_number,
                       si.invoice_date as sale_date,
                       COALESCE(NULLIF(TRIM(CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, ''))), ''), u.name, u.email, CONCAT('User ', u.id)) as sales_rep_name,
                       u.email as sales_rep_email
                FROM sales_invoices si 
                LEFT JOIN customers c ON si.customer_id = c.id 
                LEFT JOIN users u ON si.created_by = u.id
                WHERE si.id = ? AND si.company_id = ?
            ");
            $stmt->execute([$id, $company_id]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invoice) {
                http_response_code(404);
                echo json_encode(['error' => 'Invoice not found']);
                exit;
            }
            
            // Get invoice lines with product information
            $stmt = $pdo->prepare("
                SELECT sil.*, p.name as product_name,
                       sil.description as description,
                       sil.quantity as quantity,
                       sil.unit_price as unit_price
                FROM sales_invoice_lines sil 
                LEFT JOIN products p ON sil.product_id = p.id
                WHERE sil.invoice_id = ?
            ");
            $stmt->execute([$invoice['id']]);
            $invoice['lines'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Ensure we have the expected field names for frontend and calculate balance
            $invoice['amount'] = $invoice['total'];
            $invoice['invoice_number'] = $invoice['invoice_no'];
            $invoice['product_name'] = $invoice['lines'][0]['product_name'] ?? '';
            $invoice['balance'] = floatval($invoice['total']) - floatval($invoice['amount_paid']);
            
            // Determine accurate status based on payments
            $total = floatval($invoice['total']);
            $paid = floatval($invoice['amount_paid']);
            if ($paid >= $total) {
                $invoice['status'] = 'paid';
            } elseif ($paid > 0) {
                $invoice['status'] = 'partially_paid';
            } elseif ($invoice['status'] === 'paid' && $paid == 0) {
                $invoice['status'] = 'draft'; // Reset if payment was reversed
            }
            
            echo json_encode($invoice);
        } else {
            // Get all invoices with balance and accurate status
            $search = $_GET['search'] ?? '';
            $whereClause = "WHERE si.company_id = ?";
            $params = [$company_id];
            
            if (!empty($search)) {
                $whereClause .= " AND c.name LIKE ?";
                $params[] = "%$search%";
            }
            
            $stmt = $pdo->prepare("
                SELECT si.*, c.name as customer_name,
                       si.invoice_no as invoice_number,
                       si.invoice_date as sale_date,
                       si.total as amount,
                       (si.total - si.amount_paid) as balance,
                       COALESCE(NULLIF(TRIM(CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, ''))), ''), u.name, u.email, CONCAT('User ', u.id)) as sales_rep_name,
                       u.email as sales_rep_email,
                       CASE 
                           WHEN si.amount_paid >= si.total THEN 'paid'
                           WHEN si.amount_paid > 0 THEN 'partially_paid'
                           WHEN si.due_date < CURDATE() AND si.amount_paid = 0 THEN 'overdue'
                           ELSE si.status
                       END as computed_status
                FROM sales_invoices si 
                LEFT JOIN customers c ON si.customer_id = c.id 
                LEFT JOIN users u ON si.created_by = u.id
                $whereClause 
                ORDER BY si.invoice_date DESC
            ");
            $stmt->execute($params);
            $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Update status in response
            foreach ($invoices as &$invoice) {
                $invoice['status'] = $invoice['computed_status'];
                unset($invoice['computed_status']);
            }
            
            echo json_encode($invoices);
        }
    } else if ($method === 'POST') {
        $customer_id = $input['customer_id'] ?? 0;
        $invoice_date = $input['invoice_date'] ?? date('Y-m-d');
        $due_date = $input['due_date'] ?? date('Y-m-d', strtotime('+30 days'));
        $notes = $input['notes'] ?? '';
        $items = $input['items'] ?? [];
        
        // Discount fields
        $discount_amount = floatval($input['discount_amount'] ?? 0);
        $discount_type = $input['discount_type'] ?? 'fixed'; // 'fixed' or 'percent'

        if (empty($items)) {
            http_response_code(400);
            echo json_encode(['error' => 'Items required']);
            exit;
        }

        $pdo->beginTransaction();

        try {
            // Generate invoice number (use provided one or auto-generate)
            $invoice_no = $input['invoice_number'] ?? null;
            if (!$invoice_no) {
                $stmt = $pdo->prepare("
                    SELECT COALESCE(MAX(
                        CASE 
                            WHEN invoice_no LIKE 'INV%' THEN CAST(SUBSTRING(invoice_no, 4) AS UNSIGNED)
                            ELSE 0 
                        END
                    ), 0) + 1 as next_number 
                    FROM sales_invoices 
                    WHERE company_id = ?
                ");
                $stmt->execute([$company_id]);
                $result = $stmt->fetch();
                $next_number = $result ? $result['next_number'] : 1;
                $invoice_no = 'INV' . str_pad($next_number, 3, '0', STR_PAD_LEFT);
            }

            $subtotal = 0;

            // Calculate subtotal (before discount and tax)
            foreach ($items as $item) {
                $line_total = $item['quantity'] * $item['unit_price'];
                $subtotal += $line_total;
            }
            
            // Calculate discount
            $discount_value = 0;
            if ($discount_amount > 0) {
                if ($discount_type === 'percent') {
                    $discount_value = $subtotal * ($discount_amount / 100);
                } else {
                    $discount_value = min($discount_amount, $subtotal); // Don't exceed subtotal
                }
            }
            
            // Apply discount to get discounted subtotal
            $discounted_subtotal = $subtotal - $discount_value;
            
            // Calculate tax on discounted amount
            $tax_amount = 0;
            foreach ($items as $item) {
                $line_total = $item['quantity'] * $item['unit_price'];
                // Calculate tax proportionally based on discount
                $line_discounted = $line_total * ($discounted_subtotal / $subtotal);
                $tax_amount += $line_discounted * ($item['tax_rate'] ?? 0) / 100;
            }

            $total_amount = $discounted_subtotal + $tax_amount;

            // Get customer name for journal entry
            $customerStmt = $pdo->prepare("SELECT name FROM customers WHERE id = ? AND company_id = ?");
            $customerStmt->execute([$customer_id, $company_id]);
            $customer = $customerStmt->fetch();
            $customer_name = $customer ? $customer['name'] : 'Unknown Customer';

            // Get tax_rate_id from input
            $tax_rate_id = $input['tax_rate_id'] ?? null;

            // Store final calculated amounts in database (including discount)
            $stored_tax = $tax_amount;
            $stored_total = $total_amount;

            // Insert invoice with discount data
            $stmt = $pdo->prepare("
                INSERT INTO sales_invoices (company_id, customer_id, invoice_no, invoice_date, due_date, subtotal, tax, discount_amount, discount_type, discount_value, total, amount_paid, status, notes, tax_rate_id, created_by, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'draft', ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$company_id, $customer_id, $invoice_no, $invoice_date, $due_date, $subtotal, $stored_tax, $discount_amount, $discount_type, $discount_value, $stored_total, $notes, $tax_rate_id, $_SESSION['user_id']]);
            
            $invoice_id = $pdo->lastInsertId();

            // INSERT INTO SALES TABLE FOR DAILY TRACKING (CRITICAL FOR USER DASHBOARD)
            $stmt = $pdo->prepare("
                INSERT INTO sales (company_id, customer_id, user_id, total_amount, payment_status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
            ");
            $stmt->execute([$company_id, $customer_id, $_SESSION['user_id'], $stored_total]);
            
            error_log("✅ Sales entry created for user {$_SESSION['user_id']}: Amount $stored_total, Invoice $invoice_no");

            // Insert invoice lines and update stock
            $lineStmt = $pdo->prepare("
                INSERT INTO sales_invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax, line_total, tax_rate_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");

            $updateStockStmt = $pdo->prepare("
                UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
            ");

            foreach ($items as $item) {
                $line_total = $item['quantity'] * $item['unit_price'];
                $tax_for_line = $line_total * ($item['tax_rate'] ?? 0) / 100;
                
                $lineStmt->execute([
                    $invoice_id,
                    $item['product_id'],
                    $item['description'] ?? '',
                    $item['quantity'],
                    $item['unit_price'],
                    $tax_for_line,
                    $line_total,
                    $tax_rate_id
                ]);

                // Update product stock (only if tracking inventory)
                $checkTrackStmt = $pdo->prepare("SELECT track_inventory FROM products WHERE id = ?");
                $checkTrackStmt->execute([$item['product_id']]);
                $product = $checkTrackStmt->fetch();
                
                if ($product && $product['track_inventory']) {
                    // Record stock transaction
                    $stockStmt = $pdo->prepare("
                        INSERT INTO stock_transactions (company_id, product_id, change_qty, type, reference_type, reference_id, created_at, updated_at) 
                        VALUES (?, ?, ?, 'sale', 'sales_invoice', ?, NOW(), NOW())
                    ");
                    $stockStmt->execute([
                        $company_id,
                        $item['product_id'],
                        -$item['quantity'], // Negative for sales
                        $invoice_id
                    ]);

                    // Update product stock
                    $updateStockStmt->execute([
                        $item['quantity'],
                        $item['product_id']
                    ]);
                }
            }

            // Create proper sales journal entries according to accounting principles:
            // 1. Dr. Accounts Receivable, Cr. Sales Revenue (for the sale)
            // 2. Dr. Cost of Goods Sold, Cr. Inventory (for the cost)
            $resolver = new AccountResolver($pdo, $company_id);
            $ar_account_id = $resolver->ar(false);      // Use existing account
            $sales_account_id = $resolver->sales(false); // Use existing account
            $cogs_account_id = $resolver->cogs(false);   // Use existing account
            $inventory_account_id = $resolver->inventory(false); // Use existing account
            
            if ($ar_account_id && $sales_account_id) {
                // 1. Sales Entry: Dr. Accounts Receivable, Cr. Sales Revenue
                $journal_lines = [
                    [
                        'account_id' => $ar_account_id,
                        'debit' => $total_amount,
                        'credit' => 0
                    ],
                    [
                        'account_id' => $sales_account_id,
                        'debit' => 0,
                        'credit' => $total_amount
                    ]
                ];
                
                // Create journal entry for the sale
                $journal_entry_id = createAutomaticJournalEntry(
                    $pdo,
                    $company_id,
                    'sales_invoice',
                    $invoice_id,
                    "Sales Invoice $invoice_no - Customer: " . ($customer_name ?? 'N/A'),
                    $journal_lines,
                    $invoice_date
                );
                
                if ($journal_entry_id) {
                    error_log("✅ Sales journal entry created (ID: $journal_entry_id): Dr. AR $total_amount, Cr. Sales Revenue $total_amount for Invoice $invoice_no");
                } else {
                    error_log("❌ Failed to create sales journal entry for Invoice $invoice_no");
                }
            } else {
                error_log("❌ Failed to resolve AR or Sales accounts for Invoice $invoice_no (AR: $ar_account_id, Sales: $sales_account_id)");
            }
            
            // 2. COGS Entry: Dr. Cost of Goods Sold, Cr. Inventory (for items with inventory tracking)
            if ($cogs_account_id && $inventory_account_id && !empty($items)) {
                $total_cogs = 0;
                foreach ($items as $item) {
                    if (isset($item['product_id']) && $item['product_id'] > 0) {
                        // Get product cost
                        $productStmt = $pdo->prepare("SELECT cost_price, track_inventory FROM products WHERE id = ? AND company_id = ?");
                        $productStmt->execute([$item['product_id'], $company_id]);
                        $product = $productStmt->fetch(PDO::FETCH_ASSOC);
                        
                        if ($product && $product['track_inventory']) {
                            $cost_per_unit = floatval($product['cost_price']);
                            $quantity = floatval($item['quantity']);
                            $line_cogs = $cost_per_unit * $quantity;
                            $total_cogs += $line_cogs;
                        }
                    }
                }
                
                if ($total_cogs > 0) {
                    $cogs_journal_lines = [
                        [
                            'account_id' => $cogs_account_id,
                            'debit' => $total_cogs,
                            'credit' => 0
                        ],
                        [
                            'account_id' => $inventory_account_id,
                            'debit' => 0,
                            'credit' => $total_cogs
                        ]
                    ];
                    
                    $cogs_journal_id = createAutomaticJournalEntry(
                        $pdo,
                        $company_id,
                        'sales_cogs',
                        $invoice_id,
                        "Cost of Goods Sold - Invoice $invoice_no",
                        $cogs_journal_lines,
                        $invoice_date
                    );
                    
                    if ($cogs_journal_id) {
                        error_log("✅ COGS journal entry created (ID: $cogs_journal_id): Dr. COGS $total_cogs, Cr. Inventory $total_cogs for Invoice $invoice_no");
                    } else {
                        error_log("❌ Failed to create COGS journal entry for Invoice $invoice_no");
                    }
                } else {
                    error_log("ℹ️ No COGS entry needed for Invoice $invoice_no (no inventory items or zero cost)");
                }
            } else {
                error_log("❌ Failed to resolve COGS or Inventory accounts for Invoice $invoice_no (COGS: $cogs_account_id, Inventory: $inventory_account_id)");
            }

            // Update customer balance - add the invoice total to their balance
            $updateBalanceStmt = $pdo->prepare("
                UPDATE customers 
                SET balance = balance + ?, updated_at = NOW() 
                WHERE id = ? AND company_id = ?
            ");
            $updateBalanceStmt->execute([$total_amount, $customer_id, $company_id]);
            
            // Log the balance update for debugging
            error_log("Sales API: Updated customer $customer_id balance by +$total_amount for invoice $invoice_no");

            $pdo->commit();

            // Return the created invoice with discount information from database
            $stmt = $pdo->prepare("
                SELECT si.*, c.name as customer_name,
                       si.invoice_no as invoice_number,
                       si.invoice_date as sale_date,
                       si.total as amount
                FROM sales_invoices si 
                LEFT JOIN customers c ON si.customer_id = c.id 
                WHERE si.id = ?
            ");
            $stmt->execute([$invoice_id]);
            $invoice = $stmt->fetch();
            
            // Discount information is now stored in DB and included in response
            $invoice['discounted_subtotal'] = $discounted_subtotal;
            $invoice['discounted_total'] = $total_amount; // This is the final amount after discount
            
            // Get invoice lines
            $stmt = $pdo->prepare("
                SELECT sil.*, p.name as product_name 
                FROM sales_invoice_lines sil 
                LEFT JOIN products p ON sil.product_id = p.id
                WHERE sil.invoice_id = ?
            ");
            $stmt->execute([$invoice_id]);
            $invoice['lines'] = $stmt->fetchAll();

            echo json_encode($invoice);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    } else if ($method === 'PUT') {
        $id = $input['id'] ?? 0;
        $status = $input['status'] ?? 'draft';
        
        // Update invoice status
        $stmt = $pdo->prepare("UPDATE sales_invoices SET status = ?, updated_at = NOW() WHERE id = ? AND company_id = ?");
        $stmt->execute([$status, $id, $company_id]);
        
        // Get invoice details for sales table update
        $stmt = $pdo->prepare("SELECT customer_id, total FROM sales_invoices WHERE id = ? AND company_id = ?");
        $stmt->execute([$id, $company_id]);
        $invoice = $stmt->fetch();
        
        if ($invoice) {
            // Update corresponding sales table entry status
            $newPaymentStatus = ($status === 'paid') ? 'paid' : 'pending';
            $updateSalesStmt = $pdo->prepare("
                UPDATE sales 
                SET payment_status = ?, updated_at = NOW() 
                WHERE company_id = ? AND customer_id = ? AND total_amount = ? 
                ORDER BY created_at DESC LIMIT 1
            ");
            $updateSalesStmt->execute([$newPaymentStatus, $company_id, $invoice['customer_id'], $invoice['total']]);
            
            error_log("✅ Sales payment status updated to $newPaymentStatus for invoice #$id");
        }
        
        // Get updated invoice
        $stmt = $pdo->prepare("
            SELECT si.*, c.name as customer_name,
                   si.invoice_no as invoice_number,
                   si.invoice_date as sale_date,
                   si.total as amount
            FROM sales_invoices si 
            LEFT JOIN customers c ON si.customer_id = c.id 
            WHERE si.id = ?
        ");
        $stmt->execute([$id]);
        $invoice = $stmt->fetch();
        
        echo json_encode($invoice);
        
    } else if ($method === 'PATCH') {
        // PATCH functionality temporarily disabled - reversal system not available
        http_response_code(501);
        echo json_encode(['error' => 'PATCH operations not currently supported']);
        
    } else if ($method === 'DELETE') {
        $id = $_GET['id'] ?? 0;
        
        $pdo->beginTransaction();
        
        try {
            // Get invoice details for customer balance update
            $stmt = $pdo->prepare("SELECT customer_id, total, invoice_no FROM sales_invoices WHERE id = ? AND company_id = ?");
            $stmt->execute([$id, $company_id]);
            $invoice = $stmt->fetch();
            
            if (!$invoice) {
                http_response_code(404);
                echo json_encode(['error' => 'Invoice not found']);
                exit;
            }
            
            // Get invoice lines to reverse stock
            $stmt = $pdo->prepare("SELECT * FROM sales_invoice_lines WHERE invoice_id = ?");
            $stmt->execute([$id]);
            $lines = $stmt->fetchAll();
            
            // Reverse stock quantities
            $updateStockStmt = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?");
            $deleteStockStmt = $pdo->prepare("DELETE FROM stock_transactions WHERE reference_type = 'sales_invoice' AND reference_id = ?");
            
            foreach ($lines as $line) {
                $updateStockStmt->execute([$line['quantity'], $line['product_id']]);
            }
            
            // Delete stock transactions
            $deleteStockStmt->execute([$id]);
            
            // DELETE FROM SALES TABLE (for daily tracking)
            $deleteSalesStmt = $pdo->prepare("DELETE FROM sales WHERE company_id = ? AND total_amount = ? AND customer_id = ? ORDER BY created_at DESC LIMIT 1");
            $deleteSalesStmt->execute([$company_id, $invoice['total'], $invoice['customer_id']]);
            
            error_log("✅ Sales entry deleted for invoice {$invoice['invoice_no']}: Amount {$invoice['total']}");
            
            // Delete related journal entries
            $deleteJournalStmt = $pdo->prepare("DELETE FROM journal_lines WHERE journal_id IN (SELECT id FROM journal_entries WHERE reference_type = 'sales_invoice' AND reference_id = ?)");
            $deleteJournalStmt->execute([$id]);
            
            $deleteJournalEntriesStmt = $pdo->prepare("DELETE FROM journal_entries WHERE reference_type = 'sales_invoice' AND reference_id = ?");
            $deleteJournalEntriesStmt->execute([$id]);
            
            // Delete invoice lines
            $stmt = $pdo->prepare("DELETE FROM sales_invoice_lines WHERE invoice_id = ?");
            $stmt->execute([$id]);
            
            // Delete invoice
            $stmt = $pdo->prepare("DELETE FROM sales_invoices WHERE id = ?");
            $stmt->execute([$id]);
            
            // Update customer balance - subtract the deleted invoice total from their balance
            $updateBalanceStmt = $pdo->prepare("
                UPDATE customers 
                SET balance = balance - ?, updated_at = NOW() 
                WHERE id = ? AND company_id = ?
            ");
            $updateBalanceStmt->execute([$invoice['total'], $invoice['customer_id'], $company_id]);
            
            // Log the balance update for debugging
            error_log("Sales API: Updated customer {$invoice['customer_id']} balance by -{$invoice['total']} for deleted invoice {$invoice['invoice_no']}");
            
            $pdo->commit();
            echo json_encode(['success' => true]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed. Supported: GET, POST, PUT, PATCH, DELETE']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'exception', 'message' => $e->getMessage()]);
}
