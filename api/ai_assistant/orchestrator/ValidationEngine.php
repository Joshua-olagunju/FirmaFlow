<?php
/**
 * VALIDATION ENGINE MODULE
 * 
 * Validates extracted data and determines required fields.
 * 
 * CODE-OWNED validation - AI extracts, this module validates.
 */

namespace FirmaFlow\AIOrchestrator;

class ValidationEngine {
    
    /**
     * Validate extracted data for action
     */
    public static function validateData(array $data, string $action): array {
        $required = self::getRequiredFields($action);
        $missing = [];
        
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                // Check alternate field names
                $alternate = self::getAlternateFieldName($field, $data);
                if (!$alternate) {
                    $missing[] = $field;
                }
            }
        }
        
        return [
            'isValid' => empty($missing),
            'missing' => $missing,
            'data' => $data,
            'requiredFields' => $required
        ];
    }
    
    /**
     * Get required fields for action
     */
    public static function getRequiredFields(string $action): array {
        $required = [
            // Customer actions
            'create_customer' => ['name'],
            'update_customer' => [],  // ID found via selection
            'delete_customer' => [],
            'search_customer' => [],
            
            // Supplier actions
            'create_supplier' => ['name'],
            'update_supplier' => [],
            'delete_supplier' => [],
            
            // Product actions
            'create_product' => ['name'],
            'update_product' => [],
            'delete_product' => [],
            
            // Expense actions
            'create_expense' => ['description', 'amount'],
            
            // List actions - no required fields
            'list_customers' => [],
            'list_suppliers' => [],
            'list_products' => [],
            'list_sales' => [],
            'list_purchases' => [],
            'list_expenses' => [],
            
            // Report actions
            'sales_report' => [],
            'expense_report' => [],
            'profit_loss' => []
        ];
        
        return $required[$action] ?? [];
    }
    
    /**
     * Check if action requires extraction
     */
    public static function requiresExtraction(string $action): bool {
        $noExtraction = [
            'list_customers', 'list_suppliers', 'list_products',
            'list_sales', 'list_purchases', 'list_expenses',
            'sales_report', 'expense_report', 'profit_loss',
            'check_stock'
        ];
        
        return !in_array($action, $noExtraction);
    }
    
    /**
     * Check if action requires confirmation
     */
    public static function requiresConfirmation(string $module, string $action): bool {
        // Always confirm deletes
        if (strpos($action, 'delete_') === 0) {
            return true;
        }
        
        // Confirm creates/updates (forms will handle this)
        if (strpos($action, 'create_') === 0 || strpos($action, 'update_') === 0) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get entity type for action
     */
    public static function getEntityType(string $action): ?string {
        if (strpos($action, 'customer') !== false) return 'customer';
        if (strpos($action, 'supplier') !== false) return 'supplier';
        if (strpos($action, 'product') !== false) return 'product';
        if (strpos($action, 'expense') !== false) return 'expense';
        if (strpos($action, 'sale') !== false) return 'sale';
        if (strpos($action, 'purchase') !== false) return 'purchase';
        
        return null;
    }
    
    /**
     * Get alternate field name from data
     */
    private static function getAlternateFieldName(string $field, array $data): ?string {
        $alternates = [
            'name' => ['customer_name', 'supplier_name', 'product_name'],
            'customer_id' => ['id', 'customer'],
            'supplier_id' => ['id', 'supplier'],
            'product_id' => ['id', 'product']
        ];
        
        if (isset($alternates[$field])) {
            foreach ($alternates[$field] as $alt) {
                if (isset($data[$alt]) && $data[$alt] !== '' && $data[$alt] !== null) {
                    return $alt;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Normalize field names in data
     */
    public static function normalizeData(array $data, string $action): array {
        $normalized = $data;
        
        // Normalize name fields
        if (isset($data['customer_name']) && !isset($data['name'])) {
            $normalized['name'] = $data['customer_name'];
        }
        if (isset($data['supplier_name']) && !isset($data['name'])) {
            $normalized['name'] = $data['supplier_name'];
        }
        if (isset($data['product_name']) && !isset($data['name'])) {
            $normalized['name'] = $data['product_name'];
        }
        
        // Normalize ID fields
        if (strpos($action, 'customer') !== false && isset($data['id']) && !isset($data['customer_id'])) {
            $normalized['customer_id'] = $data['id'];
        }
        if (strpos($action, 'supplier') !== false && isset($data['id']) && !isset($data['supplier_id'])) {
            $normalized['supplier_id'] = $data['id'];
        }
        if (strpos($action, 'product') !== false && isset($data['id']) && !isset($data['product_id'])) {
            $normalized['product_id'] = $data['id'];
        }
        
        return $normalized;
    }
    
    /**
     * Sanitize data for database
     */
    public static function sanitizeData(array $data): array {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = trim($value);
            } elseif (is_numeric($value)) {
                $sanitized[$key] = $value;
            } elseif (is_array($value)) {
                $sanitized[$key] = self::sanitizeData($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }
}
