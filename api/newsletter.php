<?php
/**
 * Newsletter Subscription API
 * Handles email collection from landing page
 */

// Enhanced error handling
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../includes/db.php';

// Create table if not exists
createNewsletterTable();

// Set JSON content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            handleSubscription();
            break;
            
        case 'GET':
            if (isset($_GET['action'])) {
                switch ($_GET['action']) {
                    case 'stats':
                        getSubscriptionStats();
                        break;
                    case 'list':
                        getSubscriptionList();
                        break;
                    case 'export':
                        exportSubscriptions();
                        break;
                    default:
                        jsonError('Invalid action');
                }
            } else {
                jsonError('Action required');
            }
            break;
            
        default:
            jsonError('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Newsletter API Error: ' . $e->getMessage());
    jsonError('Server error', 500);
}

/**
 * Handle email subscription
 */
function handleSubscription() {
    global $pdo;
    
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST; // Fallback to form data
    }
    
    $email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
    
    if (!$email) {
        jsonError('Valid email address required');
    }
    
    // Get client information
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $referrer = $_SERVER['HTTP_REFERER'] ?? null;
    $sourcePage = $input['source'] ?? 'landing_page';
    
    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id, status FROM newsletter_subscriptions WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            if ($existing['status'] === 'active') {
                jsonSuccess('You are already subscribed! Thank you for your interest in FirmaFlow.');
            } else {
                // Reactivate subscription
                $stmt = $pdo->prepare("
                    UPDATE newsletter_subscriptions 
                    SET status = 'active', subscribed_at = NOW(), ip_address = ?, user_agent = ?, referrer = ?
                    WHERE email = ?
                ");
                $stmt->execute([$ipAddress, $userAgent, $referrer, $email]);
                jsonSuccess('Welcome back! Your subscription has been reactivated.');
            }
        } else {
            // Insert new subscription
            $stmt = $pdo->prepare("
                INSERT INTO newsletter_subscriptions (email, ip_address, user_agent, source_page, referrer) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$email, $ipAddress, $userAgent, $sourcePage, $referrer]);
            
            // Send welcome email (optional)
            sendWelcomeEmail($email);
            
            jsonSuccess('🎉 Thank you! You\'ll be the first to know when FirmaFlow launches!');
        }
        
    } catch (Exception $e) {
        error_log('Subscription error: ' . $e->getMessage());
        jsonError('Failed to subscribe. Please try again.');
    }
}

/**
 * Get subscription statistics
 */
