<?php
// api/create_customer.php - API endpoint for creating customers
header('Content-Type: application/json');

// Allow both GET and POST requests
$method = $_SERVER['REQUEST_METHOD'];
$allowedMethods = ['POST', 'GET'];

if (!in_array($method, $allowedMethods)) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

session_start();

// Authentication check
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/subscription_helper.php';

try {
    // Use the global $pdo connection from db.php
    
    // Get user info
    $userId = $_SESSION['user_id'];
    $companyId = $_SESSION['company_id'];
    $userRole = $_SESSION['role'] ?? 'user';
    
    // Get request data
    if ($method === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data');
        }
    } else {
        $data = $_GET;
    }
    
    // Validate required fields
    if (empty($data['name'])) {
        throw new Exception('Customer name is required');
    }
    
    // Check customer limit based on subscription plan
    $currentCount = 0;
    try {
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM customers WHERE company_id = ?");
        $countStmt->execute([$companyId]);
        $currentCount = $countStmt->fetchColumn();
        
        // Get subscription info
        $subscriptionInfo = getUserSubscriptionInfo($userId);
        $plan = $subscriptionInfo['subscription_plan'] ?? 'free';
        
        // Define limits per plan
        $limits = [
            'free' => 50,
            'starter' => 100,
            'professional' => 1000,
            'enterprise' => -1 // unlimited
        ];
        
        $limit = $limits[$plan] ?? $limits['free'];
        
        // Check if limit is reached (unless enterprise)
        if ($limit !== -1 && $currentCount >= $limit) {
            $message = "Customer limit reached for your current plan ({$currentCount}/{$limit}). ";
            if ($plan === 'free') {
                $message .= "Upgrade to Starter plan to add more customers.";
            } elseif ($plan === 'starter') {
                $message .= "Upgrade to Professional plan to add more customers.";
            } else {
                $message .= "Please upgrade your plan to add more customers.";
            }
            throw new Exception($message);
        }
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'limit reached') !== false) {
            throw $e; // Re-throw limit errors
        }
        // For other errors, log but continue (don't block customer creation due to limit check failures)
        error_log("Customer limit check failed: " . $e->getMessage());
    }
    
    // Prepare customer data
    $customerData = [
        'name' => trim($data['name']),
        'email' => !empty($data['email']) ? trim($data['email']) : null,
        'phone' => !empty($data['phone']) ? trim($data['phone']) : null,
        'address' => !empty($data['address']) ? trim($data['address']) : null,
        'city' => !empty($data['city']) ? trim($data['city']) : null,
        'state' => !empty($data['state']) ? trim($data['state']) : null,
        'company_id' => $companyId,
        'created_by' => $userId,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    
    // Check if customer already exists (by name or email)
    $checkStmt = $pdo->prepare("
        SELECT id FROM customers 
        WHERE company_id = ? AND (name = ? OR (email IS NOT NULL AND email = ?))
    ");
    $checkStmt->execute([$companyId, $customerData['name'], $customerData['email']]);
    
    if ($checkStmt->fetch()) {
        throw new Exception('Customer with this name or email already exists');
    }
    
    // Insert customer
    $columns = array_keys($customerData);
    $placeholders = ':' . implode(', :', $columns);
    $columnsList = implode(', ', $columns);
    
    $stmt = $pdo->prepare("
        INSERT INTO customers ({$columnsList}) 
        VALUES ({$placeholders})
    ");
    
    $stmt->execute($customerData);
    $customerId = $pdo->lastInsertId();
    
    // Get the created customer data
    $getCustomerStmt = $pdo->prepare("
        SELECT * FROM customers WHERE id = ? AND company_id = ?
    ");
    $getCustomerStmt->execute([$customerId, $companyId]);
    $newCustomer = $getCustomerStmt->fetch(PDO::FETCH_ASSOC);
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Customer created successfully',
        'customer' => [
            'id' => intval($newCustomer['id']),
            'name' => $newCustomer['name'],
            'email' => $newCustomer['email'],
            'phone' => $newCustomer['phone'],
            'address' => $newCustomer['address'],
            'city' => $newCustomer['city'],
            'state' => $newCustomer['state'],
            'created_at' => $newCustomer['created_at']
        ]
    ]);

} catch (Exception $e) {
    error_log("Create Customer API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?>
