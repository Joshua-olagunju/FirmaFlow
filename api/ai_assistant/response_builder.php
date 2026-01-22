<?php
/**
 * Response Builder
 * 
 * SINGLE RESPONSIBILITY: Format responses for frontend consumption
 * 
 * All orchestrator responses go through this class.
 * Ensures consistent structure across all response types.
 */

class ResponseBuilder {
    
    // Response type constants for frontend rendering
    const TYPE_SUCCESS = 'success';
    const TYPE_ERROR = 'error';
    const TYPE_CONFIRMATION = 'confirmation';
    const TYPE_FORM = 'form';
    const TYPE_CLARIFICATION = 'clarification';
    const TYPE_ASSISTANT = 'assistant';
    const TYPE_GREETING = 'greeting';
    const TYPE_HELP = 'help';
    const TYPE_CANCELLED = 'cancelled';
    const TYPE_WARNING = 'warning';
    const TYPE_INFO = 'info';
    const TYPE_CAPABILITY_OFFER = 'capability_offer';
    const TYPE_TASK_COMPLETE = 'task_complete';
    const TYPE_CHAT = 'chat';
    
    /**
     * Build a standard response structure
     * 
     * @param string $type Response type for frontend routing
     * @param string $message Human-readable message
     * @param array $data Additional data payload
     * @return array Formatted response
     */
    public static function build(string $type, string $message, array $data = []): array {
        $response = [
            'status' => in_array($type, [self::TYPE_ERROR, self::TYPE_WARNING, self::TYPE_CANCELLED]) ? 'error' : 'success',
            'type' => $type,
            'message' => $message,
            'timestamp' => date('c'),
        ];
        
        // Merge data into response (flatten for frontend compatibility)
        if (!empty($data)) {
            $response = array_merge($response, $data);
        }
        
        return $response;
    }
    
    /**
     * Build success response
     */
    public static function success(string $message, array $data = []): array {
        return self::build(self::TYPE_SUCCESS, $message, $data);
    }
    
    /**
     * Build error response
     */
    public static function error(string $message, array $data = []): array {
        return self::build(self::TYPE_ERROR, $message, $data);
    }
    
    /**
     * Build confirmation request
     */
    public static function confirmation(string $message, array $task, array $displayData): array {
        return self::build(self::TYPE_CONFIRMATION, $message, [
            'action' => $task['action'],
            'module' => $task['module'],
            'data' => $displayData,
            'options' => ['Confirm', 'Cancel', 'Modify']
        ]);
    }
    
    /**
     * Build form response
     */
    public static function form(string $message, array $formConfig, string $action, string $module): array {
        return self::build(self::TYPE_FORM, $message, array_merge($formConfig, [
            'action' => $action,
            'module' => $module
        ]));
    }
    
    /**
     * Build clarification request
     */
    public static function clarification(string $message, array $options = []): array {
        $data = [
            'awaitingInput' => true
        ];
        
        if (!empty($options['missing'])) {
            $data['missing'] = $options['missing'];
        }
        if (!empty($options['currentData'])) {
            $data['currentData'] = $options['currentData'];
        }
        if (!empty($options['options'])) {
            $data['options'] = $options['options'];
            $data['selectType'] = $options['selectType'] ?? 'item';
        }
        
        return self::build(self::TYPE_CLARIFICATION, $message, $data);
    }
    
    /**
     * Build assistant/conversational response
     */
    public static function assistant(string $message, array $data = []): array {
        return self::build(self::TYPE_ASSISTANT, $message, $data);
    }
    
    /**
     * Build greeting response
     */
    public static function greeting(string $message = null): array {
        $defaultGreeting = "👋 Hello! I'm your FirmaFlow AI Assistant.\n\n" .
            "I can help you with:\n" .
            "• 👤 Customers - Create, view, manage\n" .
            "• 📦 Inventory - Products, stock\n" .
            "• 💰 Sales - Invoices, payments\n" .
            "• 💸 Expenses - Track spending\n" .
            "• 📊 Reports - Financial insights\n\n" .
            "Just ask me anything or tell me what you need!";
            
        return self::build(self::TYPE_GREETING, $message ?? $defaultGreeting);
    }
    
    /**
     * Build help response
     */
    public static function help(string $message, array $capabilities = []): array {
        return self::build(self::TYPE_HELP, $message, [
            'capabilities' => $capabilities
        ]);
    }
    
    /**
     * Build cancelled response
     */
    public static function cancelled(string $message = null): array {
        return self::build(self::TYPE_CANCELLED, $message ?? '🔄 Reset! What would you like to do?', [
            'state' => 'IDLE'
        ]);
    }
    
    /**
     * Build capability offer response
     */
    public static function capabilityOffer(string $message, string $pendingAction, string $offerType): array {
        return self::build(self::TYPE_CAPABILITY_OFFER, $message, [
            'pendingAction' => $pendingAction,
            'offerType' => $offerType,
            'options' => ['Yes, please', 'No, thanks']
        ]);
    }
    
