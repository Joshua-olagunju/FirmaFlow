<?php
// AI Insights API - FREE Groq Integration
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

session_start();

// Load environment variables
require_once __DIR__ . '/../config/env_loader.php';
loadEnv();

// CORS Headers - Allow multiple localhost ports
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

// Authentication check
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $action = $input['action'] ?? 'insights';
    
    try {
        // Get Groq API Key from environment variable (stored in .env)
        // Sign up for FREE at https://console.groq.com
        $groqApiKey = getenv('GROQ_API_KEY');
        
        if (!$groqApiKey) {
            throw new Exception('GROQ_API_KEY not configured. Please add it to your .env file.');
        }
        
        if ($action === 'chat') {
            // Handle chat conversation
            $message = $input['message'] ?? '';
            $reportContext = $input['reportContext'] ?? '';
            $conversationHistory = $input['conversationHistory'] ?? [];
            
            if (empty($message)) {
                http_response_code(400);
                echo json_encode(['error' => 'Message is required']);
                exit;
            }
            
            $response = handleChatMessage($message, $reportContext, $conversationHistory, $groqApiKey);
            
            echo json_encode([
                'success' => true,
                'response' => $response
            ]);
            
        } else {
            // Handle insights generation
            $reportType = $input['reportType'] ?? '';
            $reportData = $input['reportData'] ?? [];
            
            if (empty($reportType) || empty($reportData)) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing report type or data']);
                exit;
            }
            
            // Generate insights based on report type
            $insights = generateInsights($reportType, $reportData, $groqApiKey);
            
            echo json_encode([
                'success' => true,
                'insights' => $insights
            ]);
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

function generateInsights($reportType, $reportData, $apiKey) {
    // Create context-aware prompt based on report type
    $prompt = createPrompt($reportType, $reportData);
    
    // Call Groq API (FREE - Using Llama 3)
    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    
    $data = [
        'model' => 'llama-3.3-70b-versatile', // Updated to current FREE model
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are a financial analyst expert. Provide clear, actionable insights based on financial data. Be concise and professional.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ],
        'temperature' => 0.7,
        'max_tokens' => 500,
        'top_p' => 1,
        'stream' => false
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
        CURLOPT_SSL_VERIFYPEER => false, // For local dev
        CURLOPT_SSL_VERIFYHOST => false
    ]);
    
    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false) {
        throw new Exception('cURL error: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        throw new Exception('Groq API request failed (HTTP ' . $httpCode . '): ' . $response);
    }
    
    $result = json_decode($response, true);
    
    if (isset($result['choices'][0]['message']['content'])) {
        $content = $result['choices'][0]['message']['content'];
        
        // Parse insights into array
        return parseInsights($content);
    }
    
    throw new Exception('Invalid response from AI service');
}

function createPrompt($reportType, $reportData) {
    $dataJson = json_encode($reportData, JSON_PRETTY_PRINT);
    
    $prompts = [
        'profit_loss' => "Analyze this Profit & Loss report and provide 3-5 key financial insights:\n\nData: {$dataJson}\n\nProvide insights on:\n1. Revenue trends and performance\n2. Expense patterns and cost control\n3. Profit margin analysis\n4. Areas for improvement\n5. Actionable recommendations\n\nFormat each insight as a bullet point starting with • ",
        
        'balance_sheet' => "Analyze this Balance Sheet and provide 3-5 key financial insights:\n\nData: {$dataJson}\n\nProvide insights on:\n1. Asset composition and liquidity\n2. Liability management\n3. Equity position\n4. Financial stability indicators\n5. Recommendations for better balance\n\nFormat each insight as a bullet point starting with • ",
        
        'cash_flow' => "Analyze this Cash Flow statement and provide 3-5 key insights:\n\nData: {$dataJson}\n\nProvide insights on:\n1. Cash generation from operations\n2. Investment activities impact\n3. Financing activities\n4. Cash position health\n5. Liquidity recommendations\n\nFormat each insight as a bullet point starting with • ",
        
        'trial_balance' => "Analyze this Trial Balance and provide 3-5 key insights:\n\nData: {$dataJson}\n\nProvide insights on:\n1. Account balance verification\n2. Debit/credit balance status\n3. Any irregularities detected\n4. Account category analysis\n5. Recommendations\n\nFormat each insight as a bullet point starting with • ",
        
        'sales_summary' => "Analyze this Sales Summary and provide 3-5 key insights:\n\nData: {$dataJson}\n\nProvide insights on:\n1. Sales performance trends\n2. Top performing products/customers\n3. Revenue patterns\n4. Growth opportunities\n5. Strategic recommendations\n\nFormat each insight as a bullet point starting with • ",
        
        'inventory_summary' => "Analyze this Inventory report and provide 3-5 key insights:\n\nData: {$dataJson}\n\nProvide insights on:\n1. Stock value and turnover\n2. Low stock alerts significance\n3. High value items management\n4. Inventory optimization\n5. Cost reduction opportunities\n\nFormat each insight as a bullet point starting with • "
    ];
    
    return $prompts[$reportType] ?? "Analyze this financial report: {$dataJson}";
}

