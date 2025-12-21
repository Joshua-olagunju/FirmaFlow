<?php
// AI Assistant API - Automate Tasks (Create Customers, Products, Invoices, Payments)
session_start();
header('Content-Type: application/json');

// CORS Headers - Match customers.php format exactly
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

// Load database connection - same as other APIs
require_once __DIR__ . '/../includes/db.php';

// Load environment variables for Groq API
require_once __DIR__ . '/../config/env_loader.php';
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
        
        switch ($action) {
            case 'parse_prompt':
                // Parse user prompt to understand intent and extract data
                $prompt = $input['prompt'] ?? '';
                $conversationHistory = $input['conversationHistory'] ?? [];
                $result = parseUserPrompt($prompt, $conversationHistory, $groqApiKey);
                echo json_encode($result);
                break;
                
            case 'execute_task':
                // Execute the confirmed task
                $taskType = $input['taskType'] ?? '';
                $taskData = $input['taskData'] ?? [];
                
                $result = executeTask($taskType, $taskData);
                echo json_encode($result);
                break;
                
            case 'query_info':
                // Handle informational queries directly (no confirmation needed)
                $queryType = $input['queryType'] ?? '';
                $queryData = $input['queryData'] ?? [];
                
                $result = handleQuery($queryType, $queryData);
                echo json_encode($result);
                break;
                
            case 'get_capabilities':
                // Return list of what AI can do
                echo json_encode([
                    'success' => true,
                    'capabilities' => getCapabilities()
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

function getCapabilities() {
    return [
        [
            'id' => 'create_customer',
            'title' => 'Create Customer',
            'description' => 'Add a new customer to your system',
            'example' => 'Create a customer named John Doe with email john@example.com and phone 1234567890'
        ],
        [
            'id' => 'create_product',
            'title' => 'Add Product to Inventory',
            'description' => 'Add new products or goods to your inventory',
            'example' => 'Add product Laptop with price 50000 and quantity 10'
        ],
        [
            'id' => 'create_invoice',
            'title' => 'Create Invoice',
            'description' => 'Create an invoice for a customer',
            'example' => 'Create invoice for John Doe with product Laptop quantity 2'
        ],
        [
            'id' => 'approve_payment',
            'title' => 'Approve Payment',
            'description' => 'Approve pending payments',
            'example' => 'Approve payment for invoice INV-001'
        ]
    ];
}

function parseUserPrompt($prompt, $conversationHistory, $apiKey) {
    $systemPrompt = <<<SYSTEM
You are an AI assistant for FirmaFlow accounting software. Parse user requests and extract structured data.

Be flexible and understand natural language. Users can provide information in any order or format.
IMPORTANT: Use the conversation history to understand context. If the user refers to information from previous messages, extract it from the context.

Identify the task type and extract all relevant data. Return ONLY valid JSON without any markdown formatting.

Task types: create_customer, create_product, create_invoice, approve_payment, query_information, conversational, template_request

For create_customer, extract ALL provided fields:
- name (required)
- email (optional but extract if mentioned)
- phone (optional but extract if mentioned)
- address (optional but extract if mentioned - can be full address or just street)
- credit_limit (optional, extract if mentioned)
- payment_terms (optional, extract if mentioned like "Net 30", "Net 60")
- customer_type (optional, "individual" or "business")

For create_product, extract ALL provided fields:
- name (required)
- description (optional but extract if mentioned)
- selling_price (required, extract any number mentioned as price/selling price)
- cost_price (optional, extract if mentioned separately as cost/cost price/purchase price)
- quantity (required, extract any number mentioned as quantity/stock/qty)
- unit (optional, extract if mentioned like "pieces", "kg", "liters", etc. - default to "Pieces")
- sku (optional but extract if mentioned - will be auto-generated if not provided)

For create_invoice, extract:
- customer_name or customer_email (required)
- items (array of {product_name, quantity, price})
- due_date (optional)
- notes (optional)

For approve_payment, extract:
- invoice_number or payment_id (required)

For query_information (when user asks business questions):
- query_type: "customers", "products", "invoices", "payments", "sales", "today", "daily_summary", "top_customers", "top_products", "invoice_details", "customer_details", "product_details", "expenses", "help", "general"
- query_text: the actual question
- query_params: any specific IDs, names, dates, or filters mentioned
- Use "daily_summary" for comprehensive questions like "what happened today", "today's activities", "give me a summary of today", "all activities today"

For conversational (when user is being friendly, off-topic, or asking about the AI itself):
- Use this for greetings ("hi", "hello"), identity questions ("who are you", "what are you"), small talk ("how are you"), or non-business topics
- ALSO use for questions about how the system works: "will SKU be generated?", "does it auto-generate?", "how does it work?", "what happens when?", "can you do X?"
- response: a brief, friendly response that acknowledges them and redirects to business tasks OR answers their question about system capabilities

For template_request (when user EXPLICITLY asks for examples, templates, or prompts):
- ONLY use when user directly requests: "give me a prompt", "show me an example", "give me a template", "show me a sample"
- Do NOT use for questions about system capabilities or how things work
- template_type: "customer", "product", "invoice", "payment" - what they want an example for
- Include context from conversation if they're referring to something discussed

Examples of natural prompts:
- "Create customer John Doe, email john@example.com, phone 1234567890, address 123 Main St, credit limit 10000"
- "Add product Laptop for 50000 with 10 in stock"
- "Add product Rice, cost price 500, selling price 800, 100 bags"
- "Make a new customer called ABC Corp, business type, Net 60 terms, phone 555-1234"

Response format:
{
    "task_type": "create_customer|create_product|create_invoice|approve_payment|query_information|conversational|template_request|unknown",
    "confidence": 0.0-1.0,
    "extracted_data": {
        // ALL extracted fields, even optional ones if user provided them
    },
    "missing_fields": ["field1", "field2"],
    "has_all_required": true|false,
    "clarification_message": "message asking for missing info" or null,
    "conversational_response": "friendly response for conversational queries" or null,
    "template_type": "customer|product|invoice|payment for template requests" or null
}

Be generous in extraction - if user provides information, extract it even if it's optional.
If task is unclear or you cannot determine intent, set task_type to "unknown".
SYSTEM;

    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    
    // Build messages array with conversation history
    $messages = [['role' => 'system', 'content' => $systemPrompt]];
    
    // Add conversation history for context (limit to last 10 messages to avoid token limits)
    $historyLimit = array_slice($conversationHistory, -10);
    foreach ($historyLimit as $msg) {
        $messages[] = [
            'role' => $msg['role'],
            'content' => $msg['content']
        ];
    }
    
    // Add current prompt
    $messages[] = ['role' => 'user', 'content' => $prompt];
    
    $data = [
        'model' => 'llama-3.1-8b-instant',
        'messages' => $messages,
        'temperature' => 0.3,
        'max_tokens' => 800,
        'response_format' => ['type' => 'json_object']
    ];
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        error_log("AI Assistant cURL Error: " . $curlError);
        throw new Exception('Network error connecting to AI service');
    }
    
    if ($httpCode !== 200) {
        error_log("AI Assistant HTTP Error: " . $httpCode . " Response: " . substr($response, 0, 500));
        
        // Check for rate limit error
        $errorData = json_decode($response, true);
        if ($httpCode === 429 && isset($errorData['error']['code']) && $errorData['error']['code'] === 'rate_limit_exceeded') {
            // Extract wait time if available
            preg_match('/try again in ([^.]+)/', $errorData['error']['message'] ?? '', $matches);
            $waitTime = $matches[1] ?? 'a few minutes';
            throw new Exception("⏰ AI service rate limit reached. Please try again in {$waitTime}. The AI has processed many requests today and needs to rest!");
        }
        
        throw new Exception('AI service unavailable (HTTP ' . $httpCode . ')');
    }
    
    $result = json_decode($response, true);
    
    if (!$result || !isset($result['choices'][0]['message']['content'])) {
        error_log("AI Assistant Invalid Response: " . substr($response, 0, 500));
        throw new Exception('Invalid response from AI service');
    }
    
    $aiResponse = $result['choices'][0]['message']['content'] ?? '';
    
    $parsed = json_decode($aiResponse, true);
    
    if (!$parsed || !isset($parsed['task_type'])) {
        error_log("AI Assistant Parse Error. AI Response: " . substr($aiResponse, 0, 500));
        throw new Exception('Failed to parse AI response');
    }
    
    return [
        'success' => true,
        'parsed' => $parsed,
        'original_prompt' => $prompt
    ];
}

function handleQuery($queryType, $queryData) {
    global $pdo;
    
    if (!isset($_SESSION['company_id'])) {
        return ['success' => false, 'error' => 'Unauthorized'];
    }
    
    $companyId = $_SESSION['company_id'];
    $userId = $_SESSION['user_id'];
    
    try {
        switch ($queryType) {
            case 'customers':
                // Count customers
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM customers WHERE company_id = ?");
                $stmt->execute([$companyId]);
                $count = $stmt->fetchColumn();
                
                // Get recent customers
                $stmt = $pdo->prepare("SELECT name, email, created_at FROM customers WHERE company_id = ? ORDER BY created_at DESC LIMIT 5");
                $stmt->execute([$companyId]);
                $recent = $stmt->fetchAll();
                
                $answer = "📊 You have **{$count} customer(s)** in your system.";
                if ($count > 0) {
                    $answer .= "\n\n🆕 Recent customers:\n";
                    foreach ($recent as $customer) {
                        $date = date('M d, Y', strtotime($customer['created_at']));
                        $answer .= "• {$customer['name']}";
                        if ($customer['email']) $answer .= " ({$customer['email']})";
                        $answer .= " - Added {$date}\n";
                    }
                }
                
                return ['success' => true, 'answer' => $answer];
                
            case 'products':
                // Count products
                $stmt = $pdo->prepare("SELECT COUNT(*) as count, SUM(stock_quantity) as total_stock FROM products WHERE company_id = ?");
                $stmt->execute([$companyId]);
                $data = $stmt->fetch();
                
                $answer = "📦 You have **{$data['count']} product(s)** with **{$data['total_stock']} total units** in stock.";
                
                return ['success' => true, 'answer' => $answer];
                
            case 'invoices':
                // Count invoices and get totals
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as count,
                        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_total,
                        SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END) as unpaid_total
                    FROM sales_invoices WHERE company_id = ?
                ");
                $stmt->execute([$companyId]);
                $data = $stmt->fetch();
                
                $answer = "📄 You have **{$data['count']} invoice(s)**.\n";
                $answer .= "💰 Paid: ₦" . number_format($data['paid_total'], 2) . "\n";
                $answer .= "⏳ Unpaid: ₦" . number_format($data['unpaid_total'], 2);
                
                return ['success' => true, 'answer' => $answer];
                
            case 'payments':
                // Get payment stats
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as count,
                        SUM(amount) as total,
                        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_total,
                        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_total
                    FROM payments WHERE company_id = ?
                ");
                $stmt->execute([$companyId]);
                $data = $stmt->fetch();
                
                $answer = "💳 Payment Summary:\n";
                $answer .= "• Total Payments: {$data['count']}\n";
                $answer .= "• Completed: ₦" . number_format($data['completed_total'], 2) . "\n";
                $answer .= "• Pending: ₦" . number_format($data['pending_total'], 2);
                
                return ['success' => true, 'answer' => $answer];
                
            case 'sales':
                // Total sales/revenue
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as invoice_count,
                        SUM(total) as total_revenue,
                        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_revenue,
                        AVG(total) as avg_invoice
                    FROM sales_invoices 
                    WHERE company_id = ?
                ");
                $stmt->execute([$companyId]);
                $data = $stmt->fetch();
                
                $answer = "💰 Sales Summary:\n";
                $answer .= "• Total Invoices: {$data['invoice_count']}\n";
                $answer .= "• Total Revenue: ₦" . number_format($data['total_revenue'] ?? 0, 2) . "\n";
                $answer .= "• Paid Revenue: ₦" . number_format($data['paid_revenue'] ?? 0, 2) . "\n";
                $answer .= "• Average Invoice: ₦" . number_format($data['avg_invoice'] ?? 0, 2);
                
                return ['success' => true, 'answer' => $answer];
                
            case 'today':
            case 'daily_summary':
            case 'general':
                // Comprehensive daily activity summary
                $today = date('Y-m-d');
                $summary = "📅 **Today's Complete Summary** (" . date('F j, Y') . ")\n\n";
                
                // 1. New Customers Added
                $stmt = $pdo->prepare("SELECT COUNT(*) as count, GROUP_CONCAT(name SEPARATOR ', ') as names FROM customers WHERE company_id = ? AND DATE(created_at) = CURDATE() LIMIT 5");
                $stmt->execute([$companyId]);
                $customers = $stmt->fetch();
                if ($customers['count'] > 0) {
                    $summary .= "👥 **New Customers:** {$customers['count']}\n";
                    if ($customers['names']) {
                        $names = explode(', ', $customers['names']);
                        foreach (array_slice($names, 0, 3) as $name) {
                            $summary .= "   • {$name}\n";
                        }
                        if ($customers['count'] > 3) $summary .= "   • ...and " . ($customers['count'] - 3) . " more\n";
                    }
                    $summary .= "\n";
                } else {
                    $summary .= "👥 **New Customers:** 0\n\n";
                }
                
                // 2. New Products Added
                $stmt = $pdo->prepare("SELECT COUNT(*) as count, GROUP_CONCAT(name SEPARATOR ', ') as names FROM products WHERE company_id = ? AND DATE(created_at) = CURDATE() LIMIT 5");
                $stmt->execute([$companyId]);
                $products = $stmt->fetch();
                if ($products['count'] > 0) {
                    $summary .= "📦 **New Products:** {$products['count']}\n";
                    if ($products['names']) {
                        $names = explode(', ', $products['names']);
                        foreach (array_slice($names, 0, 3) as $name) {
                            $summary .= "   • {$name}\n";
                        }
                        if ($products['count'] > 3) $summary .= "   • ...and " . ($products['count'] - 3) . " more\n";
                    }
                    $summary .= "\n";
                } else {
                    $summary .= "📦 **New Products:** 0\n\n";
                }
                
                // 3. Invoices/Sales
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as count,
                        SUM(total) as revenue,
                        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid
                    FROM sales_invoices 
                    WHERE company_id = ? AND DATE(created_at) = CURDATE()
                ");
                $stmt->execute([$companyId]);
                $invoices = $stmt->fetch();
                $summary .= "💰 **Sales/Invoices:** {$invoices['count']}\n";
                if ($invoices['count'] > 0) {
                    $summary .= "   • Total Amount: ₦" . number_format($invoices['revenue'] ?? 0, 2) . "\n";
                    $summary .= "   • Paid: ₦" . number_format($invoices['paid'] ?? 0, 2) . "\n";
                }
                $summary .= "\n";
                
                // 4. Payments Received
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as count,
                        SUM(amount) as total
                    FROM payments 
                    WHERE company_id = ? AND DATE(payment_date) = CURDATE()
                ");
                $stmt->execute([$companyId]);
                $payments = $stmt->fetch();
                $summary .= "💳 **Payments Received:** {$payments['count']}\n";
                if ($payments['count'] > 0) {
                    $summary .= "   • Total: ₦" . number_format($payments['total'] ?? 0, 2) . "\n";
                }
                $summary .= "\n";
                
                // 5. Expenses
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as count,
                        SUM(amount) as total
                    FROM expenses 
                    WHERE company_id = ? AND DATE(expense_date) = CURDATE()
                ");
                $stmt->execute([$companyId]);
                $expenses = $stmt->fetch();
                $summary .= "💸 **Expenses:** {$expenses['count']}\n";
                if ($expenses['count'] > 0) {
                    $summary .= "   • Total: ₦" . number_format($expenses['total'] ?? 0, 2) . "\n";
                }
                $summary .= "\n";
                
                // 6. Net Summary
                $netIncome = ($invoices['paid'] ?? 0) - ($expenses['total'] ?? 0);
                $summary .= "📊 **Net Income Today:** ₦" . number_format($netIncome, 2) . "\n";
                if ($netIncome > 0) {
                    $summary .= "   ✅ Profitable day!";
                } elseif ($netIncome < 0) {
                    $summary .= "   ⚠️ Expenses exceeded income";
                } else {
                    $summary .= "   ℹ️ Break-even";
                }
                
                return ['success' => true, 'answer' => $summary];
                
            case 'top_customers':
                // Top customers by spending
                $stmt = $pdo->prepare("
                    SELECT 
                        c.name,
                        c.email,
                        COUNT(si.id) as invoice_count,
                        SUM(si.total) as total_spent
                    FROM customers c
                    LEFT JOIN sales_invoices si ON c.id = si.customer_id AND si.company_id = ?
                    WHERE c.company_id = ?
                    GROUP BY c.id
                    HAVING total_spent > 0
                    ORDER BY total_spent DESC
                    LIMIT 10
                ");
                $stmt->execute([$companyId, $companyId]);
                $topCustomers = $stmt->fetchAll();
                
                if (empty($topCustomers)) {
                    return ['success' => true, 'answer' => '📊 No customer spending data available yet.'];
                }
                
                $answer = "🏆 Top Customers by Spending:\n\n";
                $rank = 1;
                foreach ($topCustomers as $customer) {
                    $answer .= "{$rank}. **{$customer['name']}**\n";
                    if ($customer['email']) $answer .= "   📧 {$customer['email']}\n";
                    $answer .= "   💰 Total Spent: ₦" . number_format($customer['total_spent'], 2) . "\n";
                    $answer .= "   📄 Invoices: {$customer['invoice_count']}\n\n";
                    $rank++;
                }
                
                return ['success' => true, 'answer' => $answer];
                
            case 'top_products':
                // Top selling products
                $stmt = $pdo->prepare("
                    SELECT 
                        p.name,
                        p.price,
                        p.stock_quantity,
                        SUM(sil.quantity) as total_sold,
                        SUM(sil.line_total) as total_revenue
                    FROM products p
                    LEFT JOIN sales_invoice_lines sil ON p.id = sil.product_id
                    LEFT JOIN sales_invoices si ON sil.invoice_id = si.id AND si.company_id = ?
                    WHERE p.company_id = ?
                    GROUP BY p.id
                    HAVING total_sold > 0
                    ORDER BY total_sold DESC
                    LIMIT 10
                ");
                $stmt->execute([$companyId, $companyId]);
                $topProducts = $stmt->fetchAll();
                
                if (empty($topProducts)) {
                    return ['success' => true, 'answer' => '📦 No product sales data available yet.'];
                }
                
                $answer = "🏆 Top Selling Products:\n\n";
                $rank = 1;
                foreach ($topProducts as $product) {
                    $answer .= "{$rank}. **{$product['name']}**\n";
                    $answer .= "   📊 Units Sold: {$product['total_sold']}\n";
                    $answer .= "   💰 Revenue: ₦" . number_format($product['total_revenue'] ?? 0, 2) . "\n";
                    $answer .= "   📦 Current Stock: {$product['stock_quantity']}\n\n";
                    $rank++;
                }
                
                return ['success' => true, 'answer' => $answer];
                
            case 'invoice_details':
                // Get specific invoice details
                if (!isset($queryData['invoice_number']) && !isset($queryData['invoice_id'])) {
                    return ['success' => false, 'error' => 'Please provide an invoice number or ID.'];
                }
                
                $whereClause = isset($queryData['invoice_number']) ? 'invoice_no = ?' : 'id = ?';
                $value = $queryData['invoice_number'] ?? $queryData['invoice_id'];
                
                $stmt = $pdo->prepare("
                    SELECT 
                        si.*,
                        c.name as customer_name,
                        c.email as customer_email,
                        c.phone as customer_phone
                    FROM sales_invoices si
                    LEFT JOIN customers c ON si.customer_id = c.id
                    WHERE si.company_id = ? AND si.$whereClause
                ");
                $stmt->execute([$companyId, $value]);
                $invoice = $stmt->fetch();
                
                if (!$invoice) {
                    return ['success' => false, 'error' => 'Invoice not found.'];
                }
                
                // Get invoice items
                $stmt = $pdo->prepare("
                    SELECT 
                        sil.*,
                        p.name as product_name
                    FROM sales_invoice_lines sil
                    LEFT JOIN products p ON sil.product_id = p.id
                    WHERE sil.invoice_id = ?
                ");
                $stmt->execute([$invoice['id']]);
                $items = $stmt->fetchAll();
                
                $answer = "📄 **Invoice #{$invoice['invoice_no']}**\n\n";
                $answer .= "👤 Customer: {$invoice['customer_name']}\n";
                if ($invoice['customer_email']) $answer .= "📧 Email: {$invoice['customer_email']}\n";
                if ($invoice['customer_phone']) $answer .= "📞 Phone: {$invoice['customer_phone']}\n";
                $answer .= "📅 Date: " . date('M d, Y', strtotime($invoice['created_at'])) . "\n";
                if ($invoice['due_date']) $answer .= "⏰ Due Date: " . date('M d, Y', strtotime($invoice['due_date'])) . "\n";
                $answer .= "📊 Status: " . strtoupper($invoice['status']) . "\n\n";
                
                $answer .= "🛒 **Items:**\n";
                foreach ($items as $item) {
                    $answer .= "• {$item['product_name']} x {$item['quantity']}\n";
                    $answer .= "  ₦" . number_format($item['unit_price'], 2) . " each = ₦" . number_format($item['line_total'], 2) . "\n";
                }
                
                $answer .= "\n💰 **Total: ₦" . number_format($invoice['total'], 2) . "**";
                
                return ['success' => true, 'answer' => $answer];
                
            case 'customer_details':
                // Get specific customer details
                if (!isset($queryData['customer_name']) && !isset($queryData['customer_id'])) {
                    return ['success' => false, 'error' => 'Please provide a customer name or ID.'];
                }
                
                $whereClause = isset($queryData['customer_name']) ? 'name LIKE ?' : 'id = ?';
                $value = isset($queryData['customer_name']) ? '%' . $queryData['customer_name'] . '%' : $queryData['customer_id'];
                
                $stmt = $pdo->prepare("
                    SELECT * FROM customers
                    WHERE company_id = ? AND $whereClause
                ");
                $stmt->execute([$companyId, $value]);
                $customer = $stmt->fetch();
                
                if (!$customer) {
                    return ['success' => false, 'error' => 'Customer not found.'];
                }
                
                // Get customer's spending
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as invoice_count,
                        SUM(total) as total_spent,
                        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_total,
                        SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END) as unpaid_total
                    FROM sales_invoices
                    WHERE customer_id = ? AND company_id = ?
                ");
                $stmt->execute([$customer['id'], $companyId]);
                $spending = $stmt->fetch();
                
                $answer = "👤 **{$customer['name']}**\n\n";
                if ($customer['email']) $answer .= "📧 Email: {$customer['email']}\n";
                if ($customer['phone']) $answer .= "📞 Phone: {$customer['phone']}\n";
                if ($customer['address']) $answer .= "📍 Address: {$customer['address']}\n";
                $answer .= "📅 Customer Since: " . date('M d, Y', strtotime($customer['created_at'])) . "\n\n";
                
                $answer .= "💰 **Spending Summary:**\n";
                $answer .= "• Total Invoices: {$spending['invoice_count']}\n";
                $answer .= "• Total Spent: ₦" . number_format($spending['total_spent'] ?? 0, 2) . "\n";
                $answer .= "• Paid: ₦" . number_format($spending['paid_total'] ?? 0, 2) . "\n";
                $answer .= "• Outstanding: ₦" . number_format($spending['unpaid_total'] ?? 0, 2);
                
                return ['success' => true, 'answer' => $answer];
                
            case 'product_details':
                // Get specific product details
                if (!isset($queryData['product_name']) && !isset($queryData['product_id'])) {
                    return ['success' => false, 'error' => 'Please provide a product name or ID.'];
                }
                
                $whereClause = isset($queryData['product_name']) ? 'name LIKE ?' : 'id = ?';
                $value = isset($queryData['product_name']) ? '%' . $queryData['product_name'] . '%' : $queryData['product_id'];
                
                $stmt = $pdo->prepare("
                    SELECT * FROM products
                    WHERE company_id = ? AND $whereClause
                ");
                $stmt->execute([$companyId, $value]);
                $product = $stmt->fetch();
                
                if (!$product) {
                    return ['success' => false, 'error' => 'Product not found.'];
                }
                
                // Get sales stats
                $stmt = $pdo->prepare("
                    SELECT 
                        SUM(sil.quantity) as total_sold,
                        SUM(sil.line_total) as total_revenue
                    FROM sales_invoice_lines sil
                    LEFT JOIN sales_invoices si ON sil.invoice_id = si.id
                    WHERE sil.product_id = ? AND si.company_id = ?
                ");
                $stmt->execute([$product['id'], $companyId]);
                $sales = $stmt->fetch();
                
                $answer = "📦 **{$product['name']}**\n\n";
                if ($product['description']) $answer .= "📝 {$product['description']}\n\n";
                $answer .= "💰 Price: ₦" . number_format($product['price'], 2) . "\n";
                $answer .= "📊 Stock: {$product['stock_quantity']} units\n";
                if ($product['sku']) $answer .= "🔖 SKU: {$product['sku']}\n";
                
                if ($sales['total_sold']) {
                    $answer .= "\n📈 **Sales Performance:**\n";
                    $answer .= "• Units Sold: {$sales['total_sold']}\n";
                    $answer .= "• Total Revenue: ₦" . number_format($sales['total_revenue'] ?? 0, 2);
                }
                
                return ['success' => true, 'answer' => $answer];
                
            default:
                return ['success' => false, 'error' => 'I can help you with: customer info, product details, invoices, payments, sales stats, top customers/products, and today\'s summary. Try asking things like "who is my top spender?" or "show me invoice #123".'];
        }
    } catch (Exception $e) {
        return ['success' => false, 'error' => 'Failed to retrieve information: ' . $e->getMessage()];
    }
}

function executeTask($taskType, $taskData) {
    global $pdo; // Use global $pdo from includes/db.php
    
    if (!isset($_SESSION['user_id'])) {
        return ['success' => false, 'error' => 'User session invalid. Please log in again.'];
    }
    
    $companyId = $_SESSION['company_id'];
    $userId = $_SESSION['user_id'];
    
    switch ($taskType) {
        case 'create_customer':
            return createCustomer($taskData, $companyId, $pdo);
            
        case 'create_product':
            return createProduct($taskData, $companyId, $pdo);
            
        case 'create_invoice':
            return createInvoice($taskData, $companyId, $userId, $pdo);
            
        case 'approve_payment':
            return approvePayment($taskData, $companyId, $pdo);
            
        default:
            return ['success' => false, 'error' => 'Unknown task type'];
    }
}

function createCustomer($data, $companyId, $pdo) {
    try {
        // Validate required fields - matching customers.php
        if (empty($data['name'])) {
            return ['success' => false, 'error' => 'Customer name is required'];
        }
        
        // Extract data - accept ALL fields user provided
        $name = $data['name'];
        $phone = $data['phone'] ?? null;
        $email = $data['email'] ?? null;
        $billing_address = $data['address'] ?? null;
        
        // Accept optional fields if user provided them
        $customer_type = $data['customer_type'] ?? 'individual';
        $payment_terms = $data['payment_terms'] ?? 'Net 30';
        $credit_limit = $data['credit_limit'] ?? 0;
        $is_active = 1;
        $balance = 0;
        
        // Insert customer - exact same SQL as customers.php
        $stmt = $pdo->prepare("
            INSERT INTO customers 
            (company_id, name, phone, email, billing_address, customer_type, payment_terms, credit_limit, is_active, balance, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $companyId, 
            $name, 
            $phone, 
            $email, 
            $billing_address, 
            $customer_type, 
            $payment_terms, 
            $credit_limit, 
            $is_active, 
            $balance
        ]);
        
        $customerId = $pdo->lastInsertId();
        
        // Fetch the created customer
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch();
        
        return [
            'success' => true,
            'message' => 'Customer created successfully',
            'customer_id' => $customerId,
            'customer_name' => $name,
            'data' => $customer
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function createProduct($data, $companyId, $pdo) {
    try {
        // Match products.php validation
        if (empty($data['name'])) {
            return ['success' => false, 'error' => 'Product name is required'];
        }
        
        $name = $data['name'];
        $description = $data['description'] ?? '';
        $unit = $data['unit'] ?? 'Pieces';
        
        // Handle prices: cost_price and selling_price separately
        // If only 'price' is provided, use it as selling_price
        $selling_price = $data['selling_price'] ?? $data['price'] ?? 0;
        $cost_price = $data['cost_price'] ?? $selling_price; // Default cost to selling if not provided
        
        $stock_quantity = $data['quantity'] ?? 0;
        $reorder_level = 0;
        $track_inventory = 1;
        $is_active = 1;
        
        // Auto-generate SKU if not provided (match AddProductModal.jsx logic)
        $sku = $data['sku'] ?? null;
        if (empty($sku)) {
            $sku = generateProductSKU($name);
        }
        
        // Insert product - matching products.php structure
        $stmt = $pdo->prepare("
            INSERT INTO products 
            (company_id, name, sku, description, unit, cost_price, selling_price, stock_quantity, reorder_level, track_inventory, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $companyId,
            $name,
            $sku,
            $description,
            $unit,
            $cost_price,
            $selling_price,
            $stock_quantity,
            $reorder_level,
            $track_inventory,
            $is_active
        ]);
        
        $productId = $pdo->lastInsertId();
        
        return [
            'success' => true,
            'message' => 'Product added to inventory successfully',
            'product_id' => $productId,
            'product_name' => $name,
            'sku' => $sku
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Auto-generate SKU in format: TOP-QOM (3 chars - 3 chars from name)
// Matches the logic from AddProductModal.jsx
function generateProductSKU($name) {
    if (empty($name)) return '';
    
    // Remove special chars and split into words
    $name = strtoupper($name);
    $name = preg_replace('/[^A-Z0-9\s]/', '', $name);
    $words = array_filter(explode(' ', $name), function($w) { return !empty($w); });
    
    if (empty($words)) return '';
    
    // Get first 3 characters from first word
    $firstPart = str_pad(substr($words[0], 0, 3), 3, 'X');
    
    // Get first 3 characters from second word (or use part of first word)
    if (count($words) > 1) {
        $secondPart = str_pad(substr($words[1], 0, 3), 3, 'X');
    } else {
        // Use remaining chars from first word or repeat
        $remaining = substr($words[0], 3, 3);
        $secondPart = str_pad($remaining, 3, $words[0][0]);
    }
    
    return $firstPart . '-' . $secondPart;
}

function createInvoice($data, $companyId, $userId, $pdo) {
    try {
        // Find customer
        $customerIdentifier = $data['customer_name'] ?? $data['customer_email'] ?? null;
        if (!$customerIdentifier) {
            return ['success' => false, 'error' => 'Customer identifier required'];
        }
        
        $stmt = $pdo->prepare("
            SELECT id, name FROM customers 
            WHERE company_id = ? AND (name LIKE ? OR email LIKE ?)
            LIMIT 1
        ");
        $stmt->execute([$companyId, "%$customerIdentifier%", "%$customerIdentifier%"]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$customer) {
            return ['success' => false, 'error' => 'Customer not found'];
        }
        
        // Validate items
        if (empty($data['items']) || !is_array($data['items'])) {
            return ['success' => false, 'error' => 'Invoice items required'];
        }
        
        // Generate invoice number
        $stmt = $pdo->prepare("
            SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number, 5) AS UNSIGNED)), 0) + 1 as next_num
            FROM sales 
            WHERE company_id = ? AND invoice_number LIKE 'INV-%'
        ");
        $stmt->execute([$companyId]);
        $nextNum = $stmt->fetchColumn();
        $invoiceNumber = 'INV-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
        
        // Calculate total
        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $subtotal += ($item['price'] ?? 0) * ($item['quantity'] ?? 0);
        }
        $tax = $subtotal * 0.075; // 7.5% VAT
        $total = $subtotal + $tax;
        
        // Insert invoice
        $pdo->beginTransaction();
        
        $dueDate = $data['due_date'] ?? date('Y-m-d', strtotime('+30 days'));
        
        $stmt = $pdo->prepare("
            INSERT INTO sales (
                company_id, customer_id, invoice_number, invoice_date, due_date,
                subtotal, tax, total, status, notes, created_by, created_at
            ) VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, 'pending', ?, ?, NOW())
        ");
        
        $stmt->execute([
            $companyId,
            $customer['id'],
            $invoiceNumber,
            $dueDate,
            $subtotal,
            $tax,
            $total,
            $data['notes'] ?? '',
            $userId
        ]);
        
        $invoiceId = $pdo->lastInsertId();
        
        // Insert invoice items
        $stmt = $pdo->prepare("
            INSERT INTO invoice_items (sale_id, description, quantity, unit_price, total)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($data['items'] as $item) {
            $itemTotal = ($item['price'] ?? 0) * ($item['quantity'] ?? 0);
            $stmt->execute([
                $invoiceId,
                $item['product_name'] ?? $item['description'] ?? 'Item',
                $item['quantity'] ?? 1,
                $item['price'] ?? 0,
                $itemTotal
            ]);
        }
        
        $pdo->commit();
        
        return [
            'success' => true,
            'message' => 'Invoice created successfully',
            'invoice_id' => $invoiceId,
            'invoice_number' => $invoiceNumber,
            'customer_name' => $customer['name'],
            'total' => $total
        ];
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function approvePayment($data, $companyId, $pdo) {
    try {
        $identifier = $data['invoice_number'] ?? $data['payment_id'] ?? null;
        if (!$identifier) {
            return ['success' => false, 'error' => 'Invoice number or payment ID required'];
        }
        
        // Find payment
        $stmt = $pdo->prepare("
            SELECT p.id, p.amount, s.invoice_number 
            FROM payments p
            LEFT JOIN sales s ON p.sale_id = s.id
            WHERE p.company_id = ? AND p.status = 'pending'
            AND (s.invoice_number = ? OR p.id = ?)
            LIMIT 1
        ");
        $stmt->execute([$companyId, $identifier, $identifier]);
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$payment) {
            return ['success' => false, 'error' => 'Pending payment not found'];
        }
        
        // Approve payment
        $stmt = $pdo->prepare("
            UPDATE payments 
            SET status = 'completed', verified_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$payment['id']]);
        
        // Update invoice status
        $stmt = $pdo->prepare("
            UPDATE sales s
            SET s.status = 'paid'
            WHERE s.id = (SELECT sale_id FROM payments WHERE id = ?)
        ");
        $stmt->execute([$payment['id']]);
        
        return [
            'success' => true,
            'message' => 'Payment approved successfully',
            'payment_id' => $payment['id'],
            'invoice_number' => $payment['invoice_number'],
            'amount' => $payment['amount']
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}
