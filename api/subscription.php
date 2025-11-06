<?php
// api/subscription.php
// Hardened API endpoint for subscription management (activate subscriptions without webhooks)
declare(strict_types=1);

session_start();

// Basic CORS - prefer config or env to restrict origin in production
$allowedOrigin = getenv('ALLOWED_ORIGIN') ?: ''; // e.g. https://yourdomain.com
if ($allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// --- Includes ---
require_once __DIR__ . '/../includes/db.php';              // must set $pdo (PDO)
require_once __DIR__ . '/../includes/flutterwave_helper.php'; // optional used in GET plans

// --- Basic checks ---
if (!isset($pdo) || !($pdo instanceof PDO)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server misconfiguration: database not available']);
    exit;
}

// Helper: consistent JSON responses
function json_response(array $payload, int $httpCode = 200): void {
    http_response_code($httpCode);
    echo json_encode($payload);
    exit;
}

// ---------- Auth ----------
function requireAuth(): int {
    if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required']);
        exit;
    }
    return (int) $_SESSION['user_id'];
}

// ---------- Helpers ----------
/**
 * Activate subscription for a user. Caller must be authenticated.
 * Admins can optionally activate for another user by providing 'for_user_id'.
 */
function activateSubscription(array $input, int $callerUserId, PDO $pdo): array {
    // defaults and normalization
    $targetUserId = $callerUserId;

    // validate required input
    $plan = strtolower(trim((string)($input['plan'] ?? '')));
    $billingType = strtolower(trim((string)($input['billing_type'] ?? 'monthly')));
    $transactionId = trim((string)($input['transaction_id'] ?? ''));
    $txRef = trim((string)($input['tx_ref'] ?? ''));
    $amount = isset($input['amount']) ? (float)$input['amount'] : 0.0;
    $currency = strtoupper(trim((string)($input['currency'] ?? 'NGN')));
    $paymentMethod = trim((string)($input['payment_method'] ?? 'flutterwave'));
    $paymentStatus = trim((string)($input['payment_status'] ?? 'successful'));

    if ($amount <= 0 || $plan === '' || $transactionId === '' || $txRef === '') {
        return ['success' => false, 'message' => 'Missing or invalid required fields: plan, transaction_id, tx_ref, amount'];
    }

    // allowed plans and billing types
    $validPlans = ['starter', 'professional', 'enterprise', 'free'];
    $validBillingTypes = ['monthly', 'quarterly', 'six_months', 'yearly'];
    
    if (!in_array($plan, $validPlans, true)) {
        return ['success' => false, 'message' => 'Invalid plan specified'];
    }
    
    if (!in_array($billingType, $validBillingTypes, true)) {
        return ['success' => false, 'message' => 'Invalid billing type specified'];
    }

    // If caller requested activation for another user, validate admin role
    if (!empty($input['for_user_id'])) {
        $requestedId = (int)$input['for_user_id'];
        if ($requestedId <= 0) {
            return ['success' => false, 'message' => 'Invalid for_user_id'];
        }

        // verify caller role
        $stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmtRole->execute([$callerUserId]);
        $r = $stmtRole->fetch(PDO::FETCH_ASSOC);
        $role = $r['role'] ?? 'user';

        if ($role === 'admin') {
            $targetUserId = $requestedId;
        } else {
            return ['success' => false, 'message' => 'Insufficient privileges to activate for another user'];
        }
    }

    try {
        $pdo->beginTransaction();

        // compute dates based on billing type
        $startDate = date('Y-m-d H:i:s');
        switch ($billingType) {
            case 'quarterly':
                $endDate = date('Y-m-d H:i:s', strtotime('+3 months', strtotime($startDate)));
                break;
            case 'six_months':
                $endDate = date('Y-m-d H:i:s', strtotime('+6 months', strtotime($startDate)));
                break;
            case 'yearly':
                $endDate = date('Y-m-d H:i:s', strtotime('+1 year', strtotime($startDate)));
                break;
            case 'monthly':
            default:
                $endDate = date('Y-m-d H:i:s', strtotime('+1 month', strtotime($startDate)));
                break;
        }

        // update users table
        $updateSql = "
            UPDATE users
            SET 
                subscription_plan = :plan,
                subscription_status = 'active',
                subscription_start_date = :start,
                subscription_end_date = :end,
                billing_type = :billing_type,
                last_payment_date = :last_payment,
                payment_reference = :payment_reference,
                updated_at = NOW()
            WHERE id = :user_id
        ";
        $stmt = $pdo->prepare($updateSql);
        $ok = $stmt->execute([
            ':plan' => $plan,
            ':start' => $startDate,
            ':end' => $endDate,
            ':billing_type' => $billingType,
            ':last_payment' => $startDate,
            ':payment_reference' => $txRef,
            ':user_id' => $targetUserId
        ]);

        if (!$ok) {
            $pdo->rollBack();
            return ['success' => false, 'message' => 'Failed to update user subscription'];
        }

        // attempt to fetch company_id (nullable)
        $companyId = null;
        $stmtComp = $pdo->prepare("SELECT company_id FROM users WHERE id = ?");
        $stmtComp->execute([$targetUserId]);
        $compRow = $stmtComp->fetch(PDO::FETCH_ASSOC);
        if ($compRow && isset($compRow['company_id'])) {
            $companyId = $compRow['company_id'];
        }

        // record payment
        $insertSql = "
            INSERT INTO subscription_payments
            (user_id, company_id, transaction_id, tx_ref, amount, currency, status, plan_type, billing_type, payment_method, subscription_start, subscription_end, flutterwave_data, created_at)
            VALUES (:user_id, :company_id, :transaction_id, :tx_ref, :amount, :currency, :status, :plan_type, :billing_type, :payment_method, :start, :end, :fw_data, NOW())
        ";

        $fwData = json_encode($input, JSON_UNESCAPED_UNICODE);

        $stmtPay = $pdo->prepare($insertSql);
        $okPay = $stmtPay->execute([
            ':user_id' => $targetUserId,
            ':company_id' => $companyId,
            ':transaction_id' => $transactionId,
            ':tx_ref' => $txRef,
            ':amount' => $amount,
            ':currency' => $currency,
            ':status' => $paymentStatus,
            ':plan_type' => $plan,
            ':billing_type' => $billingType,
            ':payment_method' => $paymentMethod,
            ':start' => $startDate,
            ':end' => $endDate,
            ':fw_data' => $fwData
        ]);

        if (!$okPay) {
            $pdo->rollBack();
            return ['success' => false, 'message' => 'Failed to record payment'];
        }

        $pdo->commit();

        return [
            'success' => true,
            'message' => 'Subscription activated successfully',
            'subscription' => [
                'user_id' => $targetUserId,
                'plan' => $plan,
                'billing_type' => $billingType,
                'status' => 'active',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'transaction_id' => $transactionId,
                'tx_ref' => $txRef
            ]
        ];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('[subscription.activate] Exception: ' . $e->getMessage());
        return ['success' => false, 'message' => 'Subscription activation failed: ' . $e->getMessage()];
    }
}

