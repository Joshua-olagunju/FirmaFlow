<?php
/**
 * AI Assistant - Main Entry Point (v3.0)
 * 
 * PRODUCTION-GRADE AI ORCHESTRATION SYSTEM
 * 
 * This system follows strict architecture rules:
 * - AI does NOT own state
 * - AI does NOT route requests
 * - AI does NOT execute actions
 * - AI ONLY extracts data and estimates confidence
 * - ALL control lives in CODE
 * 
 * Flow:
 * 1. User message → Router (code) → Task queue
 * 2. FSM state transitions (code-owned)
 * 3. Load prompts: GLOBAL + MODULE + TASK
 * 4. Call AI ONCE per task
 * 5. Validate output (code)
 * 6. Execute action (code)
 * 7. Clear AI context → Next task or IDLE
 */

// Suppress all output except JSON (prevent HTML errors from being sent)
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);
ini_set('log_errors', '1');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

// ============================================
// CORS Configuration
// ============================================
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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================
// Load Core Dependencies
// ============================================
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../config/env_loader.php';

// Load new architecture components
require_once __DIR__ . '/orchestrator.php';
require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/query_engine.php';

// Load handlers (for execution) - using plural names to match modules
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

// ============================================
// Authentication Check
// ============================================
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized - Please login'
    ]);
    exit;
}

// ============================================
// Request Handling
// ============================================
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    // Get API Key
    $groqApiKey = getenv('GROQ_API_KEY');
    if (!$groqApiKey) {
        throw new Exception('GROQ_API_KEY not configured');
    }
    
    $companyId = $_SESSION['company_id'];
    $userId = $_SESSION['user_id'];
    
    // Get conversation history from request (sent by frontend)
    $conversationHistory = $input['conversationHistory'] ?? [];
    
    // Initialize Orchestrator with conversation history
    $orchestrator = new Orchestrator($pdo, $companyId, $userId, $groqApiKey, $conversationHistory);
    
    switch ($action) {
        // ============================================
        // PRIMARY ACTION: Process User Message
        // ============================================
        case 'process':
        case 'send_message':
        case 'parse_prompt':
            $message = $input['message'] ?? $input['prompt'] ?? '';
            
            if (empty(trim($message))) {
                echo json_encode([
                    'success' => false,
                    'error' => 'Message cannot be empty'
                ]);
                exit;
            }
            
            $result = $orchestrator->processMessage($message);
            echo json_encode($result);
            break;
        
        // ============================================
        // CONFIRMATION: Handle user confirmation response
        // ============================================
        case 'confirm':
            $response = $input['response'] ?? 'confirm'; // confirm, reject, modify
            $formData = $input['formData'] ?? null;
            $message = $input['message'] ?? $response;
            
            // If formData is provided, pass it as JSON for the orchestrator to parse
            if ($formData && is_array($formData)) {
                $message = json_encode($formData);
            }
            
            $result = $orchestrator->processMessage($message);
            echo json_encode($result);
            break;
        
        // ============================================
        // CANCEL: Reset to IDLE state
        // ============================================
        case 'cancel':
        case 'reset':
            $result = $orchestrator->processMessage('cancel');
            echo json_encode($result);
            break;
        
        // ============================================
        // GET STATE: Return current FSM state (debugging)
        // ============================================
        case 'get_state':
            $state = $orchestrator->getDebugState();
            echo json_encode([
                'success' => true,
                'state' => $state
            ]);
            break;
        
        // ============================================
        // GET CAPABILITIES: Return system capabilities
        // ============================================
        case 'get_capabilities':
            echo json_encode([
                'success' => true,
                'capabilities' => getSystemCapabilities()
            ]);
            break;
        
        // ============================================
        // LEGACY SUPPORT: Execute task directly
        // ============================================
        case 'execute_task':
            // For backward compatibility with existing frontend
            $intent = $input['intent'] ?? $input['taskType'] ?? '';
            $data = $input['data'] ?? $input['taskData'] ?? [];
            
            $result = executeIntentLegacy($intent, $data, $pdo, $companyId, $userId);
            echo json_encode($result);
            break;
        
        // ============================================
        // LEGACY SUPPORT: Query information
        // ============================================
        case 'query_info':
            $queryType = $input['queryType'] ?? '';
            $queryData = $input['queryData'] ?? [];
            
            // Route to appropriate handler
            require_once __DIR__ . '/query_engine.php';
            $result = handleQuery($queryType, $queryData, $pdo, $companyId, $userId);
            echo json_encode($result);
            break;
        
        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid action: ' . $action
            ]);
    }
    
} catch (Exception $e) {
    error_log("AI Assistant Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to process request',
        'message' => $e->getMessage()
    ]);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get system capabilities for frontend display
 * Returns array format compatible with frontend MessageBubble component
 */
