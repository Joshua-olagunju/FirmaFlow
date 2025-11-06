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
 * Export customers data (simplified version that works)
 */
function exportCustomers($pdo, $company_id, $format) {
    // Simple customer query with actual field names
    $sql = "
        SELECT 
            c.id as customer_id,
            c.name,
            c.email,
            c.phone,
            c.billing_address,
            c.customer_type,
            c.payment_terms,
            c.credit_limit,
            c.balance,
            c.is_active,
            c.created_at,
            c.updated_at,
            -- Sales summary
            COALESCE(s.total_sales, 0) as total_sales_amount,
            COALESCE(s.sales_count, 0) as total_sales_count
        FROM customers c
        LEFT JOIN (
            SELECT 
                customer_id,
                COUNT(*) as sales_count,
                SUM(total_amount) as total_sales
            FROM sales 
            WHERE company_id = ?
            GROUP BY customer_id
        ) s ON c.id = s.customer_id
        WHERE c.company_id = ?
        ORDER BY c.name
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id, $company_id]);
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
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
 * Export products data (simplified version that works)
 */
function exportProducts($pdo, $company_id, $format) {
    // Simple product query with actual field names
    $sql = "
        SELECT 
            p.id as product_id,
            p.sku,
            p.name,
            p.description,
            p.unit,
            p.cost_price,
            p.selling_price,
            p.track_inventory,
            p.stock_quantity,
            p.reorder_level,
            p.is_active,
            p.created_at,
            p.updated_at
        FROM products p
        WHERE p.company_id = ?
        ORDER BY p.name
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
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
 * Export sales data (simplified version that works)
 */
function exportSales($pdo, $company_id, $format) {
    // Simple sales query with actual field names
    $sql = "
        SELECT 
            s.id as sale_id,
            s.customer_id,
            c.name as customer_name,
            c.email as customer_email,
            s.total_amount,
            s.payment_status,
            s.created_at,
            s.updated_at
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.company_id = ?
        ORDER BY s.created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$company_id]);
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($format === 'zoho') {
        exportSalesZohoFormat($sales);
    } elseif ($format === 'quickbooks') {
        exportSalesQuickBooksFormat($sales);
    } elseif ($format === 'excel') {
        exportSalesExcel($sales);
    } else {
        exportSalesCSV($sales);
    }
}

// Simple CSV export functions
function exportCustomersCSV($customers) {
    $filename = 'customers_export_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    if (!empty($customers)) {
        fputcsv($output, array_keys($customers[0]));
        foreach ($customers as $customer) {
            fputcsv($output, $customer);
        }
    }
    
    fclose($output);
}

function exportProductsCSV($products) {
    $filename = 'products_export_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    if (!empty($products)) {
        fputcsv($output, array_keys($products[0]));
        foreach ($products as $product) {
            fputcsv($output, $product);
        }
    }
    
    fclose($output);
}

function exportSalesCSV($sales) {
    $filename = 'sales_export_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    if (!empty($sales)) {
        fputcsv($output, array_keys($sales[0]));
        foreach ($sales as $sale) {
            fputcsv($output, $sale);
        }
    }
    
    fclose($output);
}

// Simple Zoho format exports
function exportCustomersZohoFormat($customers) {
    $filename = 'customers_zoho_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    $headers = ['Customer Name*', 'Customer Email', 'Customer Phone', 'Currency Code', 'Payment Terms', 'Credit Limit'];
    fputcsv($output, $headers);
    
    foreach ($customers as $customer) {
        $row = [
            $customer['name'],
            $customer['email'],
            $customer['phone'],
            'NGN',
            $customer['payment_terms'] ?? 'Due on Receipt',
            $customer['credit_limit'] ?? ''
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

function exportProductsZohoFormat($products) {
    $filename = 'products_zoho_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    $headers = ['Item Name*', 'Item Type*', 'Description', 'Rate*', 'SKU', 'Unit'];
    fputcsv($output, $headers);
    
    foreach ($products as $product) {
        $row = [
            $product['name'],
            'inventory',
            $product['description'],
            $product['selling_price'],
            $product['sku'],
            $product['unit']
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

function exportSalesZohoFormat($sales) {
    $filename = 'sales_zoho_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    $headers = ['CustomerName*', 'InvoiceNumber*', 'InvoiceDate*', 'Total', 'PaidStatus'];
    fputcsv($output, $headers);
    
    foreach ($sales as $sale) {
        $row = [
            $sale['customer_name'],
            'INV-' . $sale['sale_id'],
            date('Y-m-d', strtotime($sale['created_at'])),
            $sale['total_amount'],
            $sale['payment_status']
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

// QuickBooks formats (similar to Zoho but different headers)
function exportCustomersQuickBooksFormat($customers) {
    $filename = 'customers_quickbooks_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    $headers = ['Name', 'Email', 'Phone', 'Terms', 'CreditLimit'];
    fputcsv($output, $headers);
    
    foreach ($customers as $customer) {
        $row = [
            $customer['name'],
            $customer['email'],
            $customer['phone'],
            $customer['payment_terms'] ?? 'Due on Receipt',
            $customer['credit_limit'] ?? ''
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

function exportProductsQuickBooksFormat($products) {
    $filename = 'products_quickbooks_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    $headers = ['Name', 'Type', 'Description', 'Price', 'Cost', 'QtyOnHand'];
    fputcsv($output, $headers);
    
    foreach ($products as $product) {
        $row = [
            $product['name'],
            'Inventory Part',
            $product['description'],
            $product['selling_price'],
            $product['cost_price'],
            $product['stock_quantity']
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

function exportSalesQuickBooksFormat($sales) {
    $filename = 'sales_quickbooks_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    $headers = ['Customer', 'RefNumber', 'TxnDate', 'Amount'];
    fputcsv($output, $headers);
    
    foreach ($sales as $sale) {
        $row = [
            $sale['customer_name'],
            'INV-' . $sale['sale_id'],
            date('Y-m-d', strtotime($sale['created_at'])),
            $sale['total_amount']
        ];
        fputcsv($output, $row);
    }
    
    fclose($output);
}

// Excel exports (same as CSV for now)
function exportCustomersExcel($customers) {
    exportCustomersCSV($customers);
}

function exportProductsExcel($products) {
    exportProductsCSV($products);
}

function exportSalesExcel($sales) {
    exportSalesCSV($sales);
}
?>
