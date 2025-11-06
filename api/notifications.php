<?php
require_once '../db.php';
require_once '../check_auth.php';

// Set JSON response header
header('Content-Type: application/json');

// Enable CORS if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get current user and company info
$current_user_id = $_SESSION['user_id'] ?? null;
$current_company_id = $_SESSION['company_id'] ?? null;

if (!$current_user_id || !$current_company_id) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'send_test_email':
            handleSendTestEmail($input);
            break;
            
        case 'send_notification':
            handleSendNotification($input);
            break;
            
        case 'get_notification_settings':
            handleGetNotificationSettings();
            break;
            
        case 'check_overdue_invoices':
            handleCheckOverdueInvoices();
            break;
            
        case 'check_low_stock':
            handleCheckLowStock();
            break;
            
        case 'trigger_browser_notification':
            handleTriggerBrowserNotification($input);
            break;
            
        case 'get_browser_notifications':
            handleGetBrowserNotifications();
            break;
            
        case 'mark_notification_read':
            handleMarkNotificationRead($input);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

function handleSendTestEmail($input) {
    global $current_company_id;
    
    $email = $input['email'] ?? '';
    if (empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Email address is required']);
        return;
    }
    
    $subject = '[Firmaflow] Test Email Notification';
    $message = "
    <html>
    <head>
        <title>Firmaflow Test Email</title>
    </head>
    <body>
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <div style='background-color: #f8f9fa; padding: 20px; border-radius: 10px;'>
                <h2 style='color: #28a745;'>🔔 Firmaflow Notification Test</h2>
                <p>Dear Administrator,</p>
                <p>This is a test email to confirm that your notification system is working correctly.</p>
                
                <div style='background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h4>Test Details:</h4>
                    <ul>
                        <li><strong>Company ID:</strong> $current_company_id</li>
                        <li><strong>Test Time:</strong> " . date('Y-m-d H:i:s') . "</li>
                        <li><strong>Email Configuration:</strong> Working ✅</li>
                    </ul>
                </div>
                
                <p>If you're receiving this email, your notification system is properly configured!</p>
                
                <hr style='margin: 20px 0;'>
                <p style='color: #6c757d; font-size: 12px;'>
                    This is an automated message from Firmaflow. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Firmaflow System <noreply@firmaflow.com>" . "\r\n";
    
    if (mail($email, $subject, $message, $headers)) {
        echo json_encode(['success' => true, 'message' => 'Test email sent successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to send test email. Please check your server email configuration.']);
    }
}

function handleSendNotification($input) {
    $type = $input['type'] ?? '';
    $title = $input['title'] ?? '';
    $message = $input['message'] ?? '';
    $data = $input['data'] ?? [];
    
    // Get notification settings
    $settings = getNotificationSettings();
    
    switch ($type) {
        case 'new_sale':
            if ($settings['email_new_sale']) {
                sendEmailNotification('New Sale Alert', $message, $settings['notification_email']);
            }
            if ($settings['browser_new_sales']) {
                storeBrowserNotification($title, $message, 'sale', $data);
            }
            break;
            
        case 'overdue_invoice':
            if ($settings['email_overdue_invoices']) {
                sendEmailNotification('Overdue Invoice Alert', $message, $settings['notification_email']);
            }
            if ($settings['browser_overdue_alerts']) {
                storeBrowserNotification($title, $message, 'overdue', $data);
            }
            break;
            
        case 'low_stock':
            if ($settings['email_low_stock']) {
                sendEmailNotification('Low Stock Alert', $message, $settings['notification_email']);
            }
            if ($settings['browser_low_stock']) {
                storeBrowserNotification($title, $message, 'stock', $data);
            }
            break;
            
        case 'sales_reversal':
            if ($settings['email_reversal_alerts']) {
                sendEmailNotification('Sales Reversal Alert', $message, $settings['notification_email']);
            }
            break;
            
        case 'payment_received':
            if ($settings['email_payment_received']) {
                sendEmailNotification('Payment Received', $message, $settings['notification_email']);
            }
            break;
    }
    
    echo json_encode(['success' => true, 'message' => 'Notification sent']);
}

function handleGetNotificationSettings() {
    $settings = getNotificationSettings();
    echo json_encode(['success' => true, 'settings' => $settings]);
}

