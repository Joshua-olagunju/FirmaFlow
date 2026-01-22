<?php
/**
 * Validation Engine
 * 
 * SINGLE RESPONSIBILITY: Validate extracted data before execution
 * 
 * This class owns all validation logic. It determines:
 * - What fields are required for each action
 * - Whether extracted data is complete
 * - What fields are missing
 * 
 * CODE-OWNED: AI suggestions are validated here, not trusted blindly.
 */

class ValidationEngine {
    
    /**
     * Required fields per action
     * 
     * Note: Empty array means form-based collection (all fields optional at AI level)
     */
    private static $requirements = [
        // Customer actions
        'create_customer' => [],  // Form collects all fields
        'update_customer' => ['customer_name'],
        'delete_customer' => ['customer_name'],
        'view_customer' => ['customer_name'],
        'customer_balance' => ['customer_name'],
        'customer_transactions' => ['customer_name'],
        'customer_details' => ['customer_name'],
        
        // Supplier actions
        'create_supplier' => [],  // Form collects all fields
        'update_supplier' => ['supplier_name'],
        'delete_supplier' => ['supplier_name'],
        'view_supplier' => ['supplier_name'],
        'supplier_balance' => ['supplier_name'],
        'supplier_transactions' => ['supplier_name'],
        'supplier_details' => ['supplier_name'],
        'activate_supplier' => ['supplier_name'],
        'deactivate_supplier' => ['supplier_name'],
        
        // Inventory actions
        'add_product' => ['name', 'selling_price'],
        'update_product' => ['product_name'],
        'delete_product' => ['product_name'],
        
        // Sales actions
        'create_invoice' => ['items'],
        'update_invoice' => ['invoice_number'],
        'view_invoice' => ['invoice_number'],
        
        // Payment actions
        'record_payment' => ['amount'],
        'approve_supplier_payment' => [],
        
        // Expense actions
        'add_expense' => ['description', 'amount'],
        'update_expense' => ['expense_id'],
        
        // Settings actions
        'create_tax' => ['name', 'rate'],
        
        // Purchase actions
        'create_purchase_order' => ['items'],
    ];
    
    /**
     * Actions that accept alternative identifiers
     * 
     * For these actions, either _id or _name is acceptable
     */
    private static $alternativeIdentifiers = [
        'customer' => ['customer_name', 'customer_id'],
        'supplier' => ['supplier_name', 'supplier_id'],
        'product' => ['product_name', 'product_id'],
    ];
    
    /**
     * Get required fields for an action
     */
    public static function getRequiredFields(string $action): array {
        return self::$requirements[$action] ?? [];
    }
    
    /**
     * Validate AI extraction output
     * 
     * @param array $extracted AI response with extracted_data
     * @param string $action The target action
     * @return array ['isValid' => bool, 'missing' => array, 'confidence' => float]
     */
    public static function validateExtraction(array $extracted, string $action): array {
        $requiredFields = self::getRequiredFields($action);
        $extractedData = $extracted['extracted_data'] ?? [];
        $missing = [];
        
        foreach ($requiredFields as $field) {
            if (!self::hasField($extractedData, $field, $action)) {
                $missing[] = $field;
            }
        }
        
        // Also check AI's own missing_required field (but validate it)
        $aiMissing = $extracted['missing_required'] ?? [];
        $missing = array_unique(array_merge($missing, $aiMissing));
        
        return [
            'isValid' => empty($missing),
            'missing' => $missing,
            'confidence' => $extracted['confidence'] ?? 0.5
        ];
    }
    
    /**
     * Validate data array directly (without AI response wrapper)
     * 
     * @param array $data Data to validate
     * @param string $action The target action
     * @return array ['isValid' => bool, 'missing' => array]
     */
    public static function validateData(array $data, string $action): array {
        $requiredFields = self::getRequiredFields($action);
        $missing = [];
        
        foreach ($requiredFields as $field) {
            if (!self::hasField($data, $field, $action)) {
                $missing[] = $field;
            }
        }
        
        return [
            'isValid' => empty($missing),
            'missing' => $missing
        ];
    }
    
