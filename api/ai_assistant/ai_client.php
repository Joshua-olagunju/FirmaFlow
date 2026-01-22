<?php
/**
 * AI Client
 * 
 * SINGLE RESPONSIBILITY: Handle all AI API communication
 * 
 * This class encapsulates all Groq API calls.
 * The orchestrator uses this instead of making direct curl calls.
 * 
 * Benefits:
 * - Centralized API key management
 * - Consistent error handling
 * - Easy to swap AI providers
 * - Rate limit handling
 */

class AIClient {
    
    private $apiKey;
    private $baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    private $model = 'openai/gpt-oss-20b';
    private $maxContextMessages;
    
    const MAX_CONTEXT_MESSAGES_DEFAULT = 4;
    
    public function __construct(string $apiKey, int $maxContextMessages = self::MAX_CONTEXT_MESSAGES_DEFAULT) {
        $this->apiKey = $apiKey;
        $this->maxContextMessages = $maxContextMessages;
    }
    
    /**
     * Call AI for structured data extraction
     * 
     * @param string $systemPrompt System prompt with instructions
     * @param string $userMessage Current user message
     * @param array $conversationHistory Previous messages for context
     * @return array ['success' => bool, 'data' => array|null, 'error' => string|null]
     */
    public function extractData(
        string $systemPrompt,
        string $userMessage,
        array $conversationHistory = []
    ): array {
        return $this->call($systemPrompt, $userMessage, $conversationHistory, true);
    }
    
    /**
     * Call AI for conversational response
     * 
     * @param string $systemPrompt System prompt with instructions
     * @param string $userMessage Current user message
     * @param array $conversationHistory Previous messages for context
     * @return array ['success' => bool, 'data' => array|null, 'error' => string|null]
     */
    public function chat(
        string $systemPrompt,
        string $userMessage,
        array $conversationHistory = []
    ): array {
        return $this->call($systemPrompt, $userMessage, $conversationHistory, false);
    }
    
    /**
     * Internal method to make AI API call
     * 
     * @param string $systemPrompt System prompt
     * @param string $userMessage User message
     * @param array $conversationHistory Conversation history
     * @param bool $forceJson Whether to force JSON response format
     * @return array Response array
     */
    private function call(
        string $systemPrompt,
        string $userMessage,
        array $conversationHistory,
        bool $forceJson
    ): array {
        $ch = curl_init($this->baseUrl);
        
        // Build messages array
        $messages = [['role' => 'system', 'content' => $systemPrompt]];
        
        // Add conversation history (limit to prevent token overflow)
        $historyToInclude = array_slice($conversationHistory, -$this->maxContextMessages);
        foreach ($historyToInclude as $msg) {
            $messages[] = [
                'role' => $msg['role'] ?? 'user',
                'content' => $msg['content'] ?? ''
            ];
        }
        
        // Add current user message
        $messages[] = ['role' => 'user', 'content' => $userMessage];
        
        // Log context info
        error_log(sprintf(
            "AIClient: %d history + 1 system + 1 current = %d messages",
            count($historyToInclude),
            count($messages)
        ));
        
        // Build request
        $data = [
            'model' => $this->model,
            'messages' => $messages,
            'temperature' => $forceJson ? 0.1 : 0.7,
            'max_tokens' => 500
        ];
        
        if ($forceJson) {
            $data['response_format'] = ['type' => 'json_object'];
        }
        
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey
            ],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        // Handle errors
        if ($curlError) {
            error_log("AIClient curl error: " . $curlError);
            return ['success' => false, 'error' => 'Network error: ' . $curlError];
        }
        
        if ($httpCode !== 200) {
            return $this->handleHttpError($httpCode, $response);
        }
        
        // Parse response
        return $this->parseResponse($response, $forceJson);
    }
    
    /**
     * Handle HTTP errors from API
     */
    private function handleHttpError(int $httpCode, string $response): array {
        $errorData = json_decode($response, true);
        error_log("AIClient HTTP error {$httpCode}: " . substr($response, 0, 500));
        
        if ($httpCode === 429) {
            preg_match('/try again in ([^.]+)/', $errorData['error']['message'] ?? '', $matches);
            return [
                'success' => false,
                'error' => 'Rate limit. Try again in ' . ($matches[1] ?? '30 seconds')
            ];
        }
        
        return [
            'success' => false,
            'error' => 'AI service error (HTTP ' . $httpCode . ')'
        ];
    }
    
    /**
     * Parse AI response
     */
    private function parseResponse(string $response, bool $forceJson): array {
        $result = json_decode($response, true);
        $aiContent = $result['choices'][0]['message']['content'] ?? '';
        
        error_log("AIClient raw response: " . substr($aiContent, 0, 300));
        
        // For conversational mode, return plain text
        if (!$forceJson) {
            return [
                'success' => true,
                'data' => [
                    'response' => trim($aiContent),
                    'mode' => 'conversational'
                ]
            ];
        }
        
        // For JSON mode, parse the response
        $parsed = json_decode($aiContent, true);
        
        if (!$parsed || json_last_error() !== JSON_ERROR_NONE) {
            error_log("AIClient JSON parsing failed, using fallback");
            return [
                'success' => true,
                'data' => [
                    'mode' => 'conversational',
                    'confidence' => 0.5,
                    'response' => $aiContent ?: 'I\'m processing your request. Could you provide more details?',
                    'extracted_data' => [],
                    'parsing_failed' => true
                ]
            ];
        }
        
        // Normalize response field names
        $this->normalizeResponseFields($parsed);
        
        return ['success' => true, 'data' => $parsed];
    }
    
    /**
     * Normalize AI response field names
     * 
     * AI sometimes uses different names for the same concept
     */
    private function normalizeResponseFields(array &$parsed): void {
        $responseAliases = ['answer', 'message', 'reply', 'text'];
        
        if (!isset($parsed['response'])) {
            foreach ($responseAliases as $alias) {
                if (isset($parsed[$alias])) {
                    $parsed['response'] = $parsed[$alias];
                    break;
                }
            }
        }
    }
    
    /**
     * Set the AI model to use
     */
    public function setModel(string $model): void {
        $this->model = $model;
    }
    
    /**
     * Get current model
     */
    public function getModel(): string {
        return $this->model;
    }
}
