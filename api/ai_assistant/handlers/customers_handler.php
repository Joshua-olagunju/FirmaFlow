<?php
/**
 * Customer Handler - ENHANCED
 * Handles all customer-related intents
 * 
 * CAPABILITIES:
 * - create_customer: Add new customer
 * - update_customer: Modify customer details
 * - delete_customer: Remove customer (with safety checks)
 * - view_customer: Get specific customer details
 * - customer_summary: List all customers / count
 * - top_customers: Top customers by revenue/orders
 * - customer_transactions: Transaction history
 * - customer_balance: Check outstanding balance
 * - change_customer_type: Switch individual <-> business
 * - toggle_customer_status: Activate/deactivate customer
 */

function handleCustomersIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    switch ($intent) {
        case 'create_customer':
            return createCustomerAction($data, $pdo, $companyId);
            
        case 'update_customer':
            return updateCustomerAction($data, $pdo, $companyId);
            
        case 'delete_customer':
            return deleteCustomerAction($data, $pdo, $companyId);
            
        case 'view_customer':
            return viewCustomerAction($data, $pdo, $companyId);
            
        case 'customer_summary':
            return customerSummaryAction($data, $pdo, $companyId);
            
        case 'customer_details':
            return customerDetailsAction($data, $pdo, $companyId);
            
        case 'top_customers':
            return topCustomersAction($data, $pdo, $companyId);
            
        case 'customer_transactions':
            return customerTransactionsAction($data, $pdo, $companyId);
            
        case 'customer_balance':
            return customerBalanceAction($data, $pdo, $companyId);
            
        case 'change_customer_type':
            return changeCustomerTypeAction($data, $pdo, $companyId);
            
        case 'toggle_customer_status':
        case 'activate_customer':
        case 'deactivate_customer':
            return toggleCustomerStatusAction($data, $pdo, $companyId, $intent);
            
        default:
            return formatErrorResponse('Unknown customer intent: ' . $intent);
    }
}

/**
 * Create new customer
 */