function getSystemCapabilities(): array {
    return [
        [
            'id' => 'customers',
            'title' => '👤 Customers',
            'description' => 'Create, view, and manage customer records',
            'example' => 'Create customer John Doe with email john@example.com'
        ],
        [
            'id' => 'inventory',
            'title' => '📦 Inventory',
            'description' => 'Add products, view stock, and analyze inventory',
            'example' => 'Add product Laptop, price 50000, quantity 10'
        ],
        [
            'id' => 'sales',
            'title' => '💰 Sales',
            'description' => 'Create invoices, record payments, view sales',
            'example' => 'Create invoice for John Doe with 2 Laptops'
        ],
        [
            'id' => 'payments',
            'title' => '💳 Payments',
            'description' => 'View pending payments, process transactions',
            'example' => 'Show me pending invoices'
        ],
        [
            'id' => 'expenses',
            'title' => '💸 Expenses',
            'description' => 'Track expenses and analyze spending',
            'example' => 'Add expense Electricity bill 15000'
        ],
        [
            'id' => 'suppliers',
            'title' => '🏭 Suppliers',
            'description' => 'Manage supplier records and purchases',
            'example' => 'Create supplier ABC Corp with phone 9876543210'
        ],
        [
            'id' => 'reports',
            'title' => '📊 Reports',
            'description' => 'Generate financial reports and analytics',
            'example' => 'Generate profit and loss report for this month'
        ],
        [
            'id' => 'settings',
            'title' => '⚙️ Settings',
            'description' => 'Configure company and system settings',
            'example' => 'What are my current settings?'
        ]
    ];
}

/**
 * Legacy intent execution (backward compatibility)
 */
function executeIntentLegacy($intent, $data, $pdo, $companyId, $userId) {
    require_once __DIR__ . '/intent_classifier.php';
    
    // Handle unknown/empty intents gracefully
    if (empty($intent) || $intent === 'unknown') {
        return [
            'success' => false,
            'error' => 'I couldn\'t understand that request. Please try rephrasing your command.',
            'type' => 'unknown'
        ];
    }
    
    $category = getIntentCategory($intent);
    
    $handlers = [
        'customers' => 'handleCustomersIntent',
        'suppliers' => 'handleSuppliersIntent',
        'inventory' => 'handleInventoryIntent',
        'sales' => 'handleSalesIntent',
        'payments' => 'handlePaymentsIntent',
        'purchases' => 'handlePurchasesIntent',
        'expenses' => 'handleExpensesIntent',
        'reports' => 'handleReportsIntent',
        'subscriptions' => 'handleSubscriptionsIntent',
        'settings' => 'handleSettingsIntent'
    ];
    
    if (!isset($handlers[$category])) {
        return [
            'success' => false,
            'error' => 'I don\'t recognize that task type. Please try again with a different request.',
            'type' => 'unknown'
        ];
    }
    
    $handlerFunction = $handlers[$category];
    return $handlerFunction($intent, $data, 'executing', $pdo, $companyId, $userId);
}
