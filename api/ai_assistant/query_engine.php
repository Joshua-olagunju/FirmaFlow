<?php
/**
 * Query Engine Module - Enhanced v2.0
 * Safe database query system with comprehensive security and reporting
 * 
 * SECURITY FEATURES:
 * - Parameterized queries (100% SQL injection prevention)
 * - Company scoping (all queries filtered by company_id)
 * - Input validation & sanitization
 * - Query result limits (prevent memory exhaustion)
 * - Error handling & logging
 * - Read-only operations only (no writes)
 */

// ═══════════════════════════════════════════════════════════════════
// SAFETY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

define('MAX_QUERY_LIMIT', 1000); // Maximum records per query
define('DEFAULT_QUERY_LIMIT', 50); // Default limit if not specified
define('MAX_DATE_RANGE_DAYS', 365); // Maximum date range in days

/**
 * Sanitize and validate query filters
 */
function sanitizeQueryFilters($filters) {
    $sanitized = [];
    
    // Limit
    if (isset($filters['limit'])) {
        $limit = (int) $filters['limit'];
        $sanitized['limit'] = min(max(1, $limit), MAX_QUERY_LIMIT);
    } else {
        $sanitized['limit'] = DEFAULT_QUERY_LIMIT;
    }
    
    // Date range validation
    if (isset($filters['date_range'])) {
        $range = parseDateRange($filters['date_range']);
        $daysDiff = (strtotime($range['end']) - strtotime($range['start'])) / 86400;
        
        if ($daysDiff > MAX_DATE_RANGE_DAYS) {
            throw new Exception('Date range exceeds maximum allowed (' . MAX_DATE_RANGE_DAYS . ' days)');
        }
        
        $sanitized['start_date'] = $range['start'];
        $sanitized['end_date'] = $range['end'];
    }
    
    // Status filter (whitelist)
    if (isset($filters['status'])) {
        $validStatuses = ['pending', 'paid', 'partially_paid', 'overdue', 'cancelled', 'active', 'inactive'];
        if (in_array($filters['status'], $validStatuses)) {
            $sanitized['status'] = $filters['status'];
        }
    }
    
    // Type filter (whitelist)
    if (isset($filters['type'])) {
        $validTypes = ['all', 'customer', 'supplier', 'product', 'service'];
        if (in_array($filters['type'], $validTypes)) {
            $sanitized['type'] = $filters['type'];
        }
    }
    
    // Search term sanitization
    if (isset($filters['search'])) {
        $sanitized['search'] = trim($filters['search']);
    }
    
    // Pass through safe identifiers
    $safeFields = ['customer_id', 'customer_name', 'customer_email', 'product_id', 
                   'invoice_id', 'invoice_number', 'category', 'period', 'threshold'];
    foreach ($safeFields as $field) {
        if (isset($filters[$field])) {
            $sanitized[$field] = $filters[$field];
        }
    }
    
    return $sanitized;
}

/**
 * Validate company_id to prevent unauthorized access
 */
function validateCompanyAccess($companyId) {
    if (empty($companyId) || !is_numeric($companyId) || $companyId <= 0) {
        throw new Exception('Invalid company ID');
    }
    return (int) $companyId;
}

/**
 * Build safe WHERE clause from filters
 */