    /**
     * Check if a field exists and is not empty
     * 
     * Handles alternative identifiers (e.g., customer_name OR customer_id)
     */
    private static function hasField(array $data, string $field, string $action): bool {
        // Check for alternative identifiers
        foreach (self::$alternativeIdentifiers as $entity => $alternatives) {
            if (in_array($field, $alternatives) && self::isEntityAction($action, $entity)) {
                // Accept ANY of the alternatives
                foreach ($alternatives as $alt) {
                    if (isset($data[$alt]) && $data[$alt] !== null && $data[$alt] !== '') {
                        return true;
                    }
                }
                return false;
            }
        }
        
        // Standard field check
        return isset($data[$field]) && $data[$field] !== null && $data[$field] !== '';
    }
    
    /**
     * Check if action relates to a specific entity type
     */
    private static function isEntityAction(string $action, string $entity): bool {
        return strpos($action, $entity) !== false;
    }
    
    /**
     * Get validation status as a structured result
     * 
     * Useful for state machines that need detailed validation info
     */
    public static function getValidationStatus(array $data, string $action): array {
        $validation = self::validateData($data, $action);
        
        return [
            'action' => $action,
            'isValid' => $validation['isValid'],
            'missing' => $validation['missing'],
            'required' => self::getRequiredFields($action),
            'provided' => array_keys(array_filter($data, fn($v) => $v !== null && $v !== '')),
            'canProceed' => $validation['isValid'],
        ];
    }
    
    /**
     * Check if action requires confirmation before execution
     * 
     * High-risk actions ALWAYS require confirmation.
     * Low-risk actions can auto-execute with high confidence.
     */
    public static function requiresConfirmation(string $module, string $action): bool {
        // Actions that ALWAYS require confirmation (high risk)
        $highRiskActions = [
            'delete_customer', 'delete_supplier', 'delete_product',
            'create_invoice', 'update_invoice',
            'create_purchase_order',
            'approve_supplier_payment',
            'deactivate_customer', 'deactivate_supplier',
        ];
        
        if (in_array($action, $highRiskActions)) {
            return true;
        }
        
        // Create/Update actions for entities require confirmation
        if (preg_match('/^(create|update)_/', $action)) {
            return true;
        }
        
        // Read-only actions don't need confirmation
        $readOnlyPatterns = [
            'view_', 'list_', 'get_', 'show_',
            'summary', 'balance', 'transactions', 'details', 'report'
        ];
        
        foreach ($readOnlyPatterns as $pattern) {
            if (strpos($action, $pattern) !== false) {
                return false;
            }
        }
        
        // Default: require confirmation
        return true;
    }
    
    /**
     * Check if action is read-only (no data modification)
     */
    public static function isReadOnlyAction(string $action): bool {
        $readOnlyActions = [
            'customer_summary', 'top_customers', 'customer_balance', 
            'customer_transactions', 'customer_details', 'view_customer',
            'supplier_summary', 'supplier_balance', 'supplier_transactions',
            'supplier_details', 'view_supplier',
            'inventory_summary', 'view_inventory', 'low_stock',
            'sales_summary', 'view_invoice', 'pending_invoices',
            'expense_summary', 'view_expense',
            'payment_summary', 'view_payment',
            'dashboard_stats', 'generate_report', 'report_analysis',
            'greeting', 'help', 'chat',
        ];
        
        return in_array($action, $readOnlyActions);
    }
    
    /**
     * Determine the entity type from an action
     * 
     * @return string|null Entity type (customer, supplier, product, etc.)
     */
    public static function getEntityType(string $action): ?string {
        $entityPatterns = [
            'customer' => '/customer/i',
            'supplier' => '/supplier/i',
            'product' => '/product|inventory/i',
            'invoice' => '/invoice|sale/i',
            'expense' => '/expense/i',
            'payment' => '/payment/i',
            'purchase' => '/purchase/i',
        ];
        
        foreach ($entityPatterns as $entity => $pattern) {
            if (preg_match($pattern, $action)) {
                return $entity;
            }
        }
        
        return null;
    }
}
