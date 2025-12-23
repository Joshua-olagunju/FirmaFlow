<?php
/**
 * Payment Handler
 * Handles all payment-related intents
 */

function handlePaymentsIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    switch ($intent) {
        case 'view_pending_invoices':
            return queryPendingInvoices($pdo, $companyId, $data);
            
        case 'view_pending_supplier_bills':
            return queryPendingSupplierBills($pdo, $companyId, $data);
            
        case 'approve_supplier_payment':
            return approveSupplierPaymentAction($data, $pdo, $companyId);
            
        case 'view_transaction_history':
            return queryPayments($pdo, $companyId, $data);
            
        default:
            return formatErrorResponse('Unknown payment intent: ' . $intent);
    }
}

/**
 * Approve supplier payment
 */
function approveSupplierPaymentAction($data, $pdo, $companyId) {
    try {
        // Validate required fields
        $purchaseId = $data['purchase_id'] ?? null;
        $purchaseNumber = $data['purchase_number'] ?? null;
        $amount = $data['amount'] ?? null;
        
        if (!$purchaseId && !$purchaseNumber) {
            return formatErrorResponse('Purchase ID or number is required', 'VALIDATION_ERROR');
        }
        
        // Find purchase order
        if ($purchaseNumber && !$purchaseId) {
            $stmt = $pdo->prepare("
                SELECT id, purchase_number, total, status, supplier_id 
                FROM purchases 
                WHERE company_id = ? AND purchase_number = ?
            ");
            $stmt->execute([$companyId, $purchaseNumber]);
            $purchase = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$purchase) {
                return formatErrorResponse("Purchase order '{$purchaseNumber}' not found", 'NOT_FOUND');
            }
            $purchaseId = $purchase['id'];
        } else {
            $stmt = $pdo->prepare("
                SELECT id, purchase_number, total, status, supplier_id 
                FROM purchases 
                WHERE id = ? AND company_id = ?
            ");
            $stmt->execute([$purchaseId, $companyId]);
            $purchase = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$purchase) {
                return formatErrorResponse('Purchase order not found', 'NOT_FOUND');
            }
        }
        
        // Get supplier info
        $stmt = $pdo->prepare("SELECT name FROM suppliers WHERE id = ?");
        $stmt->execute([$purchase['supplier_id']]);
        $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // If amount not provided, use full purchase amount
        if (!$amount) {
            $amount = $purchase['total'];
        }
        
        if ($amount <= 0) {
            return formatErrorResponse('Payment amount must be greater than 0', 'VALIDATION_ERROR');
        }
        
        // Check total paid so far
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(amount), 0) as total_paid 
            FROM supplier_payments 
            WHERE purchase_id = ?
        ");
        $stmt->execute([$purchaseId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalPaid = $result['total_paid'];
        $remaining = $purchase['total'] - $totalPaid;
        
        if ($amount > $remaining) {
            return formatErrorResponse(
                "Payment amount (" . formatCurrency($amount) . ") exceeds remaining balance (" . formatCurrency($remaining) . ")",
                'VALIDATION_ERROR'
            );
        }
        
        $pdo->beginTransaction();
        
        // Record supplier payment
        $paymentMethod = $data['payment_method'] ?? 'bank_transfer';
        $reference = $data['reference'] ?? 'SUP-PAY-' . date('YmdHis');
        $paymentDate = $data['payment_date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            INSERT INTO supplier_payments 
            (company_id, purchase_id, supplier_id, amount, payment_method, payment_date, reference, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW())
        ");
        
        $stmt->execute([
            $companyId,
            $purchaseId,
            $purchase['supplier_id'],
            $amount,
            $paymentMethod,
            $paymentDate,
            $reference,
            $data['notes'] ?? 'Payment approved via AI Assistant'
        ]);
        
        $paymentId = $pdo->lastInsertId();
        
        // Update purchase status
        $newTotalPaid = $totalPaid + $amount;
        $newStatus = ($newTotalPaid >= $purchase['total']) ? 'paid' : 'partially_paid';
        
        $stmt = $pdo->prepare("
            UPDATE purchases 
            SET payment_status = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$newStatus, $purchaseId]);
        
        $pdo->commit();
        
        $statusMessage = $newStatus === 'paid' ? '✅ Fully Paid!' : '⚠️ Partially Paid';
        $remainingNew = $purchase['total'] - $newTotalPaid;
        
        return formatSuccessResponse(
            "✅ Supplier payment approved!\n🏢 Supplier: {$supplier['name']}\n📄 PO: {$purchase['purchase_number']}\n💵 Amount: " . formatCurrency($amount) . "\n📊 Status: {$statusMessage}" .
            ($remainingNew > 0 ? "\n⏳ Remaining: " . formatCurrency($remainingNew) : ''),
            [
                'payment_id' => $paymentId,
                'purchase_id' => $purchaseId,
                'purchase_number' => $purchase['purchase_number'],
                'supplier' => $supplier['name'],
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
        return formatErrorResponse('Failed to approve payment: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Query pending supplier bills
 */
function queryPendingSupplierBills($pdo, $companyId, $filters) {
    try {
        $limit = $filters['limit'] ?? 10;
        
        $stmt = $pdo->prepare("
            SELECT 
                p.purchase_number,
                p.purchase_date,
                p.total_amount,
                p.status,
                s.name as supplier_name
            FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.company_id = ? AND p.status IN ('pending', 'partially_paid')
            ORDER BY p.purchase_date ASC
            LIMIT ?
        ");
        $stmt->execute([$companyId, $limit]);
        $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($pending)) {
            return formatSuccessResponse("✅ No pending supplier bills!", ['pending_bills' => []]);
        }
        
        $totalUnpaid = array_sum(array_column($pending, 'total_amount'));
        
        $answer = "💳 **Pending Supplier Bills:**\n\n";
        foreach ($pending as $bill) {
            $answer .= "• **{$bill['purchase_number']}** - {$bill['supplier_name']}\n";
            $answer .= "  Amount: " . formatCurrency($bill['total_amount']) . "\n";
            $answer .= "  Status: {$bill['status']}\n\n";
        }
        $answer .= "**Total Unpaid:** " . formatCurrency($totalUnpaid);
        
        return formatSuccessResponse($answer, ['pending_bills' => $pending, 'total_unpaid' => $totalUnpaid]);
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to query supplier bills: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Query payment history
 */
function queryPayments($pdo, $companyId, $filters) {
    try {
        $limit = $filters['limit'] ?? 20;
        $type = $filters['type'] ?? 'all'; // 'all', 'customer', 'supplier'
        
        $conditions = ["p.company_id = ?"];
        $params = [$companyId];
        
        // Date range filter
        if (!empty($filters['date_range'])) {
            $dateRange = parseDateRange($filters['date_range']);
            $conditions[] = "p.payment_date >= ?";
            $conditions[] = "p.payment_date <= ?";
            $params[] = $dateRange['start'];
            $params[] = $dateRange['end'];
        }
        
        // Payment method filter
        if (!empty($filters['payment_method'])) {
            $conditions[] = "p.payment_method = ?";
            $params[] = $filters['payment_method'];
        }
        
        $payments = [];
        
        // Query customer payments
        if ($type === 'all' || $type === 'customer') {
            $sql = "
                SELECT 
                    p.id,
                    p.amount,
                    p.payment_method,
                    p.payment_date,
                    p.reference,
                    'customer' as payment_type,
                    c.name as party_name,
                    si.invoice_no as document_number
                FROM payments p
                LEFT JOIN sales_invoices si ON p.invoice_id = si.id
                LEFT JOIN customers c ON si.customer_id = c.id
                WHERE " . implode(' AND ', $conditions) . "
                ORDER BY p.payment_date DESC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $customerPayments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $payments = array_merge($payments, $customerPayments);
        }
        
        // Query supplier payments
        if ($type === 'all' || $type === 'supplier') {
            $conditions[0] = "sp.company_id = ?";
            $sql = "
                SELECT 
                    sp.id,
                    sp.amount,
                    sp.payment_method,
                    sp.payment_date,
                    sp.reference,
                    'supplier' as payment_type,
                    s.name as party_name,
                    pur.purchase_number as document_number
                FROM supplier_payments sp
                LEFT JOIN purchases pur ON sp.purchase_id = pur.id
                LEFT JOIN suppliers s ON sp.supplier_id = s.id
                WHERE " . implode(' AND ', $conditions) . "
                ORDER BY sp.payment_date DESC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $supplierPayments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $payments = array_merge($payments, $supplierPayments);
        }
        
        // Sort by date and limit
        usort($payments, function($a, $b) {
            return strtotime($b['payment_date']) - strtotime($a['payment_date']);
        });
        $payments = array_slice($payments, 0, $limit);
        
        if (empty($payments)) {
            return formatSuccessResponse("No payment transactions found.", ['payments' => []]);
        }
        
        // Calculate totals
        $totalAmount = array_sum(array_column($payments, 'amount'));
        $customerTotal = array_sum(array_map(function($p) {
            return $p['payment_type'] === 'customer' ? $p['amount'] : 0;
        }, $payments));
        $supplierTotal = array_sum(array_map(function($p) {
            return $p['payment_type'] === 'supplier' ? $p['amount'] : 0;
        }, $payments));
        
        $answer = "💳 **Payment Transaction History:**\n\n";
        
        foreach ($payments as $payment) {
            $icon = $payment['payment_type'] === 'customer' ? '📥' : '📤';
            $answer .= "{$icon} **{$payment['document_number']}** - {$payment['party_name']}\n";
            $answer .= "   Amount: " . formatCurrency($payment['amount']) . " ({$payment['payment_method']})\n";
            $answer .= "   Date: {$payment['payment_date']}\n";
            $answer .= "   Ref: {$payment['reference']}\n\n";
        }
        
        $answer .= "**Summary:**\n";
        $answer .= "📥 Customer Payments: " . formatCurrency($customerTotal) . "\n";
        $answer .= "📤 Supplier Payments: " . formatCurrency($supplierTotal) . "\n";
        $answer .= "💰 Total: " . formatCurrency($totalAmount);
        
        return formatSuccessResponse($answer, [
            'payments' => $payments,
            'total_amount' => $totalAmount,
            'customer_total' => $customerTotal,
            'supplier_total' => $supplierTotal,
            'count' => count($payments)
        ]);
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to query payment history: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}
