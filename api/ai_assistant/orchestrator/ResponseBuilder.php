<?php
/**
 * RESPONSE BUILDER MODULE
 * 
 * Formats all responses for frontend consumption.
 * 
 * Response types:
 * - success: Action completed successfully
 * - error: Action failed
 * - assistant: Conversational response
 * - confirmation: Awaiting user confirmation
 * - form: Show data collection form
 * - clarification: Need more info
 * - selection: Show selection list
 * - cancelled: Action was cancelled
 */

namespace FirmaFlow\AIOrchestrator;

class ResponseBuilder {
    
    /**
     * Success response
     */
    public static function success(string $message, array $data = []): array {
        return [
            'success' => true,
            'type' => 'success',
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Error response
     */
    public static function error(string $message, array $details = []): array {
        return [
            'success' => false,
            'type' => 'error',
            'message' => $message,
            'data' => $details,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Warning response
     */
    public static function warning(string $message): array {
        return [
            'success' => true,
            'type' => 'warning',
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Assistant (conversational) response
     */
    public static function assistant(string $message, array $suggestions = []): array {
        return [
            'success' => true,
            'type' => 'assistant',
            'message' => $message,
            'suggestions' => $suggestions,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Greeting response
     */
    public static function greeting(string $message): array {
        return [
            'success' => true,
            'type' => 'greeting',
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Form response
     * 
     * Note: Frontend expects:
     * - data.fields: actual field values
     * - data.fieldConfig: field configuration (label, type, required, placeholder)
     */
    public static function form(string $message, array $formConfig, string $action, string $module): array {
        // Extract fields (values) and fieldConfig (metadata) from formConfig
        $fields = [];
        $fieldConfig = [];
        
        foreach ($formConfig['fields'] ?? [] as $field) {
            $fieldName = $field['name'];
            $fields[$fieldName] = $field['value'] ?? '';
            $fieldConfig[$fieldName] = [
                'label' => $field['label'] ?? ucfirst(str_replace('_', ' ', $fieldName)),
                'type' => $field['type'] ?? 'text',
                'required' => $field['required'] ?? false,
                'placeholder' => $field['placeholder'] ?? '',
                'options' => $field['options'] ?? null
            ];
        }
        
        // Include hidden fields in fields array
        foreach ($formConfig['hiddenFields'] ?? [] as $name => $value) {
            if ($value !== null) {
                $fields[$name] = $value;
            }
        }
        
        return [
            'success' => true,
            'type' => 'form',
            'message' => $message,
            'data' => [
                'fields' => $fields,
                'fieldConfig' => $fieldConfig,
                'action' => $action,
                'module' => $module,
                'title' => $formConfig['title'] ?? '',
                'submitLabel' => $formConfig['submitLabel'] ?? 'Submit'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Confirmation response
     * 
     * Frontend expects:
     * - data.action: the action being confirmed
     * - data.data: the data for the action
     */
    public static function confirmation(string $message, array $task, array $data): array {
        return [
            'success' => true,
            'type' => 'confirmation',
            'message' => $message,
            'data' => [
                'action' => $task['action'] ?? 'unknown',
                'module' => $task['module'] ?? 'unknown',
                'data' => $data
            ],
            'task' => $task,
            'actions' => [
                ['label' => 'Confirm', 'value' => 'yes', 'style' => 'primary'],
                ['label' => 'Cancel', 'value' => 'no', 'style' => 'secondary'],
                ['label' => 'Modify', 'value' => 'modify', 'style' => 'link']
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Clarification response (need more info)
     */
    public static function clarification(string $message, array $options = []): array {
        return [
            'success' => true,
            'type' => 'clarification',
            'message' => $message,
            'data' => $options,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Selection response (choose from list)
     * 
     * Frontend expects options array with: id, label, sublabel, value
     */
    public static function selection(string $message, array $items, string $selectType, string $action = ''): array {
        // Transform items to frontend-expected format
        $options = [];
        foreach ($items as $index => $item) {
            $options[] = [
                'id' => $item['id'] ?? ($index + 1),
                'label' => $item['name'] ?? $item['label'] ?? "Item " . ($index + 1),
                'sublabel' => $item['sublabel'] ?? $item['email'] ?? $item['description'] ?? null,
                'value' => $item['id'] ?? ($index + 1)  // Actual database ID for selection
            ];
        }
        
        return [
            'success' => true,
            'type' => 'selection',
            'message' => $message,
            'options' => $options,  // Frontend expects 'options' not 'items'
            'items' => $items,      // Keep raw items for reference
            'selectType' => $selectType,
            'action' => $action,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Cancelled response
     */
    public static function cancelled(string $message): array {
        return [
            'success' => true,
            'type' => 'cancelled',
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Capability offer response
     */
    public static function capabilityOffer(string $message, array $capabilities): array {
        return [
            'success' => true,
            'type' => 'capability_offer',
            'message' => $message,
            'capabilities' => $capabilities,
            'data' => [
                'categories' => $capabilities,
                'options' => ['Yes, I\'d like to do something', 'Just browsing']
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Format confirmation message for task
     */
    public static function formatConfirmationMessage(array $task, array $data): string {
        $module = $task['module'];
        $action = $task['action'];
        
        switch ($action) {
            case 'delete_customer':
                $name = $data['name'] ?? $data['customer_name'] ?? "ID {$data['customer_id']}";
                return "⚠️ Are you sure you want to delete customer **{$name}**? This cannot be undone.";
                
            case 'delete_supplier':
                $name = $data['name'] ?? $data['supplier_name'] ?? "ID {$data['supplier_id']}";
                return "⚠️ Are you sure you want to delete supplier **{$name}**? This cannot be undone.";
                
            case 'delete_product':
                $name = $data['name'] ?? $data['product_name'] ?? "ID {$data['product_id']}";
                return "⚠️ Are you sure you want to delete product **{$name}**? This cannot be undone.";
                
            default:
                return "Please confirm you want to proceed with this action.";
        }
    }
    
    /**
     * Build clarification message for missing fields
     */
    public static function buildClarificationMessage(array $missing, string $action): string {
        $fieldLabels = [
            'name' => 'name',
            'customer_name' => 'customer name',
            'supplier_name' => 'supplier name',
            'product_name' => 'product name',
            'customer_id' => 'which customer',
            'supplier_id' => 'which supplier',
            'product_id' => 'which product',
            'email' => 'email address',
            'phone' => 'phone number',
            'amount' => 'amount',
            'description' => 'description'
        ];
        
        if (count($missing) === 1) {
            $field = $missing[0];
            $label = $fieldLabels[$field] ?? $field;
            return "I need the {$label} to continue. What should it be?";
        }
        
        $labels = array_map(
            fn($f) => $fieldLabels[$f] ?? $f,
            array_slice($missing, 0, 3)
        );
        
        return "I need a few more details: " . implode(', ', $labels) . ".";
    }
    
    /**
     * Format data table for display
     */
    public static function formatDataTable(array $data, array $columns = []): array {
        if (empty($data)) {
            return ['rows' => [], 'columns' => []];
        }
        
        // Auto-detect columns if not specified
        if (empty($columns)) {
            $columns = array_keys($data[0]);
        }
        
        return [
            'rows' => $data,
            'columns' => $columns
        ];
    }
    
    /**
     * Data report response (for business intelligence queries)
     * Shows tabular data with summary
     */
    public static function dataReport(string $message, array $data, array $summary = []): array {
        return [
            'success' => true,
            'type' => 'data_report',
            'message' => $message,
            'data' => [
                'items' => $data,
                'summary' => $summary,
                'count' => count($data)
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Insight response (single stat or insight)
     */
    public static function insight(string $message, array $stats = []): array {
        return [
            'success' => true,
            'type' => 'insight',
            'message' => $message,
            'data' => $stats,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Format currency value
     */
    public static function formatCurrency(float $amount, string $currency = 'USD'): string {
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'NGN' => '₦'
        ];
        
        $symbol = $symbols[$currency] ?? $currency . ' ';
        return $symbol . number_format($amount, 2);
    }
}