    /**
     * Format a confirmation message from task and data
     */
    public static function formatConfirmationMessage(array $task, array $data): string {
        $action = str_replace('_', ' ', $task['action']);
        $action = ucwords($action);
        
        $message = "📋 **Please confirm: {$action}**\n\n";
        
        foreach ($data as $key => $value) {
            if ($value === null || $value === '') continue;
            
            // Skip showing IDs if we have names (redundant for display)
            if ($key === 'customer_id' && isset($data['customer_name'])) continue;
            if ($key === 'supplier_id' && isset($data['supplier_name'])) continue;
            
            $label = ucwords(str_replace('_', ' ', $key));
            
            if (is_array($value)) {
                $message .= "**{$label}:**\n";
                foreach ($value as $item) {
                    if (is_array($item)) {
                        $itemStr = implode(', ', array_map(
                            fn($k, $v) => "{$k}: {$v}",
                            array_keys($item),
                            $item
                        ));
                        $message .= "  • {$itemStr}\n";
                    } else {
                        $message .= "  • {$item}\n";
                    }
                }
            } else {
                $message .= "• **{$label}:** {$value}\n";
            }
        }
        
        $message .= "\n*Reply 'Confirm' to proceed, 'Cancel' to abort, or tell me what to change.*";
        
        return $message;
    }
    
    /**
     * Build clarification message for missing fields
     */
    public static function buildClarificationMessage(array $missing, string $action): string {
        $friendlyFieldNames = [
            'customer_name' => 'customer name',
            'customer_id' => 'customer',
            'supplier_name' => 'supplier name',
            'supplier_id' => 'supplier',
            'name' => 'name',
            'email' => 'email address',
            'phone' => 'phone number',
            'address' => 'address',
            'amount' => 'amount',
            'description' => 'description',
            'selling_price' => 'selling price',
            'items' => 'items/products',
        ];
        
        $friendlyAction = str_replace('_', ' ', $action);
        
        if (count($missing) === 1) {
            $field = $missing[0];
            $friendlyField = $friendlyFieldNames[$field] ?? str_replace('_', ' ', $field);
            
            // For customer/supplier actions, offer selection
            if (in_array($field, ['customer_name', 'customer_id'])) {
                return "Which customer would you like to {$friendlyAction}? You can type their name or select from the list:";
            }
            if (in_array($field, ['supplier_name', 'supplier_id'])) {
                return "Which supplier would you like to {$friendlyAction}? You can type their name or select from the list:";
            }
            
            return "I need the **{$friendlyField}** to {$friendlyAction}. Could you provide it?";
        }
        
        // Multiple missing fields
        $fieldList = array_map(function($f) use ($friendlyFieldNames) {
            return $friendlyFieldNames[$f] ?? str_replace('_', ' ', $f);
        }, $missing);
        
        $lastField = array_pop($fieldList);
        $fieldString = implode(', ', $fieldList) . ' and ' . $lastField;
        
        return "To {$friendlyAction}, I need: **{$fieldString}**. What would you like to provide?";
    }
    
    /**
     * Get standard help message
     */
    public static function getHelpMessage(): string {
        return "## 🤖 I'm your FirmaFlow AI Assistant!\n\n" .
            "Here's what I can help you with:\n\n" .
            "### 👤 Customers\n" .
            "• \"Create a customer\" or \"Add new customer John Doe\"\n" .
            "• \"Show my customers\" or \"List all customers\"\n" .
            "• \"Edit customer John\" or \"Update customer email\"\n" .
            "• \"Delete customer\" or \"Who is my top customer?\"\n\n" .
            "### 📦 Products & Inventory\n" .
            "• \"Add a product\" or \"Create product Laptop at 50000\"\n" .
            "• \"Show my inventory\" or \"What products are low in stock?\"\n\n" .
            "### 💰 Sales & Invoices\n" .
            "• \"Create an invoice\" or \"Today's sales\"\n" .
            "• \"Show pending invoices\" or \"Sales this month\"\n\n" .
            "### 💸 Expenses\n" .
            "• \"Record expense\" or \"Add expense Electricity 15000\"\n" .
            "• \"Show my expenses\" or \"Expense summary\"\n\n" .
            "### 🏢 Suppliers\n" .
            "• \"Add supplier\" or \"Show suppliers\"\n" .
            "• \"Create purchase order\"\n\n" .
            "### 📊 Reports\n" .
            "• \"Business overview\" or \"Profit and loss\"\n\n" .
            "**Tips:**\n" .
            "• I understand natural language - just tell me what you need!\n" .
            "• Say \"cancel\" anytime to start over\n" .
            "• I'll ask for confirmation before making changes";
    }
}
