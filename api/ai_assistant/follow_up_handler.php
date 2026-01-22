<?php
/**
 * Follow-Up Handler
 * 
 * SINGLE RESPONSIBILITY: Handle follow-up responses to previous interactions
 * 
 * When the AI offers options like "Would you like to view your customers?",
 * this handler processes responses like "yes", "view them", "create one".
 * 
 * This reduces the need for full AI processing for simple follow-ups.
 */

class FollowUpHandler {
    
    /**
     * Topic to action mappings
     * 
     * Maps conversation topics to their corresponding view/create actions
     */
    private static $topicMappings = [
        'customer' => [
            'module' => 'customers',
            'view_action' => 'customer_summary',
            'create_action' => 'create_customer'
        ],
        'supplier' => [
            'module' => 'suppliers',
            'view_action' => 'supplier_summary',
            'create_action' => 'create_supplier'
        ],
        'vendor' => [
            'module' => 'suppliers',
            'view_action' => 'supplier_summary',
            'create_action' => 'create_supplier'
        ],
        'product' => [
            'module' => 'inventory',
            'view_action' => 'inventory_summary',
            'create_action' => 'create_product'
        ],
        'inventory' => [
            'module' => 'inventory',
            'view_action' => 'inventory_summary',
            'create_action' => 'create_product'
        ],
        'invoice' => [
            'module' => 'sales',
            'view_action' => 'sales_summary',
            'create_action' => 'create_invoice'
        ],
        'sale' => [
            'module' => 'sales',
            'view_action' => 'sales_summary',
            'create_action' => 'create_invoice'
        ],
        'expense' => [
            'module' => 'expenses',
            'view_action' => 'expense_summary',
            'create_action' => 'create_expense'
        ],
        'payment' => [
            'module' => 'payments',
            'view_action' => 'payment_summary',
            'create_action' => 'record_payment'
        ],
        'report' => [
            'module' => 'reports',
            'view_action' => 'view_dashboard',
            'create_action' => null
        ],
    ];
    
    /**
     * Check if message is a follow-up response
     * 
     * @param string $message User message
     * @param array $lastOfferedActions Previously offered actions (from session)
     * @return array|null Follow-up result or null if not a follow-up
     */
    public static function tryHandle(string $message, array $lastOfferedActions): ?array {
        if (empty($lastOfferedActions)) {
            return null;
        }
        
        $lower = trim(strtolower($message));
        
        // Check for negative response
        if (self::isNegativeResponse($lower)) {
            return [
                'type' => 'decline',
                'message' => "No problem! Let me know if you need anything else.",
                'clear_offered' => true
            ];
        }
        
        // Check for view request
        if (self::isViewRequest($lower)) {
            if (isset($lastOfferedActions['view_action']) && isset($lastOfferedActions['module'])) {
                return [
                    'type' => 'view',
                    'module' => $lastOfferedActions['module'],
                    'action' => $lastOfferedActions['view_action'],
                    'clear_offered' => true
                ];
            }
        }
        
        // Check for create request
        if (self::isCreateRequest($lower)) {
            if (isset($lastOfferedActions['create_action']) && isset($lastOfferedActions['module'])) {
                return [
                    'type' => 'create',
                    'module' => $lastOfferedActions['module'],
                    'action' => $lastOfferedActions['create_action'],
                    'clear_offered' => true
                ];
            }
        }
        
        return null;
    }
    
    /**
     * Check if message is a negative/declining response
     */
    public static function isNegativeResponse(string $lower): bool {
        $negativePatterns = [
            '/^(no|nope|nah|cancel|nevermind|never\s*mind|not?\s*now)$/i'
        ];
        
        foreach ($negativePatterns as $pattern) {
            if (preg_match($pattern, $lower)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if message is a view/show request
     */
    public static function isViewRequest(string $lower): bool {
        // Simple affirmatives that imply "show me"
        if (preg_match('/^(yes|yeah|yep|sure|ok|okay|alright|yea|yup)$/i', $lower)) {
            return true;
        }
        
        // Explicit view requests
        if (preg_match('/\b(view|show|list|see|display)\s*(them|it|those|the|my|all)?\b/i', $lower)) {
            return true;
        }
        
        // "Let's view/show/see"
        if (preg_match('/^let\'?s?\s*(view|show|see|look)/i', $lower)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if message is a create/add request
     */
    public static function isCreateRequest(string $lower): bool {
        // Explicit create requests
        if (preg_match('/\b(create|add|new|make)\s*(one|it|a|an|them)?\b/i', $lower)) {
            return true;
        }
        
        // "Let's create/add/make"
        if (preg_match('/^let\'?s?\s*(create|add|make)/i', $lower)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Detect topic from message and return offered actions
     * 
     * Called after AI generates a response mentioning a topic,
     * so the system can handle follow-up responses.
     */
    public static function detectTopicFromMessage(string $message): ?array {
        $lower = strtolower($message);
        
        foreach (self::$topicMappings as $topic => $actions) {
            if (preg_match("/\\b{$topic}s?\\b/i", $lower)) {
                return $actions;
            }
        }
        
        return null;
    }
    
    /**
     * Check if response is an affirmative (yes/okay/sure)
     */
    public static function isAffirmativeResponse(string $message): bool {
        $lower = trim(strtolower($message));
        
        $affirmatives = [
            'yes', 'yeah', 'yep', 'sure', 'ok', 'okay',
            'yes please', 'yes, please', 'go ahead', 'do it',
            'proceed', 'y', 'alright', 'yea', 'yup'
        ];
        
        if (in_array($lower, $affirmatives)) {
            return true;
        }
        
        // Pattern match for variations
        if (preg_match('/^(yes|yeah|sure|ok)/i', $lower)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get topic mappings (useful for tests/debugging)
     */
    public static function getTopicMappings(): array {
        return self::$topicMappings;
    }
}
