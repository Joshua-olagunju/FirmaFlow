<?php
/**
 * Semantic Analyzer
 * 
 * PRE-ROUTER AI LAYER
 * 
 * This is the FIRST AI call in the pipeline.
 * Its ONLY job is to understand what the user is trying to do.
 * 
 * IT DOES NOT:
 * - Route to modules
 * - Extract structured data
 * - Execute actions
 * - Make decisions
 * 
 * IT ONLY:
 * - Understands semantic meaning
 * - Tolerates misspellings
 * - Identifies if action is required
 * - Provides a human summary
 * 
 * OUTPUT IS ADVISORY, NOT AUTHORITATIVE.
 */

class SemanticAnalyzer {
    
    private $apiKey;
    private $conversationHistory;
    
    const MAX_CONTEXT_MESSAGES = 3;
    
    public function __construct($apiKey, $conversationHistory = []) {
        $this->apiKey = $apiKey;
        $this->conversationHistory = $conversationHistory;
    }
    
    /**
     * Analyze message semantically BEFORE routing
     * 
     * This is TOLERANT and FORGIVING.
     * It NEVER fails.
     * It ALWAYS returns something useful.
     */
    public function analyze(string $message): array {
        // Empty message handling
        if (empty(trim($message))) {
            return [
                'success' => true,
                'summary' => 'Empty message received',
                'user_intent_type' => 'unclear',
                'action_required' => false,
                'confidence' => 0.0,
                'suggested_topics' => [],
                'is_conversational' => true
            ];
        }
        
        // Build semantic analysis prompt
        $systemPrompt = $this->buildSemanticPrompt();
        
        // Call AI for understanding (NOT routing)
        $aiResponse = $this->callAI($systemPrompt, $message);
        
        // If AI fails, return safe fallback
        if (!$aiResponse['success']) {
            return $this->buildFallbackAnalysis($message);
        }
        
        $analysis = $aiResponse['data'];
        
        // Ensure required fields exist with safe defaults
        $analysis['success'] = true;
        $analysis['summary'] = $analysis['summary'] ?? 'User sent a message';
        $analysis['user_intent_type'] = $analysis['user_intent_type'] ?? 'general';
        $analysis['action_required'] = $analysis['action_required'] ?? false;
        $analysis['confidence'] = $analysis['confidence'] ?? 0.5;
        $analysis['suggested_topics'] = $analysis['suggested_topics'] ?? [];
        $analysis['is_conversational'] = $analysis['is_conversational'] ?? true;
        
        return $analysis;
    }
    