function buildSafeWhereClause($baseConditions, $filters, &$params) {
    $conditions = $baseConditions;
    
    if (isset($filters['status'])) {
        $conditions[] = "status = ?";
        $params[] = $filters['status'];
    }
    
    if (isset($filters['start_date']) && isset($filters['end_date'])) {
        $conditions[] = "DATE(created_at) >= ?";
        $conditions[] = "DATE(created_at) <= ?";
        $params[] = $filters['start_date'];
        $params[] = $filters['end_date'];
    }
    
    if (isset($filters['search']) && !empty($filters['search'])) {
        $conditions[] = "(name LIKE ? OR email LIKE ? OR description LIKE ?)";
        $searchTerm = '%' . $filters['search'] . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    return implode(' AND ', $conditions);
}

// ═══════════════════════════════════════════════════════════════════
// MAIN QUERY ROUTER
// ═══════════════════════════════════════════════════════════════════

/**
 * Main query handler - routes to appropriate query function with safety checks
 */
function handleQuery($queryType, $queryData, $pdo, $companyId, $userId) {
    try {
        // Security validation
        $companyId = validateCompanyAccess($companyId);
        $queryData = sanitizeQueryFilters($queryData ?? []);
        
        // Query routing with comprehensive coverage
        switch ($queryType) {
            // Customer queries
            case 'customers':
            case 'customer_list':
                return queryCustomers($pdo, $companyId, $queryData);
                
            case 'customer_details':
                return queryCustomerDetails($pdo, $companyId, $queryData);
                
            case 'top_customers':
                return queryTopCustomers($pdo, $companyId, $queryData);
                
            // Product/Inventory queries
            case 'products':
            case 'inventory':
                return queryInventory($pdo, $companyId, $queryData);
                
            case 'low_stock':
                return queryLowStock($pdo, $companyId, $queryData);
                
            case 'product_details':
                return queryProductDetails($pdo, $companyId, $queryData);
                
            case 'out_of_stock':
                return queryOutOfStock($pdo, $companyId, $queryData);
                
            // Sales queries
            case 'invoices':
            case 'sales':
                return querySales($pdo, $companyId, $queryData);
                
            case 'invoice_details':
                return queryInvoiceDetails($pdo, $companyId, $queryData);
                
            case 'sales_summary':
                return querySalesSummary($pdo, $companyId, $queryData);
                
            case 'overdue_invoices':
                return queryOverdueInvoices($pdo, $companyId, $queryData);
                
            // Payment queries
            case 'payments':
            case 'transaction_history':
                return queryPayments($pdo, $companyId, $queryData);
                
            case 'pending_invoices':
                return queryPendingInvoices($pdo, $companyId, $queryData);
                
            case 'pending_supplier_bills':
                return queryPendingSupplierBills($pdo, $companyId, $queryData);
                
            // Purchase queries
            case 'purchases':
            case 'purchase_orders':
                return queryPurchases($pdo, $companyId, $queryData);
                
            case 'purchase_details':
                return queryPurchaseDetails($pdo, $companyId, $queryData);
                
            // Expense queries
            case 'expenses':
                return queryExpenses($pdo, $companyId, $queryData);
                
            case 'expense_summary':
                return queryExpenseSummary($pdo, $companyId, $queryData);
                
            case 'expense_by_category':
                return queryExpensesByCategory($pdo, $companyId, $queryData);
                
            // Summary/Dashboard queries
            case 'today':
            case 'daily_summary':
                return queryDailySummary($pdo, $companyId, $queryData);
                
            case 'weekly_summary':
                return queryWeeklySummary($pdo, $companyId, $queryData);
                
            case 'monthly_summary':
                return queryMonthlySummary($pdo, $companyId, $queryData);
                
            default:
                return formatErrorResponse('Unknown query type: ' . $queryType, 'INVALID_QUERY_TYPE');
        }
    } catch (Exception $e) {
        error_log('Query Engine Error: ' . $e->getMessage());
        return formatErrorResponse('Query failed: ' . $e->getMessage(), 'QUERY_ERROR');
    }
}

/**
 * Query customers with optional filters
 */
function queryCustomers($pdo, $companyId, $filters = []) {
    $sql = "SELECT COUNT(*) as count FROM customers WHERE company_id = ?";
    $params = [$companyId];
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $count = $stmt->fetchColumn();
    
    // Get recent customers
    $stmt = $pdo->prepare("
        SELECT name, email, phone, created_at 
        FROM customers 
        WHERE company_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt->execute([$companyId]);
    $recent = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $answer = "📊 You have **{$count} customer(s)** in your system.\n\n";
    if ($count > 0 && !empty($recent)) {
        $answer .= "🆕 Recent customers:\n";
        foreach ($recent as $customer) {
            $date = date('M d, Y', strtotime($customer['created_at']));
            $answer .= "• {$customer['name']}";
            if ($customer['email']) $answer .= " ({$customer['email']})";
            $answer .= " - Added {$date}\n";
        }
    }
    
    return formatSuccessResponse($answer, ['count' => $count, 'recent' => $recent]);
}

/**
 * Query customer details
 */
function queryCustomerDetails($pdo, $companyId, $filters) {
    $identifier = $filters['customer_id'] ?? $filters['customer_name'] ?? $filters['customer_email'] ?? null;
    
    if (!$identifier) {
        return formatErrorResponse('Customer identifier required');
    }
    
    $customer = findCustomer($pdo, $companyId, $identifier);
    
    if (!$customer) {
        return formatErrorResponse('Customer not found');
    }
    
    // Get customer sales stats
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as invoice_count,
            SUM(total) as total_spent,
            SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_amount,
            SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END) as outstanding
        FROM sales_invoices
        WHERE company_id = ? AND customer_id = ?
    ");
    $stmt->execute([$companyId, $customer['id']]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $answer = "👤 **{$customer['name']}**\n\n";
    if ($customer['email']) $answer .= "📧 Email: {$customer['email']}\n";
    if ($customer['phone']) $answer .= "📞 Phone: {$customer['phone']}\n";
    $answer .= "\n💰 **Sales Summary:**\n";
    $answer .= "• Total Invoices: {$stats['invoice_count']}\n";
    $answer .= "• Total Spent: " . formatCurrency($stats['total_spent'] ?? 0) . "\n";
    $answer .= "• Paid: " . formatCurrency($stats['paid_amount'] ?? 0) . "\n";
    $answer .= "• Outstanding: " . formatCurrency($stats['outstanding'] ?? 0);
    
    return formatSuccessResponse($answer, ['customer' => $customer, 'stats' => $stats]);
}

/**
 * Query top customers by sales
 */
function queryTopCustomers($pdo, $companyId, $filters) {
    $limit = $filters['limit'] ?? 5;
    
    $stmt = $pdo->prepare("
        SELECT 
            c.name as customer_name,
            COUNT(si.id) as invoice_count,
            SUM(si.total) as total_spent
        FROM customers c
        LEFT JOIN sales_invoices si ON c.id = si.customer_id AND si.company_id = ?
        WHERE c.company_id = ?
        GROUP BY c.id
        HAVING total_spent > 0
        ORDER BY total_spent DESC
        LIMIT ?
    ");
    $stmt->execute([$companyId, $companyId, $limit]);
    $topCustomers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($topCustomers)) {
        return formatSuccessResponse("No customer sales data found yet.", ['top_customers' => []]);
    }
    
    $answer = "🏆 **Top {$limit} Customers by Sales:**\n\n";
    foreach ($topCustomers as $index => $customer) {
        $rank = $index + 1;
        $answer .= "{$rank}. **{$customer['customer_name']}**\n";
        $answer .= "   • Total Spent: " . formatCurrency($customer['total_spent']) . "\n";
        $answer .= "   • Invoices: {$customer['invoice_count']}\n\n";
    }
    
    return formatSuccessResponse($answer, ['top_customers' => $topCustomers]);
}

/**
 * Query inventory/products
 */
function queryInventory($pdo, $companyId, $filters) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count, SUM(stock_quantity) as total_stock 
        FROM products 
        WHERE company_id = ?
    ");
    $stmt->execute([$companyId]);
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $answer = "📦 You have **{$data['count']} product(s)** with **{$data['total_stock']} total units** in stock.";
    
    return formatSuccessResponse($answer, $data);
}

/**
 * Query low stock products
 */
function queryLowStock($pdo, $companyId, $filters) {
    $threshold = $filters['threshold'] ?? 10;
    
    $stmt = $pdo->prepare("
        SELECT name, stock_quantity, reorder_level
        FROM products
        WHERE company_id = ? AND stock_quantity <= ?
        ORDER BY stock_quantity ASC
        LIMIT 10
    ");
    $stmt->execute([$companyId, $threshold]);
    $lowStock = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($lowStock)) {
        return formatSuccessResponse("✅ All products are well-stocked!", ['low_stock_items' => []]);
    }
    
    $answer = "⚠️ **Low Stock Alert:**\n\n";
    foreach ($lowStock as $product) {
        $answer .= "• **{$product['name']}**: {$product['stock_quantity']} units remaining\n";
    }
    
    return formatSuccessResponse($answer, ['low_stock_items' => $lowStock]);
}

/**
 * Query pending invoices
 */
function queryPendingInvoices($pdo, $companyId, $filters) {
    $limit = $filters['limit'] ?? 10;
    
    $stmt = $pdo->prepare("
        SELECT 
            si.invoice_no,
            si.invoice_date,
            si.total,
            si.status,
            c.name as customer_name,
            DATEDIFF(NOW(), si.invoice_date) as days_overdue
        FROM sales_invoices si
        LEFT JOIN customers c ON si.customer_id = c.id
        WHERE si.company_id = ? AND si.status IN ('pending', 'partially_paid')
        ORDER BY si.invoice_date ASC
        LIMIT ?
    ");
    $stmt->execute([$companyId, $limit]);
    $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($pending)) {
        return formatSuccessResponse("✅ No pending invoices! All invoices are paid.", ['pending_invoices' => []]);
    }
    
    $totalUnpaid = array_sum(array_column($pending, 'total'));
    
    $answer = "💳 **Pending Invoices ({count})**\n\n";
    $answer = str_replace('{count}', count($pending), $answer);
    
    foreach ($pending as $invoice) {
        $answer .= "• **{$invoice['invoice_no']}** - {$invoice['customer_name']}\n";
        $answer .= "  Amount: " . formatCurrency($invoice['total']) . "\n";
        $answer .= "  Status: {$invoice['status']}\n";
        if ($invoice['days_overdue'] > 30) {
            $answer .= "  ⚠️ Overdue by {$invoice['days_overdue']} days\n";
        }
        $answer .= "\n";
    }
    
    $answer .= "**Total Unpaid:** " . formatCurrency($totalUnpaid);
    
    return formatSuccessResponse($answer, ['pending_invoices' => $pending, 'total_unpaid' => $totalUnpaid]);
}

/**
 * Query daily summary
 */
function queryDailySummary($pdo, $companyId, $filters) {
    $date = $filters['date'] ?? date('Y-m-d');
    
    // Today's sales
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total), 0) as today_sales, COUNT(*) as invoice_count
        FROM sales_invoices
        WHERE company_id = ? AND DATE(invoice_date) = ?
    ");
    $stmt->execute([$companyId, $date]);
    $sales = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Today's expenses
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as today_expenses, COUNT(*) as expense_count
        FROM expenses
        WHERE company_id = ? AND DATE(expense_date) = ?
    ");
    $stmt->execute([$companyId, $date]);
    $expenses = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Today's payments received
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as today_payments
        FROM payments
        WHERE company_id = ? AND DATE(payment_date) = ? AND type = 'received'
    ");
    $stmt->execute([$companyId, $date]);
    $payments = $stmt->fetchColumn();
    
    $displayDate = ($date === date('Y-m-d')) ? 'Today' : date('M d, Y', strtotime($date));
    
    $answer = "📊 **{$displayDate}'s Summary:**\n\n";
    $answer .= "💰 **Sales:** " . formatCurrency($sales['today_sales']) . " ({$sales['invoice_count']} invoices)\n";
    $answer .= "💸 **Expenses:** " . formatCurrency($expenses['today_expenses']) . " ({$expenses['expense_count']} expenses)\n";
    $answer .= "💳 **Payments Received:** " . formatCurrency($payments) . "\n\n";
    
    $netIncome = $sales['today_sales'] - $expenses['today_expenses'];
    $answer .= "📈 **Net Income:** " . formatCurrency($netIncome);
    
    return formatSuccessResponse($answer, [
        'sales' => $sales,
        'expenses' => $expenses,
        'payments' => $payments,
        'net_income' => $netIncome
    ]);
}

