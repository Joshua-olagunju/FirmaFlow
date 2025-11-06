<?php
/**
 * config/flutterwave_config.php
 * Secure: only reads secrets from environment variables.
 * Do NOT put secrets in this file.
 */

$public  = getenv('FLW_PUBLIC_KEY')     ?: null;
$secret  = getenv('FLW_SECRET_KEY')     ?: null;
$encKey  = getenv('FLW_ENCRYPTION_KEY') ?: null;
$env     = getenv('FLW_ENV')            ?: 'live';
$webhook = getenv('FLW_WEBHOOK_SECRET') ?: null;

// Production validation - ensure all required keys are present
$isProduction = ($env === 'live') || (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false);

if ($isProduction) {
    $missingVars = [];
    if (empty($public) || strpos($public, 'FLWPUBK-') !== 0) {
        $missingVars[] = 'FLW_PUBLIC_KEY';
    }
    if (empty($secret) || strpos($secret, 'FLWSECK-') !== 0) {
        $missingVars[] = 'FLW_SECRET_KEY';
    }
    if (empty($encKey)) {
        $missingVars[] = 'FLW_ENCRYPTION_KEY';
    }
    if (empty($webhook) || $webhook === 'your-actual-live-webhook-secret-here') {
        $missingVars[] = 'FLW_WEBHOOK_SECRET';
    }
    
    if (!empty($missingVars)) {
        error_log('[FLUTTERWAVE CONFIG] Missing or invalid environment variables: ' . implode(', ', $missingVars));
        if ($env === 'live') {
            throw new RuntimeException('Payment configuration incomplete for production. Missing: ' . implode(', ', $missingVars));
        }
    }
}

return [
    'public_key'     => $public,
    'secret_key'     => $secret,
    'encryption_key' => $encKey,
    'environment'    => $env,
    'webhook_secret' => $webhook,

    'base_url'    => 'https://api.flutterwave.com/v3',
    'payment_url' => 'https://checkout.flutterwave.com/v3/hosted/pay',

    'subscription_plans' => [
        'starter' => [
            'name'=>'Starter',
            'monthly' => ['amount'=>5000,'plan_id'=>148218,'currency'=>'NGN','interval'=>'monthly'],
            'quarterly' => ['amount'=>14550,'plan_id'=>148856,'currency'=>'NGN','interval'=>'quarterly', 'original_amount'=>15000, 'discount'=>3],
            'six_months' => ['amount'=>28200,'plan_id'=>148861,'currency'=>'NGN','interval'=>'6months', 'original_amount'=>30000, 'discount'=>6],
            'yearly' => ['amount'=>54000,'plan_id'=>148820,'currency'=>'NGN','interval'=>'yearly', 'original_amount'=>60000, 'discount'=>10]
        ],
        'professional' => [
            'name'=>'Professional',
            'monthly' => ['amount'=>10000,'plan_id'=>148219,'currency'=>'NGN','interval'=>'monthly'],
            'quarterly' => ['amount'=>29100,'plan_id'=>148860,'currency'=>'NGN','interval'=>'quarterly', 'original_amount'=>30000, 'discount'=>3],
            'six_months' => ['amount'=>56400,'plan_id'=>148862,'currency'=>'NGN','interval'=>'6months', 'original_amount'=>60000, 'discount'=>6],
            'yearly' => ['amount'=>108000,'plan_id'=>148821,'currency'=>'NGN','interval'=>'yearly', 'original_amount'=>120000, 'discount'=>10]
        ],
        'enterprise' => [
            'name'=>'Enterprise',
            'monthly' => ['amount'=>15000,'plan_id'=>148220,'currency'=>'NGN','interval'=>'monthly'],
            'quarterly' => ['amount'=>43650,'plan_id'=>148859,'currency'=>'NGN','interval'=>'quarterly', 'original_amount'=>45000, 'discount'=>3],
            'six_months' => ['amount'=>84600,'plan_id'=>148863,'currency'=>'NGN','interval'=>'6months', 'original_amount'=>90000, 'discount'=>6],
            'yearly' => ['amount'=>162000,'plan_id'=>148822,'currency'=>'NGN','interval'=>'yearly', 'original_amount'=>180000, 'discount'=>10]
        ],
    ],

    'redirect_urls' => [
        'success' => $isProduction ? '/public/subscription_success.php' : '/Firmaflow/public/subscription_success.php',
        'cancel'  => $isProduction ? '/public/subscription.php' : '/Firmaflow/public/subscription.php',
    ],
];
?>