    /**
     * Build the semantic understanding prompt
     * 
     * This prompt MUST:
     * - Focus on understanding, not routing
     * - Be tolerant of misspellings
     * - Correct spelling errors automatically
     * - Never fail
     * - Always provide useful output
     */
    private function buildSemanticPrompt(): string {
        return <<<PROMPT
═══════════════════════════════════════════════════════════════════
SEMANTIC UNDERSTANDING LAYER
═══════════════════════════════════════════════════════════════════

You are the FIRST AI layer in a business assistant system.

YOUR ONLY JOB:
- Understand what the user is trying to communicate
- Tolerate and auto-correct spelling errors (e.g., "costomr" → "customer", "cretae" → "create")
- Detect if they're asking a question or requesting an action
- Be extremely forgiving and never fail

YOU DO NOT:
- Route to specific modules  
- Extract structured data
- Execute actions
- Make routing decisions

SPELLING TOLERANCE:
- Auto-correct common misspellings silently
- Understand typos and phonetic variations
- Recognize words even with missing letters
- Examples: "cretae" = "create", "costomr" = "customer", "expence" = "expense", "invioce" = "invoice"

CONTEXT AWARENESS:
- If the user says "view them" or "show them", understand they're referring to the last mentioned topic
- Recognize confirmations: "yes", "okay let's do that", "sure", "view them"
- Recognize rejections: "no", "cancel", "never mind"

USER INTENT TYPES:
- question: User is asking for a DEFINITION or EXPLANATION ("what is X?", "how do I...?", "tell me about...")
  * These are general knowledge questions that don't need database access
  * Examples: "what is a customer?", "how does invoicing work?", "tell me about football"
  
- data_query: User is asking for THEIR ACTUAL DATA from the database ("who is my top customer?", "show my sales", "what are my products?")
  * These REQUIRE database access and should be treated as ACTIONS
  * Keywords that indicate data queries: "show", "give me", "my", "who is", "what are", "how much", "list", "display"
  * Examples: 
    - "who is my top customer?" (query customers by revenue)
    - "show me my inventory" (query products)
    - "what sales did I make?" (query sales data)
    - "how much did I earn?" (query revenue)
    - "give me today's sales" (query sales with date filter)
    - "show my expenses" (query expenses)
  * CRITICAL: Never make up data - these must query the real database
  * Note: Even with typos like "summry" or "sals", recognize as data_query
  
- action: User wants to CREATE, UPDATE, or DELETE something ("create a customer", "delete invoice", "update product")
- confirmation: User is confirming/agreeing to a previous offer ("yes", "okay", "let's do that")
- rejection: User is declining ("no", "cancel", "never mind")
- conversation: Just chatting, greeting, or unclear
- off_topic: Asking about something not business-related (sports, weather, etc.)

OUTPUT FORMAT (JSON):
{
  "summary": "What the user is trying to do in simple terms",
  "user_intent_type": "question|data_query|action|confirmation|rejection|conversation|off_topic",
  "action_required": true|false,
  "confidence": 0.0-1.0,
  "suggested_topics": ["customers", "products", "invoices"],
  "is_conversational": true|false,
  "corrected_message": "If spelling was corrected, show the corrected version, otherwise null"
}

EXAMPLES:

User: "what is a costomr?"
Response: {
  "summary": "User is asking what a customer is (definition question)",
  "user_intent_type": "question",
  "action_required": false,
  "confidence": 1.0,
  "suggested_topics": ["customers"],
  "is_conversational": false,
  "corrected_message": "what is a customer?"
}

User: "who is my top customer?"
Response: {
  "summary": "User wants to know their top customer from database",
  "user_intent_type": "data_query",
  "action_required": true,
  "confidence": 1.0,
  "suggested_topics": ["customers"],
  "is_conversational": false,
  "corrected_message": null
}

User: "show me my products"
Response: {
  "summary": "User wants to view their product inventory from database",
  "user_intent_type": "data_query",
  "action_required": true,
  "confidence": 1.0,
  "suggested_topics": ["products"],
  "is_conversational": false,
  "corrected_message": null
}

User: "give me todays sales summary"
Response: {
  "summary": "User wants to see today's sales data from database",
  "user_intent_type": "data_query",
  "action_required": true,
  "confidence": 1.0,
  "suggested_topics": ["sales"],
  "is_conversational": false,
  "corrected_message": "give me today's sales summary"
}

User: "show my expenses"
Response: {
  "summary": "User wants to view their expenses from database",
  "user_intent_type": "data_query",
  "action_required": true,
  "confidence": 1.0,
  "suggested_topics": ["expenses"],
  "is_conversational": false,
  "corrected_message": null
}

User: "how much did I earn this month"
Response: {
  "summary": "User wants to see earnings/revenue data from database",
  "user_intent_type": "data_query",
  "action_required": true,
  "confidence": 1.0,
  "suggested_topics": ["sales"],
  "is_conversational": false,
  "corrected_message": null
}

User: "okay lets view them"
Response: {
  "summary": "User wants to view something mentioned previously",
  "user_intent_type": "confirmation",
  "action_required": true,
  "confidence": 0.9,
  "suggested_topics": [],
  "is_conversational": false,
  "corrected_message": "okay let's view them"
}

User: "lets cretae a customer"
Response: {
  "summary": "User wants to create a new customer",
  "user_intent_type": "action",
  "action_required": true,
  "confidence": 0.95,
  "suggested_topics": ["customers"],
  "is_conversational": false,
  "corrected_message": "let's create a customer"
}

User: "can you tell me about football?"
Response: {
  "summary": "User is asking about football (off-topic for business management)",
  "user_intent_type": "off_topic",
  "action_required": false,
  "confidence": 1.0,
  "suggested_topics": [],
  "is_conversational": true,
  "corrected_message": null
}

User: "humm, give me a list so i know which to chose"
Response: {
  "summary": "User wants to see available options or capabilities",
  "user_intent_type": "question",
  "action_required": false,
  "confidence": 0.8,
  "suggested_topics": [],
  "is_conversational": true,
  "corrected_message": "hmm, give me a list so I know which to choose"
}

═══════════════════════════════════════════════════════════════════
PROMPT;
    }
    