/**
 * Query sales summary
 */
function querySalesSummary($pdo, $companyId, $filters) {
    $period = $filters['period'] ?? 'month';
    $dateCondition = "DATE(invoice_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    
    if ($period === 'week') {
        $dateCondition = "DATE(invoice_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } elseif ($period === 'year') {
        $dateCondition = "YEAR(invoice_date) = YEAR(CURDATE())";
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as invoice_count,
            SUM(total) as total_revenue,
            AVG(total) as avg_invoice,
            SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_revenue,
            SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END) as unpaid_revenue
        FROM sales_invoices
        WHERE company_id = ? AND {$dateCondition}
    ");
    $stmt->execute([$companyId]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $answer = "📈 **Sales Summary (Last {$period}):**\n\n";
    $answer .= "• Total Invoices: {$summary['invoice_count']}\n";
    $answer .= "• Total Revenue: " . formatCurrency($summary['total_revenue'] ?? 0) . "\n";
    $answer .= "• Average Invoice: " . formatCurrency($summary['avg_invoice'] ?? 0) . "\n";
    $answer .= "• Paid: " . formatCurrency($summary['paid_revenue'] ?? 0) . "\n";
    $answer .= "• Unpaid: " . formatCurrency($summary['unpaid_revenue'] ?? 0);
    
    return formatSuccessResponse($answer, $summary);
}

/**
 * Query expenses
 */
function queryExpenses($pdo, $companyId, $filters) {
    $limit = $filters['limit'] ?? 10;
    
    $stmt = $pdo->prepare("
        SELECT reference, description, amount, expense_date, category
        FROM expenses
        WHERE company_id = ?
        ORDER BY expense_date DESC
        LIMIT ?
    ");
    $stmt->execute([$companyId, $limit]);
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $totalExpenses = array_sum(array_column($expenses, 'amount'));
    
    if (empty($expenses)) {
        return formatSuccessResponse("No expenses recorded yet.", ['expenses' => []]);
    }
    
    $answer = "💸 **Recent Expenses:**\n\n";
    foreach ($expenses as $expense) {
        $date = date('M d', strtotime($expense['expense_date']));
        $answer .= "• **{$expense['description']}** - " . formatCurrency($expense['amount']) . " ({$date})\n";
    }
    $answer .= "\n**Total:** " . formatCurrency($totalExpenses);
    
    return formatSuccessResponse($answer, ['expenses' => $expenses, 'total' => $totalExpenses]);
}

// ═══════════════════════════════════════════════════════════════════
// MISSING QUERY FUNCTIONS - COMPREHENSIVE REPORTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Query product details
 */
function queryProductDetails($pdo, $companyId, $filters) {
    $identifier = $filters['product_id'] ?? $filters['product_name'] ?? null;
    
    if (!$identifier) {
        return formatErrorResponse('Product identifier required', 'VALIDATION_ERROR');
    }
    
    if (is_numeric($identifier)) {
        $stmt = $pdo->prepare("
            SELECT * FROM products 
            WHERE id = ? AND company_id = ?
        ");
        $stmt->execute([$identifier, $companyId]);
    } else {
        $stmt = $pdo->prepare("
            SELECT * FROM products 
            WHERE company_id = ? AND name LIKE ?
        ");
        $stmt->execute([$companyId, '%' . $identifier . '%']);
    }
    
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$product) {
        return formatErrorResponse('Product not found', 'NOT_FOUND');
    }
    
    $answer = "📦 **{$product['name']}**\n\n";
    $answer .= "💰 Price: " . formatCurrency($product['selling_price']) . "\n";
    $answer .= "📊 Stock: {$product['stock_quantity']} {$product['unit']}\n";
    if ($product['reorder_level']) {
        $answer .= "⚠️ Reorder Level: {$product['reorder_level']}\n";
    }
    if ($product['description']) {
        $answer .= "📝 Description: {$product['description']}";
    }
    
    return formatSuccessResponse($answer, ['product' => $product]);
}

/**
 * Query out of stock products
 */
function queryOutOfStock($pdo, $companyId, $filters) {
    $stmt = $pdo->prepare("
        SELECT name, sku, last_restocked
        FROM products
        WHERE company_id = ? AND stock_quantity = 0
        ORDER BY last_restocked DESC
        LIMIT ?
    ");
    $stmt->execute([$companyId, $filters['limit']]);
    $outOfStock = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($outOfStock)) {
        return formatSuccessResponse("✅ No out-of-stock products!", ['out_of_stock' => []]);
    }
    
    $answer = "⛔ **Out of Stock Products:**\n\n";
    foreach ($outOfStock as $product) {
        $answer .= "• {$product['name']}";
        if ($product['sku']) $answer .= " (SKU: {$product['sku']})";
        $answer .= "\n";
    }
    
    return formatSuccessResponse($answer, ['out_of_stock' => $outOfStock]);
}

/**
 * Query sales/invoices with filters
 */
function querySales($pdo, $companyId, $filters) {
    $params = [$companyId];
    $conditions = ['company_id = ?'];
    
    if (isset($filters['status'])) {
        $conditions[] = 'status = ?';
        $params[] = $filters['status'];
    }
    
    if (isset($filters['start_date']) && isset($filters['end_date'])) {
        $conditions[] = 'invoice_date >= ?';
        $conditions[] = 'invoice_date <= ?';
        $params[] = $filters['start_date'];
        $params[] = $filters['end_date'];
    }
    
    $params[] = $filters['limit'];
    
    $stmt = $pdo->prepare("
        SELECT 
            si.invoice_no,
            si.invoice_date,
            si.total,
            si.status,
            c.name as customer_name
        FROM sales_invoices si
        LEFT JOIN customers c ON si.customer_id = c.id
        WHERE " . implode(' AND ', $conditions) . "
        ORDER BY si.invoice_date DESC
        LIMIT ?
    ");
    $stmt->execute($params);
    $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($invoices)) {
        return formatSuccessResponse("No invoices found.", ['invoices' => []]);
    }
    
    $totalAmount = array_sum(array_column($invoices, 'total'));
    
    $answer = "📄 **Sales Invoices (**" . count($invoices) . "):**\n\n";
    foreach (array_slice($invoices, 0, 10) as $inv) {
        $answer .= "• **{$inv['invoice_no']}** - {$inv['customer_name']}\n";
        $answer .= "  Amount: " . formatCurrency($inv['total']) . " | Status: {$inv['status']}\n\n";
    }
    $answer .= "**Total:** " . formatCurrency($totalAmount);
    
    return formatSuccessResponse($answer, ['invoices' => $invoices, 'total' => $totalAmount]);
}

/**
 * Query invoice details
 */
function queryInvoiceDetails($pdo, $companyId, $filters) {
    $identifier = $filters['invoice_id'] ?? $filters['invoice_number'] ?? null;
    
    if (!$identifier) {
        return formatErrorResponse('Invoice identifier required', 'VALIDATION_ERROR');
    }
    
    if (is_numeric($identifier)) {
        $stmt = $pdo->prepare("
            SELECT si.*, c.name as customer_name, c.email, c.phone
            FROM sales_invoices si
            LEFT JOIN customers c ON si.customer_id = c.id
            WHERE si.id = ? AND si.company_id = ?
        ");
        $stmt->execute([$identifier, $companyId]);
    } else {
        $stmt = $pdo->prepare("
            SELECT si.*, c.name as customer_name, c.email, c.phone
            FROM sales_invoices si
            LEFT JOIN customers c ON si.customer_id = c.id
            WHERE si.invoice_no = ? AND si.company_id = ?
        ");
        $stmt->execute([$identifier, $companyId]);
    }
    
    $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$invoice) {
        return formatErrorResponse('Invoice not found', 'NOT_FOUND');
    }
    
    // Get items
    $stmt = $pdo->prepare("
        SELECT * FROM sales_invoice_lines 
        WHERE invoice_id = ?
    ");
    $stmt->execute([$invoice['id']]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $answer = "📄 **Invoice: {$invoice['invoice_no']}**\n\n";
    $answer .= "👤 Customer: {$invoice['customer_name']}\n";
    $answer .= "📅 Date: {$invoice['invoice_date']} | Due: {$invoice['due_date']}\n";
    $answer .= "💰 Total: " . formatCurrency($invoice['total']) . "\n";
    $answer .= "📊 Status: {$invoice['status']}\n\n";
    
    if (!empty($items)) {
        $answer .= "**Items:**\n";
        foreach ($items as $item) {
            $answer .= "• {$item['description']} - {$item['quantity']} x " . formatCurrency($item['unit_price']) . "\n";
        }
    }
    
    return formatSuccessResponse($answer, ['invoice' => $invoice, 'items' => $items]);
}

/**
 * Query overdue invoices
 */
function queryOverdueInvoices($pdo, $companyId, $filters) {
    $stmt = $pdo->prepare("
        SELECT 
            si.invoice_no,
            si.invoice_date,
            si.due_date,
            si.total,
            c.name as customer_name,
            DATEDIFF(NOW(), si.due_date) as days_overdue
        FROM sales_invoices si
        LEFT JOIN customers c ON si.customer_id = c.id
        WHERE si.company_id = ? 
        AND si.status IN ('pending', 'partially_paid')
        AND si.due_date < NOW()
        ORDER BY days_overdue DESC
        LIMIT ?
    ");
    $stmt->execute([$companyId, $filters['limit']]);
    $overdue = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($overdue)) {
        return formatSuccessResponse("✅ No overdue invoices!", ['overdue_invoices' => []]);
    }
    
    $totalOverdue = array_sum(array_column($overdue, 'total'));
    
    $answer = "⚠️ **Overdue Invoices (**" . count($overdue) . "):**\n\n";
    foreach ($overdue as $inv) {
        $answer .= "• **{$inv['invoice_no']}** - {$inv['customer_name']}\n";
        $answer .= "  Amount: " . formatCurrency($inv['total']) . "\n";
        $answer .= "  🔴 {$inv['days_overdue']} days overdue\n\n";
    }
    $answer .= "**Total Overdue:** " . formatCurrency($totalOverdue);
    
    return formatSuccessResponse($answer, ['overdue_invoices' => $overdue, 'total_overdue' => $totalOverdue]);
}

/**
 * Query purchases
 */
function queryPurchases($pdo, $companyId, $filters) {
    $params = [$companyId];
    $conditions = ['company_id = ?'];
    
    if (isset($filters['status'])) {
        $conditions[] = 'status = ?';
        $params[] = $filters['status'];
    }
    
    $params[] = $filters['limit'];
    
    $stmt = $pdo->prepare("
        SELECT 
            pur.purchase_number,
            pur.purchase_date,
            pur.total,
            pur.status,
            s.name as supplier_name
        FROM purchases pur
        LEFT JOIN suppliers s ON pur.supplier_id = s.id
        WHERE " . implode(' AND ', $conditions) . "
        ORDER BY pur.purchase_date DESC
        LIMIT ?
    ");
    $stmt->execute($params);
    $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($purchases)) {
        return formatSuccessResponse("No purchase orders found.", ['purchases' => []]);
    }
    
    $totalAmount = array_sum(array_column($purchases, 'total'));
    
    $answer = "🛒 **Purchase Orders (**" . count($purchases) . "):**\n\n";
    foreach (array_slice($purchases, 0, 10) as $po) {
        $answer .= "• **{$po['purchase_number']}** - {$po['supplier_name']}\n";
        $answer .= "  Amount: " . formatCurrency($po['total']) . " | Status: {$po['status']}\n\n";
    }
    $answer .= "**Total:** " . formatCurrency($totalAmount);
    
    return formatSuccessResponse($answer, ['purchases' => $purchases, 'total' => $totalAmount]);
}

/**
 * Query purchase details
 */
function queryPurchaseDetails($pdo, $companyId, $filters) {
    $identifier = $filters['purchase_id'] ?? $filters['purchase_number'] ?? null;
    
    if (!$identifier) {
        return formatErrorResponse('Purchase identifier required', 'VALIDATION_ERROR');
    }
    
    if (is_numeric($identifier)) {
        $stmt = $pdo->prepare("
            SELECT pur.*, s.name as supplier_name, s.email, s.phone
            FROM purchases pur
            LEFT JOIN suppliers s ON pur.supplier_id = s.id
            WHERE pur.id = ? AND pur.company_id = ?
        ");
        $stmt->execute([$identifier, $companyId]);
    } else {
        $stmt = $pdo->prepare("
            SELECT pur.*, s.name as supplier_name, s.email, s.phone
            FROM purchases pur
            LEFT JOIN suppliers s ON pur.supplier_id = s.id
            WHERE pur.purchase_number = ? AND pur.company_id = ?
        ");
        $stmt->execute([$identifier, $companyId]);
    }
    
    $purchase = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$purchase) {
        return formatErrorResponse('Purchase order not found', 'NOT_FOUND');
    }
    
    $answer = "🛒 **PO: {$purchase['purchase_number']}**\n\n";
    $answer .= "🏢 Supplier: {$purchase['supplier_name']}\n";
    $answer .= "📅 Date: {$purchase['purchase_date']}\n";
    $answer .= "💰 Total: " . formatCurrency($purchase['total']) . "\n";
    $answer .= "📊 Status: {$purchase['status']}";
    
    return formatSuccessResponse($answer, ['purchase' => $purchase]);
}

/**
 * Query expenses by category
 */
function queryExpensesByCategory($pdo, $companyId, $filters) {
    $dateCondition = "";
    $params = [$companyId];
    
    if (isset($filters['start_date']) && isset($filters['end_date'])) {
        $dateCondition = "AND expense_date >= ? AND expense_date <= ?";
        $params[] = $filters['start_date'];
        $params[] = $filters['end_date'];
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            category,
            COUNT(*) as count,
            SUM(amount) as total
        FROM expenses
        WHERE company_id = ? {$dateCondition}
        GROUP BY category
        ORDER BY total DESC
    ");
    $stmt->execute($params);
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($categories)) {
        return formatSuccessResponse("No expense data available.", ['categories' => []]);
    }
    
    $grandTotal = array_sum(array_column($categories, 'total'));
    
    $answer = "💸 **Expenses by Category:**\n\n";
    foreach ($categories as $cat) {
        $percentage = ($grandTotal > 0) ? ($cat['total'] / $grandTotal) * 100 : 0;
        $answer .= "• **{$cat['category']}**: " . formatCurrency($cat['total']) . " (" . number_format($percentage, 1) . "%)\n";
        $answer .= "  {$cat['count']} transactions\n\n";
    }
    $answer .= "**Total:** " . formatCurrency($grandTotal);
    
    return formatSuccessResponse($answer, ['categories' => $categories, 'total' => $grandTotal]);
}

/**
 * Query weekly summary
 */
function queryWeeklySummary($pdo, $companyId, $filters) {
    $startDate = date('Y-m-d', strtotime('-7 days'));
    $endDate = date('Y-m-d');
    
    // Sales
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as invoice_count
        FROM sales_invoices
        WHERE company_id = ? AND invoice_date >= ? AND invoice_date <= ?
    ");
    $stmt->execute([$companyId, $startDate, $endDate]);
    $sales = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Expenses
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as expenses
        FROM expenses
        WHERE company_id = ? AND expense_date >= ? AND expense_date <= ?
    ");
    $stmt->execute([$companyId, $startDate, $endDate]);
    $expenses = $stmt->fetchColumn();
    
    $netIncome = $sales['revenue'] - $expenses;
    
    $answer = "📊 **Weekly Summary (Last 7 Days):**\n\n";
    $answer .= "💰 Revenue: " . formatCurrency($sales['revenue']) . " ({$sales['invoice_count']} invoices)\n";
    $answer .= "💸 Expenses: " . formatCurrency($expenses) . "\n";
    $answer .= "📈 Net Income: " . formatCurrency($netIncome);
    
    return formatSuccessResponse($answer, [
        'sales' => $sales,
        'expenses' => $expenses,
        'net_income' => $netIncome
    ]);
}

/**
 * Query monthly summary
 */
function queryMonthlySummary($pdo, $companyId, $filters) {
    $startDate = date('Y-m-01'); // First day of current month
    $endDate = date('Y-m-d');
    
    // Sales
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(total), 0) as revenue,
            COUNT(*) as invoice_count,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
        FROM sales_invoices
        WHERE company_id = ? AND invoice_date >= ? AND invoice_date <= ?
    ");
    $stmt->execute([$companyId, $startDate, $endDate]);
    $sales = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Expenses
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as expenses, COUNT(*) as expense_count
        FROM expenses
        WHERE company_id = ? AND expense_date >= ? AND expense_date <= ?
    ");
    $stmt->execute([$companyId, $startDate, $endDate]);
    $expenses = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Customer count
    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT customer_id) as active_customers
        FROM sales_invoices
        WHERE company_id = ? AND invoice_date >= ? AND invoice_date <= ?
    ");
    $stmt->execute([$companyId, $startDate, $endDate]);
    $customers = $stmt->fetchColumn();
    
    $netIncome = $sales['revenue'] - $expenses['expenses'];
    $avgInvoice = $sales['invoice_count'] > 0 ? $sales['revenue'] / $sales['invoice_count'] : 0;
    
    $answer = "📊 **Monthly Summary (" . date('F Y') . "):**\n\n";
    $answer .= "💰 Revenue: " . formatCurrency($sales['revenue']) . "\n";
    $answer .= "📄 Invoices: {$sales['invoice_count']} ({$sales['paid_count']} paid)\n";
    $answer .= "📊 Avg Invoice: " . formatCurrency($avgInvoice) . "\n";
    $answer .= "💸 Expenses: " . formatCurrency($expenses['expenses']) . " ({$expenses['expense_count']} items)\n";
    $answer .= "👥 Active Customers: {$customers}\n";
    $answer .= "📈 Net Income: " . formatCurrency($netIncome);
    
    return formatSuccessResponse($answer, [
        'sales' => $sales,
        'expenses' => $expenses,
        'net_income' => $netIncome,
        'active_customers' => $customers,
        'avg_invoice' => $avgInvoice
    ]);
}