function parseInsights($content) {
    // Split by bullet points or numbered lists
    $lines = explode("\n", $content);
    $insights = [];
    
    foreach ($lines as $line) {
        $line = trim($line);
        // Remove bullet points, numbers, or dashes
        $line = preg_replace('/^[•\-\d\.]+\s*/', '', $line);
        
        if (!empty($line) && strlen($line) > 20) {
            $insights[] = $line;
        }
    }
    
    // Limit to 5 insights
    return array_slice($insights, 0, 5);
}

function handleChatMessage($message, $reportContext, $conversationHistory, $apiKey) {
    // Build conversation messages for API
    $messages = [
        [
            'role' => 'system',
            'content' => 'You are a helpful AI Financial Assistant. Your role is to help users understand their financial reports and provide general financial guidance. 

IMPORTANT GUIDELINES:
1. You have access to the user\'s financial report data provided in the context
2. Answer questions about the specific numbers, trends, and metrics in their report
3. Provide clear, actionable financial advice and recommendations
4. Explain accounting concepts and best practices when asked
5. Be conversational and friendly while maintaining professionalism
6. Always remind users that you are an AI and not a certified financial advisor
7. For critical financial decisions, recommend consulting with a professional
8. Focus on insights related to the report data when applicable

Keep responses concise (2-4 paragraphs) and easy to understand.'
        ]
    ];
    
    // Add report context if available
    if (!empty($reportContext)) {
        $reportContextData = json_decode($reportContext, true);
        $reportName = $reportContextData['reportName'] ?? 'Financial Report';
        
        $messages[] = [
            'role' => 'system',
            'content' => "CONTEXT: The user has just generated a {$reportName}. Here is their report data:\n\n" . json_encode($reportContextData['data'], JSON_PRETTY_PRINT) . "\n\nUse this data to answer their questions specifically about their financial situation."
        ];
    }
    
    // Add conversation history (last 5 messages)
    foreach (array_slice($conversationHistory, -5) as $msg) {
        if (isset($msg['role']) && isset($msg['content'])) {
            $messages[] = [
                'role' => $msg['role'],
                'content' => $msg['content']
            ];
        }
    }
    
    // Add current user message
    $messages[] = [
        'role' => 'user',
        'content' => $message
    ];
    
    // Call Groq API
    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    
    $data = [
        'model' => 'llama-3.3-70b-versatile',
        'messages' => $messages,
        'temperature' => 0.8,
        'max_tokens' => 800,
        'top_p' => 1,
        'stream' => false
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
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false) {
        throw new Exception('cURL error: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        throw new Exception('Groq API request failed (HTTP ' . $httpCode . '): ' . $response);
    }
    
    $result = json_decode($response, true);
    
    if (isset($result['choices'][0]['message']['content'])) {
        return $result['choices'][0]['message']['content'];
    }
    
    throw new Exception('Invalid response from AI service');
}

