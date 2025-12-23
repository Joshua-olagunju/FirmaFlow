<?php
/**
 * Sales Handler
 * Handles all sales/invoice-related intents
 */

function handleSalesIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    switch ($intent) {
        case 'create_invoice':
            return createInvoiceAction($data, $pdo, $companyId, $userId);
            
        case 'update_invoice':
            return updateInvoiceAction($data, $pdo, $companyId);
            
        case 'view_invoice':
            return viewInvoiceAction($data, $pdo, $companyId);
            
        case 'record_payment':
            return recordPaymentAction($data, $pdo, $companyId, $userId);
            
        case 'sales_summary':
            return querySalesSummary($pdo, $companyId, $data);
            
        case 'sales_analytics':
            return salesAnalyticsAction($data, $pdo, $companyId);
            
        default:
            return formatErrorResponse('Unknown sales intent: ' . $intent);
    }
}

/**
 * Create invoice (extracted from original ai_assistant.php)
 */
function createInvoiceAction($data, $pdo, $companyId, $userId) {
    try {
        // Find customer
        $customerIdentifier = $data['customer_name'] ?? $data['customer_email'] ?? null;
        if (!$customerIdentifier) {
            return formatErrorResponse('Customer name or email is required', 'VALIDATION_ERROR');
        }
        
        $customer = findCustomer($pdo, $companyId, $customerIdentifier);
        if (!$customer) {
            return formatErrorResponse("Customer '{$customerIdentifier}' not found. Create customer first.", 'NOT_FOUND');
        }
        
        $items = $data['items'] ?? [];
        if (empty($items)) {
            return formatErrorResponse('Invoice items are required', 'VALIDATION_ERROR');
        }
        
        // Calculate total
        $total = 0;
        foreach ($items as $item) {
            $quantity = $item['quantity'] ?? 1;
            $price = $item['price'] ?? 0;
            $total += ($quantity * $price);
        }
        
        // Generate invoice number
        $invoiceNumber = generateInvoiceNumber($pdo, $companyId);
        
        $invoiceDate = date('Y-m-d');
        $dueDate = $data['due_date'] ?? date('Y-m-d', strtotime('+30 days'));
        $notes = $data['notes'] ?? '';
        
        $pdo->beginTransaction();
        
        // Insert invoice
        $stmt = $pdo->prepare("
            INSERT INTO sales_invoices 
            (company_id, customer_id, invoice_no, invoice_date, due_date, subtotal, total, status, notes, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $companyId,
            $customer['id'],
            $invoiceNumber,
            $invoiceDate,
            $dueDate,
            $total,
            $total,
            $notes,
            $userId
        ]);
        
        $invoiceId = $pdo->lastInsertId();
        
        // Insert invoice items
        $stmt = $pdo->prepare("
            INSERT INTO sales_invoice_lines 
            (invoice_id, description, quantity, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($items as $item) {
            $description = $item['product_name'] ?? $item['description'] ?? 'Item';
            $quantity = $item['quantity'] ?? 1;
            $price = $item['price'] ?? 0;
            $itemTotal = $quantity * $price;
            
            $stmt->execute([
                $invoiceId,
                $description,
                $quantity,
                $price,
                $itemTotal
            ]);
        }
        
        $pdo->commit();
        
        return formatSuccessResponse(
            "✅ Invoice **{$invoiceNumber}** created!\n👤 Customer: {$customer['name']}\n💰 Total: " . formatCurrency($total) . "\n📅 Due: {$dueDate}",
            [
                'invoice_id' => $invoiceId,
                'invoice_number' => $invoiceNumber,
                'customer_name' => $customer['name'],
                'total' => $total
            ]
        );
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        return formatErrorResponse('Failed to create invoice: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Update invoice
 */
function updateInvoiceAction($data, $pdo, $companyId) {
    try {
        // Get invoice ID
        $invoiceId = $data['invoice_id'] ?? null;
        $invoiceNumber = $data['invoice_number'] ?? null;
        
        if (!$invoiceId && !$invoiceNumber) {
            return formatErrorResponse('Invoice ID or number is required', 'VALIDATION_ERROR');
        }
        
        // Find invoice
        if ($invoiceNumber && !$invoiceId) {
            $stmt = $pdo->prepare("
                SELECT id FROM sales_invoices 
                WHERE company_id = ? AND invoice_no = ?
            ");
            $stmt->execute([$companyId, $invoiceNumber]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$invoice) {
                return formatErrorResponse("Invoice '{$invoiceNumber}' not found", 'NOT_FOUND');
            }
            $invoiceId = $invoice['id'];
        }
        
        // Verify invoice belongs to company
        $stmt = $pdo->prepare("
            SELECT id, invoice_no, status FROM sales_invoices 
            WHERE id = ? AND company_id = ?
        ");
        $stmt->execute([$invoiceId, $companyId]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            return formatErrorResponse('Invoice not found', 'NOT_FOUND');
        }
        
        // Build update query dynamically
        $updates = [];
        $params = [];
        
        if (isset($data['status'])) {
            $validStatuses = ['pending', 'paid', 'partially_paid', 'overdue', 'cancelled'];
            if (!in_array($data['status'], $validStatuses)) {
                return formatErrorResponse('Invalid status. Valid: ' . implode(', ', $validStatuses), 'VALIDATION_ERROR');
            }
            $updates[] = 'status = ?';
            $params[] = $data['status'];
        }
        
        if (isset($data['due_date'])) {
            $updates[] = 'due_date = ?';
            $params[] = $data['due_date'];
        }
        
        if (isset($data['notes'])) {
            $updates[] = 'notes = ?';
            $params[] = $data['notes'];
        }
        
        if (empty($updates)) {
            return formatErrorResponse('No fields to update', 'VALIDATION_ERROR');
        }
        
        // Add updated_at
        $updates[] = 'updated_at = NOW()';
        $params[] = $invoiceId;
        $params[] = $companyId;
        
        $sql = "UPDATE sales_invoices SET " . implode(', ', $updates) . " WHERE id = ? AND company_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $updatedFields = array_keys(array_filter([
            'status' => isset($data['status']),
            'due_date' => isset($data['due_date']),
            'notes' => isset($data['notes'])
        ]));
        
        return formatSuccessResponse(
            "✅ Invoice **{$invoice['invoice_no']}** updated successfully!\nUpdated: " . implode(', ', $updatedFields),
            [
                'invoice_id' => $invoiceId,
                'invoice_number' => $invoice['invoice_no'],
                'updated_fields' => $updatedFields
            ]
        );
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to update invoice: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * View invoice details
 */
function viewInvoiceAction($data, $pdo, $companyId) {
    try {
        $invoiceId = $data['invoice_id'] ?? null;
        $invoiceNumber = $data['invoice_number'] ?? null;
        
        if (!$invoiceId && !$invoiceNumber) {
            return formatErrorResponse('Invoice ID or number is required', 'VALIDATION_ERROR');
        }
        
        // Find invoice
        if ($invoiceNumber && !$invoiceId) {
            $stmt = $pdo->prepare("
                SELECT id FROM sales_invoices 
                WHERE company_id = ? AND invoice_no = ?
            ");
            $stmt->execute([$companyId, $invoiceNumber]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$invoice) {
                return formatErrorResponse("Invoice '{$invoiceNumber}' not found", 'NOT_FOUND');
            }
            $invoiceId = $invoice['id'];
        }
        
        // Get invoice details with customer info
        $stmt = $pdo->prepare("
            SELECT 
                si.*,
                c.name as customer_name,
                c.email as customer_email,
                c.phone as customer_phone
            FROM sales_invoices si
            LEFT JOIN customers c ON si.customer_id = c.id
            WHERE si.id = ? AND si.company_id = ?
        ");
        $stmt->execute([$invoiceId, $companyId]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            return formatErrorResponse('Invoice not found', 'NOT_FOUND');
        }
        
        // Get invoice items
        $stmt = $pdo->prepare("
            SELECT * FROM sales_invoice_lines 
            WHERE invoice_id = ?
        ");
        $stmt->execute([$invoiceId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get payments
        $stmt = $pdo->prepare("
            SELECT * FROM payments 
            WHERE invoice_id = ?
            ORDER BY payment_date DESC
        ");
        $stmt->execute([$invoiceId]);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $totalPaid = array_sum(array_column($payments, 'amount'));
        $remaining = $invoice['total'] - $totalPaid;
        
        $answer = "📄 **Invoice Details: {$invoice['invoice_no']}**\n\n";
        $answer .= "👤 Customer: {$invoice['customer_name']}\n";
        $answer .= "📅 Date: {$invoice['invoice_date']}\n";
        $answer .= "📊 Status: {$invoice['status']}\n";
        $answer .= "💰 Total: " . formatCurrency($invoice['total']) . "\n";
        $answer .= "💵 Paid: " . formatCurrency($totalPaid) . "\n";
        $answer .= "⏳ Remaining: " . formatCurrency($remaining) . "\n\n";
        
        if (!empty($items)) {
            $answer .= "**Items:**\n";
            foreach ($items as $item) {
                $answer .= "• {$item['description']} - Qty: {$item['quantity']} x " . formatCurrency($item['unit_price']) . " = " . formatCurrency($item['line_total']) . "\n";
            }
        }
        
        return formatSuccessResponse($answer, [
            'invoice' => $invoice,
            'items' => $items,
            'payments' => $payments,
            'total_paid' => $totalPaid,
            'remaining' => $remaining
        ]);
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to retrieve invoice: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Record customer payment
 */
function recordPaymentAction($data, $pdo, $companyId, $userId) {
    try {
        // Validate required fields
        $invoiceId = $data['invoice_id'] ?? null;
        $invoiceNumber = $data['invoice_number'] ?? null;
        $amount = $data['amount'] ?? null;
        
        if (!$invoiceId && !$invoiceNumber) {
            return formatErrorResponse('Invoice ID or number is required', 'VALIDATION_ERROR');
        }
        
        if (!$amount || $amount <= 0) {
            return formatErrorResponse('Payment amount must be greater than 0', 'VALIDATION_ERROR');
        }
        
        // Find invoice
        if ($invoiceNumber && !$invoiceId) {
            $stmt = $pdo->prepare("
                SELECT id, invoice_no, total, status FROM sales_invoices 
                WHERE company_id = ? AND invoice_no = ?
            ");
            $stmt->execute([$companyId, $invoiceNumber]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$invoice) {
                return formatErrorResponse("Invoice '{$invoiceNumber}' not found", 'NOT_FOUND');
            }
            $invoiceId = $invoice['id'];
        } else {
            $stmt = $pdo->prepare("
                SELECT id, invoice_no, total, status FROM sales_invoices 
                WHERE id = ? AND company_id = ?
            ");
            $stmt->execute([$invoiceId, $companyId]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$invoice) {
                return formatErrorResponse('Invoice not found', 'NOT_FOUND');
            }
        }
        
        // Check if already paid
        if ($invoice['status'] === 'paid') {
            return formatErrorResponse('Invoice is already paid in full', 'CONFLICT');
        }
        
        // Calculate total paid so far
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(amount), 0) as total_paid 
            FROM payments 
            WHERE invoice_id = ?
        ");
        $stmt->execute([$invoiceId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalPaid = $result['total_paid'];
        $remaining = $invoice['total'] - $totalPaid;
        
        // Validate payment amount
        if ($amount > $remaining) {
            return formatErrorResponse(
                "Payment amount (" . formatCurrency($amount) . ") exceeds remaining balance (" . formatCurrency($remaining) . ")",
                'VALIDATION_ERROR'
            );
        }
        
        $pdo->beginTransaction();
        
        // Record payment
        $paymentMethod = $data['payment_method'] ?? 'cash';
        $reference = $data['reference'] ?? 'PAY-' . date('YmdHis');
        $paymentDate = $data['payment_date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            INSERT INTO payments 
            (company_id, invoice_id, amount, payment_method, payment_date, reference, notes, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $companyId,
            $invoiceId,
            $amount,
            $paymentMethod,
            $paymentDate,
            $reference,
            $data['notes'] ?? '',
            $userId
        ]);
        
        $paymentId = $pdo->lastInsertId();
        
        // Update invoice status
        $newTotalPaid = $totalPaid + $amount;
        $newStatus = ($newTotalPaid >= $invoice['total']) ? 'paid' : 'partially_paid';
        
        $stmt = $pdo->prepare("
            UPDATE sales_invoices 
            SET status = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$newStatus, $invoiceId]);
        
        $pdo->commit();
        
        $statusMessage = $newStatus === 'paid' ? '✅ Fully Paid!' : '⚠️ Partially Paid';
        $remainingNew = $invoice['total'] - $newTotalPaid;
        
        return formatSuccessResponse(
            "💰 Payment recorded successfully!\n📄 Invoice: {$invoice['invoice_no']}\n💵 Amount Paid: " . formatCurrency($amount) . "\n📊 Status: {$statusMessage}" . 
            ($remainingNew > 0 ? "\n⏳ Remaining: " . formatCurrency($remainingNew) : ''),
            [
                'payment_id' => $paymentId,
                'invoice_id' => $invoiceId,
                'invoice_number' => $invoice['invoice_no'],
                'amount_paid' => $amount,
                'total_paid' => $newTotalPaid,
                'remaining' => $remainingNew,
                'status' => $newStatus,
                'reference' => $reference
            ]
        );
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        return formatErrorResponse('Failed to record payment: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Sales Analytics - Advanced sales metrics and trends
 */
function salesAnalyticsAction($data, $pdo, $companyId) {
    try {
        $metric = $data['metric'] ?? 'overview';
        
        // Build date filter
        $dateFilter = "";
        $params = [$companyId];
        
        if (isset($data['date_range'])) {
            if ($data['date_range'] === 'this_month') {
                $dateFilter = "AND si.invoice_date >= DATE_FORMAT(NOW(), '%Y-%m-01')";
            } elseif ($data['date_range'] === 'last_month') {
                $dateFilter = "AND si.invoice_date >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') 
                              AND si.invoice_date < DATE_FORMAT(NOW(), '%Y-%m-01')";
            } elseif ($data['date_range'] === 'this_year') {
                $dateFilter = "AND YEAR(si.invoice_date) = YEAR(NOW())";
            } elseif ($data['date_range'] === 'last_year') {
                $dateFilter = "AND YEAR(si.invoice_date) = YEAR(NOW()) - 1";
            }
        }
        
        if ($metric === 'overview' || $metric === 'summary') {
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(DISTINCT si.id) as total_invoices,
                    SUM(si.total) as total_sales,
                    AVG(si.total) as avg_sale,
                    COALESCE(SUM(p.amount), 0) as total_payments,
                    SUM(si.total) - COALESCE(SUM(p.amount), 0) as outstanding,
                    COUNT(DISTINCT si.customer_id) as unique_customers,
                    COUNT(DISTINCT CASE WHEN si.status = 'paid' THEN si.id END) as paid_invoices,
                    COUNT(DISTINCT CASE WHEN si.status = 'partial' THEN si.id END) as partial_invoices,
                    COUNT(DISTINCT CASE WHEN si.status = 'pending' THEN si.id END) as pending_invoices
                FROM sales_invoices si
                LEFT JOIN payments p ON si.id = p.reference_id AND p.reference_type = 'sales_invoice' AND p.company_id = si.company_id
                WHERE si.company_id = ? $dateFilter
            ");
            $stmt->execute($params);
            $overview = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return formatSuccessResponse(
                "📊 **Sales Overview**",
                [
                    'overview' => $overview,
                    'date_range' => $data['date_range'] ?? 'all_time'
                ]
            );
            
        } elseif ($metric === 'trend' || $metric === 'monthly') {
            $stmt = $pdo->prepare("
                SELECT 
                    DATE_FORMAT(si.invoice_date, '%Y-%m') as month,
                    COUNT(DISTINCT si.id) as invoice_count,
                    SUM(si.total) as total_sales,
                    AVG(si.total) as avg_sale,
                    COUNT(DISTINCT si.customer_id) as unique_customers
                FROM sales_invoices si
                WHERE si.company_id = ? $dateFilter
                GROUP BY DATE_FORMAT(si.invoice_date, '%Y-%m')
                ORDER BY month DESC
                LIMIT 12
            ");
            $stmt->execute($params);
            $trend = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return formatSuccessResponse(
                "📈 **Sales Trend Analysis**",
                [
                    'trend' => $trend,
                    'date_range' => $data['date_range'] ?? 'all_time'
                ]
            );
            
        } elseif ($metric === 'payment_status') {
            $stmt = $pdo->prepare("
                SELECT 
                    si.status,
                    COUNT(si.id) as count,
                    SUM(si.total) as total_amount,
                    SUM(si.total - COALESCE(p.total_paid, 0)) as outstanding
                FROM sales_invoices si
                LEFT JOIN (
                    SELECT reference_id as sales_invoice_id, SUM(amount) as total_paid
                    FROM payments
                    WHERE company_id = ? AND reference_type = 'sales_invoice'
                    GROUP BY reference_id
                ) p ON si.id = p.sales_invoice_id
                WHERE si.company_id = ? $dateFilter
                GROUP BY si.status
            ");
            $params[] = $companyId;
            $stmt->execute($params);
            $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return formatSuccessResponse(
                "💳 **Payment Status Breakdown**",
                [
                    'statuses' => $statuses,
                    'date_range' => $data['date_range'] ?? 'all_time'
                ]
            );
        }
        
        return formatErrorResponse("Unknown metric: $metric", 'VALIDATION_ERROR');
        
    } catch (Exception $e) {
        error_log("Error getting sales analytics: " . $e->getMessage());
        return formatErrorResponse('Failed to retrieve sales analytics: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}
