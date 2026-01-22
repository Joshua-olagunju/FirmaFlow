<?php
/**
 * JEPA-STYLE AI REASONER MODULE
 * 
 * This is the "prediction" part of JEPA architecture.
 * 
 * Given the world state, this module:
 * 1. Understands user intent (semantic analysis)
 * 2. Predicts likely next states (JEPA prediction)
 * 3. Extracts structured data from messages
 * 4. Generates conversational responses
 * 
 * KEY PRINCIPLE: AI suggests, code decides
 * The AI provides predictions, but PHP code validates and chooses actions.
 */

namespace FirmaFlow\AIOrchestrator;

class AIReasoner {
    
    private $apiKey;
    private $conversationHistory;
    private $apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    private $model = 'llama-3.3-70b-versatile';
    
    public function __construct(string $apiKey, array $conversationHistory = []) {
        $this->apiKey = $apiKey;
        $this->conversationHistory = $conversationHistory;
    }
    
    /**
     * JEPA UNDERSTAND: Semantic understanding of user intent
     * 
     * Given the world state, understand what the user wants to do.
     * Returns structured understanding, not raw AI output.
     */
    public function understand(string $message, array $worldSnapshot): array {
        // Build context-aware prompt
        $worldSummary = $this->buildWorldSummary($worldSnapshot);
        
        $systemPrompt = $this->getUnderstandingPrompt($worldSummary);
        
        $response = $this->callAI($systemPrompt, $message);
        
        // Parse AI response into structured understanding
        return $this->parseUnderstanding($response, $message);
    }
    
    /**
     * JEPA PREDICT: Predict likely next states
     * 
     * Given current understanding and world state, predict what 
     * the likely next system states are. This helps the code
     * prepare for user's next action.
     */
    public function predictNextStates(array $understanding, array $worldSnapshot): array {
        // If conversational, no state prediction needed
        if ($understanding['isConversational']) {
            return ['likelyStates' => ['IDLE']];
        }
        
        // Predict based on action type
        $predictions = [];
        
        switch ($understanding['action']) {
            case 'create_customer':
            case 'create_supplier':
            case 'create_product':
            case 'create_expense':
                $predictions = [
                    'likelyStates' => ['DATA_EXTRACTED', 'AWAITING_CONFIRMATION'],
                    'needsForm' => true,
                    'suggestedFollowUp' => 'show_form'
                ];
                break;
                
            case 'list_customers':
            case 'list_suppliers':
            case 'list_products':
            case 'list_sales':
                $predictions = [
                    'likelyStates' => ['COMPLETED'],
                    'needsForm' => false,
                    'suggestedFollowUp' => 'offer_create'
                ];
                break;
                
            case 'update_customer':
            case 'update_supplier':
            case 'update_product':
                $predictions = [
                    'likelyStates' => ['DATA_EXTRACTED', 'AWAITING_CONFIRMATION'],
                    'needsForm' => true,
                    'needsEntitySelection' => !isset($understanding['data']['id']),
                    'suggestedFollowUp' => 'show_selection_or_form'
                ];
                break;
                
            case 'delete_customer':
            case 'delete_supplier':
            case 'delete_product':
                $predictions = [
                    'likelyStates' => ['AWAITING_CONFIRMATION'],
                    'needsForm' => false,
                    'needsEntitySelection' => !isset($understanding['data']['id']),
                    'suggestedFollowUp' => 'show_confirmation'
                ];
                break;
                
            default:
                $predictions = [
                    'likelyStates' => ['INTENT_DETECTED'],
                    'needsForm' => false,
                    'suggestedFollowUp' => 'clarify'
                ];
        }
        
        return $predictions;
    }
    
    /**
     * Extract structured data from user message
     * 
     * Given current task context, extract relevant data fields.
     */
    public function extractData(string $message, array $currentTask, array $worldSnapshot): array {
        $module = $currentTask['module'];
        $action = $currentTask['action'];
        
        // Build extraction prompt based on task
        $systemPrompt = $this->getExtractionPrompt($module, $action, $worldSnapshot);
        
        $response = $this->callAI($systemPrompt, $message, true);
        
        // Parse extraction result
        $data = $this->parseExtractionResponse($response);
        
        // Merge with any existing data
        $existingData = $currentTask['data'] ?? [];
        $mergedData = array_merge($existingData, $data);
        
        return [
            'data' => $mergedData,
            'rawResponse' => $response,
            'confidence' => $this->assessConfidence($data, $action)
        ];
    }
    
