<?php
/**
 * AI Assistant - Main Router
 * Routes requests to appropriate modules based on action
 */
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

// Load dependencies
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../config/env_loader.php';
require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/state_manager.php';
require_once __DIR__ . '/parser.php';
require_once __DIR__ . '/intent_classifier.php';
require_once __DIR__ . '/query_engine.php';

// Load handlers (using plural names to match modules)
require_once __DIR__ . '/handlers/customers_handler.php';
require_once __DIR__ . '/handlers/suppliers_handler.php';
require_once __DIR__ . '/handlers/inventory_handler.php';
require_once __DIR__ . '/handlers/sales_handler.php';
require_once __DIR__ . '/handlers/payments_handler.php';
require_once __DIR__ . '/handlers/purchases_handler.php';
require_once __DIR__ . '/handlers/expenses_handler.php';
require_once __DIR__ . '/handlers/reports_handler.php';
require_once __DIR__ . '/handlers/subscriptions_handler.php';
require_once __DIR__ . '/handlers/settings_handler.php';

loadEnv();

// Authentication check
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    try {
        // Get Groq API Key
        $groqApiKey = getenv('GROQ_API_KEY');
        if (!$groqApiKey) {
            throw new Exception('GROQ_API_KEY not configured.');
        }
        
        $companyId = $_SESSION['company_id'];
        $userId = $_SESSION['user_id'];
        
        switch ($action) {
            case 'parse_prompt':
                // Parse user prompt and classify intent
                $prompt = $input['prompt'] ?? '';
                $conversationHistory = $input['conversationHistory'] ?? [];
                $state = $input['state'] ?? 'idle';
                
                $result = parseAndClassifyIntent($prompt, $conversationHistory, $state, $groqApiKey, $pdo, $companyId);
                echo json_encode($result);
                break;
                
            case 'execute_task':
                // Execute confirmed task through appropriate handler
                $intent = $input['intent'] ?? $input['taskType'] ?? '';
                $data = $input['data'] ?? $input['taskData'] ?? [];
                $state = $input['state'] ?? 'executing';
                
                $result = executeIntent($intent, $data, $state, $pdo, $companyId, $userId);
                echo json_encode($result);
                break;
                
            case 'query_info':
                // Handle informational queries through query engine
                $queryType = $input['queryType'] ?? '';
                $queryData = $input['queryData'] ?? [];
                
                $result = handleQuery($queryType, $queryData, $pdo, $companyId, $userId);
                echo json_encode($result);
                break;
                
            case 'get_capabilities':
                // Return system capabilities
                echo json_encode([
                    'success' => true,
                    'capabilities' => getSystemCapabilities()
                ]);
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to process request',
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

/**
 * Execute intent through appropriate handler
 */
function executeIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    // Route to appropriate handler based on intent category
    $category = getIntentCategory($intent);
    
    switch ($category) {
        case 'customers':
            return handleCustomerIntent($intent, $data, $state, $pdo, $companyId, $userId);
            
        case 'suppliers':
            return handleSupplierIntent($intent, $data, $state, $pdo, $companyId, $userId);
            
        case 'inventory':
            return handleInventoryIntent($intent, $data, $state, $pdo, $companyId, $userId);
            
        case 'sales':
            return handleSalesIntent($intent, $data, $state, $pdo, $companyId, $userId);
            
        case 'payments':
            return handlePaymentIntent($intent, $data, $state, $pdo, $companyId, $userId);
            
        case 'purchases':
            return handlePurchaseIntent($intent, $data, $state, $pdo, $companyId, $userId);
            
        case 'expenses':
            return handleExpenseIntent($intent, $data, $state, $pdo, $companyId, $userId);
            
        case 'reports':
            return handleReportIntent($intent, $data, $state, $pdo, $companyId, $userId);
            
        case 'subscriptions':
            return handleSubscriptionIntent($intent, $data, $state, $pdo, $companyId, $userId);
            
        case 'settings':
            return handleSettingsIntent($intent, $data, $state, $pdo, $companyId, $userId);
            
        default:
            return [
                'success' => false,
                'error' => 'Unknown intent category',
                'intent' => $intent
            ];
    }
}

/**
 * Get system capabilities formatted for frontend display
 */
function getSystemCapabilities() {
    // Return flat array with id, title, description, example for frontend
    return [
        // Customers
        [
            'id' => 'create_customer',
            'title' => '👤 Create Customer',
            'description' => 'Add new customers to your system',
            'example' => 'Create customer John Doe with email john@example.com, phone 08012345678'
        ],
        [
            'id' => 'view_customer',
            'title' => '🔍 View Customer',
            'description' => 'Search and view customer details',
            'example' => 'Show me customer John Doe'
        ],
        [
            'id' => 'customer_summary',
            'title' => '📊 Customer Stats',
            'description' => 'Get customer statistics and top buyers',
            'example' => 'Show me my top customers'
        ],
        
        // Inventory
        [
            'id' => 'add_product',
            'title' => '📦 Add Product',
            'description' => 'Add products to your inventory',
            'example' => 'Add product Laptop, selling price 50000, quantity 10'
        ],
        [
            'id' => 'view_inventory',
            'title' => '📋 View Inventory',
            'description' => 'Check product stock levels',
            'example' => 'Show me my inventory'
        ],
        [
            'id' => 'inventory_analysis',
            'title' => '📈 Inventory Analysis',
            'description' => 'Analyze inventory performance',
            'example' => 'What products are low in stock?'
        ],
        
        // Sales
        [
            'id' => 'create_invoice',
            'title' => '🧾 Create Invoice',
            'description' => 'Generate sales invoices',
            'example' => 'Create invoice for John Doe with Laptop x 2'
        ],
        [
            'id' => 'view_invoice',
            'title' => '👁️ View Invoice',
            'description' => 'View invoice details',
            'example' => 'Show me invoice INV-001'
        ],
        [
            'id' => 'sales_summary',
            'title' => '💰 Sales Report',
            'description' => 'Get sales statistics',
            'example' => 'Show me today\'s sales'
        ],
        
        // Payments
        [
            'id' => 'view_pending_invoices',
            'title' => '⏳ Pending Invoices',
            'description' => 'View unpaid customer invoices',
            'example' => 'Show me pending invoices'
        ],
        [
            'id' => 'approve_supplier_payment',
            'title' => '✅ Approve Payment',
            'description' => 'Approve supplier payments',
            'example' => 'Approve payment for PO-001'
        ],
        
        // Purchases
        [
            'id' => 'create_purchase_order',
            'title' => '🛒 Create Purchase',
            'description' => 'Create purchase orders',
            'example' => 'Create purchase order for ABC Supplier'
        ],
        [
            'id' => 'purchase_summary',
            'title' => '📊 Purchase Report',
            'description' => 'View purchase statistics',
            'example' => 'Show me this month\'s purchases'
        ],
        
        // Expenses
        [
            'id' => 'add_expense',
            'title' => '💸 Record Expense',
            'description' => 'Record business expenses',
            'example' => 'Add expense Electricity bill, amount 15000'
        ],
        [
            'id' => 'expense_summary',
            'title' => '📉 Expense Report',
            'description' => 'View expense breakdown',
            'example' => 'Show me my expenses this week'
        ],
        
        // Reports
        [
            'id' => 'report_analysis',
            'title' => '📊 Business Overview',
            'description' => 'Comprehensive business analysis',
            'example' => 'Give me a business overview'
        ],
        [
            'id' => 'generate_report',
            'title' => '📄 Financial Report',
            'description' => 'Generate detailed reports',
            'example' => 'Generate profit and loss report'
        ]
    ];
}
