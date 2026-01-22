<?php
/**
 * FOLLOW-UP HANDLER MODULE
 * 
 * Handles contextual follow-up responses.
 * 
 * Key scenarios:
 * - User discusses "customers" → User says "update" → Show customer selection
 * - User discusses "products" → User says "delete" → Show product selection  
 * - User sees options → User says "yes" → Execute first suggested action
 * 
 * Context tracking:
 * - lastTopic: The entity type being discussed (customers, products, etc.)
 * - lastOfferedActions: Actions offered to user
 */

namespace FirmaFlow\AIOrchestrator;

class FollowUpHandler {
    
    /**
     * Try to handle message as contextual follow-up
     * 
     * Returns null if not a follow-up response
     */
    public static function tryHandle(string $message, array $lastOfferedActions): ?array {
        $message = strtolower(trim($message));
        $lastTopic = self::getLastTopic();
        
        // Check for action keywords with topic context
        if ($lastTopic) {
            // Update action - needs entity selection
            if (self::isUpdateRequest($message)) {
                return self::handleUpdateRequest($lastTopic);
            }
            
            // Delete action - needs entity selection
            if (self::isDeleteRequest($message)) {
                return self::handleDeleteRequest($lastTopic);
            }
            
            // Add/Create action - show form
            if (self::isCreateRequest($message)) {
                return self::handleCreateRequest($lastTopic);
            }
            
            // View/List action
            if (self::isViewRequest($message)) {
                return self::handleViewRequest($lastTopic);
            }
        }
        
        // Check offered actions for yes/no responses
        if (!empty($lastOfferedActions)) {
            if (self::isAffirmative($message)) {
                return self::handleAffirmative($lastOfferedActions);
            }
            
            if (self::isNegative($message)) {
                return [
                    'type' => 'decline',
                    'message' => 'No problem! What else can I help you with?'
                ];
            }
        }
        
        return null;
    }
    
