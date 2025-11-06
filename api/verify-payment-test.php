<?php
// TEST MODE: Fake Flutterwave Payment Verification API
// ================================================
// IMPORTANT: When going live, replace this file with real Flutterwave integration
// 
// CHANGES NEEDED FOR PRODUCTION:
// 1. Update public key in subscription.php: Replace "FLWPUBK_TEST-FAKE" with your real public key
// 2. Update secret key below: Replace "FLWSECK_TEST-FAKE" with your real secret key  
// 3. Change CURL endpoint to real Flutterwave API
// 4. Remove the fake simulation logic and use real API responses
// ================================================

session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/subscription_helper.php';
require_once __DIR__ . '/../includes/email_helper.php';

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
    // =============================================
    // TEST MODE: Fake Flutterwave verification
    // =============================================
    // PRODUCTION CHANGE: Replace this entire section with real Flutterwave API call
    
    $secret_key = "FLWSECK_TEST-FAKE"; // PRODUCTION: Use real secret key
    
    // Simulate successful payment verification for testing
    error_log("TEST MODE: Simulating payment verification for tx_ref: " . $tx_ref);
    
    // Extract amount from transaction reference (fake simulation)
    $amount = 0;
    if (strpos($tx_ref, '_5000_') !== false) {
        $amount = 5000; // Starter plan
    } elseif (strpos($tx_ref, '_10000_') !== false) {
        $amount = 10000; // Professional plan  
    } elseif (strpos($tx_ref, '_15000_') !== false) {
        $amount = 15000; // Enterprise plan
    } else {
        // Default to starter for testing
        $amount = 5000;
    }
    
    // Fake payment data structure (mimics real Flutterwave response)
    $payment_info = [
        'id' => $transaction_id,
        'tx_ref' => $tx_ref,
        'amount' => $amount,
        'currency' => 'NGN',
        'status' => 'successful',
        'payment_type' => 'card',
        'customer' => [
            'email' => $_SESSION['user_email'] ?? 'test@example.com',
            'name' => $_SESSION['user_name'] ?? 'Test User'
        ],
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    // PRODUCTION: Replace above with real Flutterwave API call:
    /*
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/{$transaction_id}/verify",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'GET',
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
    */
    
    // =============================================
    // END TEST MODE SECTION
    // =============================================
    
    // Validate payment (same logic for test and production)
    if ($payment_info['status'] !== 'successful') {
        echo json_encode(['success' => false, 'error' => 'Payment was not successful']);
        exit;
    }
    
    if ($payment_info['tx_ref'] !== $tx_ref) {
        echo json_encode(['success' => false, 'error' => 'Transaction reference mismatch']);
        exit;
    }
    
    // Determine subscription plan based on amount
    $amount = (float) $payment_info['amount'];
    $plan = '';
    $plan_limits = [];
    
    if ($amount >= 15000) {
        $plan = 'enterprise';
        $plan_limits = [
            'customers' => -1, // Unlimited
            'products' => -1,  // Unlimited
            'users' => -1      // Unlimited
        ];
    } elseif ($amount >= 10000) {
        $plan = 'professional';
        $plan_limits = [
            'customers' => 1000,
            'products' => 2000,
            'users' => 5
        ];
    } else {
        $plan = 'starter';
        $plan_limits = [
            'customers' => 100,
            'products' => 500,
            'users' => 1
        ];
    }
    
    // Calculate subscription end date (1 month from now)
    $subscription_end = date('Y-m-d H:i:s', strtotime('+1 month'));
    
    // Check if payments table exists, if not create it
    try {
        $stmt = $pdo->query("DESCRIBE subscription_payments");
    } catch (Exception $e) {
        // Create payments table if it doesn't exist
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS subscription_payments (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                company_id BIGINT NOT NULL,
                user_id BIGINT NOT NULL,
                transaction_id VARCHAR(255) NOT NULL,
                tx_ref VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'NGN',
                status VARCHAR(50) NOT NULL,
                payment_method VARCHAR(100),
                plan_type VARCHAR(50) NOT NULL,
                subscription_start DATETIME NOT NULL,
                subscription_end DATETIME NOT NULL,
                flutterwave_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_company_id (company_id),
                INDEX idx_user_id (user_id),
                INDEX idx_transaction_id (transaction_id),
                INDEX idx_tx_ref (tx_ref)
            )
        ");
    }
    
    // Store payment record
    $stmt = $pdo->prepare("
        INSERT INTO subscription_payments (
            company_id, user_id, transaction_id, tx_ref, amount, currency, 
            status, payment_method, plan_type, subscription_start, subscription_end,
            flutterwave_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW())
    ");
    
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
        $subscription_end,
        json_encode($payment_info)
    ]);
    
    // Update user subscription in users table
    $stmt = $pdo->prepare("
        UPDATE users SET 
            subscription_plan = ?,
            subscription_status = 'active',
            subscription_start_date = NOW(),
            subscription_end_date = ?,
            last_payment_date = NOW(),
            payment_reference = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    
    $stmt->execute([
        $plan,
        $subscription_end,
        $transaction_id,
        $_SESSION['user_id']
    ]);
    
    // Update session with new plan info
    $_SESSION['subscription_plan'] = $plan;
    $_SESSION['subscription_status'] = 'active';
    
    // Log the test transaction
    error_log("TEST MODE: Payment verified successfully - Plan: $plan, Amount: $amount, User: " . $_SESSION['user_id']);
    
    // Send payment confirmation email
    try {
        $planDisplayName = ucfirst($plan);
        $formattedAmount = '₦' . number_format($amount);
        EmailHelper::sendPaymentConfirmation(
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
        'message' => 'Payment verified and subscription activated (TEST MODE)',
        'plan' => $plan,
        'amount' => $amount,
        'subscription_end' => $subscription_end,
        'test_mode' => true
    ]);
    
} catch (Exception $e) {
    error_log("Payment verification error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
