<?php
// Start session first
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/pagination_helper.php';
require_once __DIR__ . '/../includes/subscription_helper.php';

// Check authentication
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

// Always use company_id for all users (company-wide customers)
$company_id = $_SESSION['company_id'];
$method = $_SERVER['REQUEST_METHOD'];

// Function to check customer limits based on subscription
function checkCustomerLimit($pdo, $company_id, $user_id) {
    // Get current customer count for this company
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM customers WHERE company_id = ?");
    $stmt->execute([$company_id]);
    $currentCount = $stmt->fetchColumn();
    
    // Get subscription info for the user
    $subscriptionInfo = getUserSubscriptionInfo($user_id);
    $plan = $subscriptionInfo['subscription_plan'] ?? 'free';
    
    // Define limits per plan
    $limits = [
        'free' => 50,
        'starter' => 100,
        'professional' => 1000,
        'enterprise' => -1 // unlimited
    ];
    
    $limit = $limits[$plan] ?? $limits['free'];
    
    // If enterprise (unlimited), always allow
    if ($limit === -1) {
        return ['allowed' => true, 'current' => $currentCount, 'limit' => 'unlimited'];
    }
    
    // Check if current count is at or above limit
    $allowed = $currentCount < $limit;
    
    return [
        'allowed' => $allowed,
        'current' => $currentCount,
        'limit' => $limit,
        'plan' => $plan
    ];
}

// Read input (JSON)
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ? AND company_id = ?");
            $stmt->execute([$_GET['id'], $company_id]);
            $row = $stmt->fetch();
            echo json_encode($row ?: []);
        } else {
            // Pagination parameters
            $page = getCurrentPageFromRequest();
            $itemsPerPage = getItemsPerPageFromRequest(20);
            $search = $_GET['search'] ?? '';
            $sortBy = $_GET['sort_by'] ?? 'name';
            $sortOrder = $_GET['sort_order'] ?? 'ASC';
            
            // Validate sort parameters
            $allowedSortFields = ['name', 'email', 'phone', 'created_at'];
            if (!in_array($sortBy, $allowedSortFields)) {
                $sortBy = 'name';
            }
            $sortOrder = strtoupper($sortOrder) === 'DESC' ? 'DESC' : 'ASC';
            
            // Apply filters - always filter by session company_id
            $where = ["company_id = ?"];
            $params = [$company_id];

            // Search functionality
            if (!empty($search)) {
                $where[] = "(name LIKE ? OR email LIKE ? OR phone LIKE ?)";
                $searchParam = "%$search%";
                $params[] = $searchParam;
                $params[] = $searchParam;
                $params[] = $searchParam;
            }

            if (isset($_GET['filter'])) {
                switch($_GET['filter']) {
                    case 'active':
                        $where[] = "is_active = 1";
                        break;
                    case 'with_balance':
                        $where[] = "balance > 0";
                        break;
                }
            }

            $whereClause = 'WHERE ' . implode(' AND ', $where);
            
            // Get total count for pagination
            $countSql = "SELECT COUNT(*) FROM customers $whereClause";
            $stmt = $pdo->prepare($countSql);
            $stmt->execute($params);
            $totalItems = $stmt->fetchColumn();
            
            // Create pagination
            $pagination = createPagination($totalItems, $page, $itemsPerPage);
            
            // Get paginated data
            $sql = "SELECT id, name, email, phone, billing_address, customer_type, 
                           payment_terms, credit_limit, is_active, balance,
                           DATE_FORMAT(created_at, '%Y-%m-%d') as created_date,
                           created_at
                    FROM customers 
                    $whereClause 
                    ORDER BY $sortBy $sortOrder 
                    {$pagination->getLimitClause()}";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            
            // Return paginated response
            echo json_encode([
                'success' => true,
                'data' => $rows,
                'pagination' => $pagination->getPaginationInfo(),
                'total' => $totalItems
            ]);
        }
        exit;
    }

    if ($method === 'POST') {
        // Check customer limit before allowing creation
        $user_id = $_SESSION['user_id'] ?? 0;
        $limitCheck = checkCustomerLimit($pdo, $company_id, $user_id);
        
        if (!$limitCheck['allowed']) {
            http_response_code(403);
            $message = "Customer limit reached for your current plan. ";
            if ($limitCheck['plan'] === 'free') {
                $message .= "Upgrade to Starter plan to add more customers.";
            } elseif ($limitCheck['plan'] === 'starter') {
                $message .= "Upgrade to Professional plan to add more customers.";
            } else {
                $message .= "Please upgrade your plan to add more customers.";
            }
            echo json_encode([
                'error' => $message,
                'current_count' => $limitCheck['current'],
                'limit' => $limitCheck['limit'],
                'plan' => $limitCheck['plan']
            ]);
            exit;
        }
        
        // Required: name (company_id comes from session)
        $name = $input['name'] ?? null;
        $phone = $input['phone'] ?? null;
        $email = $input['email'] ?? null;
        $billing_address = $input['billing_address'] ?? null;
        $customer_type = $input['customer_type'] ?? 'individual';
        $payment_terms = $input['payment_terms'] ?? 'Net 30';
        $credit_limit = $input['credit_limit'] ?? 0;
        $is_active = $input['is_active'] ?? 1;
        $balance = $input['balance'] ?? 0;

        if (!$name) {
            http_response_code(400);
            echo json_encode(['error' => 'name required']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO customers (company_id, name, phone, email, billing_address, customer_type, payment_terms, credit_limit, is_active, balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([$company_id, $name, $phone, $email, $billing_address, $customer_type, $payment_terms, $credit_limit, $is_active, $balance]);
        $id = $pdo->lastInsertId();

        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        $customer = $stmt->fetch();
        
        echo json_encode([
            'success' => true,
            'message' => 'Customer created successfully',
            'data' => $customer
        ]);
        exit;
    }

    if ($method === 'PUT') {
        // must pass id via query string ?id=123
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'id required in query string']);
            exit;
        }
        $id = (int)$_GET['id'];
        // build update columns
        $fields = [];
        $params = [];
        foreach (['name','phone','email','billing_address','customer_type','payment_terms','credit_limit','is_active','balance'] as $col) {
            if (isset($input[$col])) {
                $fields[] = "$col = ?";
                $params[] = $input[$col];
            }
        }
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'no fields to update']);
            exit;
        }
        $params[] = $id;
        $sql = "UPDATE customers SET " . implode(',', $fields) . ", updated_at = NOW() WHERE id = ? AND company_id = ?";
        $params[] = $company_id;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        $customer = $stmt->fetch();
        
        echo json_encode([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => $customer
        ]);
        exit;
    }

    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'id required']);
            exit;
        }
        $id = (int)$_GET['id'];
        $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ? AND company_id = ?");
        $stmt->execute([$id, $company_id]);
        echo json_encode(['success' => true]);
        exit;
    }

    // other methods
    http_response_code(405);
    echo json_encode(['error' => 'method not allowed']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'exception', 'message' => $e->getMessage()]);
}