    /**
     * Generate conversational response (no action needed)
     */
    public function generateConversationalResponse(string $message, array $understanding): string {
        $systemPrompt = <<<PROMPT
You are a helpful business assistant for FirmaFlow.
Be friendly, concise, and helpful.
If the user seems to want to do something, gently suggest how you can help.

Available capabilities:
- Customer management (create, list, update, delete customers)
- Supplier management (create, list, update, delete suppliers)
- Product/Inventory management
- Sales and invoicing
- Purchases and bills
- Expense tracking
- Financial reports

Keep responses brief (1-3 sentences) unless more detail is needed.
PROMPT;
        
        return $this->callAI($systemPrompt, $message);
    }
    
    /**
     * Call AI API
     */
    private function callAI(string $systemPrompt, string $userMessage, bool $expectJson = false): string {
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt]
        ];
        
        // Add conversation history (limited)
        foreach (array_slice($this->conversationHistory, -6) as $msg) {
            $messages[] = [
                'role' => $msg['role'] === 'assistant' ? 'assistant' : 'user',
                'content' => $msg['content']
            ];
        }
        
        $messages[] = ['role' => 'user', 'content' => $userMessage];
        
        $payload = [
            'model' => $this->model,
            'messages' => $messages,
            'temperature' => $expectJson ? 0.1 : 0.7,
            'max_tokens' => 1024
        ];
        
        if ($expectJson) {
            $payload['response_format'] = ['type' => 'json_object'];
        }
        
        $ch = curl_init($this->apiEndpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            error_log("AI API error: HTTP {$httpCode} - {$response}");
            throw new \Exception("AI service temporarily unavailable");
        }
        
        $result = json_decode($response, true);
        return $result['choices'][0]['message']['content'] ?? '';
    }
    
    /**
     * Build world summary for AI context
     */
    private function buildWorldSummary(array $worldSnapshot): string {
        $summary = "Current state: {$worldSnapshot['fsmState']['state']}\n";
        
        if ($worldSnapshot['currentTask']) {
            $task = $worldSnapshot['currentTask'];
            $summary .= "Active task: {$task['module']}.{$task['action']}\n";
        }
        
        $bc = $worldSnapshot['businessContext'];
        $summary .= "Business data: {$bc['counts']['customers']} customers, ";
        $summary .= "{$bc['counts']['suppliers']} suppliers, ";
        $summary .= "{$bc['counts']['products']} products\n";
        
        if (!empty($worldSnapshot['lastOfferedActions'])) {
            $summary .= "Recently discussed: ";
            $topics = array_map(fn($a) => $a['module'] ?? 'topic', $worldSnapshot['lastOfferedActions']);
            $summary .= implode(', ', $topics) . "\n";
        }
        
        return $summary;
    }
    
    /**
     * Get understanding prompt
     */
    private function getUnderstandingPrompt(string $worldSummary): string {
        return <<<PROMPT
You are an intent analyzer for FirmaFlow business management system.

{$worldSummary}

Analyze the user's message and determine:
1. Is this conversational (greeting, question, chat) or an action request?
2. If action: what module and action?
3. What data was mentioned?

Modules: customers, suppliers, inventory, sales, purchases, expenses, reports, settings
Actions per module:
- customers: create_customer, list_customers, update_customer, delete_customer, search_customer
- suppliers: create_supplier, list_suppliers, update_supplier, delete_supplier
- inventory: create_product, list_products, update_product, delete_product, check_stock
- sales: create_sale, list_sales, view_sale
- purchases: create_purchase, list_purchases
- expenses: create_expense, list_expenses
- reports: sales_report, expense_report, profit_loss

Respond in JSON format:
{
  "isConversational": true/false,
  "isDataQuery": true/false,
  "module": "module_name or null",
  "action": "action_name or null",
  "data": { extracted field values },
  "confidence": 0.0-1.0,
  "topics": ["relevant", "topics"]
}

Be lenient with typos and variations. "custmer" = customer, "add" = create, "show" = list.
PROMPT;
    }
    
    /**
     * Get extraction prompt for specific module/action
     */
    private function getExtractionPrompt(string $module, string $action, array $worldSnapshot): string {
        $fieldSchemas = $this->getFieldSchema($module, $action);
        $worldSummary = $this->buildWorldSummary($worldSnapshot);
        
        return <<<PROMPT
You are a data extractor for FirmaFlow.

{$worldSummary}

Current task: {$module}.{$action}

Extract these fields from the user's message:
{$fieldSchemas}

Rules:
1. Only extract fields that are clearly mentioned
2. Use null for fields not mentioned
3. Be lenient with formatting (phone numbers, dates, etc.)
4. For customer_name/supplier_name: extract any business or person name mentioned

Respond in JSON format with only the field names and values.
PROMPT;
    }
    
    /**
     * Get field schema for module/action
     */
    private function getFieldSchema(string $module, string $action): string {
        $schemas = [
            'customers' => [
                'create_customer' => "name (required), email, phone, address, city, tax_id",
                'update_customer' => "id or name (to identify), plus any fields to update",
                'delete_customer' => "id or name (to identify)"
            ],
            'suppliers' => [
                'create_supplier' => "name (required), email, phone, address, contact_person",
                'update_supplier' => "id or name (to identify), plus any fields to update",
                'delete_supplier' => "id or name (to identify)"
            ],
            'inventory' => [
                'create_product' => "name (required), sku, price, cost, quantity, category",
                'update_product' => "id or name (to identify), plus any fields to update",
                'delete_product' => "id or name (to identify)"
            ],
            'expenses' => [
                'create_expense' => "description (required), amount (required), category, date, vendor"
            ]
        ];
        
        return $schemas[$module][$action] ?? "Extract all relevant fields";
    }
    
    /**
     * Parse understanding response from AI
     */
    private function parseUnderstanding(string $response, string $originalMessage): array {
        $data = json_decode($response, true);
        
        if (!$data) {
            // Fallback: assume conversational
            return [
                'isConversational' => true,
                'isDataQuery' => false,
                'module' => null,
                'action' => null,
                'data' => [],
                'confidence' => 0.3,
                'topics' => []
            ];
        }
        
        // Ensure required fields
        return [
            'isConversational' => $data['isConversational'] ?? true,
            'isDataQuery' => $data['isDataQuery'] ?? false,
            'module' => $data['module'] ?? null,
            'action' => $data['action'] ?? null,
            'data' => $data['data'] ?? [],
            'confidence' => $data['confidence'] ?? 0.5,
            'topics' => $data['topics'] ?? []
        ];
    }
    
    /**
     * Parse extraction response from AI
     */
    private function parseExtractionResponse(string $response): array {
        $data = json_decode($response, true);
        
        if (!$data) {
            return [];
        }
        
        // Clean null values
        return array_filter($data, fn($v) => $v !== null && $v !== '');
    }
    
    /**
     * Assess confidence level of extraction
     */
    private function assessConfidence(array $data, string $action): float {
        $requiredFields = $this->getRequiredFields($action);
        
        if (empty($requiredFields)) {
            return 0.9;
        }
        
        $foundRequired = 0;
        foreach ($requiredFields as $field) {
            if (!empty($data[$field])) {
                $foundRequired++;
            }
        }
        
        return $foundRequired / count($requiredFields);
    }
    
    /**
     * Get required fields for action
     */
    private function getRequiredFields(string $action): array {
        $required = [
            'create_customer' => ['name'],
            'create_supplier' => ['name'],
            'create_product' => ['name'],
            'create_expense' => ['description', 'amount'],
            'update_customer' => ['customer_id'],
            'update_supplier' => ['supplier_id'],
            'update_product' => ['product_id'],
            'delete_customer' => ['customer_id'],
            'delete_supplier' => ['supplier_id'],
            'delete_product' => ['product_id']
        ];
        
        return $required[$action] ?? [];
    }
}
