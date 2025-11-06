<?php
// Payment verification API for Flutterwave integration
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/email_helper.php';
require_once __DIR__ . '/../includes/production_email_service.php';

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$transaction_id = $input['transaction_id'] ?? '';
$tx_ref = $input['tx_ref'] ?? '';

if (empty($transaction_id) || empty($tx_ref)) {
    echo json_encode(['success' => false, 'error' => 'Transaction ID and reference are required']);
    exit;
}

try {
    // Flutterwave configuration - Load from config file
    $flutterwave_config = require_once __DIR__ . '/../config/flutterwave_config.php';
    $secret_key = $flutterwave_config['secret_key']; // Use live secret key from config
    
    // Verify transaction with Flutterwave using live API
    $curl = curl_init();
    
    // Determine if we're in production
    $isProduction = ($flutterwave_config['environment'] === 'live') || 
                   (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false);
    
    curl_setopt_array($curl, array(
        CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/{$transaction_id}/verify",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_SSL_VERIFYPEER => $isProduction, // Enable SSL verification for production
        CURLOPT_SSL_VERIFYHOST => $isProduction ? 2 : 0, // Enable host verification for production
        CURLOPT_HTTPHEADER => array(
            'Authorization: Bearer ' . $secret_key,
            'Content-Type: application/json'
        ),
    ));
    
    $response = curl_exec($curl);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($http_code !== 200) {
        throw new Exception('Failed to verify payment with Flutterwave');
    }
    
    $payment_data = json_decode($response, true);
    
    if (!$payment_data || $payment_data['status'] !== 'success') {
        throw new Exception('Invalid payment verification response');
    }
    
    $payment_info = $payment_data['data'];
    
    // Validate payment
    // Enforce strict Flutterwave verification for live mode
    if ($payment_info['status'] !== 'successful') {
        echo json_encode(['success' => false, 'error' => 'Payment was not successful']);
        exit;
    }
    
    if ($payment_info['tx_ref'] !== $tx_ref) {
        echo json_encode(['success' => false, 'error' => 'Transaction reference mismatch']);
        exit;
    }
    
    // Additional verification: Ensure this is a real Flutterwave transaction
    if (empty($payment_info['flw_ref']) || empty($payment_info['processor_response'])) {
        throw new Exception('Invalid Flutterwave transaction data');
    }
    
    // Extract billing type from tx_ref (format: FF_userid_plan_billingtype_timestamp_random)
    $billing_type = 'monthly'; // default
    $tx_ref_parts = explode('_', $tx_ref);
    if (count($tx_ref_parts) >= 4) {
        $extracted_billing = $tx_ref_parts[3]; // billing type is the 4th part (index 3)
        $valid_billing_types = ['monthly', 'quarterly', 'six_months', 'yearly'];
        if (in_array($extracted_billing, $valid_billing_types)) {
            $billing_type = $extracted_billing;
        }
    }
    
    // Determine subscription plan based on amount and validate against Flutterwave config
    $amount = (float) $payment_info['amount'];
    $plan = '';
    $plan_limits = [];
    
    // Load plan configuration for validation - support all billing types
    $monthly_amounts = [
        'starter' => 5000,
        'professional' => 10000,
        'enterprise' => 15000
    ];
    
    // Calculate expected amounts for different billing periods
    $expected_amounts = [];
    foreach ($monthly_amounts as $plan_name => $monthly_amount) {
        $expected_amounts[$plan_name] = [
            'monthly' => $monthly_amount,
            'quarterly' => $monthly_amount * 3 * 0.97, // 3% discount
            'six_months' => $monthly_amount * 6 * 0.94, // 6% discount
            'yearly' => $monthly_amount * 12 * 0.9 // 10% discount
        ];
    }
    
    // Match payment amount to valid plan amounts for the detected billing type
    $plan_found = false;
    foreach ($expected_amounts as $plan_name => $amounts) {
        if (abs($amount - $amounts[$billing_type]) < 1) { // Allow for small floating point differences
            $plan = $plan_name;
            $plan_found = true;
            break;
        }
    }
    
    if (!$plan_found) {
        throw new Exception('Invalid payment amount: ' . $amount . ' for billing type: ' . $billing_type);
    }
    
    // Set plan limits based on validated plan
    switch ($plan) {
        case 'enterprise':
            $plan_limits = [
                'customers' => -1, // Unlimited
                'products' => -1,  // Unlimited  
                'users' => -1      // Unlimited
            ];
            break;
        case 'professional':
            $plan_limits = [
                'customers' => 1000,
                'products' => 2000,
                'users' => 5
            ];
            break;
        case 'starter':
        default:
            $plan_limits = [
                'customers' => 100,
                'products' => 500,
                'users' => 1
            ];
            break;
    }
    
    // Calculate subscription end date based on billing type
    switch ($billing_type) {
        case 'quarterly':
            $subscription_end = date('Y-m-d H:i:s', strtotime('+3 months'));
            break;
        case 'six_months':
            $subscription_end = date('Y-m-d H:i:s', strtotime('+6 months'));
            break;
        case 'yearly':
            $subscription_end = date('Y-m-d H:i:s', strtotime('+1 year'));
            break;
        case 'monthly':
        default:
            $subscription_end = date('Y-m-d H:i:s', strtotime('+1 month'));
            break;
    }
    
    // Store payment record with full Flutterwave data
    $stmt = $pdo->prepare("
        INSERT INTO payments (
            company_id, user_id, transaction_id, tx_ref, amount, currency, 
            status, payment_method, plan_type, billing_type, subscription_start, subscription_end,
            flutterwave_data, flutterwave_fee, app_fee, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, NOW())
    ");
    
    $flutterwave_fee = $payment_info['app_fee'] ?? 0;
    $merchant_fee = $payment_info['merchant_fee'] ?? 0;
    
    $stmt->execute([
        $_SESSION['company_id'],
        $_SESSION['user_id'],
        $transaction_id,
        $tx_ref,
        $amount,
        $payment_info['currency'],
        'successful',
        $payment_info['payment_type'] ?? 'card',
        $plan,
        $billing_type,
        $subscription_end,
        json_encode($payment_info),
        $flutterwave_fee,
        $merchant_fee
    ]);
    
    // Update company subscription
    $stmt = $pdo->prepare("
        UPDATE companies SET 
            subscription_plan = ?,
            subscription_status = 'active',
            subscription_start = NOW(),
            subscription_end = ?,
            billing_type = ?,
            max_customers = ?,
            max_products = ?,
            max_users = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    
    $stmt->execute([
        $plan,
        $subscription_end,
        $billing_type,
        $plan_limits['customers'],
        $plan_limits['products'],
        $plan_limits['users'],
        $_SESSION['company_id']
    ]);
    
    // Update session with new plan info
    $_SESSION['subscription_plan'] = $plan;
    $_SESSION['subscription_status'] = 'active';
    
    // Log successful live payment
    error_log("LIVE PAYMENT SUCCESS: Company {$_SESSION['company_id']}, Amount: {$amount}, Plan: {$plan}, Billing: {$billing_type}, Transaction: {$transaction_id}");
    
    // Send payment confirmation email using production service
    try {
        $planDisplayName = ucfirst($plan);
        $formattedAmount = '₦' . number_format($amount);
        ProductionEmailService::sendPaymentConfirmation(
            $_SESSION['user_email'], 
            $_SESSION['user_name'], 
            $planDisplayName, 
            $formattedAmount, 
            $transaction_id
        );
    } catch (Exception $emailError) {
        // Log email error but don't fail the payment
        error_log("Payment confirmation email failed for {$_SESSION['user_email']}: " . $emailError->getMessage());
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Payment verified and subscription activated',
        'plan' => $plan,
        'amount' => $amount,
        'subscription_end' => $subscription_end
    ]);
    
} catch (Exception $e) {
    error_log("Payment verification error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
