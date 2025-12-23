<?php
/**
 * Subscription Handler
 * Handles all subscription-related intents
 */

function handleSubscriptionsIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    switch ($intent) {
        case 'view_subscription':
            return viewSubscription($pdo, $companyId);
        
        case 'upgrade_subscription':
            return upgradeSubscription($data, $pdo, $companyId, $userId);
        
        case 'upgrade_guidance':
            return provideUpgradeGuidance($pdo, $companyId);
        
        default:
            return formatErrorResponse("Unknown subscription intent: $intent");
    }
}

/**
 * View current subscription status
 */
function viewSubscription($pdo, $companyId) {
    try {
        // Get current subscription from users table
        $stmt = $pdo->prepare("
            SELECT 
                u.subscription_plan,
                u.billing_type,
                u.subscription_status,
                u.trial_start_date,
                u.trial_end_date,
                u.subscription_start_date,
                u.subscription_end_date,
                u.last_payment_date,
                c.name as company_name
            FROM users u
            JOIN companies c ON u.company_id = c.id
            WHERE u.company_id = ?
            ORDER BY u.created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$companyId]);
        $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$subscription) {
            return [
                'success' => true,
                'action' => 'view_subscription',
                'result' => [
                    'status' => 'no_subscription',
                    'message' => 'No active subscription found'
                ],
                'message' => 'You currently have no active subscription. Consider starting with our Free plan or upgrading to unlock more features.'
            ];
        }
        
        // Calculate days remaining
        $daysRemaining = null;
        $endDate = null;
        
        if ($subscription['subscription_status'] === 'trial' && $subscription['trial_end_date']) {
            $endDate = new DateTime($subscription['trial_end_date']);
            $today = new DateTime();
            $interval = $today->diff($endDate);
            $daysRemaining = $endDate > $today ? $interval->days : 0;
        } elseif ($subscription['subscription_end_date']) {
            $endDate = new DateTime($subscription['subscription_end_date']);
            $today = new DateTime();
            $interval = $today->diff($endDate);
            $daysRemaining = $endDate > $today ? $interval->days : 0;
        }
        
        // Format result
        $result = [
            'plan' => ucfirst($subscription['subscription_plan'] ?? 'free'),
            'billing_type' => $subscription['billing_type'] ?? 'N/A',
            'status' => ucfirst($subscription['subscription_status'] ?? 'active'),
            'start_date' => $subscription['subscription_start_date'] ?? $subscription['trial_start_date'],
            'end_date' => $subscription['subscription_end_date'] ?? $subscription['trial_end_date'],
            'days_remaining' => $daysRemaining,
            'last_payment_date' => $subscription['last_payment_date']
        ];
        
        // Build friendly message
        $plan = $result['plan'];
        $status = $result['status'];
        
        $message = "📊 **Your Subscription:**\n\n";
        $message .= "• Plan: {$plan}\n";
        $message .= "• Status: {$status}\n";
        
        if ($result['billing_type'] !== 'N/A') {
            $message .= "• Billing: {$result['billing_type']}\n";
        }
        
        if ($status === 'Trial') {
            $message .= "• Trial ends: {$result['end_date']}\n";
            if ($daysRemaining !== null) {
                $message .= "• Days remaining: {$daysRemaining}\n";
            }
        } elseif ($result['end_date']) {
            $message .= "• Next billing: {$result['end_date']}\n";
        }
        
        return [
            'success' => true,
            'action' => 'view_subscription',
            'result' => $result,
            'message' => $message
        ];
        
    } catch (Exception $e) {
        return formatErrorResponse('Error fetching subscription: ' . $e->getMessage());
    }
}

/**
 * Upgrade subscription
 */