    /**
     * Build fallback analysis if AI call fails
     */
    private function buildFallbackAnalysis(string $message): array {
        $lower = strtolower(trim($message));
        
        // Detect common patterns as fallback
        $patterns = [
            'greeting' => '/^(hi|hello|hey|good\s*(morning|afternoon|evening))\b/i',
            'help' => '/\b(help|what\s+can\s+you|capabilities)\b/i',
            'customer' => '/\b(customer|client)\b/i',
            'product' => '/\b(product|item|inventory)\b/i',
            'invoice' => '/\b(invoice|sale|sell)\b/i',
        ];
        
        $detectedTopics = [];
        $intentType = 'conversation';
        
        foreach ($patterns as $topic => $pattern) {
            if (preg_match($pattern, $lower)) {
                if ($topic === 'greeting') {
                    $intentType = 'greeting';
                } elseif ($topic === 'help') {
                    $intentType = 'help';
                } else {
                    $detectedTopics[] = $topic;
                }
            }
        }
        
        // Check if it looks like an action
        $actionKeywords = ['add', 'create', 'update', 'edit', 'delete', 'remove'];
        $actionRequired = false;
        foreach ($actionKeywords as $keyword) {
            if (strpos($lower, $keyword) !== false) {
                $actionRequired = true;
                $intentType = 'action';
                break;
            }
        }
        
        return [
            'success' => true,
            'summary' => 'Message received: ' . substr($message, 0, 50),
            'user_intent_type' => $intentType,
            'action_required' => $actionRequired,
            'confidence' => 0.3, // Low confidence for fallback
            'suggested_topics' => $detectedTopics,
            'is_conversational' => !$actionRequired,
            'fallback_used' => true
        ];
    }
    
    /**
     * Call AI API for semantic analysis
     */
    private function callAI(string $systemPrompt, string $userMessage): array {
        $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
        
        // Build messages with minimal context
        $messages = [['role' => 'system', 'content' => $systemPrompt]];
        
        // Add minimal conversation history
        $historyToInclude = array_slice($this->conversationHistory, -self::MAX_CONTEXT_MESSAGES);
        foreach ($historyToInclude as $msg) {
            $messages[] = [
                'role' => $msg['role'] ?? 'user',
                'content' => $msg['content'] ?? ''
            ];
        }
        
        // Add current message
        $messages[] = ['role' => 'user', 'content' => $userMessage];
        
        $data = [
            'model' => 'llama-3.3-70b-versatile',  // Updated to currently supported model
            'messages' => $messages,
            'temperature' => 0.3, // Moderate temperature for understanding
            'max_tokens' => 300,
            'response_format' => ['type' => 'json_object']
        ];
        
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey
            ],
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return ['success' => false, 'error' => 'AI service unavailable'];
        }
        
        $result = json_decode($response, true);
        $aiContent = $result['choices'][0]['message']['content'] ?? '';
        $parsed = json_decode($aiContent, true);
        
        if (!$parsed) {
            return ['success' => false, 'error' => 'Parse failed'];
        }
        
        return ['success' => true, 'data' => $parsed];
    }
}