function handleCheckOverdueInvoices() {
    global $pdo, $current_company_id;
    
    // Get overdue invoices
    $stmt = $pdo->prepare("
        SELECT 
            si.*,
            c.name as customer_name,
            DATEDIFF(CURDATE(), si.due_date) as days_overdue
        FROM sales_invoices si 
        JOIN customers c ON si.customer_id = c.id 
        WHERE si.company_id = ? 
        AND si.status IN ('pending', 'sent') 
        AND si.due_date < CURDATE()
        AND (si.total_amount - COALESCE(si.amount_paid, 0)) > 0
        ORDER BY si.due_date ASC
    ");
    $stmt->execute([$current_company_id]);
    $overdue_invoices = $stmt->fetchAll();
    
    if (empty($overdue_invoices)) {
        echo json_encode(['success' => true, 'overdue_count' => 0, 'message' => 'No overdue invoices found']);
        return;
    }
    
    $total_overdue = array_sum(array_column($overdue_invoices, 'total_amount'));
    $overdue_count = count($overdue_invoices);
    
    // Check if we should send notification based on frequency
    $settings = getNotificationSettings();
    $should_notify = shouldSendOverdueNotification($settings['overdue_alert_frequency']);
    
    if ($should_notify) {
        $message = "You have $overdue_count overdue invoices totaling ₦" . number_format($total_overdue, 2);
        
        if ($settings['email_overdue_invoices']) {
            sendOverdueInvoicesEmail($overdue_invoices, $settings['notification_email']);
        }
        
        if ($settings['browser_overdue_alerts']) {
            storeBrowserNotification(
                'Overdue Invoices Alert', 
                $message, 
                'overdue', 
                ['count' => $overdue_count, 'total' => $total_overdue]
            );
        }
        
        // Update last notification time
        updateLastNotificationTime('overdue_invoices');
    }
    
    echo json_encode([
        'success' => true, 
        'overdue_count' => $overdue_count,
        'total_overdue' => $total_overdue,
        'notification_sent' => $should_notify,
        'invoices' => $overdue_invoices
    ]);
}

function handleCheckLowStock() {
    global $pdo, $current_company_id;
    
    $settings = getNotificationSettings();
    $threshold = $settings['low_stock_threshold'] ?? 10;
    
    // Get low stock products
    $stmt = $pdo->prepare("
        SELECT 
            id, name, sku, stock_quantity, unit, selling_price
        FROM products 
        WHERE company_id = ? 
        AND stock_quantity <= ? 
        AND stock_quantity > 0
        ORDER BY stock_quantity ASC
    ");
    $stmt->execute([$current_company_id, $threshold]);
    $low_stock_products = $stmt->fetchAll();
    
    if (empty($low_stock_products)) {
        echo json_encode(['success' => true, 'low_stock_count' => 0, 'message' => 'No low stock products found']);
        return;
    }
    
    $low_stock_count = count($low_stock_products);
    $should_notify = shouldSendLowStockNotification();
    
    if ($should_notify) {
        $message = "You have $low_stock_count products running low on stock";
        
        if ($settings['email_low_stock']) {
            sendLowStockEmail($low_stock_products, $settings['notification_email']);
        }
        
        if ($settings['browser_low_stock']) {
            storeBrowserNotification(
                'Low Stock Alert', 
                $message, 
                'stock', 
                ['count' => $low_stock_count, 'products' => $low_stock_products]
            );
        }
        
        updateLastNotificationTime('low_stock');
    }
    
    echo json_encode([
        'success' => true, 
        'low_stock_count' => $low_stock_count,
        'notification_sent' => $should_notify,
        'products' => $low_stock_products
    ]);
}

function handleTriggerBrowserNotification($input) {
    $title = $input['title'] ?? '';
    $message = $input['message'] ?? '';
    $type = $input['type'] ?? 'info';
    $data = $input['data'] ?? [];
    
    storeBrowserNotification($title, $message, $type, $data);
    echo json_encode(['success' => true, 'message' => 'Browser notification queued']);
}

function handleGetBrowserNotifications() {
    global $pdo, $current_company_id, $current_user_id;
    
    // Get unread browser notifications for the current user/company
    $stmt = $pdo->prepare("
        SELECT id, title, message, type, data, created_at 
        FROM browser_notifications 
        WHERE company_id = ? 
        AND (user_id IS NULL OR user_id = ?) 
        AND is_read = FALSE 
        AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ORDER BY created_at DESC
        LIMIT 10
    ");
    $stmt->execute([$current_company_id, $current_user_id]);
    $notifications = $stmt->fetchAll();
    
    // Mark notifications as read
    if (!empty($notifications)) {
        $notification_ids = array_column($notifications, 'id');
        $placeholders = str_repeat('?,', count($notification_ids) - 1) . '?';
        $update_stmt = $pdo->prepare("UPDATE browser_notifications SET is_read = TRUE WHERE id IN ($placeholders)");
        $update_stmt->execute($notification_ids);
    }
    
    // Parse JSON data for each notification
    foreach ($notifications as &$notification) {
        $notification['data'] = json_decode($notification['data'], true);
    }
    
    echo json_encode(['success' => true, 'notifications' => $notifications]);
}

function handleMarkNotificationRead($input) {
    global $pdo, $current_company_id;
    
    $notification_id = $input['notification_id'] ?? 0;
    
    if (!$notification_id) {
        echo json_encode(['success' => false, 'message' => 'Notification ID required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        UPDATE browser_notifications 
        SET is_read = TRUE 
        WHERE id = ? AND company_id = ?
    ");
    $stmt->execute([$notification_id, $current_company_id]);
    
    echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
}

// Helper functions
function getNotificationSettings() {
    global $pdo, $current_company_id;
    
    $stmt = $pdo->prepare("
        SELECT setting_key, setting_value, setting_type 
        FROM company_settings 
        WHERE company_id = ? 
        AND setting_key LIKE '%notification%' OR setting_key LIKE '%email_%' OR setting_key LIKE '%browser_%'
    ");
    $stmt->execute([$current_company_id]);
    $results = $stmt->fetchAll();
    
    $settings = [
        'email_low_stock' => true,
        'email_new_sale' => true,
        'email_overdue_invoices' => true,
        'email_payment_received' => false,
        'email_daily_summary' => false,
        'email_weekly_report' => false,
        'email_reversal_alerts' => true,
        'email_system_maintenance' => false,
        'browser_notifications' => true,
        'browser_new_sales' => true,
        'browser_overdue_alerts' => false,
        'sound_alerts' => false,
        'browser_low_stock' => false,
        'notification_email' => '',
        'notification_email_secondary' => '',
        'notification_frequency' => 'immediate',
        'overdue_alert_frequency' => 'daily',
        'low_stock_threshold' => 10,
        'notification_timezone' => 'Africa/Lagos'
    ];
    
    foreach ($results as $row) {
        $key = $row['setting_key'];
        $value = $row['setting_value'];
        
        if ($row['setting_type'] === 'boolean') {
            $settings[$key] = (bool)$value;
        } elseif ($row['setting_type'] === 'number') {
            $settings[$key] = (int)$value;
        } else {
            $settings[$key] = $value;
        }
    }
    
    return $settings;
}

function sendEmailNotification($subject, $message, $email) {
    if (empty($email)) return false;
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Firmaflow System <noreply@firmaflow.com>" . "\r\n";
    
    $html_message = "
    <html>
    <body style='font-family: Arial, sans-serif;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
            <h2 style='color: #28a745;'>$subject</h2>
            <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px;'>
                $message
            </div>
            <hr style='margin: 20px 0;'>
            <p style='color: #6c757d; font-size: 12px;'>
                This is an automated message from Firmaflow. Time: " . date('Y-m-d H:i:s') . "
            </p>
        </div>
    </body>
    </html>
    ";
    
    return mail($email, "[Firmaflow] $subject", $html_message, $headers);
}

function sendOverdueInvoicesEmail($invoices, $email) {
    $total_overdue = array_sum(array_column($invoices, 'total_amount'));
    $count = count($invoices);
    
    $invoice_list = '';
    foreach ($invoices as $invoice) {
        $invoice_list .= "<tr>
            <td>{$invoice['invoice_number']}</td>
            <td>{$invoice['customer_name']}</td>
            <td>₦" . number_format($invoice['total_amount'], 2) . "</td>
            <td>{$invoice['due_date']}</td>
            <td>{$invoice['days_overdue']} days</td>
        </tr>";
    }
    
    $message = "
    <p>You have <strong>$count overdue invoices</strong> totaling <strong>₦" . number_format($total_overdue, 2) . "</strong></p>
    
    <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
        <thead>
            <tr style='background-color: #f8f9fa;'>
                <th style='border: 1px solid #ddd; padding: 8px;'>Invoice #</th>
                <th style='border: 1px solid #ddd; padding: 8px;'>Customer</th>
                <th style='border: 1px solid #ddd; padding: 8px;'>Amount</th>
                <th style='border: 1px solid #ddd; padding: 8px;'>Due Date</th>
                <th style='border: 1px solid #ddd; padding: 8px;'>Days Overdue</th>
            </tr>
        </thead>
        <tbody>
            $invoice_list
        </tbody>
    </table>
    
    <p>Please follow up with these customers to collect the outstanding payments.</p>
    ";
    
    sendEmailNotification('Overdue Invoices Alert', $message, $email);
}

function sendLowStockEmail($products, $email) {
    $count = count($products);
    
    $product_list = '';
    foreach ($products as $product) {
        $product_list .= "<tr>
            <td>{$product['name']}</td>
            <td>{$product['sku']}</td>
            <td>{$product['stock_quantity']} {$product['unit']}</td>
            <td>₦" . number_format($product['selling_price'], 2) . "</td>
        </tr>";
    }
    
    $message = "
    <p>You have <strong>$count products</strong> running low on stock:</p>
    
    <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
        <thead>
            <tr style='background-color: #f8f9fa;'>
                <th style='border: 1px solid #ddd; padding: 8px;'>Product Name</th>
                <th style='border: 1px solid #ddd; padding: 8px;'>SKU</th>
                <th style='border: 1px solid #ddd; padding: 8px;'>Stock Remaining</th>
                <th style='border: 1px solid #ddd; padding: 8px;'>Price</th>
            </tr>
        </thead>
        <tbody>
            $product_list
        </tbody>
    </table>
    
    <p>Please consider restocking these items to avoid running out of inventory.</p>
    ";
    
    sendEmailNotification('Low Stock Alert', $message, $email);
}

function storeBrowserNotification($title, $message, $type, $data = []) {
    global $pdo, $current_company_id, $current_user_id;
    
    $stmt = $pdo->prepare("
        INSERT INTO browser_notifications (company_id, user_id, title, message, type, data, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    
    // Create browser_notifications table if it doesn't exist
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS browser_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT NOT NULL,
            user_id INT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            data JSON NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_company_user (company_id, user_id),
            INDEX idx_created_at (created_at)
        )
    ");
    
    $stmt->execute([$current_company_id, $current_user_id, $title, $message, $type, json_encode($data)]);
}

function shouldSendOverdueNotification($frequency) {
    global $pdo, $current_company_id;
    
    // Check last notification time
    $stmt = $pdo->prepare("
        SELECT setting_value 
        FROM company_settings 
        WHERE company_id = ? AND setting_key = 'last_overdue_notification'
    ");
    $stmt->execute([$current_company_id]);
    $last_notification = $stmt->fetchColumn();
    
    if (!$last_notification) return true;
    
    $last_time = strtotime($last_notification);
    $now = time();
    
    switch ($frequency) {
        case 'daily':
            return ($now - $last_time) >= 86400; // 24 hours
        case 'weekly':
            return ($now - $last_time) >= 604800; // 7 days
        case 'monthly':
            return ($now - $last_time) >= 2592000; // 30 days
        case 'disabled':
            return false;
        default:
            return true;
    }
}

function shouldSendLowStockNotification() {
    global $pdo, $current_company_id;
    
    $stmt = $pdo->prepare("
        SELECT setting_value 
        FROM company_settings 
        WHERE company_id = ? AND setting_key = 'last_low_stock_notification'
    ");
    $stmt->execute([$current_company_id]);
    $last_notification = $stmt->fetchColumn();
    
    if (!$last_notification) return true;
    
    $last_time = strtotime($last_notification);
    $now = time();
    
    // Send low stock notifications once per day
    return ($now - $last_time) >= 86400;
}

function updateLastNotificationTime($type) {
    global $pdo, $current_company_id;
    
    $setting_key = "last_{$type}_notification";
    
    $stmt = $pdo->prepare("
        INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, updated_at) 
        VALUES (?, ?, NOW(), 'string', NOW())
        ON DUPLICATE KEY UPDATE setting_value = NOW(), updated_at = NOW()
    ");
    $stmt->execute([$current_company_id, $setting_key]);
}


?>