// ---------- Routing ----------
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = [];

// parse input
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    if ($raw === false) {
        json_response(['success' => false, 'message' => 'Failed to read request body'], 400);
    }
    $decoded = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $input = $decoded;
        if (isset($input['action'])) {
            $action = $input['action'];
        }
    } else {
        // fallback to form-encoded POST
        $input = $_POST;
        $action = $_POST['action'] ?? $action;
    }
}

try {
    if ($method === 'GET') {
        $userId = requireAuth();
        switch ($action) {
            case 'current':
                $stmt = $pdo->prepare("SELECT subscription_plan, subscription_status, subscription_start_date, subscription_end_date, last_payment_date, payment_reference FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                json_response(['success' => true, 'data' => $row]);
                break;

            case 'payments':
            case 'history':
                $stmt = $pdo->prepare("SELECT transaction_id, tx_ref, amount, currency, status, plan_type, billing_type, payment_method, subscription_start, subscription_end, created_at FROM subscription_payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
                $stmt->execute([$userId]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                json_response(['success' => true, 'data' => $rows]);
                break;

            case 'usage':
                $stmt = $pdo->prepare("SELECT subscription_plan, subscription_status, subscription_start_date, subscription_end_date, DATEDIFF(subscription_end_date, NOW()) as days_remaining FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                json_response(['success' => true, 'data' => $row]);
                break;

            case 'plans':
                if (class_exists('FlutterwavePayment')) {
                    $fw = new FlutterwavePayment();
                    $plans = $fw->getAllPlans();
                    json_response(['success' => true, 'data' => $plans]);
                } else {
                    json_response(['success' => true, 'data' => []]);
                }
                break;

            default:
                json_response(['success' => false, 'message' => 'Invalid action for GET'], 400);
        }
    } elseif ($method === 'POST') {
        $userId = requireAuth();
        switch ($action) {
            case 'activate_subscription':
                $result = activateSubscription($input, $userId, $pdo);
                if (!empty($result['success'])) {
                    json_response($result, 200);
                } else {
                    json_response($result, 400);
                }
                break;

            case 'cancel':
                $stmt = $pdo->prepare("UPDATE users SET subscription_status = 'cancelled', updated_at = NOW() WHERE id = ?");
                $ok = $stmt->execute([$userId]);
                json_response(['success' => (bool)$ok, 'message' => $ok ? 'Subscription cancelled' : 'Failed to cancel subscription']);
                break;

            case 'update_usage':
                json_response(['success' => false, 'message' => 'Usage tracking not implemented']);
                break;

            default:
                json_response(['success' => false, 'message' => 'Invalid action for POST'], 400);
        }
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (Throwable $e) {
    error_log('[subscription.api] Unhandled exception: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
}
