<?php
// Notification Helper Functions
// Include this file to easily send notifications from anywhere in the system

function sendNotification($type, $title, $message, $data = []) {
    // Prepare notification data
    $notification_data = [
        'action' => 'send_notification',
        'type' => $type,
        'title' => $title,
        'message' => $message,
        'data' => $data
    ];
    
    // Call the notifications API internally
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/notifications.php');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($notification_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIE, session_name() . '=' . session_id());
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

function sendNewSaleNotification($invoice_data) {
    $title = "New Sale Recorded";
    $message = "New sale: {$invoice_data['invoice_number']} for ₦" . number_format($invoice_data['total_amount'], 2);
    
    return sendNotification('new_sale', $title, $message, $invoice_data);
}

function sendOverdueInvoiceNotification($invoice_data) {
    $title = "Invoice Overdue";
    $message = "Invoice {$invoice_data['invoice_number']} is now overdue (₦" . number_format($invoice_data['total_amount'], 2) . ")";
    
    return sendNotification('overdue_invoice', $title, $message, $invoice_data);
}

function sendLowStockNotification($product_data) {
    $title = "Low Stock Alert";
    $message = "Product '{$product_data['name']}' is running low ({$product_data['stock_quantity']} remaining)";
    
    return sendNotification('low_stock', $title, $message, $product_data);
}

function sendSalesReversalNotification($reversal_data) {
    $title = "Sales Reversal Alert";
    $message = "Invoice {$reversal_data['invoice_number']} has been automatically reversed due to non-payment";
    
    return sendNotification('sales_reversal', $title, $message, $reversal_data);
}

function sendPaymentReceivedNotification($payment_data) {
    $title = "Payment Received";
    $message = "Payment of ₦" . number_format($payment_data['amount'], 2) . " received for invoice {$payment_data['invoice_number']}";
    
    return sendNotification('payment_received', $title, $message, $payment_data);
}

function sendSystemMaintenanceNotification($maintenance_data) {
    $title = "System Maintenance";
    $message = $maintenance_data['message'] ?? "System maintenance notification";
    
    return sendNotification('system_maintenance', $title, $message, $maintenance_data);
}

// Browser notification functions for real-time alerts
function queueBrowserNotification($title, $message, $type = 'info', $data = []) {
    $notification_data = [
        'action' => 'trigger_browser_notification',
        'title' => $title,
        'message' => $message,
        'type' => $type,
        'data' => $data
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/notifications.php');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($notification_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIE, session_name() . '=' . session_id());
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Check and send periodic notifications
function checkAndSendPeriodicNotifications() {
    // Check overdue invoices
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/notifications.php?action=check_overdue_invoices');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIE, session_name() . '=' . session_id());
    $response = curl_exec($ch);
    curl_close($ch);
    
    // Check low stock
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/notifications.php?action=check_low_stock');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIE, session_name() . '=' . session_id());
    $response = curl_exec($ch);
    curl_close($ch);
    
    return true;
}
?>