function createCustomerAction($data, $pdo, $companyId) {
    try {
        // Validate required fields
        if (empty($data['name'])) {
            return formatErrorResponse('Customer name is required', 'VALIDATION_ERROR');
        }
        
        // Extract data
        $name = $data['name'];
        $phone = $data['phone'] ?? null;
        $email = $data['email'] ?? null;
        $billing_address = $data['address'] ?? null;
        $customer_type = $data['customer_type'] ?? 'individual';
        $payment_terms = $data['payment_terms'] ?? 'Net 30';
        $credit_limit = $data['credit_limit'] ?? 0;
        $is_active = 1;
        $balance = 0;
        
        // Insert customer
        $stmt = $pdo->prepare("
            INSERT INTO customers 
            (company_id, name, phone, email, billing_address, customer_type, payment_terms, credit_limit, is_active, balance, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $companyId, $name, $phone, $email, $billing_address, 
            $customer_type, $payment_terms, $credit_limit, $is_active, $balance
        ]);
        
        $customerId = $pdo->lastInsertId();
        
        // Fetch created customer
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return formatSuccessResponse(
            "✅ Customer **{$name}** created successfully!",
            $customer,
            ['customer_id' => $customerId, 'customer_name' => $name]
        );
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to create customer: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Update existing customer
 */
function updateCustomerAction($data, $pdo, $companyId) {
    try {
        $customerId = $data['customer_id'] ?? null;
        
        if (!$customerId) {
            return formatErrorResponse('Customer ID is required', 'VALIDATION_ERROR');
        }
        
        // Check if customer exists
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ? AND company_id = ?");
        $stmt->execute([$customerId, $companyId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$customer) {
            return formatErrorResponse('Customer not found', 'NOT_FOUND');
        }
        
        // Build update query dynamically based on provided fields
        $updates = [];
        $params = [];
        
        $allowedFields = ['name', 'email', 'phone', 'billing_address', 'credit_limit', 'payment_terms', 'customer_type', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                $updates[] = "{$field} = ?";
                $params[] = $data[$field];
            }
        }
        
        // Also check for 'address' mapping to 'billing_address'
        if (isset($data['address']) && $data['address'] !== '' && !isset($data['billing_address'])) {
            $updates[] = "billing_address = ?";
            $params[] = $data['address'];
        }
        
        if (empty($updates)) {
            return formatErrorResponse('No fields to update', 'VALIDATION_ERROR');
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $customerId;
        $params[] = $companyId;
        
        $sql = "UPDATE customers SET " . implode(', ', $updates) . " WHERE id = ? AND company_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Fetch updated customer
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        $updatedCustomer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return formatSuccessResponse(
            "✅ Customer **{$updatedCustomer['name']}** updated successfully!",
            $updatedCustomer
        );
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to update customer: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * View customer details
 */
function viewCustomerAction($data, $pdo, $companyId) {
    return queryCustomerDetails($pdo, $companyId, $data);
}

/**
 * Get customer summary/statistics
 */
function customerSummaryAction($data, $pdo, $companyId) {
    return queryCustomers($pdo, $companyId, $data);
}

/**
 * Get detailed customer profile with spending history
 * Handles: "tell me about X customer", "info about customer", "customer profile"
 */
function customerDetailsAction($data, $pdo, $companyId) {
    try {
        error_log("customerDetailsAction called with data: " . json_encode($data));
        
        // First try to find the customer
        $customerName = null;
        $customerId = null;
        
        // Check for customer_id directly
        if (!empty($data['customer_id'])) {
            $customerId = $data['customer_id'];
            error_log("Found customer_id: $customerId");
        }
        // Check for name variations in data
        elseif (!empty($data['name'])) {
            $customerName = $data['name'];
            error_log("Found name: $customerName");
        } elseif (!empty($data['customer_name'])) {
            $customerName = $data['customer_name'];
            error_log("Found customer_name: $customerName");
        } elseif (!empty($data['customer'])) {
            $customerName = $data['customer'];
            error_log("Found customer: $customerName");
        }
        // Parse from raw_input if available
        elseif (!empty($data['raw_input'])) {
            $raw = strtolower($data['raw_input']);
            // Remove common phrases to extract the name
            $patterns = [
                '/tell\s+me\s+about\s+/i',
                '/info\s+about\s+/i',
                '/information\s+about\s+/i',
                '/details\s+about\s+/i',
                '/details\s+of\s+/i',
                '/who\s+is\s+/i',
                '/\b(my\s+)?customer\b/i',
                '/\bcustomer\s+/i'
            ];
            $nameExtract = $data['raw_input'];
            foreach ($patterns as $pattern) {
                $nameExtract = preg_replace($pattern, '', $nameExtract);
            }
            $customerName = trim($nameExtract);
        }
        
        // If we have a customer ID, fetch directly
        if ($customerId) {
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ? AND company_id = ?");
            $stmt->execute([$customerId, $companyId]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        // Otherwise search by name
        elseif ($customerName && strlen($customerName) >= 2) {
            // Try exact match first
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE company_id = ? AND name LIKE ?");
            $stmt->execute([$companyId, "%{$customerName}%"]);
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($customers) === 1) {
                $customer = $customers[0];
            } elseif (count($customers) > 1) {
                // Multiple matches - ask for clarification
                $list = [];
                foreach ($customers as $idx => $c) {
                    $list[] = sprintf("%d. **%s** (%s)", $idx + 1, $c['name'], $c['email'] ?? 'No email');
                }
                return [
                    'status' => 'success',
                    'message' => "I found multiple customers matching '{$customerName}'. Which one do you mean?\n\n" . implode("\n", $list) . "\n\nPlease reply with the number or full name.",
                    'data' => [
                        'action' => 'select_customer',
                        'customers' => $customers,
                        'original_intent' => 'customer_details'
                    ]
                ];
            } else {
                $customer = null;
            }
        } else {
            // No customer specified - ask which customer
            return [
                'status' => 'success',
                'message' => "Which customer would you like to know about? Please provide the customer's name.",
                'data' => [
                    'needs_customer_name' => true,
                    'original_intent' => 'customer_details'
                ]
            ];
        }
        
        if (!$customer) {
            return formatErrorResponse("I couldn't find a customer named '{$customerName}'. Please check the name and try again.", 'NOT_FOUND');
        }
        
        // Now fetch comprehensive details
        $customerId = $customer['id'];
        
        // Get total sales and invoices
        $salesStmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_invoices,
                COALESCE(SUM(total), 0) as total_sales,
                COALESCE(AVG(total), 0) as avg_invoice,
                MIN(invoice_date) as first_sale,
                MAX(invoice_date) as last_sale
            FROM sales_invoices 
            WHERE customer_id = ? AND company_id = ?
        ");
        $salesStmt->execute([$customerId, $companyId]);
        $salesStats = $salesStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get total payments
        $paymentsStmt = $pdo->prepare("
            SELECT COALESCE(SUM(p.amount), 0) as total_paid
            FROM payments p
            INNER JOIN sales_invoices si ON p.reference_id = si.id AND p.reference_type = 'sales_invoice'
            WHERE si.customer_id = ? AND si.company_id = ?
        ");
        $paymentsStmt->execute([$customerId, $companyId]);
        $paymentStats = $paymentsStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get recent invoices (last 5)
        $recentStmt = $pdo->prepare("
            SELECT invoice_no, invoice_date, total, status
            FROM sales_invoices 
            WHERE customer_id = ? AND company_id = ?
            ORDER BY invoice_date DESC
            LIMIT 5
        ");
        $recentStmt->execute([$customerId, $companyId]);
        $recentInvoices = $recentStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get most purchased products
        $productsStmt = $pdo->prepare("
            SELECT p.name, SUM(sil.quantity) as total_qty, SUM(sil.line_total) as total_amount
            FROM sales_invoice_lines sil
            INNER JOIN sales_invoices si ON sil.invoice_id = si.id
            INNER JOIN products p ON sil.product_id = p.id
            WHERE si.customer_id = ? AND si.company_id = ?
            GROUP BY p.id, p.name
            ORDER BY total_amount DESC
            LIMIT 5
        ");
        $productsStmt->execute([$customerId, $companyId]);
        $topProducts = $productsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate outstanding balance
        $outstandingBalance = floatval($salesStats['total_sales']) - floatval($paymentStats['total_paid']);
        
        // Build comprehensive response
        $status = $customer['is_active'] ? '🟢 Active' : '🔴 Inactive';
        $type = ucfirst($customer['customer_type'] ?? 'individual');
        
        $message = "## 👤 Customer Profile: {$customer['name']}\n\n";
        $message .= "### Contact Information\n";
        $message .= "- **Type:** {$type} ({$status})\n";
        if (!empty($customer['email'])) {
            $message .= "- **Email:** {$customer['email']}\n";
        }
        if (!empty($customer['phone'])) {
            $message .= "- **Phone:** {$customer['phone']}\n";
        }
        if (!empty($customer['billing_address'])) {
            $message .= "- **Address:** {$customer['billing_address']}\n";
        }
        
        $message .= "\n### 💰 Financial Summary\n";
        $message .= "- **Total Purchases:** ₦" . number_format($salesStats['total_sales'], 2) . "\n";
        $message .= "- **Total Paid:** ₦" . number_format($paymentStats['total_paid'], 2) . "\n";
        $message .= "- **Outstanding Balance:** ₦" . number_format($outstandingBalance, 2) . "\n";
        $message .= "- **Number of Invoices:** {$salesStats['total_invoices']}\n";
        if ($salesStats['total_invoices'] > 0) {
            $message .= "- **Average Invoice:** ₦" . number_format($salesStats['avg_invoice'], 2) . "\n";
        }
        if ($salesStats['first_sale']) {
            $message .= "- **First Purchase:** " . date('M d, Y', strtotime($salesStats['first_sale'])) . "\n";
            $message .= "- **Last Purchase:** " . date('M d, Y', strtotime($salesStats['last_sale'])) . "\n";
        }
        
        // Add top products if available
        if (!empty($topProducts)) {
            $message .= "\n### 🛒 Top Purchased Products\n";
            foreach ($topProducts as $idx => $prod) {
                $message .= sprintf("%d. **%s** - %d units (₦%s)\n", 
                    $idx + 1, 
                    $prod['name'], 
                    $prod['total_qty'],
                    number_format($prod['total_amount'], 2)
                );
            }
        }
        
        // Add recent invoices if available
        if (!empty($recentInvoices)) {
            $message .= "\n### 📄 Recent Invoices\n";
            foreach ($recentInvoices as $inv) {
                $statusIcon = $inv['status'] === 'paid' ? '✅' : ($inv['status'] === 'partial' ? '⏳' : '⏰');
                $message .= sprintf("- %s **%s** (%s) - ₦%s %s\n",
                    $statusIcon,
                    $inv['invoice_no'],
                    date('M d, Y', strtotime($inv['invoice_date'])),
                    number_format($inv['total'], 2),
                    ucfirst($inv['status'])
                );
            }
        }
        
        return [
            'status' => 'success',
            'message' => $message,
            'data' => [
                'customer' => $customer,
                'sales_stats' => $salesStats,
                'payment_stats' => $paymentStats,
                'outstanding_balance' => $outstandingBalance,
                'recent_invoices' => $recentInvoices,
                'top_products' => $topProducts
            ]
        ];
        
    } catch (Exception $e) {
        error_log("customerDetailsAction error: " . $e->getMessage());
        return formatErrorResponse('Error fetching customer details: ' . $e->getMessage());
    }
}

/**
 * Get top customers by sales, revenue, or other metrics
 */
function topCustomersAction($data, $pdo, $companyId) {
    try {
        $limit = isset($data['limit']) ? intval($data['limit']) : 10;
        $metric = isset($data['metric']) ? $data['metric'] : 'revenue';
        
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
        
        $orderBy = "total_revenue DESC";
        if ($metric === 'sales_count') {
            $orderBy = "sales_count DESC";
        } elseif ($metric === 'avg_sale') {
            $orderBy = "avg_sale DESC";
        } elseif ($metric === 'payments') {
            $orderBy = "total_paid DESC";
        }
        
        $stmt = $pdo->prepare("
            SELECT c.id, c.name, c.email, c.phone, c.customer_type,
                COUNT(DISTINCT si.id) as sales_count,
                SUM(si.total) as total_revenue,
                AVG(si.total) as avg_sale,
                COALESCE(SUM(p.amount), 0) as total_paid,
                MAX(si.invoice_date) as last_sale_date
            FROM customers c
            INNER JOIN sales_invoices si ON c.id = si.customer_id AND si.company_id = c.company_id
            LEFT JOIN payments p ON si.id = p.reference_id AND p.reference_type = 'sales_invoice' AND p.company_id = c.company_id
            WHERE c.company_id = ? $dateFilter
            GROUP BY c.id
            ORDER BY $orderBy
            LIMIT $limit
        ");
        
        $stmt->execute($params);
        $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($customers)) {
            return formatSuccessResponse(
                "No customer sales data available for the selected period",
                []
            );
        }
        
        $metricLabel = $metric === 'sales_count' ? 'number of sales' : 
                       ($metric === 'avg_sale' ? 'average sale value' : 
                       ($metric === 'payments' ? 'total payments' : 'total revenue'));
        
        // Build detailed message with customer list
        $customerList = [];
        foreach ($customers as $idx => $cust) {
            $revenue = number_format($cust['total_revenue'], 2);
            $salesCount = $cust['sales_count'];
            $customerList[] = sprintf(
                "%d. **%s** - ₦%s (%d sale%s)",
                $idx + 1,
                $cust['name'],
                $revenue,
                $salesCount,
                $salesCount !== 1 ? 's' : ''
            );
        }
        
        $detailedMessage = sprintf(
            "🏆 Top %d customer%s by %s:\n\n%s",
            count($customers),
            count($customers) !== 1 ? 's' : '',
            $metricLabel,
            implode("\n", $customerList)
        );
        
        return formatSuccessResponse(
            $detailedMessage,
            [
                'customers' => $customers,
                'count' => count($customers),
                'metric' => $metric,
                'date_range' => $data['date_range'] ?? 'all_time'
            ]
        );
        
    } catch (Exception $e) {
        error_log("Error getting top customers: " . $e->getMessage());
        return formatErrorResponse('Failed to retrieve top customers: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Delete customer (with safety checks)
 */
function deleteCustomerAction($data, $pdo, $companyId) {
    try {
        $customerId = $data['customer_id'] ?? null;
        $customerName = $data['customer_name'] ?? null;
        
        // Find customer
        $customer = null;
        if ($customerId) {
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ? AND company_id = ?");
            $stmt->execute([$customerId, $companyId]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        } elseif ($customerName) {
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE name LIKE ? AND company_id = ? LIMIT 1");
            $stmt->execute(["%{$customerName}%", $companyId]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        if (!$customer) {
            return formatErrorResponse('Customer not found', 'NOT_FOUND');
        }
        
        // Safety check: Check for existing invoices
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM sales_invoices WHERE customer_id = ? AND company_id = ?");
        $stmt->execute([$customer['id'], $companyId]);
        $invoiceCount = $stmt->fetchColumn();
        
        if ($invoiceCount > 0) {
            return formatErrorResponse(
                "Cannot delete customer '{$customer['name']}' - they have {$invoiceCount} invoice(s). Consider deactivating instead.",
                'HAS_TRANSACTIONS'
            );
        }
        
        // Check for outstanding balance
        if (floatval($customer['balance']) > 0) {
            return formatErrorResponse(
                "Cannot delete customer '{$customer['name']}' - they have an outstanding balance of " . number_format($customer['balance'], 2),
                'HAS_BALANCE'
            );
        }
        
        // Safe to delete
        $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ? AND company_id = ?");
        $stmt->execute([$customer['id'], $companyId]);
        
        return formatSuccessResponse(
            "✅ Customer **{$customer['name']}** has been deleted.",
            ['deleted_customer' => $customer]
        );
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to delete customer: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Get customer transaction history
 */
function customerTransactionsAction($data, $pdo, $companyId) {
    try {
        $customer = findCustomerFromData($data, $pdo, $companyId);
        
        if (!$customer) {
            return formatErrorResponse('Customer not found. Please provide customer name or ID.', 'NOT_FOUND');
        }
        
        $limit = isset($data['limit']) ? intval($data['limit']) : 20;
        
        // Get invoices
        $stmt = $pdo->prepare("
            SELECT 
                si.id, si.invoice_number, si.invoice_date, si.due_date,
                si.total, si.status, si.notes,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE reference_id = si.id AND reference_type = 'sales_invoice') as paid_amount
            FROM sales_invoices si
            WHERE si.customer_id = ? AND si.company_id = ?
            ORDER BY si.invoice_date DESC
            LIMIT ?
        ");
        $stmt->execute([$customer['id'], $companyId, $limit]);
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get payments
        $stmt = $pdo->prepare("
            SELECT p.*, si.invoice_number
            FROM payments p
            INNER JOIN sales_invoices si ON p.reference_id = si.id AND p.reference_type = 'sales_invoice'
            WHERE si.customer_id = ? AND p.company_id = ?
            ORDER BY p.payment_date DESC
            LIMIT ?
        ");
        $stmt->execute([$customer['id'], $companyId, $limit]);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Build response
        $totalInvoiced = array_sum(array_column($invoices, 'total'));
        $totalPaid = array_sum(array_column($payments, 'amount'));
        
        $message = "📋 **Transaction History for {$customer['name']}**\n\n";
        $message .= "💰 **Summary:**\n";
        $message .= "• Total Invoiced: " . number_format($totalInvoiced, 2) . "\n";
        $message .= "• Total Paid: " . number_format($totalPaid, 2) . "\n";
        $message .= "• Outstanding: " . number_format($totalInvoiced - $totalPaid, 2) . "\n\n";
        
        if (!empty($invoices)) {
            $message .= "📄 **Recent Invoices:**\n";
            foreach (array_slice($invoices, 0, 5) as $inv) {
                $status = strtoupper($inv['status']);
                $message .= "• {$inv['invoice_number']} - " . number_format($inv['total'], 2) . " ({$status})\n";
            }
        }
        
        return formatSuccessResponse($message, [
            'customer' => $customer,
            'invoices' => $invoices,
            'payments' => $payments,
            'summary' => [
                'total_invoiced' => $totalInvoiced,
                'total_paid' => $totalPaid,
                'outstanding' => $totalInvoiced - $totalPaid
            ]
        ]);
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to get transactions: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Get customer balance/outstanding amount
 */
function customerBalanceAction($data, $pdo, $companyId) {
    try {
        $customer = findCustomerFromData($data, $pdo, $companyId);
        
        if (!$customer) {
            return formatErrorResponse('Customer not found. Please provide customer name or ID.', 'NOT_FOUND');
        }
        
        // Calculate outstanding balance from invoices
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(si.total), 0) as total_invoiced,
                COALESCE(SUM(CASE WHEN si.status = 'paid' THEN si.total ELSE 0 END), 0) as total_paid_invoices,
                (SELECT COALESCE(SUM(amount), 0) FROM payments p 
                 INNER JOIN sales_invoices si2 ON p.reference_id = si2.id 
                 WHERE si2.customer_id = ? AND p.reference_type = 'sales_invoice') as total_payments
            FROM sales_invoices si
            WHERE si.customer_id = ? AND si.company_id = ?
        ");
        $stmt->execute([$customer['id'], $customer['id'], $companyId]);
        $balanceData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $outstanding = floatval($balanceData['total_invoiced']) - floatval($balanceData['total_payments']);
        $creditLimit = floatval($customer['credit_limit']);
        $availableCredit = max(0, $creditLimit - $outstanding);
        
        $message = "💰 **Balance for {$customer['name']}**\n\n";
        $message .= "• Total Invoiced: " . number_format($balanceData['total_invoiced'], 2) . "\n";
        $message .= "• Total Paid: " . number_format($balanceData['total_payments'], 2) . "\n";
        $message .= "• **Outstanding: " . number_format($outstanding, 2) . "**\n";
        
        if ($creditLimit > 0) {
            $message .= "\n📊 **Credit Info:**\n";
            $message .= "• Credit Limit: " . number_format($creditLimit, 2) . "\n";
            $message .= "• Available Credit: " . number_format($availableCredit, 2) . "\n";
        }
        
        return formatSuccessResponse($message, [
            'customer' => $customer,
            'balance' => [
                'total_invoiced' => floatval($balanceData['total_invoiced']),
                'total_paid' => floatval($balanceData['total_payments']),
                'outstanding' => $outstanding,
                'credit_limit' => $creditLimit,
                'available_credit' => $availableCredit
            ]
        ]);
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to get balance: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Change customer type (individual <-> business)
 */
function changeCustomerTypeAction($data, $pdo, $companyId) {
    try {
        $customer = findCustomerFromData($data, $pdo, $companyId);
        
        if (!$customer) {
            return formatErrorResponse('Customer not found.', 'NOT_FOUND');
        }
        
        $newType = $data['customer_type'] ?? $data['new_type'] ?? null;
        
        // If no type specified, toggle
        if (!$newType) {
            $newType = $customer['customer_type'] === 'individual' ? 'business' : 'individual';
        }
        
        // Validate type
        if (!in_array($newType, ['individual', 'business'])) {
            return formatErrorResponse('Invalid customer type. Must be "individual" or "business".', 'VALIDATION_ERROR');
        }
        
        // Update
        $stmt = $pdo->prepare("UPDATE customers SET customer_type = ?, updated_at = NOW() WHERE id = ? AND company_id = ?");
        $stmt->execute([$newType, $customer['id'], $companyId]);
        
        return formatSuccessResponse(
            "✅ Customer **{$customer['name']}** type changed to **{$newType}**.",
            ['customer_id' => $customer['id'], 'new_type' => $newType, 'old_type' => $customer['customer_type']]
        );
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to change customer type: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Activate or deactivate customer
 */
function toggleCustomerStatusAction($data, $pdo, $companyId, $intent) {
    try {
        $customer = findCustomerFromData($data, $pdo, $companyId);
        
        if (!$customer) {
            return formatErrorResponse('Customer not found.', 'NOT_FOUND');
        }
        
        // Determine new status
        $newStatus = null;
        if ($intent === 'activate_customer') {
            $newStatus = 1;
        } elseif ($intent === 'deactivate_customer') {
            $newStatus = 0;
        } else {
            // Toggle
            $newStatus = $customer['is_active'] ? 0 : 1;
        }
        
        // If explicit status provided in data, use it
        if (isset($data['is_active'])) {
            $newStatus = $data['is_active'] ? 1 : 0;
        }
        
        // Update
        $stmt = $pdo->prepare("UPDATE customers SET is_active = ?, updated_at = NOW() WHERE id = ? AND company_id = ?");
        $stmt->execute([$newStatus, $customer['id'], $companyId]);
        
        $statusText = $newStatus ? 'activated' : 'deactivated';
        $emoji = $newStatus ? '✅' : '⏸️';
        
        return formatSuccessResponse(
            "{$emoji} Customer **{$customer['name']}** has been **{$statusText}**.",
            ['customer_id' => $customer['id'], 'is_active' => $newStatus]
        );
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to update customer status: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Helper: Find customer from various data fields
 */
function findCustomerFromData($data, $pdo, $companyId) {
    $customerId = $data['customer_id'] ?? null;
    $customerName = $data['customer_name'] ?? $data['name'] ?? null;
    $customerEmail = $data['customer_email'] ?? $data['email'] ?? null;
    
    if ($customerId) {
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ? AND company_id = ?");
        $stmt->execute([$customerId, $companyId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    if ($customerName) {
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE name LIKE ? AND company_id = ? LIMIT 1");
        $stmt->execute(["%{$customerName}%", $companyId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    if ($customerEmail) {
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = ? AND company_id = ?");
        $stmt->execute([$customerEmail, $companyId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    return null;
}
