<?php
/**
 * Intent Classifier Module
 * Maps intents to categories and provides intent metadata
 */

/**
 * Get intent category from intent name
 */
function getIntentCategory($intent) {
    $intentMap = [
        // Customers
        'create_customer' => 'customers',
        'update_customer' => 'customers',
        'delete_customer' => 'customers',
        'view_customer' => 'customers',
        'customer_summary' => 'customers',
        'customer_details' => 'customers',  // Detailed customer profile with spending history
        'top_customers' => 'customers',
        'customer_transactions' => 'customers',
        'customer_balance' => 'customers',
        'change_customer_type' => 'customers',
        'activate_customer' => 'customers',
        'deactivate_customer' => 'customers',
        // Capability questions for customers
        'ask_create_customer' => 'customers',
        'ask_update_customer' => 'customers',
        'ask_delete_customer' => 'customers',
        'ask_view_customers' => 'customers',
        
        // Suppliers
        'view_suppliers' => 'suppliers',
        'supplier_summary' => 'suppliers',
        'top_suppliers' => 'suppliers',
        
        // Inventory
        'add_product' => 'inventory',
        'add_multiple_products' => 'inventory',
        'update_product' => 'inventory',
        'adjust_stock' => 'inventory',
        'view_inventory' => 'inventory',
        'inventory_analysis' => 'inventory',
        'product_analytics' => 'inventory',
        
        // Sales
        'create_invoice' => 'sales',
        'update_invoice' => 'sales',
        'view_invoice' => 'sales',
        'record_payment' => 'sales',
        'sales_summary' => 'sales',
        'sales_analytics' => 'sales',
        
        // Payments
        'view_pending_invoices' => 'payments',
        'view_pending_supplier_bills' => 'payments',
        'approve_supplier_payment' => 'payments',
        'view_transaction_history' => 'payments',
        
        // Purchases
        'create_purchase_order' => 'purchases',
        'update_purchase_order' => 'purchases',
        'receive_goods' => 'purchases',
        'purchase_summary' => 'purchases',
        
        // Expenses
        'add_expense' => 'expenses',
        'update_expense' => 'expenses',
        'view_expenses' => 'expenses',
        'expense_summary' => 'expenses',
        'expense_analytics' => 'expenses',
        
        // Reports
        'generate_report' => 'reports',
        'report_analysis' => 'reports',
        
        // Subscriptions
        'view_subscription' => 'subscriptions',
        'upgrade_subscription' => 'subscriptions',
        'upgrade_guidance' => 'subscriptions',
        
        // Settings
        'view_settings' => 'settings',
        'update_company_info' => 'settings',
        'create_tax' => 'settings',
        'update_tax' => 'settings',
        'view_tax_rates' => 'settings',
        'create_tag' => 'settings',
        'update_tag' => 'settings',
        'view_tags' => 'settings',
        'create_template' => 'settings',
        'update_settings' => 'settings',
        
        // Users
        'create_user' => 'users',
        'update_user' => 'users',
        'view_users' => 'users',
        'deactivate_user' => 'users',
        
        // Notifications
        'send_notification' => 'notifications',
        'get_notifications' => 'notifications',
        'check_overdue_invoices' => 'notifications',
        'check_low_stock' => 'notifications',
        
        // General
        'general_chat' => 'general',
        'template_request' => 'general',
        
        // Legacy support (backward compatibility)
        'create_product' => 'inventory',
        'query_information' => 'reports',
        'conversational' => 'general'
    ];
    
    return $intentMap[$intent] ?? 'unknown';
}

/**
 * Get intent metadata (required fields, risk level, etc.)
 */