    /**
     * Check if message is an update request
     * Only returns true for simple commands, NOT 'modify customer X'
     */
    private static function isUpdateRequest(string $message): bool {
        // Exact matches only - "update", "edit", "modify" etc.
        $patterns = ['update', 'edit', 'modify', 'change'];
        if (in_array($message, $patterns)) {
            return true;
        }
        
        // Allow "update it", "edit one", etc. but NOT "update customer"
        if (preg_match('/^(update|edit|modify|change)\s*(it|one|them)?$/i', $message)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if message is a delete request
     */
    private static function isDeleteRequest(string $message): bool {
        $patterns = ['delete', 'remove', 'trash'];
        return in_array($message, $patterns) ||
               preg_match('/^(delete|remove)\s*(it|one|them)?$/i', $message);
    }
    
    /**
     * Check if message is a create request
     */
    private static function isCreateRequest(string $message): bool {
        $patterns = ['add', 'create', 'new'];
        return in_array($message, $patterns) ||
               preg_match('/^(add|create|new)\s*(one)?$/i', $message);
    }
    
    /**
     * Check if message is a view request
     */
    private static function isViewRequest(string $message): bool {
        $patterns = [
            'view', 'show', 'list', 'see', 'display',
            'view them', 'show them', 'see them', 'display them',
            'show me', 'let me see', 'view all', 'show all'
        ];
        
        foreach ($patterns as $pattern) {
            if ($message === $pattern || strpos($message, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if message is affirmative
     */
    private static function isAffirmative(string $message): bool {
        $affirmatives = [
            'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'yea', 'yup',
            'please', 'go ahead', 'do it', 'yes please', 'of course',
            'let\'s do it', 'proceed', 'confirm', 'absolutely',
            'yes, i\'d like to do something', 'yes i\'d like to do something',
            'i\'d like to do something', '1'  // Option 1 is usually "yes"
        ];
        
        // Check exact match or starts with "yes"
        if (in_array($message, $affirmatives)) {
            return true;
        }
        
        // Check if it starts with yes
        if (strpos($message, 'yes') === 0) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if message is negative
     */
    private static function isNegative(string $message): bool {
        $negatives = [
            'no', 'nope', 'nah', 'no thanks', 'not now', 'never mind',
            'cancel', 'skip', 'later', 'not yet', 'no thank you'
        ];
        
        return in_array($message, $negatives);
    }
    
    /**
     * Handle update request - return selection needed
     */
    private static function handleUpdateRequest(string $topic): array {
        $mapping = self::getTopicMapping($topic);
        
        return [
            'type' => 'selection_needed',
            'action' => 'update',
            'module' => $mapping['module'],
            'fullAction' => $mapping['updateAction'],
            'entity' => $mapping['entity'],
            'message' => "Which {$mapping['singular']} would you like to update?"
        ];
    }
    
    /**
     * Handle delete request - return selection needed
     */
    private static function handleDeleteRequest(string $topic): array {
        $mapping = self::getTopicMapping($topic);
        
        return [
            'type' => 'selection_needed',
            'action' => 'delete',
            'module' => $mapping['module'],
            'fullAction' => $mapping['deleteAction'],
            'entity' => $mapping['entity'],
            'message' => "Which {$mapping['singular']} would you like to delete?"
        ];
    }
    
    /**
     * Handle create request - show form
     */
    private static function handleCreateRequest(string $topic): array {
        $mapping = self::getTopicMapping($topic);
        
        return [
            'type' => 'create',
            'module' => $mapping['module'],
            'action' => $mapping['createAction']
        ];
    }
    
    /**
     * Handle view request - list entities
     */
    private static function handleViewRequest($topic): array {
        if (is_array($topic)) {
            // Legacy: from lastOfferedActions
            foreach ($topic as $action) {
                if ($action['type'] === 'view' || strpos($action['action'] ?? '', 'list_') === 0) {
                    return [
                        'type' => 'view',
                        'module' => $action['module'],
                        'action' => $action['action']
                    ];
                }
            }
            return ['type' => 'decline', 'message' => 'Nothing to view right now.'];
        }
        
        // From topic string
        $mapping = self::getTopicMapping($topic);
        
        return [
            'type' => 'view',
            'module' => $mapping['module'],
            'action' => $mapping['listAction']
        ];
    }
    
    /**
     * Handle affirmative response
     */
    private static function handleAffirmative(array $lastOfferedActions): array {
        // Check if this was a capability_offer - user just saw 'what can you do'
        // In this case, 'yes' means they want to do something, but we need to ask WHAT
        if (!empty($lastOfferedActions) && 
            isset($lastOfferedActions[0]['type']) && 
            $lastOfferedActions[0]['type'] === 'capability_offer') {
            return [
                'type' => 'clarification',
                'message' => "Great! What would you like to do? For example:\n" .
                             "• 'Add a customer' - create a new customer\n" .
                             "• 'Show my products' - list your products\n" .
                             "• 'Record an expense' - add an expense\n" .
                             "• 'Sales this month' - view sales analytics"
            ];
        }
        
        // Find the first create action
        foreach ($lastOfferedActions as $action) {
            if ($action['type'] === 'create') {
                return [
                    'type' => 'create',
                    'module' => $action['module'],
                    'action' => $action['action']
                ];
            }
        }
        
        // Find any action
        if (!empty($lastOfferedActions)) {
            $action = $lastOfferedActions[0];
            return [
                'type' => $action['type'],
                'module' => $action['module'],
                'action' => $action['action']
            ];
        }
        
        return [
            'type' => 'decline',
            'message' => 'I\'m not sure what you\'d like to do. Can you be more specific?'
        ];
    }
    
    /**
     * Get topic mapping (module, actions, labels)
     */
    private static function getTopicMapping(string $topic): array {
        $mappings = [
            'customers' => [
                'module' => 'customers',
                'entity' => 'customer',
                'singular' => 'customer',
                'createAction' => 'create_customer',
                'listAction' => 'list_customers',
                'updateAction' => 'update_customer',
                'deleteAction' => 'delete_customer'
            ],
            'suppliers' => [
                'module' => 'suppliers',
                'entity' => 'supplier',
                'singular' => 'supplier',
                'createAction' => 'create_supplier',
                'listAction' => 'list_suppliers',
                'updateAction' => 'update_supplier',
                'deleteAction' => 'delete_supplier'
            ],
            'products' => [
                'module' => 'inventory',
                'entity' => 'product',
                'singular' => 'product',
                'createAction' => 'create_product',
                'listAction' => 'list_products',
                'updateAction' => 'update_product',
                'deleteAction' => 'delete_product'
            ],
            'expenses' => [
                'module' => 'expenses',
                'entity' => 'expense',
                'singular' => 'expense',
                'createAction' => 'create_expense',
                'listAction' => 'list_expenses',
                'updateAction' => 'update_expense',
                'deleteAction' => 'delete_expense'
            ]
        ];
        
        return $mappings[$topic] ?? $mappings['customers'];
    }
    
    /**
     * Save current topic for follow-up context with timestamp
     */
    public static function setLastTopic(string $topic): void {
        $_SESSION['ai_last_topic'] = $topic;
        $_SESSION['ai_last_topic_time'] = time();
    }
    
    /**
     * Get last discussed topic (expires after 5 minutes)
     */
    public static function getLastTopic(): ?string {
        $topic = $_SESSION['ai_last_topic'] ?? null;
        $topicTime = $_SESSION['ai_last_topic_time'] ?? 0;
        
        // Topic expires after 5 minutes of inactivity
        if ($topic && (time() - $topicTime) > 300) {
            self::clearLastTopic();
            return null;
        }
        
        return $topic;
    }
    
    /**
     * Clear topic
     */
    public static function clearLastTopic(): void {
        unset($_SESSION['ai_last_topic']);
    }
    
    /**
     * Save topic actions for follow-up (legacy support + topic tracking)
     */
    public static function saveTopicActions(array $topics): void {
        $actions = [];
        $primaryTopic = null;
        
        foreach ($topics as $topic) {
            $topic = strtolower($topic);
            
            if (strpos($topic, 'customer') !== false) {
                $primaryTopic = 'customers';
                $actions[] = [
                    'type' => 'view',
                    'module' => 'customers',
                    'action' => 'list_customers',
                    'description' => 'View customers'
                ];
            }
            
            if (strpos($topic, 'supplier') !== false) {
                $primaryTopic = 'suppliers';
                $actions[] = [
                    'type' => 'view',
                    'module' => 'suppliers',
                    'action' => 'list_suppliers',
                    'description' => 'View suppliers'
                ];
            }
            
            if (strpos($topic, 'product') !== false || strpos($topic, 'inventory') !== false) {
                $primaryTopic = 'products';
                $actions[] = [
                    'type' => 'view',
                    'module' => 'inventory',
                    'action' => 'list_products',
                    'description' => 'View products'
                ];
            }
            
            if (strpos($topic, 'expense') !== false) {
                $primaryTopic = 'expenses';
                $actions[] = [
                    'type' => 'view',
                    'module' => 'expenses',
                    'action' => 'list_expenses',
                    'description' => 'View expenses'
                ];
            }
        }
        
        // Save topic for contextual follow-up
        if ($primaryTopic) {
            self::setLastTopic($primaryTopic);
        }
        
        if (!empty($actions)) {
            WorldState::setLastOfferedActions($actions);
        }
    }
}