function upgradeSubscription($data, $pdo, $companyId, $userId) {
    try {
        // Validate plan
        $validPlans = ['free', 'starter', 'professional', 'enterprise'];
        $plan = strtolower($data['plan'] ?? '');
        
        if (!in_array($plan, $validPlans)) {
            return formatErrorResponse(
                'Invalid plan. Available plans: ' . implode(', ', $validPlans),
                'INVALID_PLAN'
            );
        }
        
        // Validate billing cycle
        $validCycles = ['monthly', 'quarterly', 'six_months', 'yearly'];
        $billingCycle = $data['billing_cycle'] ?? 'monthly';
        
        if (!in_array($billingCycle, $validCycles)) {
            return formatErrorResponse(
                'Invalid billing cycle. Available: ' . implode(', ', $validCycles),
                'INVALID_CYCLE'
            );
        }
        
        // Get current subscription
        $stmt = $pdo->prepare("
            SELECT plan_type, status 
            FROM subscriptions 
            WHERE company_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$companyId]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Check if already on this plan
        if ($current && $current['plan_type'] === $plan) {
            return formatErrorResponse(
                "You are already on the {$plan} plan",
                'ALREADY_ON_PLAN'
            );
        }
        
        // Call subscription API
        $apiUrl = "http://localhost/FirmaFlow/api/subscription.php";
        
        $subscriptionData = [
            'action' => 'activate',
            'plan_type' => $plan,
            'billing_cycle' => $billingCycle
        ];
        
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($subscriptionData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: ' . session_name() . '=' . session_id()
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200 || $httpCode === 201) {
            $result = json_decode($response, true);
            
            return [
                'success' => true,
                'action' => 'upgrade_subscription',
                'result' => [
                    'new_plan' => ucfirst($plan),
                    'billing_cycle' => $billingCycle,
                    'status' => 'active'
                ],
                'message' => "Successfully upgraded to {$plan} plan with {$billingCycle} billing"
            ];
        } else {
            return formatErrorResponse('Failed to upgrade subscription: ' . $response);
        }
        
    } catch (Exception $e) {
        return formatErrorResponse('Error upgrading subscription: ' . $e->getMessage());
    }
}

/**
 * Provide upgrade guidance
 */
function provideUpgradeGuidance($pdo, $companyId) {
    try {
        // Get current subscription
        $stmt = $pdo->prepare("
            SELECT plan_type, status 
            FROM subscriptions 
            WHERE company_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$companyId]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $currentPlan = $current ? $current['plan_type'] : 'none';
        
        // Define plan features and pricing
        $plans = [
            'free' => [
                'name' => 'Free',
                'price' => 0,
                'features' => [
                    'Basic invoicing',
                    'Up to 5 customers',
                    'Basic reporting',
                    'Email support'
                ],
                'limits' => [
                    'customers' => 5,
                    'invoices_per_month' => 10,
                    'users' => 1
                ]
            ],
            'starter' => [
                'name' => 'Starter',
                'price' => 29,
                'features' => [
                    'Unlimited invoices',
                    'Up to 50 customers',
                    'Inventory management',
                    'Basic reports',
                    'Email & chat support'
                ],
                'limits' => [
                    'customers' => 50,
                    'invoices_per_month' => 'unlimited',
                    'users' => 2
                ]
            ],
            'professional' => [
                'name' => 'Professional',
                'price' => 79,
                'features' => [
                    'Everything in Starter',
                    'Unlimited customers',
                    'Advanced reporting',
                    'Purchase orders',
                    'Multi-currency support',
                    'Priority support',
                    'Up to 5 users'
                ],
                'limits' => [
                    'customers' => 'unlimited',
                    'invoices_per_month' => 'unlimited',
                    'users' => 5
                ]
            ],
            'enterprise' => [
                'name' => 'Enterprise',
                'price' => 199,
                'features' => [
                    'Everything in Professional',
                    'Unlimited users',
                    'Custom integrations',
                    'API access',
                    'Dedicated support',
                    'Custom training',
                    'White-label options'
                ],
                'limits' => [
                    'customers' => 'unlimited',
                    'invoices_per_month' => 'unlimited',
                    'users' => 'unlimited'
                ]
            ]
        ];
        
        // Determine recommended upgrade
        $recommendedPlan = null;
        if ($currentPlan === 'free' || $currentPlan === 'none') {
            $recommendedPlan = 'starter';
        } elseif ($currentPlan === 'starter') {
            $recommendedPlan = 'professional';
        } elseif ($currentPlan === 'professional') {
            $recommendedPlan = 'enterprise';
        }
        
        $guidance = [
            'current_plan' => ucfirst($currentPlan),
            'all_plans' => $plans,
            'recommended_plan' => $recommendedPlan ? ucfirst($recommendedPlan) : null
        ];
        
        $message = "You are currently on the " . ucfirst($currentPlan) . " plan. ";
        
        if ($recommendedPlan) {
            $recPlan = $plans[$recommendedPlan];
            $message .= "Consider upgrading to {$recPlan['name']} (\${$recPlan['price']}/month) to unlock: " . 
                       implode(', ', array_slice($recPlan['features'], 0, 3));
        } else {
            $message .= "You are already on our top-tier plan!";
        }
        
        return [
            'success' => true,
            'action' => 'upgrade_guidance',
            'result' => $guidance,
            'message' => $message
        ];
        
    } catch (Exception $e) {
        return formatErrorResponse('Error providing upgrade guidance: ' . $e->getMessage());
    }
}
