<?php
// Start session first
session_start();
header('Content-Type: application/json');

// CORS Headers
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowed_origins, true)) {
    header('Vary: Origin');
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/AccountResolver.php';
require_once __DIR__ . '/journal_helpers.php';
require_once __DIR__ . '/../includes/subscription_helper.php';

// Check authentication
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

$company_id = $_SESSION['company_id'];
$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

// Function to check product limits based on subscription
function checkProductLimit($pdo, $company_id, $user_id) {
    // Get current product count for this company
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE company_id = ?");
    $stmt->execute([$company_id]);
    $currentCount = $stmt->fetchColumn();
    
    // Get subscription info for the user
    $subscriptionInfo = getUserSubscriptionInfo($user_id);
    $plan = $subscriptionInfo['subscription_plan'] ?? 'free';
    
    // Define limits per plan
    $limits = [
        'free' => 200,
        'starter' => 500,
        'professional' => 2000,
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

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND company_id = ?");
            $stmt->execute([$_GET['id'], $company_id]);
            echo json_encode($stmt->fetch());
        } else {
            // Apply filters - always filter by session company_id
            $where = ["company_id = ?"];
            $params = [$company_id];
            
            if (isset($_GET['search'])) {
                $where[] = "(name LIKE ? OR sku LIKE ? OR description LIKE ?)";
                $searchTerm = "%{$_GET['search']}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            if (isset($_GET['filter'])) {
                switch($_GET['filter']) {
                    case 'active':
                        $where[] = "is_active = 1";
                        break;
                    case 'inactive':
                        $where[] = "is_active = 0";
                        break;
                    case 'in_stock':
                        $where[] = "stock_quantity > 0";
                        break;
                    case 'low_stock':
                        $where[] = "stock_quantity > 0 AND stock_quantity <= reorder_level";
                        break;
                    case 'out_of_stock':
                        $where[] = "stock_quantity = 0";
                        break;
                }
            }
            
            $whereClause = empty($where) ? '' : 'WHERE ' . implode(' AND ', $where);
            $sql = "SELECT * FROM products $whereClause ORDER BY name";
            
            if (empty($params)) {
                $stmt = $pdo->query($sql);
            } else {
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }
            
            $rows = $stmt->fetchAll();
            
            // Return response with success wrapper
            echo json_encode([
                'success' => true,
                'data' => $rows
            ]);
        }
        exit;
    }

    if ($method === 'POST') {
        // Check product limit before allowing creation
        $user_id = $_SESSION['user_id'] ?? 0;
        $limitCheck = checkProductLimit($pdo, $company_id, $user_id);
        
        if (!$limitCheck['allowed']) {
            http_response_code(403);
            $message = "Product limit reached for your current plan. ";
            if ($limitCheck['plan'] === 'free') {
                $message .= "Upgrade to Starter plan to add more products.";
            } elseif ($limitCheck['plan'] === 'starter') {
                $message .= "Upgrade to Professional plan to add more products.";
            } else {
                $message .= "Please upgrade your plan to add more products.";
            }
            echo json_encode([
                'error' => $message,
                'current_count' => $limitCheck['current'],
                'limit' => $limitCheck['limit'],
                'plan' => $limitCheck['plan']
            ]);
            exit;
        }
        
        $name = $input['name'] ?? null;
        if (!$name) {
            http_response_code(400);
            echo json_encode(['error' => 'name required']);
            exit;
        }
        
        $sku = $input['sku'] ?? null;
        $description = $input['description'] ?? '';
        $unit = $input['unit'] ?? 'pcs';
        $cost_price = $input['cost_price'] ?? 0;
        $selling_price = $input['selling_price'] ?? 0;
        $stock_quantity = $input['stock_quantity'] ?? 0;
        $reorder_level = $input['reorder_level'] ?? 0;
        $track_inventory = isset($input['track_inventory']) ? (int)($input['track_inventory'] ? 1 : 0) : 1;
        $is_active = isset($input['is_active']) ? (int)($input['is_active'] ? 1 : 0) : 1;
        
        // Check for duplicate SKU if provided
        if ($sku) {
            $stmt = $pdo->prepare("SELECT id FROM products WHERE sku = ? AND company_id = ?");
            $stmt->execute([$sku, $company_id]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'SKU already exists']);
                exit;
            }
        }
        
        $stmt = $pdo->prepare("INSERT INTO products (company_id, sku, name, description, unit, cost_price, selling_price, track_inventory, stock_quantity, reorder_level, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([$company_id, $sku, $name, $description, $unit, $cost_price, $selling_price, $track_inventory, $stock_quantity, $reorder_level, $is_active]);
        $id = $pdo->lastInsertId();
        
        // 🎯 Smart Defaults: Create opening balance journal entry for inventory
        if ($track_inventory && $stock_quantity > 0 && $cost_price > 0) {
            try {
                $resolver = new AccountResolver($pdo, $company_id);
                $inventoryAccountId = $resolver->inventory(false); // Use existing inventory account
                $retainedEarningsAccountId = $resolver->retained(false); // Use existing retained earnings account
                
                if ($inventoryAccountId && $retainedEarningsAccountId) {
                    $openingValue = $stock_quantity * $cost_price;
                    
                    $journal_lines = [
                        [
                            'account_id' => $inventoryAccountId,
                            'debit' => $openingValue,
                            'credit' => 0
                        ],
                        [
                            'account_id' => $retainedEarningsAccountId,
                            'debit' => 0,
                            'credit' => $openingValue
                        ]
                    ];
                    
                    $description = "Opening balance for product: $name (SKU: $sku)";
                    
                    $journalId = createAutomaticJournalEntry(
                        $pdo,
                        $company_id,
                        'product_opening',
                        $id,
                        $description,
                        $journal_lines,
                        date('Y-m-d')
                    );
                    
                    error_log("✅ Product opening balance journal entry created (ID: $journalId): Dr. Inventory $openingValue, Cr. Retained Earnings $openingValue for product $name");
                } else {
                    error_log("❌ Cannot create product opening balance: Inventory account ($inventoryAccountId) or Retained Earnings account ($retainedEarningsAccountId) not found");
                }
            } catch (Exception $e) {
                error_log("❌ Product opening balance journal entry failed: " . $e->getMessage());
                // Continue with product creation even if journal entry fails
            }
        }
        
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        
        // Check if product stock is low immediately after creation
        if ($track_inventory && $stock_quantity <= $reorder_level) {
            // Include notification helper
            require_once __DIR__ . '/../includes/notification_helpers.php';
            
            sendLowStockNotification([
                'id' => $id,
                'name' => $name,
                'sku' => $sku,
                'stock_quantity' => $stock_quantity,
                'unit' => $unit,
                'selling_price' => $selling_price
            ]);
        }
        
        echo json_encode(['success' => true, 'data' => $product]);
        exit;
    }

    if ($method === 'PUT') {
        $id = $_GET['id'] ?? $input['id'] ?? 0;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'id required in query string']);
            exit;
        }
        $id = (int)$id;
        
        $fields = [];
        $params = [];
        foreach (['name','sku','description','unit','cost_price','selling_price','stock_quantity','track_inventory','reorder_level','is_active'] as $col) {
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
        
        // Check for duplicate SKU if updating SKU
        if (isset($input['sku']) && $input['sku']) {
            $stmt = $pdo->prepare("SELECT id FROM products WHERE sku = ? AND id != ? AND company_id = ?");
            $stmt->execute([$input['sku'], $id, $company_id]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'SKU already exists']);
                exit;
            }
        }
        
        $params[] = $id;
        $sql = "UPDATE products SET " . implode(',', $fields) . ", updated_at = NOW() WHERE id = ? AND company_id = ?";
        $params[] = $company_id;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        
        // Check if stock is now low after update
        if (isset($input['stock_quantity']) && $product['track_inventory']) {
            $new_stock = (int)$input['stock_quantity'];
            $reorder_level = (int)$product['reorder_level'];
            
            if ($new_stock <= $reorder_level) {
                // Include notification helper
                require_once __DIR__ . '/../includes/notification_helpers.php';
                
                sendLowStockNotification([
                    'id' => $product['id'],
                    'name' => $product['name'],
                    'sku' => $product['sku'],
                    'stock_quantity' => $new_stock,
                    'unit' => $product['unit'],
                    'selling_price' => $product['selling_price']
                ]);
            }
        }
        
        echo json_encode(['success' => true, 'data' => $product]);
        exit;
    }

    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'id required']);
            exit;
        }
        $id = (int)$_GET['id'];
        
        // Check if product has sales transactions (optional safety check)
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM sales_items WHERE product_id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch();
            
            if ($result && $result['count'] > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Cannot delete product with existing sales transactions']);
                exit;
            }
        } catch (Exception $e) {
            // Table might not exist, continue with deletion
        }
        
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ? AND company_id = ?");
        $stmt->execute([$id, $company_id]);
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'method not allowed']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'exception', 'message' => $e->getMessage()]);
}