function getIntentMetadata($intent) {
    $metadata = [
        // Customers
        'create_customer' => [
            'required_fields' => ['name'],
            'optional_fields' => ['email', 'phone', 'address', 'credit_limit', 'payment_terms', 'customer_type'],
            'default_risk' => 'medium',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'update_customer' => [
            'required_fields' => ['customer_id'],
            'optional_fields' => ['name', 'email', 'phone', 'address', 'credit_limit'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'view_customer' => [
            'required_fields' => ['customer_id'],
            'optional_fields' => [],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'customer_summary' => [
            'required_fields' => [],
            'optional_fields' => ['date_range', 'limit'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'top_customers' => [
            'required_fields' => [],
            'optional_fields' => ['limit', 'date_range', 'metric'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Suppliers
        'view_suppliers' => [
            'required_fields' => [],
            'optional_fields' => ['limit', 'status'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'supplier_summary' => [
            'required_fields' => [],
            'optional_fields' => ['date_range', 'limit'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'top_suppliers' => [
            'required_fields' => [],
            'optional_fields' => ['limit', 'date_range', 'metric'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Inventory
        'add_product' => [
            'required_fields' => ['name', 'selling_price', 'quantity'],
            'optional_fields' => ['description', 'cost_price', 'unit', 'sku'],
            'default_risk' => 'medium',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'update_product' => [
            'required_fields' => ['product_id'],
            'optional_fields' => ['name', 'selling_price', 'quantity', 'description'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'adjust_stock' => [
            'required_fields' => ['product_id', 'adjustment'],
            'optional_fields' => ['reason'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'view_inventory' => [
            'required_fields' => [],
            'optional_fields' => ['filters', 'low_stock_only'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'product_analytics' => [
            'required_fields' => [],
            'optional_fields' => ['metric', 'limit', 'date_range'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Sales
        'create_invoice' => [
            'required_fields' => ['customer_name', 'items'],
            'optional_fields' => ['due_date', 'notes', 'discount'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'record_payment' => [
            'required_fields' => ['invoice_id', 'amount'],
            'optional_fields' => ['payment_method', 'reference'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'view_invoice' => [
            'required_fields' => ['invoice_id'],
            'optional_fields' => [],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Payments
        'view_pending_invoices' => [
            'required_fields' => [],
            'optional_fields' => ['limit', 'date_range'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'approve_supplier_payment' => [
            'required_fields' => ['payment_id'],
            'optional_fields' => [],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        
        // Expenses
        'add_expense' => [
            'required_fields' => ['description', 'amount'],
            'optional_fields' => ['category', 'date', 'payment_method'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'view_expenses' => [
            'required_fields' => [],
            'optional_fields' => ['date_range', 'category', 'limit'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Reports
        'generate_report' => [
            'required_fields' => ['report_type'],
            'optional_fields' => ['date_range', 'filters'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Subscriptions
        'view_subscription' => [
            'required_fields' => [],
            'optional_fields' => [],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'upgrade_subscription' => [
            'required_fields' => ['plan'],
            'optional_fields' => ['billing_cycle'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'upgrade_guidance' => [
            'required_fields' => [],
            'optional_fields' => [],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Settings
        'view_settings' => [
            'required_fields' => [],
            'optional_fields' => ['setting_type'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'update_company_info' => [
            'required_fields' => [],
            'optional_fields' => ['company_name', 'email', 'phone', 'address'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true,
            'provides_guidance' => true
        ],
        'create_tax' => [
            'required_fields' => ['name', 'rate'],
            'optional_fields' => ['description', 'is_default'],
            'default_risk' => 'medium',
            'requires_confirmation' => true,
            'can_auto_execute' => true
        ],
        'update_tax' => [
            'required_fields' => ['tax_id'],
            'optional_fields' => ['name', 'rate', 'description', 'is_active'],
            'default_risk' => 'medium',
            'requires_confirmation' => true,
            'can_auto_execute' => true
        ],
        'view_tax_rates' => [
            'required_fields' => [],
            'optional_fields' => ['status'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'create_tag' => [
            'required_fields' => ['name'],
            'optional_fields' => ['color'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'view_tags' => [
            'required_fields' => [],
            'optional_fields' => [],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'create_template' => [
            'required_fields' => ['template_type'],
            'optional_fields' => ['name'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true,
            'provides_guidance' => true
        ],
        'update_settings' => [
            'required_fields' => [],
            'optional_fields' => [],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true,
            'provides_guidance' => true
        ],
        
        // Missing intent metadata for sales/purchases/expenses
        'sales_summary' => [
            'required_fields' => [],
            'optional_fields' => ['date_range', 'limit', 'customer_id'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'sales_analytics' => [
            'required_fields' => [],
            'optional_fields' => ['metric', 'date_range', 'limit'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'purchase_summary' => [
            'required_fields' => [],
            'optional_fields' => ['date_range', 'limit', 'supplier_id'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'expense_summary' => [
            'required_fields' => [],
            'optional_fields' => ['date_range', 'category', 'limit'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'expense_analytics' => [
            'required_fields' => [],
            'optional_fields' => ['metric', 'date_range', 'category'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Users
        'create_user' => [
            'required_fields' => ['email', 'username', 'role'],
            'optional_fields' => ['password'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'update_user' => [
            'required_fields' => ['user_id'],
            'optional_fields' => ['email', 'role', 'is_active'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'view_users' => [
            'required_fields' => [],
            'optional_fields' => [],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Notifications
        'send_notification' => [
            'required_fields' => ['message'],
            'optional_fields' => ['type', 'priority'],
            'default_risk' => 'medium',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'check_overdue_invoices' => [
            'required_fields' => [],
            'optional_fields' => [],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        'check_low_stock' => [
            'required_fields' => [],
            'optional_fields' => ['threshold'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Purchases
        'create_purchase_order' => [
            'required_fields' => ['supplier_name', 'items'],
            'optional_fields' => ['due_date', 'notes'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'update_purchase_order' => [
            'required_fields' => ['purchase_id'],
            'optional_fields' => ['status', 'items', 'notes'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'receive_goods' => [
            'required_fields' => ['purchase_id'],
            'optional_fields' => ['received_quantity'],
            'default_risk' => 'high',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ],
        'purchase_summary' => [
            'required_fields' => [],
            'optional_fields' => ['date_range', 'supplier'],
            'default_risk' => 'low',
            'requires_confirmation' => false,
            'can_auto_execute' => true
        ],
        
        // Default for unknown intents
        'default' => [
            'required_fields' => [],
            'optional_fields' => [],
            'default_risk' => 'medium',
            'requires_confirmation' => true,
            'can_auto_execute' => false
        ]
    ];
    
    return $metadata[$intent] ?? $metadata['default'];
}

/**
 * Validate extracted data against intent requirements
 */
function validateIntentData($intent, $extractedData) {
    $metadata = getIntentMetadata($intent);
    $missing = [];
    
    // Check required fields
    foreach ($metadata['required_fields'] as $field) {
        if (!isset($extractedData[$field]) || empty($extractedData[$field])) {
            $missing[] = $field;
        }
    }
    
    return [
        'is_valid' => empty($missing),
        'missing_fields' => $missing,
        'metadata' => $metadata
    ];
}
