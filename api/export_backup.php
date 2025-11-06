<?php
session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/subscription_helper.php';

// Check authentication
if (!isset($_SESSION['company_id']) || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

$company_id = $_SESSION['company_id'];
$user_id = $_SESSION['user_id'];

// Check subscription access (backup features available for all paid plans)
$subscription_info = getUserSubscriptionInfo($user_id);
$plan = $subscription_info['subscription_plan'] ?? 'free';

if ($plan === 'free') {
    http_response_code(403);
    echo json_encode(['error' => 'Export feature requires a paid subscription plan.']);
    exit;
}

// Get export parameters
$type = $_GET['type'] ?? '';
$format = $_GET['format'] ?? 'csv';

if (!in_array($type, ['customers', 'products', 'sales'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid export type. Must be customers, products, or sales.']);
    exit;
}

if (!in_array($format, ['csv', 'excel', 'zoho', 'quickbooks'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid format. Must be csv, excel, zoho, or quickbooks.']);
    exit;
}

try {
    switch ($type) {
        case 'customers':
            exportCustomers($pdo, $company_id, $format);
            break;
        case 'products':
            exportProducts($pdo, $company_id, $format);
            break;
        case 'sales':
            exportSales($pdo, $company_id, $format);
            break;
        default:
            throw new Exception('Invalid export type');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Export failed: ' . $e->getMessage()]);
    exit;
}

/**
 * Export customers data with comprehensive information
 */
function exportCustomers($pdo, $company_id, $format) {
    // Get all customer data including transaction history
    $sql = "
        SELECT 
            c.id as customer_id,
            c.name,
            c.email,
            c.phone,
            c.billing_address as address,
            '' as city,
            '' as state,
            '' as postal_code,
            '' as country,
            '' as tax_number,
            c.balance,
            c.credit_limit,
            c.payment_terms,
            c.created_at,
            c.updated_at,
            c.is_active,
            c.customer_type,
            -- Sales summary
            COALESCE(s.total_sales, 0) as total_sales_amount,
            COALESCE(s.sales_count, 0) as total_sales_count,
            COALESCE(s.total_paid, 0) as total_amount_paid,
            COALESCE(s.total_outstanding, 0) as total_outstanding,
            s.last_sale_date,
            s.first_sale_date,
            -- Payment summary
            COALESCE(p.total_payments, 0) as total_payments_amount,
            COALESCE(p.payment_count, 0) as total_payment_count,
            p.last_payment_date
        FROM customers c
        LEFT JOIN (
            SELECT 
                customer_id,
                COUNT(*) as sales_count,
                SUM(total_amount) as total_sales,
                SUM(amount_paid) as total_paid,
                SUM(balance_due) as total_outstanding,
                MAX(sale_date) as last_sale_date,
                MIN(sale_date) as first_sale_date
            FROM sales 
            WHERE company_id = ?
            GROUP BY customer_id
        ) s ON c.id = s.customer_id
        LEFT JOIN (
            SELECT 
                customer_id,
                COUNT(*) as payment_count,
                SUM(amount) as total_payments,
                MAX(payment_date) as last_payment_date
            FROM payments 
            WHERE company_id = ? AND customer_id IS NOT NULL
            GROUP BY customer_id
        ) p ON c.id = p.customer_id
        WHERE c.company_id = ?
        ORDER BY c.name
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $company_id, $company_id]);
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // For now, skip the complex transaction history to get basic export working
    // We can add it back once basic export is functional
    
    if ($format === 'zoho') {
        exportCustomersZohoFormat($customers);
    } elseif ($format === 'quickbooks') {
        exportCustomersQuickBooksFormat($customers);
    } elseif ($format === 'excel') {
        exportCustomersExcel($customers);
    } else {
        exportCustomersCSV($customers);
    }
}

/**
 * Export products data with comprehensive information
 */
function exportProducts($pdo, $company_id, $format) {
    // Get all product data including transaction history
    $sql = "
        SELECT 
            p.id as product_id,
            p.name,
            p.sku,
            p.description,
            p.category,
            p.unit_price,
            p.cost_price,
            p.quantity_in_stock,
            p.low_stock_threshold,
            p.unit_of_measure,
            p.tax_rate,
            p.is_active,
            p.created_at,
            p.updated_at,
            p.barcode,
            p.supplier_info,
            p.reorder_point,
            p.maximum_stock_level,
            -- Sales summary
            COALESCE(s.total_sold_quantity, 0) as total_sold_quantity,
            COALESCE(s.total_sales_amount, 0) as total_sales_amount,
            COALESCE(s.sales_count, 0) as number_of_sales,
            s.last_sale_date,
            s.first_sale_date,
            COALESCE(s.avg_selling_price, p.unit_price) as average_selling_price,
            -- Purchase summary
            COALESCE(pur.total_purchased_quantity, 0) as total_purchased_quantity,
            COALESCE(pur.total_purchase_amount, 0) as total_purchase_amount,
            COALESCE(pur.purchase_count, 0) as number_of_purchases,
            pur.last_purchase_date,
            pur.first_purchase_date,
            COALESCE(pur.avg_purchase_cost, p.cost_price) as average_purchase_cost,
            -- Inventory calculations
            (COALESCE(p.quantity_in_stock, 0) * p.cost_price) as inventory_value,
            (COALESCE(s.total_sold_quantity, 0) * COALESCE(s.avg_selling_price, p.unit_price)) as lifetime_revenue,
            (COALESCE(s.total_sold_quantity, 0) * (COALESCE(s.avg_selling_price, p.unit_price) - p.cost_price)) as estimated_profit
        FROM products p
        LEFT JOIN (
            SELECT 
                si.product_id,
                SUM(si.quantity) as total_sold_quantity,
                SUM(si.quantity * si.unit_price) as total_sales_amount,
                COUNT(DISTINCT si.sale_id) as sales_count,
                MAX(s.sale_date) as last_sale_date,
                MIN(s.sale_date) as first_sale_date,
                AVG(si.unit_price) as avg_selling_price
            FROM sale_items si
            INNER JOIN sales s ON si.sale_id = s.id
            WHERE s.company_id = ?
            GROUP BY si.product_id
        ) s ON p.id = s.product_id
        LEFT JOIN (
            SELECT 
                pi.product_id,
                SUM(pi.quantity) as total_purchased_quantity,
                SUM(pi.quantity * pi.unit_cost) as total_purchase_amount,
                COUNT(DISTINCT pi.purchase_id) as purchase_count,
                MAX(pur.purchase_date) as last_purchase_date,
                MIN(pur.purchase_date) as first_purchase_date,
                AVG(pi.unit_cost) as avg_purchase_cost
            FROM purchase_items pi
            INNER JOIN purchases pur ON pi.purchase_id = pur.id
            WHERE pur.company_id = ?
            GROUP BY pi.product_id
        ) pur ON p.id = pur.product_id
        WHERE p.company_id = ?
        ORDER BY p.name
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $company_id, $company_id]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get detailed transaction history for each product
    foreach ($products as &$product) {
        $product['transaction_history'] = getProductTransactionHistory($pdo, $company_id, $product['product_id']);
        $product['sales_history'] = getProductSalesHistory($pdo, $company_id, $product['product_id']);
        $product['current_suppliers'] = getProductSuppliers($pdo, $company_id, $product['product_id']);
        $product['inventory_movements'] = getProductInventoryMovements($pdo, $company_id, $product['product_id']);
    }
    
    if ($format === 'zoho') {
        exportProductsZohoFormat($products);
    } elseif ($format === 'quickbooks') {
        exportProductsQuickBooksFormat($products);
    } elseif ($format === 'excel') {
        exportProductsExcel($products);
    } else {
        exportProductsCSV($products);
    }
}

/**
 * Export sales data with comprehensive transaction information
 */
function exportSales($pdo, $company_id, $format) {
    // Get comprehensive sales data including all related transactions
    $data = [
        'sales' => getAllTransactionsByType($pdo, $company_id, 'sales'),
        'purchases' => getAllTransactionsByType($pdo, $company_id, 'purchases'),
        'payments' => getAllTransactionsByType($pdo, $company_id, 'payments'),
        'expenses' => getAllTransactionsByType($pdo, $company_id, 'expenses')
    ];
    
    // Combine all transaction data for comprehensive export
    $comprehensive_data = [];
    
    // Add sales transactions
    foreach ($data['sales'] as $sale) {
        $comprehensive_data[] = [
            'transaction_type' => 'Sale',
            'reference_number' => $sale['invoice_number'],
            'transaction_date' => $sale['sale_date'],
            'due_date' => $sale['due_date'] ?? '',
            'party_name' => $sale['customer_name'],
            'party_email' => $sale['customer_email'],
            'party_phone' => $sale['customer_phone'],
            'subtotal' => $sale['subtotal'],
            'tax_amount' => $sale['tax_amount'],
            'discount_amount' => $sale['discount_amount'],
            'total_amount' => $sale['total_amount'],
            'amount_paid' => $sale['amount_paid'],
            'balance_due' => $sale['balance_due'],
            'status' => $sale['status'],
            'payment_status' => $sale['payment_status'],
            'notes' => $sale['notes'],
            'items_detail' => $sale['sale_items_detail'],
            'created_at' => $sale['created_at']
        ];
    }
    
    // Add purchase transactions
    foreach ($data['purchases'] as $purchase) {
        $comprehensive_data[] = [
            'transaction_type' => 'Purchase',
            'reference_number' => $purchase['reference_number'],
            'transaction_date' => $purchase['purchase_date'],
            'due_date' => $purchase['expected_delivery_date'] ?? '',
            'party_name' => $purchase['supplier_name'],
            'party_email' => $purchase['supplier_email'],
            'party_phone' => $purchase['supplier_phone'],
            'subtotal' => $purchase['subtotal'],
            'tax_amount' => $purchase['tax_amount'],
            'discount_amount' => $purchase['discount_amount'],
            'total_amount' => $purchase['total_amount'],
            'amount_paid' => $purchase['amount_paid'],
            'balance_due' => $purchase['balance_due'],
            'status' => $purchase['status'],
            'payment_status' => $purchase['payment_status'],
            'notes' => $purchase['notes'],
            'items_detail' => $purchase['purchase_items_detail'],
            'created_at' => $purchase['created_at']
        ];
    }
    
    // Add payment transactions
    foreach ($data['payments'] as $payment) {
        $party_name = $payment['customer_name'] ?? $payment['supplier_name'] ?? 'Direct Payment';
        $related_transaction = $payment['related_sale'] ?? $payment['related_purchase'] ?? '';
        
        $comprehensive_data[] = [
            'transaction_type' => 'Payment',
            'reference_number' => $payment['reference_number'],
            'transaction_date' => $payment['payment_date'],
            'due_date' => '',
            'party_name' => $party_name,
            'party_email' => '',
            'party_phone' => '',
            'subtotal' => $payment['amount'],
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => $payment['amount'],
            'amount_paid' => $payment['amount'],
            'balance_due' => 0,
            'status' => 'completed',
            'payment_status' => 'paid',
            'notes' => $payment['notes'] . ' | Method: ' . $payment['payment_method'] . ' | Related: ' . $related_transaction,
            'items_detail' => 'Payment - ' . $payment['payment_method'],
            'created_at' => $payment['created_at']
        ];
    }
    
    // Add expense transactions
    foreach ($data['expenses'] as $expense) {
        $comprehensive_data[] = [
            'transaction_type' => 'Expense',
            'reference_number' => $expense['reference'],
            'transaction_date' => $expense['expense_date'],
            'due_date' => '',
            'party_name' => $expense['payee_name'],
            'party_email' => '',
            'party_phone' => '',
            'subtotal' => $expense['amount'],
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => $expense['amount'],
            'amount_paid' => $expense['amount'],
            'balance_due' => 0,
            'status' => $expense['status'],
            'payment_status' => 'paid',
            'notes' => $expense['description'] . ' | Category: ' . $expense['expense_category'] . ' | Method: ' . $expense['payment_method'],
            'items_detail' => 'Expense - ' . $expense['expense_category'],
            'created_at' => $expense['created_at']
        ];
    }
    
    // Sort by transaction date (most recent first)
    usort($comprehensive_data, function($a, $b) {
        return strtotime($b['transaction_date']) - strtotime($a['transaction_date']);
    });
    
    if ($format === 'zoho') {
        exportSalesZohoFormat($comprehensive_data);
    } elseif ($format === 'quickbooks') {
        exportSalesQuickBooksFormat($comprehensive_data);
    } elseif ($format === 'excel') {
        exportSalesExcel($comprehensive_data);
    } else {
        exportSalesCSV($comprehensive_data);
    }
}

/**
 * Export customers in Zoho Books compatible format
 */
function exportCustomersZohoFormat($customers) {
    $filename = 'customers_zoho_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    // Zoho Books customer import headers
    $headers = [
        'Customer Name*',
        'Company Name',
        'Customer Email',
        'Customer Phone',
        'Currency Code',
        'Payment Terms',
        'Credit Limit',
        'Billing Address',
        'Billing City',
        'Billing State',
        'Billing Country',
        'Billing Code',
        'Shipping Address',
        'Shipping City', 
        'Shipping State',
        'Shipping Country',
        'Shipping Code',
        'Tax Number',
        'Notes'
    ];
    
    fputcsv($output, $headers);
    
    foreach ($customers as $customer) {
        $row = [
            $customer['name'],
            $customer['name'], // Company name same as customer name
            $customer['email'],
            $customer['phone'],
            'NGN', // Default currency
            $customer['payment_terms'] ?? 'Due on Receipt',
            $customer['credit_limit'] ?? '',
            $customer['address'],
            $customer['city'],
            $customer['state'],
            $customer['country'] ?? 'Nigeria',
            $customer['postal_code'],
            $customer['address'], // Same as billing
            $customer['city'],
            $customer['state'],
            $customer['country'] ?? 'Nigeria',
            $customer['postal_code'],
            $customer['tax_number'],
            'Imported from Firma Flow | Total Sales: ' . number_format($customer['total_sales_amount'] ?? 0, 2) . 
            ' | Sales Count: ' . ($customer['total_sales_count'] ?? 0) . 
            ' | Outstanding: ' . number_format($customer['total_outstanding'] ?? 0, 2)
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

/**
 * Export customers in QuickBooks compatible format
 */
function exportCustomersQuickBooksFormat($customers) {
    $filename = 'customers_quickbooks_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    // QuickBooks customer import headers
    $headers = [
        'Name',
        'CompanyName',
        'FirstName',
        'LastName',
        'BillAddr1',
        'BillCity',
        'BillState',
        'BillPostalCode',
        'BillCountry',
        'ShipAddr1',
        'ShipCity',
        'ShipState', 
        'ShipPostalCode',
        'ShipCountry',
        'Phone',
        'Email',
        'Contact',
        'AltContact',
        'Fax',
        'Terms',
        'CreditLimit',
        'TaxItem',
        'SalesTaxCode',
        'CustomField1'
    ];
    
    fputcsv($output, $headers);
    
    foreach ($customers as $customer) {
        $nameParts = explode(' ', $customer['name'], 2);
        $firstName = $nameParts[0] ?? '';
        $lastName = $nameParts[1] ?? '';
        
        $row = [
            $customer['name'],
            $customer['name'],
            $firstName,
            $lastName,
            $customer['address'],
            $customer['city'],
            $customer['state'],
            $customer['postal_code'],
            $customer['country'] ?? 'Nigeria',
            $customer['address'], // Same as billing
            $customer['city'],
            $customer['state'],
            $customer['postal_code'],
            $customer['country'] ?? 'Nigeria',
            $customer['phone'],
            $customer['email'],
            $customer['name'],
            '',
            '',
            $customer['payment_terms'] ?? 'Due on Receipt',
            $customer['credit_limit'] ?? '',
            '',
            '',
            'Sales: ' . number_format($customer['total_sales_amount'] ?? 0, 2) . ' | Count: ' . ($customer['total_sales_count'] ?? 0)
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

/**
 * Export products in Zoho Books compatible format
 */
function exportProductsZohoFormat($products) {
    $filename = 'products_zoho_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    // Zoho Books item import headers
    $headers = [
        'Item Name*',
        'Item Type*',
        'Description',
        'Rate*',
        'Account*',
        'Tax',
        'SKU',
        'Unit',
        'Category',
        'Opening Stock',
        'Opening Stock Rate',
        'Reorder Level',
        'Preferred Vendor',
        'Vendor Price',
        'Status'
    ];
    
    fputcsv($output, $headers);
    
    foreach ($products as $product) {
        $row = [
            $product['name'],
            'inventory', // Item type
            $product['description'] . ' | Total Sold: ' . ($product['total_sold_quantity'] ?? 0) . ' | Revenue: ' . number_format($product['total_sales_amount'] ?? 0, 2),
            $product['unit_price'],
            'Sales', // Default account
            $product['tax_rate'] ?? '', // Tax rate
            $product['sku'],
            $product['unit_of_measure'],
            $product['category'],
            $product['quantity_in_stock'],
            $product['cost_price'],
            $product['low_stock_threshold'],
            '',
            $product['average_purchase_cost'] ?? $product['cost_price'],
            $product['is_active'] ? 'Active' : 'Inactive'
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

/**
 * Export products in QuickBooks compatible format
 */
function exportProductsQuickBooksFormat($products) {
    $filename = 'products_quickbooks_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    // QuickBooks item import headers
    $headers = [
        'Name',
        'Type',
        'Description',
        'Price',
        'Cost',
        'COGSAccount',
        'IncomeAccount',
        'AssetAccount',
        'QtyOnHand',
        'U_M',
        'CustomField1',
        'CustomField2'
    ];
    
    fputcsv($output, $headers);
    
    foreach ($products as $product) {
        $row = [
            $product['name'],
            'Inventory Part',
            $product['description'] . ' | Sold: ' . ($product['total_sold_quantity'] ?? 0) . ' units',
            $product['unit_price'],
            $product['cost_price'],
            'Cost of Goods Sold',
            'Sales',
            'Inventory Asset',
            $product['quantity_in_stock'],
            $product['unit_of_measure'],
            $product['sku'],
            'Revenue: ' . number_format($product['total_sales_amount'] ?? 0, 2) . ' | Sales: ' . ($product['number_of_sales'] ?? 0)
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

/**
 * Export sales in Zoho Books compatible format
 */
function exportSalesZohoFormat($comprehensive_data) {
    $filename = 'all_transactions_zoho_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    // Zoho Books transaction import headers
    $headers = [
        'CustomerName*',
        'InvoiceNumber*',
        'InvoiceDate*',
        'DueDate',
        'Subject',
        'SubTotal',
        'Discount',
        'Tax',
        'Total',
        'PaidStatus',
        'PaymentDate',
        'Notes',
        'Terms'
    ];
    
    fputcsv($output, $headers);
    
    foreach ($comprehensive_data as $transaction) {
        // Only export sales and invoice-like transactions to Zoho
        if (in_array($transaction['transaction_type'], ['Sale', 'Purchase'])) {
            $row = [
                $transaction['party_name'],
                $transaction['reference_number'],
                $transaction['transaction_date'],
                $transaction['due_date'],
                $transaction['transaction_type'] . ' Transaction',
                $transaction['subtotal'],
                $transaction['discount_amount'],
                $transaction['tax_amount'],
                $transaction['total_amount'],
                $transaction['payment_status'],
                $transaction['payment_status'] === 'paid' ? $transaction['transaction_date'] : '',
                $transaction['notes'] . ' | Items: ' . $transaction['items_detail'],
                'Net 30'
            ];
            fputcsv($output, $row);
        }
    }
    
    fclose($output);
}

/**
 * Export sales in QuickBooks compatible format
 */
function exportSalesQuickBooksFormat($comprehensive_data) {
    $filename = 'all_transactions_quickbooks_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    // QuickBooks transaction import headers
    $headers = [
        'Customer',
        'RefNumber',
        'TxnDate',
        'DueDate',
        'Terms',
        'Memo',
        'Item',
        'Quantity',
        'Rate',
        'Amount',
        'SalesTaxCode'
    ];
    
    fputcsv($output, $headers);
    
    foreach ($comprehensive_data as $transaction) {
        // Export all transaction types to QuickBooks
        $row = [
            $transaction['party_name'],
            $transaction['reference_number'],
            $transaction['transaction_date'],
            $transaction['due_date'],
            'Net 30',
            $transaction['notes'] . ' | Type: ' . $transaction['transaction_type'],
            $transaction['transaction_type'],
            '1',
            $transaction['subtotal'],
            $transaction['total_amount'],
            $transaction['tax_amount'] > 0 ? 'TAX' : ''
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

/**
 * Standard CSV export functions
 */
function exportCustomersCSV($customers) {
    $filename = 'customers_export_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    if (!empty($customers)) {
        // Create simplified headers for existing fields only
        $headers = [
            'customer_id', 'name', 'email', 'phone', 'address', 
            'payment_terms', 'credit_limit', 'balance', 'customer_type',
            'is_active', 'created_at', 'updated_at',
            'total_sales_amount', 'total_sales_count', 'total_amount_paid', 
            'total_outstanding', 'last_sale_date', 'first_sale_date',
            'total_payments_amount', 'total_payment_count', 'last_payment_date'
        ];
        
        fputcsv($output, $headers);
        
        foreach ($customers as $customer) {
            $row = [
                $customer['customer_id'] ?? '',
                $customer['name'] ?? '',
                $customer['email'] ?? '',
                $customer['phone'] ?? '',
                $customer['address'] ?? '',
                $customer['payment_terms'] ?? '',
                $customer['credit_limit'] ?? 0,
                $customer['balance'] ?? 0,
                $customer['customer_type'] ?? '',
                $customer['is_active'] ? 'Active' : 'Inactive',
                $customer['created_at'] ?? '',
                $customer['updated_at'] ?? '',
                $customer['total_sales_amount'] ?? 0,
                $customer['total_sales_count'] ?? 0,
                $customer['total_amount_paid'] ?? 0,
                $customer['total_outstanding'] ?? 0,
                $customer['last_sale_date'] ?? '',
                $customer['first_sale_date'] ?? '',
                $customer['total_payments_amount'] ?? 0,
                $customer['total_payment_count'] ?? 0,
                $customer['last_payment_date'] ?? ''
            ];
            fputcsv($output, $row);
        }
    }
    
    fclose($output);
}

function exportProductsCSV($products) {
    $filename = 'products_comprehensive_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    if (!empty($products)) {
        // Create comprehensive headers
        $headers = [
            'product_id', 'name', 'sku', 'description', 'category', 'unit_price', 
            'cost_price', 'quantity_in_stock', 'low_stock_threshold', 'unit_of_measure',
            'tax_rate', 'is_active', 'created_at', 'updated_at', 'barcode',
            'total_sold_quantity', 'total_sales_amount', 'number_of_sales',
            'last_sale_date', 'first_sale_date', 'average_selling_price',
            'total_purchased_quantity', 'total_purchase_amount', 'number_of_purchases',
            'last_purchase_date', 'first_purchase_date', 'average_purchase_cost',
            'inventory_value', 'lifetime_revenue', 'estimated_profit',
            'transaction_history', 'sales_history', 'current_suppliers'
        ];
        
        fputcsv($output, $headers);
        
        foreach ($products as $product) {
            $row = [
                $product['product_id'], $product['name'], $product['sku'],
                $product['description'], $product['category'], $product['unit_price'],
                $product['cost_price'], $product['quantity_in_stock'], 
                $product['low_stock_threshold'], $product['unit_of_measure'],
                $product['tax_rate'], $product['is_active'] ? 'Active' : 'Inactive',
                $product['created_at'], $product['updated_at'], $product['barcode'] ?? '',
                $product['total_sold_quantity'], $product['total_sales_amount'],
                $product['number_of_sales'], $product['last_sale_date'],
                $product['first_sale_date'], $product['average_selling_price'],
                $product['total_purchased_quantity'], $product['total_purchase_amount'],
                $product['number_of_purchases'], $product['last_purchase_date'],
                $product['first_purchase_date'], $product['average_purchase_cost'],
                $product['inventory_value'], $product['lifetime_revenue'], 
                $product['estimated_profit'],
                json_encode($product['transaction_history'] ?? []),
                json_encode($product['sales_history'] ?? []),
                json_encode($product['current_suppliers'] ?? [])
            ];
            fputcsv($output, $row);
        }
    }
    
    fclose($output);
}

function exportSalesCSV($comprehensive_data) {
    $filename = 'all_transactions_comprehensive_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    if (!empty($comprehensive_data)) {
        // Create comprehensive transaction headers
        $headers = [
            'transaction_type', 'reference_number', 'transaction_date', 'due_date',
            'party_name', 'party_email', 'party_phone', 'subtotal', 'tax_amount',
            'discount_amount', 'total_amount', 'amount_paid', 'balance_due',
            'status', 'payment_status', 'notes', 'items_detail', 'created_at'
        ];
        
        fputcsv($output, $headers);
        
        foreach ($comprehensive_data as $transaction) {
            fputcsv($output, [
                $transaction['transaction_type'],
                $transaction['reference_number'],
                $transaction['transaction_date'],
                $transaction['due_date'],
                $transaction['party_name'],
                $transaction['party_email'],
                $transaction['party_phone'],
                $transaction['subtotal'],
                $transaction['tax_amount'],
                $transaction['discount_amount'],
                $transaction['total_amount'],
                $transaction['amount_paid'],
                $transaction['balance_due'],
                $transaction['status'],
                $transaction['payment_status'],
                $transaction['notes'],
                $transaction['items_detail'],
                $transaction['created_at']
            ]);
        }
    }
    
    fclose($output);
}

/**
 * Excel export functions (simplified - would need PhpSpreadsheet for full Excel support)
 */
function exportCustomersExcel($customers) {
    // For now, export as CSV with Excel-friendly formatting
    exportCustomersCSV($customers);
}

function exportProductsExcel($products) {
    // For now, export as CSV with Excel-friendly formatting  
    exportProductsCSV($products);
}

function exportSalesExcel($sales) {
    // For now, export as CSV with Excel-friendly formatting
    exportSalesCSV($sales);
}

/**
 * Helper functions for comprehensive data export
 */
function getCustomerTransactionHistory($pdo, $company_id, $customer_id) {
    $sql = "
        SELECT 
            'sale' as transaction_type,
            s.invoice_number as reference,
            s.sale_date as transaction_date,
            s.total_amount,
            s.amount_paid,
            s.balance_due,
            s.status,
            s.payment_status,
            s.notes
        FROM sales s
        WHERE s.company_id = ? AND s.customer_id = ?
        UNION ALL
        SELECT 
            'payment' as transaction_type,
            p.payment_reference as reference,
            p.payment_date as transaction_date,
            p.amount as total_amount,
            p.amount as amount_paid,
            0 as balance_due,
            'completed' as status,
            'paid' as payment_status,
            p.notes
        FROM payments p
        WHERE p.company_id = ? AND p.customer_id = ?
        ORDER BY transaction_date DESC
        LIMIT 50
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $customer_id, $company_id, $customer_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getCustomerRecentSales($pdo, $company_id, $customer_id) {
    $sql = "
        SELECT 
            s.invoice_number,
            s.sale_date,
            s.due_date,
            s.subtotal,
            s.tax_amount,
            s.discount_amount,
            s.total_amount,
            s.amount_paid,
            s.balance_due,
            s.status,
            s.payment_status,
            s.notes,
            GROUP_CONCAT(
                CONCAT(si.product_name, ' (', si.quantity, ' x ', si.unit_price, ')')
                SEPARATOR '; '
            ) as sale_items
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE s.company_id = ? AND s.customer_id = ?
        GROUP BY s.id
        ORDER BY s.sale_date DESC
        LIMIT 20
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $customer_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getCustomerPaymentHistory($pdo, $company_id, $customer_id) {
    $sql = "
        SELECT 
            p.payment_reference,
            p.payment_date,
            p.amount,
            p.payment_method,
            p.notes,
            s.invoice_number
        FROM payments p
        LEFT JOIN sales s ON p.sale_id = s.id
        WHERE p.company_id = ? AND p.customer_id = ?
        ORDER BY p.payment_date DESC
        LIMIT 20
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $customer_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getProductTransactionHistory($pdo, $company_id, $product_id) {
    $sql = "
        SELECT 
            'sale' as transaction_type,
            s.invoice_number as reference,
            s.sale_date as transaction_date,
            si.quantity,
            si.unit_price,
            (si.quantity * si.unit_price) as total_amount,
            c.name as customer_name
        FROM sale_items si
        INNER JOIN sales s ON si.sale_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.company_id = ? AND si.product_id = ?
        UNION ALL
        SELECT 
            'purchase' as transaction_type,
            pur.purchase_order_number as reference,
            pur.purchase_date as transaction_date,
            pi.quantity,
            pi.unit_cost as unit_price,
            (pi.quantity * pi.unit_cost) as total_amount,
            sup.name as customer_name
        FROM purchase_items pi
        INNER JOIN purchases pur ON pi.purchase_id = pur.id
        LEFT JOIN suppliers sup ON pur.supplier_id = sup.id
        WHERE pur.company_id = ? AND pi.product_id = ?
        ORDER BY transaction_date DESC
        LIMIT 50
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $product_id, $company_id, $product_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getProductSalesHistory($pdo, $company_id, $product_id) {
    $sql = "
        SELECT 
            s.invoice_number,
            s.sale_date,
            c.name as customer_name,
            si.quantity,
            si.unit_price,
            si.discount_amount,
            (si.quantity * si.unit_price - COALESCE(si.discount_amount, 0)) as line_total
        FROM sale_items si
        INNER JOIN sales s ON si.sale_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.company_id = ? AND si.product_id = ?
        ORDER BY s.sale_date DESC
        LIMIT 100
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $product_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getAllTransactionsByType($pdo, $company_id, $transaction_type) {
    switch ($transaction_type) {
        case 'sales':
            $sql = "
                SELECT 
                    s.id,
                    s.invoice_number,
                    s.sale_date,
                    s.due_date,
                    c.name as customer_name,
                    c.email as customer_email,
                    c.phone as customer_phone,
                    s.subtotal,
                    s.tax_amount,
                    s.discount_amount,
                    s.total_amount,
                    s.amount_paid,
                    s.balance_due,
                    s.status,
                    s.payment_status,
                    s.notes,
                    s.created_at,
                    GROUP_CONCAT(
                        CONCAT(si.product_name, ' | Qty: ', si.quantity, ' | Price: ', si.unit_price, ' | Total: ', (si.quantity * si.unit_price))
                        SEPARATOR '; '
                    ) as sale_items_detail
                FROM sales s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN sale_items si ON s.id = si.sale_id
                WHERE s.company_id = ?
                GROUP BY s.id
                ORDER BY s.sale_date DESC
            ";
            break;
            
        case 'purchases':
            $sql = "
                SELECT 
                    p.id,
                    p.purchase_order_number as reference_number,
                    p.purchase_date,
                    p.expected_delivery_date,
                    sup.name as supplier_name,
                    sup.email as supplier_email,
                    sup.phone as supplier_phone,
                    p.subtotal,
                    p.tax_amount,
                    p.discount_amount,
                    p.total_amount,
                    p.amount_paid,
                    p.balance_due,
                    p.status,
                    p.payment_status,
                    p.notes,
                    p.created_at,
                    GROUP_CONCAT(
                        CONCAT(pi.product_name, ' | Qty: ', pi.quantity, ' | Cost: ', pi.unit_cost, ' | Total: ', (pi.quantity * pi.unit_cost))
                        SEPARATOR '; '
                    ) as purchase_items_detail
                FROM purchases p
                LEFT JOIN suppliers sup ON p.supplier_id = sup.id
                LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
                WHERE p.company_id = ?
                GROUP BY p.id
                ORDER BY p.purchase_date DESC
            ";
            break;
            
        case 'payments':
            $sql = "
                SELECT 
                    pay.id,
                    pay.payment_reference as reference_number,
                    pay.payment_date,
                    pay.amount,
                    pay.payment_method,
                    pay.payment_type,
                    pay.notes,
                    c.name as customer_name,
                    sup.name as supplier_name,
                    s.invoice_number as related_sale,
                    pur.purchase_order_number as related_purchase,
                    pay.created_at
                FROM payments pay
                LEFT JOIN customers c ON pay.customer_id = c.id
                LEFT JOIN suppliers sup ON pay.supplier_id = sup.id
                LEFT JOIN sales s ON pay.sale_id = s.id
                LEFT JOIN purchases pur ON pay.purchase_id = pur.id
                WHERE pay.company_id = ?
                ORDER BY pay.payment_date DESC
            ";
            break;
            
        case 'expenses':
            $sql = "
                SELECT 
                    e.id,
                    e.reference,
                    e.expense_date,
                    e.payee_name,
                    e.expense_category,
                    e.amount,
                    e.payment_method,
                    e.description,
                    e.receipt_path,
                    e.status,
                    e.created_at
                FROM expenses e
                WHERE e.company_id = ?
                ORDER BY e.expense_date DESC
            ";
            break;
            
        default:
            return [];
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getProductSuppliers($pdo, $company_id, $product_id) {
    $sql = "
        SELECT DISTINCT
            s.name as supplier_name,
            s.email as supplier_email,
            s.phone as supplier_phone,
            pi.unit_cost as last_purchase_cost,
            pur.purchase_date as last_purchase_date
        FROM suppliers s
        INNER JOIN purchases pur ON s.id = pur.supplier_id
        INNER JOIN purchase_items pi ON pur.id = pi.purchase_id
        WHERE pur.company_id = ? AND pi.product_id = ?
        ORDER BY pur.purchase_date DESC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $product_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getProductInventoryMovements($pdo, $company_id, $product_id) {
    $sql = "
        SELECT 
            'sale' as movement_type,
            s.sale_date as movement_date,
            -si.quantity as quantity_change,
            s.invoice_number as reference,
            c.name as party_name,
            'Product Sold' as notes
        FROM sale_items si
        INNER JOIN sales s ON si.sale_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.company_id = ? AND si.product_id = ?
        UNION ALL
        SELECT 
            'purchase' as movement_type,
            pur.purchase_date as movement_date,
            pi.quantity as quantity_change,
            pur.purchase_order_number as reference,
            sup.name as party_name,
            'Product Purchased' as notes
        FROM purchase_items pi
        INNER JOIN purchases pur ON pi.purchase_id = pur.id
        LEFT JOIN suppliers sup ON pur.supplier_id = sup.id
        WHERE pur.company_id = ? AND pi.product_id = ?
        ORDER BY movement_date DESC
        LIMIT 100
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $product_id, $company_id, $product_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>
