<?php
/**
 * Subscription Helper Functions
 * Manages trial periods, subscription status, and access control
 * All users in a company follow the admin's (company owner's) subscription timeline
 */

require_once __DIR__ . '/db.php';

/**
 * Get the company admin (owner) for a user
 */
function getCompanyAdmin($userId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT admin.* 
            FROM users u
            JOIN users admin ON u.company_id = admin.company_id 
            WHERE u.id = ? AND admin.role = 'admin'
            ORDER BY admin.created_at ASC
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    } catch (Exception $e) {
        error_log("Error fetching company admin: " . $e->getMessage());
        return null;
    }
}

/**
 * Get subscription information for a user based on company admin's subscription
 */
function getUserSubscriptionInfo($userId) {
    global $pdo;
    
    try {
        // First check if this user is an admin
        $stmt = $pdo->prepare("SELECT id, role, company_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $currentUser = $stmt->fetch();
        
        if (!$currentUser) {
            return null;
        }
        
        // If user is admin, use their own subscription data
        if ($currentUser['role'] === 'admin') {
            $stmt = $pdo->prepare("
                SELECT 
                    id,
                    subscription_plan,
                    subscription_status,
                    trial_start_date,
                    trial_end_date,
                    subscription_start_date,
                    subscription_end_date,
                    last_payment_date,
                    payment_reference,
                    created_at
                FROM users 
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            return $stmt->fetch();
        } else {
            // For non-admin users, get the admin's subscription data
            $admin = getCompanyAdmin($userId);
            if (!$admin) {
                return null;
            }
            
            return [
                'id' => $admin['id'],
                'subscription_plan' => $admin['subscription_plan'],
                'subscription_status' => $admin['subscription_status'],
                'trial_start_date' => $admin['trial_start_date'],
                'trial_end_date' => $admin['trial_end_date'],
                'subscription_start_date' => $admin['subscription_start_date'],
                'subscription_end_date' => $admin['subscription_end_date'],
                'last_payment_date' => $admin['last_payment_date'],
                'payment_reference' => $admin['payment_reference'],
                'created_at' => $admin['created_at']
            ];
        }
    } catch (Exception $e) {
        error_log("Error fetching subscription info: " . $e->getMessage());
        return null;
    }
}

/**
 * Calculate remaining trial days (including today if trial hasn't expired)
 */
function getTrialDaysRemaining($userId) {
    $subscriptionInfo = getUserSubscriptionInfo($userId);
    
    if (!$subscriptionInfo || !$subscriptionInfo['trial_end_date']) {
        return 0;
    }
    
    $now = new DateTime();
    $now->setTime(0, 0, 0); // Set to start of day for accurate comparison
    $trialEnd = new DateTime($subscriptionInfo['trial_end_date']);
    $trialEnd->setTime(23, 59, 59); // Set to end of day for accurate comparison
    
    if ($now > $trialEnd) {
        return 0; // Trial expired
    }
    
    $diff = $now->diff($trialEnd);
    return (int)$diff->days + 1; // Add 1 to include the current day
}

/**
 * Check if user's trial is active (based on company admin's trial)
 */
function isTrialActive($userId) {
    $subscriptionInfo = getUserSubscriptionInfo($userId);
    
    if (!$subscriptionInfo) {
        return false;
    }
    
    // If they have an active paid subscription with actual subscription dates, trial status doesn't matter
    if ($subscriptionInfo['subscription_status'] === 'active' && 
        $subscriptionInfo['subscription_plan'] !== 'free' && 
        !empty($subscriptionInfo['subscription_start_date'])) {
        
        // Verify the paid subscription hasn't expired
        if ($subscriptionInfo['subscription_end_date']) {
            $now = new DateTime();
            $subscriptionEnd = new DateTime($subscriptionInfo['subscription_end_date']);
            return $now <= $subscriptionEnd;
        }
        return true; // Active paid subscription without end date
    }
    
    // Check trial dates for exact timestamp
    if ($subscriptionInfo['trial_end_date']) {
        $now = new DateTime();
        $trialEnd = new DateTime($subscriptionInfo['trial_end_date']);
        return $now <= $trialEnd;
    }
    
    return false;
}

/**
 * Check if user has valid subscription (trial or paid) based on company admin
 */
function hasValidSubscription($userId) {
    $subscriptionInfo = getUserSubscriptionInfo($userId);
    
    if (!$subscriptionInfo) {
        return false;
    }
    
    // Check for active paid subscription with actual subscription dates
    if ($subscriptionInfo['subscription_status'] === 'active' && 
        $subscriptionInfo['subscription_plan'] !== 'free' && 
        !empty($subscriptionInfo['subscription_start_date'])) {
        
        // Check if subscription hasn't expired
        if ($subscriptionInfo['subscription_end_date']) {
            $now = new DateTime();
            $subscriptionEnd = new DateTime($subscriptionInfo['subscription_end_date']);
            return $now <= $subscriptionEnd;
        }
        return true; // Active subscription without end date
    }
    
    // Check trial status with exact timestamp
    return isTrialActive($userId);
}

/**
 * Get subscription status for display (all users show admin's subscription status)
 */
function getSubscriptionStatus($userId) {
    $subscriptionInfo = getUserSubscriptionInfo($userId);
    
    if (!$subscriptionInfo) {
        return [
            'status' => 'unknown',
            'plan' => 'free',
            'days_remaining' => 0,
            'is_trial' => false,
            'has_access' => false,
            'message' => 'User not found'
        ];
    }
    
    $now = new DateTime();
    $isTrialActive = isTrialActive($userId);
    $hasValidSub = hasValidSubscription($userId);
    
    // Calculate precise timing data for live countdown
    $daysRemaining = getTrialDaysRemaining($userId);
    $isPaidPlan = $subscriptionInfo['subscription_plan'] !== 'free';
    
    // Initialize timing variables
    $secondsRemaining = 0;
    $exactExpirationTime = null;
    $expirationTimestamp = 0;
    
    // Calculate exact expiration timing
    if ($isPaidPlan && $subscriptionInfo['subscription_end_date']) {
        $subscriptionEnd = new DateTime($subscriptionInfo['subscription_end_date']);
        $exactExpirationTime = $subscriptionEnd->format('Y-m-d H:i:s');
        $expirationTimestamp = $subscriptionEnd->getTimestamp();
        
        if ($now <= $subscriptionEnd) {
            $diff = $now->diff($subscriptionEnd);
            $daysRemaining = (int)$diff->days + 1; // Include current day
            $secondsRemaining = $expirationTimestamp - $now->getTimestamp();
        }
    } elseif ($subscriptionInfo['trial_end_date']) {
        $trialEnd = new DateTime($subscriptionInfo['trial_end_date']);
        $exactExpirationTime = $trialEnd->format('Y-m-d H:i:s');
        $expirationTimestamp = $trialEnd->getTimestamp();
        
        if ($now <= $trialEnd) {
            $secondsRemaining = $expirationTimestamp - $now->getTimestamp();
        }
    }
    
    // Determine status and message
    $status = $subscriptionInfo['subscription_status'];
    $plan = $subscriptionInfo['subscription_plan'];
    
    // User is on trial if they don't have actual paid subscription dates
    $isTrial = empty($subscriptionInfo['subscription_start_date']);
    
    // Generate live countdown message if time remaining
    $liveMessage = '';
    if ($secondsRemaining > 0) {
        $hours = floor($secondsRemaining / 3600);
        $minutes = floor(($secondsRemaining % 3600) / 60);
        $seconds = $secondsRemaining % 60;
        
        if ($hours > 24) {
            $days = floor($hours / 24);
            $remainingHours = $hours % 24;
            $liveMessage = "{$days}d {$remainingHours}h {$minutes}m remaining";
        } elseif ($hours > 0) {
            $liveMessage = "{$hours}h {$minutes}m {$seconds}s remaining";
        } elseif ($minutes > 0) {
            $liveMessage = "{$minutes}m {$seconds}s remaining";
        } else {
            $liveMessage = "{$seconds}s remaining";
        }
    }
    
    $message = '';
    if (!$isTrial && $hasValidSub) {
        // Has actual paid subscription
        $message = "Active {$plan} subscription";
        if ($liveMessage) {
            $message .= " - {$liveMessage}";
        }
    } elseif ($isTrial && $isTrialActive) {
        // Active trial
        if ($liveMessage) {
            $message = "Free trial - {$liveMessage}";
        } else {
            $message = "Free trial - {$daysRemaining} days remaining";
        }
    } elseif ($isTrial && !$isTrialActive) {
        // Expired trial
        $message = "Free trial expired - Please subscribe to continue";
        $status = 'expired';
        $daysRemaining = 0;
        $secondsRemaining = 0;
    } else {
        // No valid subscription
        $message = "Subscription required";
        $status = 'expired';
        $daysRemaining = 0;
        $secondsRemaining = 0;
    }
    
    return [
        'status' => $status,
        'plan' => $plan,
        'days_remaining' => $daysRemaining,
        'is_trial' => $isTrial,
        'has_access' => $hasValidSub,
        'message' => $message,
        'trial_end_date' => $subscriptionInfo['trial_end_date'],
        'subscription_end_date' => $subscriptionInfo['subscription_end_date'],
        // Live countdown data
        'seconds_remaining' => max(0, $secondsRemaining),
        'expiration_timestamp' => $expirationTimestamp,
        'exact_expiration_time' => $exactExpirationTime,
        'live_message' => $liveMessage,
        'current_timestamp' => $now->getTimestamp()
    ];
}

/**
 * Check if user should have access to features
 */
function checkUserAccess($userId) {
    return hasValidSubscription($userId);
}

/**
 * Initialize trial for new admin user (only admins can have trials)
 */
function initializeUserTrial($userId) {
    global $pdo;
    
    try {
        // Check if user is admin
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user || $user['role'] !== 'admin') {
            // Non-admin users don't get their own trial - they follow admin's trial
            return true;
        }
        
        $now = new DateTime();
        $trialStart = $now->format('Y-m-d H:i:s');
        $trialEnd = $now->add(new DateInterval('P14D'))->format('Y-m-d H:i:s');
        
        $stmt = $pdo->prepare("
            UPDATE users 
            SET 
                trial_start_date = ?,
                trial_end_date = ?,
                subscription_plan = 'free',
                subscription_status = 'trial'
            WHERE id = ?
        ");
        
        return $stmt->execute([$trialStart, $trialEnd, $userId]);
    } catch (Exception $e) {
        error_log("Error initializing trial: " . $e->getMessage());
        return false;
    }
}

/**
 * Activate paid subscription (only for admin users)
 */
function activateSubscription($userId, $plan, $paymentReference = null) {
    global $pdo;
    
    try {
        // Check if user is admin
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user || $user['role'] !== 'admin') {
            error_log("Attempted to activate subscription for non-admin user: $userId");
            return false;
        }
        
        $now = new DateTime();
        $subscriptionStart = $now->format('Y-m-d H:i:s');
        $subscriptionEnd = $now->add(new DateInterval('P1M'))->format('Y-m-d H:i:s'); // 1 month
        
        $stmt = $pdo->prepare("
            UPDATE users 
            SET 
                subscription_plan = ?,
                subscription_status = 'active',
                subscription_start_date = ?,
                subscription_end_date = ?,
                last_payment_date = ?,
                payment_reference = ?
            WHERE id = ?
        ");
        
        return $stmt->execute([
            $plan, 
            $subscriptionStart, 
            $subscriptionEnd, 
            $subscriptionStart,
            $paymentReference,
            $userId
        ]);
    } catch (Exception $e) {
        error_log("Error activating subscription: " . $e->getMessage());
        return false;
    }
}

/**
 * Get trial progress percentage (0-100) based on days remaining
 */
function getTrialProgress($userId) {
    $daysRemaining = getTrialDaysRemaining($userId);
    $totalDays = 14;
    
    if ($daysRemaining <= 0) {
        return 100; // Trial expired, 100% progress
    }
    
    if ($daysRemaining >= $totalDays) {
        return 0; // Full trial remaining, 0% progress
    }
    
    $progress = (($totalDays - $daysRemaining) / $totalDays) * 100;
    return min(100, max(0, round($progress)));
}

/**
 * Check if user needs to be redirected to subscription page
 */
function requiresSubscriptionRedirect($userId) {
    $status = getSubscriptionStatus($userId);
    return !$status['has_access'];
}

/**
 * Check if user can access the system 
 * All users follow their company admin's subscription status
 */
function canUserAccessSystem($userId) {
    // Simply check if the user has valid subscription based on admin's status
    return hasValidSubscription($userId);
}

/**
 * Get allowed features based on subscription plan
 */
function getAllowedFeatures($plan) {
    $features = [
        'free' => [
            'customers' => 100,
            'products' => 500,
            'users' => 1,
            'reports' => 'basic',
            'support' => 'email'
        ],
        'starter' => [
            'customers' => 100,
            'products' => 500,
            'users' => 1,
            'reports' => 'basic',
            'support' => 'email'
        ],
        'professional' => [
            'customers' => 1000,
            'products' => 2000,
            'users' => 5,
            'reports' => 'advanced',
            'support' => 'email_chat'
        ],
        'enterprise' => [
            'customers' => 'unlimited',
            'products' => 'unlimited',
            'users' => 'unlimited',
            'reports' => 'full',
            'support' => 'all_channels'
        ]
    ];
    
    return $features[$plan] ?? $features['free'];
}