function getSubscriptionStats() {
    global $pdo;
    
    try {
        // Total subscriptions
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM newsletter_subscriptions WHERE status = 'active'");
        $total = $stmt->fetch()['total'];
        
        // Today's subscriptions
        $stmt = $pdo->query("
            SELECT COUNT(*) as today 
            FROM newsletter_subscriptions 
            WHERE DATE(subscribed_at) = CURDATE() AND status = 'active'
        ");
        $today = $stmt->fetch()['today'];
        
        // This week's subscriptions
        $stmt = $pdo->query("
            SELECT COUNT(*) as week 
            FROM newsletter_subscriptions 
            WHERE subscribed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status = 'active'
        ");
        $week = $stmt->fetch()['week'];
        
        // Monthly breakdown
        $stmt = $pdo->query("
            SELECT 
                DATE_FORMAT(subscribed_at, '%Y-%m') as month,
                COUNT(*) as count
            FROM newsletter_subscriptions 
            WHERE status = 'active'
            GROUP BY DATE_FORMAT(subscribed_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        ");
        $monthly = $stmt->fetchAll();
        
        jsonSuccess('Statistics retrieved', [
            'total_subscriptions' => (int)$total,
            'today_subscriptions' => (int)$today,
            'week_subscriptions' => (int)$week,
            'monthly_breakdown' => $monthly
        ]);
        
    } catch (Exception $e) {
        error_log('Stats error: ' . $e->getMessage());
        jsonError('Failed to get statistics');
    }
}

/**
 * Get subscription list (paginated)
 */
function getSubscriptionList() {
    global $pdo;
    
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 50);
    $offset = ($page - 1) * $limit;
    
    try {
        // Get total count
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM newsletter_subscriptions WHERE status = 'active'");
        $total = $stmt->fetch()['total'];
        
        // Get paginated list
        $stmt = $pdo->prepare("
            SELECT email, subscribed_at, ip_address, source_page, referrer, country, city
            FROM newsletter_subscriptions 
            WHERE status = 'active'
            ORDER BY subscribed_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        $subscriptions = $stmt->fetchAll();
        
        jsonSuccess('Subscription list retrieved', [
            'subscriptions' => $subscriptions,
            'pagination' => [
                'current_page' => $page,
                'total_count' => (int)$total,
                'per_page' => $limit,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log('List error: ' . $e->getMessage());
        jsonError('Failed to get subscription list');
    }
}

/**
 * Export subscriptions as CSV
 */
function exportSubscriptions() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT email, subscribed_at, ip_address, source_page, referrer, country, city
            FROM newsletter_subscriptions 
            WHERE status = 'active'
            ORDER BY subscribed_at DESC
        ");
        $subscriptions = $stmt->fetchAll();
        
        // Set CSV headers
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="firmaflow_subscriptions_' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        
        // Write CSV header
        fputcsv($output, ['Email', 'Subscribed At', 'IP Address', 'Source Page', 'Referrer', 'Country', 'City']);
        
        // Write data rows
        foreach ($subscriptions as $sub) {
            fputcsv($output, [
                $sub['email'],
                $sub['subscribed_at'],
                $sub['ip_address'],
                $sub['source_page'],
                $sub['referrer'],
                $sub['country'],
                $sub['city']
            ]);
        }
        
        fclose($output);
        
    } catch (Exception $e) {
        error_log('Export error: ' . $e->getMessage());
        jsonError('Failed to export subscriptions');
    }
}

/**
 * Send welcome email to new subscriber
 */
function sendWelcomeEmail($email) {
    try {
        $subject = 'Welcome to FirmaFlow - You\'re on the List! 🎉';
        $from = 'notifications@firmaflowledger.com';
        
        $htmlBody = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='text-align: center; margin-bottom: 30px;'>
                <img src='https://firmaflowledger.com/assets/firmaflow-logo.jpg' alt='FirmaFlow Logo' style='width: 80px; height: 80px; border-radius: 15px;'>
                <h2 style='color: #667eea; margin: 15px 0;'>Welcome to FirmaFlow!</h2>
            </div>
            
            <div style='background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;'>
                <h3 style='color: #333; margin-top: 0;'>🎉 You're In!</h3>
                <p style='color: #666; line-height: 1.6; margin: 15px 0;'>
                    Thank you for joining thousands of business owners who are eagerly waiting for 
                    Nigeria's most comprehensive business management platform!
                </p>
                
                <div style='background: #667eea; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                    <strong>🚀 Launching November 1st, 2025</strong>
                </div>
                
                <p style='color: #666; line-height: 1.6;'>
                    As a VIP subscriber, you'll get:
                </p>
                
                <ul style='color: #666; line-height: 1.8; padding-left: 20px;'>
                    <li>🏆 <strong>Early Access</strong> - Be among the first to use FirmaFlow</li>
                    <li>💰 <strong>Launch Discount</strong> - Exclusive 50% off your first year</li>
                    <li>📚 <strong>Free Training</strong> - Complimentary onboarding and setup</li>
                    <li>🎁 <strong>Bonus Features</strong> - Free premium add-ons for early adopters</li>
                </ul>
                
                <p style='color: #666; line-height: 1.6; margin: 20px 0;'>
                    We'll keep you updated with our progress and send you exclusive sneak peeks 
                    of the platform as we get closer to launch!
                </p>
                
                <div style='text-align: center; margin: 25px 0;'>
                    <a href='https://firmaflowledger.com' style='background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; display: inline-block;'>
                        Visit Our Website
                    </a>
                </div>
            </div>
            
            <div style='text-align: center; color: #999; font-size: 12px; margin-top: 30px;'>
                <p>FirmaFlow - CAC Registered Business Management Platform</p>
                <p>You're receiving this because you subscribed to our launch notifications.</p>
            </div>
        </div>
        ";
        
        $headers = [
            'From' => "FirmaFlow Team <{$from}>",
            'Reply-To' => "support@firmaflowledger.com",
            'MIME-Version' => '1.0',
            'Content-Type' => 'text/html; charset=UTF-8',
            'X-Mailer' => 'FirmaFlow Notifications'
        ];
        
        $headerString = '';
        foreach ($headers as $key => $value) {
            $headerString .= "$key: $value\r\n";
        }
        
        // Send in background to not block the response
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        }
        
        mail($email, $subject, $htmlBody, $headerString);
        
    } catch (Exception $e) {
        error_log('Welcome email error: ' . $e->getMessage());
    }
}

/**
 * Create newsletter table if it doesn't exist
 */
function createNewsletterTable() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'newsletter_subscriptions'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("
                CREATE TABLE `newsletter_subscriptions` (
                  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `subscribed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `user_agent` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `status` enum('active','unsubscribed','bounced') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
                  `source_page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'landing_page',
                  `referrer` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  PRIMARY KEY (`id`),
                  UNIQUE KEY `unique_email` (`email`),
                  KEY `idx_subscribed_at` (`subscribed_at`),
                  KEY `idx_status` (`status`),
                  KEY `idx_source_page` (`source_page`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
        }
    } catch (Exception $e) {
        error_log('Table creation error: ' . $e->getMessage());
    }
}

/**
 * JSON success response
 */
function jsonSuccess($message, $data = null) {
    $response = ['success' => true, 'message' => $message];
    if ($data) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

/**
 * JSON error response
 */
function jsonError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}
?>