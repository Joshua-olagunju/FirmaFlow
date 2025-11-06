<?php
// Flutterwave Payment Helper Class
// Handles all Flutterwave payment operations

class FlutterwavePayment {
    private $config;
    private $publicKey;
    private $secretKey;
    private $encryptionKey;
    private $baseUrl;
    
    public function __construct() {
        $this->config = require_once __DIR__ . '/../config/flutterwave_config.php';
        $this->publicKey = $this->config['public_key'];
        $this->secretKey = $this->config['secret_key'];
        $this->encryptionKey = $this->config['encryption_key'];
        $this->baseUrl = $this->config['base_url'];
    }
    
    /**
     * Initialize payment for subscription
     */
    public function initializePayment($customerData, $planType) {
        if (!isset($this->config['subscription_plans'][$planType])) {
            throw new Exception('Invalid subscription plan');
        }
        
        $plan = $this->config['subscription_plans'][$planType];
        
        $paymentData = [
            'tx_ref' => $this->generateTransactionRef($customerData['customer_id'] ?? '', $planType),
            'amount' => $plan['amount'],
            'currency' => $plan['currency'],
            'redirect_url' => $this->getBaseUrl() . $this->config['redirect_urls']['success'],
            'payment_options' => 'card,banktransfer,ussd,account',
            'customer' => [
                'email' => $customerData['email'],
                'phonenumber' => $customerData['phone'] ?? '',
                'name' => $customerData['name']
            ],
            'customizations' => [
                'title' => 'Firmaflow ' . $plan['name'] . ' Subscription',
                'description' => $plan['description'],
                'logo' => $this->getBaseUrl() . '/assets/firmaflow-logo.jpg'
            ],
            'meta' => [
                'plan_type' => $planType,
                'plan_id' => $plan['plan_id'],
                'customer_id' => $customerData['customer_id'] ?? null,
                'company_id' => $customerData['company_id'] ?? null,
                'environment' => $this->config['environment']
            ]
        ];
        
        return $this->makeRequest('/payments', $paymentData);
    }
    
    /**
     * Verify payment transaction
     */
    public function verifyPayment($transactionId) {
        $url = "/transactions/{$transactionId}/verify";
        return $this->makeRequest($url, null, 'GET');
    }
    
    /**
     * Create subscription plan (if needed)
     */
    public function createSubscriptionPlan($planData) {
        $subscriptionData = [
            'amount' => $planData['amount'],
            'name' => $planData['name'],
            'interval' => $planData['interval'],
            'duration' => $planData['duration'] ?? 12, // 12 months default
            'currency' => $planData['currency'] ?? 'NGN'
        ];
        
        return $this->makeRequest('/payment-plans', $subscriptionData);
    }
    
    /**
     * Subscribe customer to plan
     */
    public function subscribeCustomer($customerEmail, $planId) {
        $subscriptionData = [
            'customer' => $customerEmail,
            'plan' => $planId
        ];
        
        return $this->makeRequest('/subscriptions', $subscriptionData);
    }
    
    /**
     * Cancel subscription
     */
    public function cancelSubscription($subscriptionId) {
        $url = "/subscriptions/{$subscriptionId}/cancel";
        return $this->makeRequest($url, [], 'PUT');
    }
    
    /**
     * Get subscription details
     */
    public function getSubscription($subscriptionId) {
        $url = "/subscriptions/{$subscriptionId}";
        return $this->makeRequest($url, null, 'GET');
    }
    
    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature($payload, $signature) {
        $expectedSignature = hash_hmac('sha256', $payload, $this->config['webhook_secret']);
        return hash_equals($expectedSignature, $signature);
    }
    
    /**
     * Make HTTP request to Flutterwave API
     */
    private function makeRequest($endpoint, $data = null, $method = 'POST') {
        $url = $this->baseUrl . $endpoint;
        
        $headers = [
            'Authorization: Bearer ' . $this->secretKey,
            'Content-Type: application/json'
        ];
        
        $ch = curl_init();
        
        // Production security settings
        $isProduction = ($this->config['environment'] === 'live');
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => $isProduction, // Enable SSL verification in production
            CURLOPT_SSL_VERIFYHOST => $isProduction ? 2 : 0, // Verify host in production
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_USERAGENT => 'FirmaFlow/1.0 (Flutterwave Integration)'
        ]);
        
        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('cURL Error: ' . $error);
        }
        
        $decodedResponse = json_decode($response, true);
        
        if ($httpCode >= 400) {
            $errorMessage = $decodedResponse['message'] ?? 'Payment request failed';
            throw new Exception($errorMessage, $httpCode);
        }
        
        return $decodedResponse;
    }
    
    /**
     * Generate unique transaction reference
     */
    private function generateTransactionRef($userId = '', $planType = '') {
        $prefix = $this->config['environment'] === 'live' ? 'FW_LIVE' : 'FW_TEST';
        return $prefix . '_' . ($userId ?: 'USER') . '_' . ($planType ?: 'PLAN') . '_' . time() . '_' . uniqid();
    }
    
    /**
     * Get base URL for redirects
     */
    private function getBaseUrl() {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        
        // Force HTTPS in production
        if ($this->config['environment'] === 'live' && $protocol === 'http') {
            $protocol = 'https';
        }
        
        return $protocol . '://' . $host;
    }
    
    /**
     * Format amount for display
     */
    public function formatAmount($amount, $currency = 'NGN') {
        if ($currency === 'NGN') {
            return '₦' . number_format($amount);
        }
        return $currency . ' ' . number_format($amount);
    }
    
    /**
     * Get plan details
     */
    public function getPlan($planType) {
        return $this->config['subscription_plans'][$planType] ?? null;
    }
    
    /**
     * Get all available plans
     */
    public function getAllPlans() {
        return $this->config['subscription_plans'];
    }
}
?>