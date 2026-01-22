<?php
/**
 * Form Builder
 * 
 * SINGLE RESPONSIBILITY: Build form configurations for UI
 * 
 * Extracted from orchestrator.php to reduce complexity.
 * These functions are pure - they take data and return config.
 * They do NOT interact with FSM or AI.
 */

class FormBuilder {
    
    /**
     * Build customer form configuration for editable UI
     */
    public static function buildCustomerForm(array $data = []): array {
        return [
            'type' => 'form',
            'fieldConfig' => [
                'name' => [
                    'label' => 'Customer Name',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'Enter customer name'
                ],
                'phone' => [
                    'label' => 'Phone Number',
                    'type' => 'tel',
                    'required' => true,
                    'placeholder' => 'Enter phone number'
                ],
                'email' => [
                    'label' => 'Email Address',
                    'type' => 'email',
                    'required' => true,
                    'placeholder' => 'customer@example.com'
                ],
                'billing_address' => [
                    'label' => 'Billing Address',
                    'type' => 'textarea',
                    'required' => true,
                    'placeholder' => 'Enter complete billing address'
                ],
                'customer_type' => [
                    'label' => 'Customer Type',
                    'type' => 'select',
                    'required' => false,
                    'options' => ['Individual', 'Business'],
                    'default' => 'Individual'
                ],
                'payment_terms' => [
                    'label' => 'Payment Terms',
                    'type' => 'select',
                    'required' => false,
                    'options' => ['Cash on Delivery', 'Net 7 days', 'Net 15 days', 'Net 30 days', 'Net 60 days'],
                    'default' => 'Cash on Delivery'
                ],
                'credit_limit' => [
                    'label' => 'Credit Limit',
                    'type' => 'number',
                    'required' => false,
                    'placeholder' => '0.00'
                ],
                'is_active' => [
                    'label' => 'Active Customer',
                    'type' => 'checkbox',
                    'required' => false,
                    'placeholder' => 'Mark as active customer',
                    'default' => true
                ]
            ],
            'fields' => [
                'customer_id' => $data['customer_id'] ?? $data['id'] ?? null,
                'name' => $data['name'] ?? $data['customer_name'] ?? '',
                'phone' => $data['phone'] ?? '',
                'email' => $data['email'] ?? '',
                'billing_address' => $data['billing_address'] ?? $data['address'] ?? '',
                'customer_type' => $data['customer_type'] ?? 'Individual',
                'payment_terms' => $data['payment_terms'] ?? 'Cash on Delivery',
                'credit_limit' => $data['credit_limit'] ?? '',
                'is_active' => $data['is_active'] ?? true
            ]
        ];
    }
    
    /**
     * Build supplier form configuration for editable UI
     */
    public static function buildSupplierForm(array $data = []): array {
        return [
            'type' => 'form',
            'fieldConfig' => [
                'company_name' => [
                    'label' => 'Company Name',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'Enter supplier company name'
                ],
                'contact_person' => [
                    'label' => 'Contact Person',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'Enter contact person name'
                ],
                'phone' => [
                    'label' => 'Phone Number',
                    'type' => 'tel',
                    'required' => true,
                    'placeholder' => 'Enter phone number'
                ],
                'email' => [
                    'label' => 'Email Address',
                    'type' => 'email',
                    'required' => true,
                    'placeholder' => 'supplier@example.com'
                ],
                'address' => [
                    'label' => 'Address',
                    'type' => 'textarea',
                    'required' => true,
                    'placeholder' => 'Enter complete address'
                ],
                'tax_number' => [
                    'label' => 'Tax Number / TIN',
                    'type' => 'text',
                    'required' => false,
                    'placeholder' => 'Enter tax identification number'
                ],
                'payment_terms' => [
                    'label' => 'Payment Terms',
                    'type' => 'select',
                    'required' => false,
                    'options' => ['Immediate', 'Net 7 days', 'Net 15 days', 'Net 30 days', 'Net 45 days', 'Net 60 days'],
                    'default' => 'Net 30 days'
                ],
                'is_active' => [
                    'label' => 'Active Supplier',
                    'type' => 'checkbox',
                    'required' => false,
                    'placeholder' => 'Mark as active supplier',
                    'default' => true
                ]
            ],
            'fields' => [
                'supplier_id' => $data['supplier_id'] ?? $data['id'] ?? null,
                'company_name' => $data['company_name'] ?? $data['name'] ?? $data['supplier_name'] ?? '',
                'contact_person' => $data['contact_person'] ?? $data['contact'] ?? '',
                'phone' => $data['phone'] ?? '',
                'email' => $data['email'] ?? '',
                'address' => $data['address'] ?? '',
                'tax_number' => $data['tax_number'] ?? $data['tax_id'] ?? '',
                'payment_terms' => $data['payment_terms'] ?? 'Net 30 days',
                'is_active' => $data['is_active'] ?? (($data['status'] ?? 'active') === 'active')
            ]
        ];
    }
    
    /**
     * Build product form configuration for editable UI
     */
    public static function buildProductForm(array $data = []): array {
        return [
            'type' => 'form',
            'fieldConfig' => [
                'name' => [
                    'label' => 'Product Name',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'Enter product name'
                ],
                'sku' => [
                    'label' => 'SKU',
                    'type' => 'text',
                    'required' => false,
                    'placeholder' => 'Auto-generated if empty'
                ],
                'description' => [
                    'label' => 'Description',
                    'type' => 'textarea',
                    'required' => false,
                    'placeholder' => 'Product description'
                ],
                'selling_price' => [
                    'label' => 'Selling Price',
                    'type' => 'number',
                    'required' => true,
                    'placeholder' => '0.00'
                ],
                'cost_price' => [
                    'label' => 'Cost Price',
                    'type' => 'number',
                    'required' => false,
                    'placeholder' => '0.00'
                ],
                'quantity' => [
                    'label' => 'Initial Stock',
                    'type' => 'number',
                    'required' => false,
                    'placeholder' => '0'
                ],
                'reorder_level' => [
                    'label' => 'Reorder Level',
                    'type' => 'number',
                    'required' => false,
                    'placeholder' => '10'
                ]
            ],
            'fields' => [
                'product_id' => $data['product_id'] ?? $data['id'] ?? null,
                'name' => $data['name'] ?? $data['product_name'] ?? '',
                'sku' => $data['sku'] ?? '',
                'description' => $data['description'] ?? '',
                'selling_price' => $data['selling_price'] ?? $data['price'] ?? '',
                'cost_price' => $data['cost_price'] ?? '',
                'quantity' => $data['quantity'] ?? $data['stock'] ?? '',
                'reorder_level' => $data['reorder_level'] ?? 10
            ]
        ];
    }
    
    /**
     * Build expense form configuration
     */
    public static function buildExpenseForm(array $data = []): array {
        return [
            'type' => 'form',
            'fieldConfig' => [
                'description' => [
                    'label' => 'Description',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'e.g., Office supplies, Electricity bill'
                ],
                'amount' => [
                    'label' => 'Amount',
                    'type' => 'number',
                    'required' => true,
                    'placeholder' => '0.00'
                ],
                'category' => [
                    'label' => 'Category',
                    'type' => 'select',
                    'required' => false,
                    'options' => ['Operating', 'Utilities', 'Rent', 'Salaries', 'Marketing', 'Travel', 'Other'],
                    'default' => 'Operating'
                ],
                'date' => [
                    'label' => 'Date',
                    'type' => 'date',
                    'required' => false,
                    'default' => date('Y-m-d')
                ],
                'notes' => [
                    'label' => 'Notes',
                    'type' => 'textarea',
                    'required' => false,
                    'placeholder' => 'Additional notes'
                ]
            ],
            'fields' => [
                'expense_id' => $data['expense_id'] ?? $data['id'] ?? null,
                'description' => $data['description'] ?? '',
                'amount' => $data['amount'] ?? '',
                'category' => $data['category'] ?? 'Operating',
                'date' => $data['date'] ?? date('Y-m-d'),
                'notes' => $data['notes'] ?? ''
            ]
        ];
    }
    
    /**
     * Get form builder for a specific action
     * 
     * @param string $action The action type (create_customer, update_supplier, etc.)
     * @param array $data Pre-populated data
     * @return array|null Form configuration or null if not a form action
     */
    public static function getFormForAction(string $action, array $data = []): ?array {
        $formMap = [
            'create_customer' => 'buildCustomerForm',
            'update_customer' => 'buildCustomerForm',
            'create_supplier' => 'buildSupplierForm',
            'update_supplier' => 'buildSupplierForm',
            'add_product' => 'buildProductForm',
            'update_product' => 'buildProductForm',
            'add_expense' => 'buildExpenseForm',
            'update_expense' => 'buildExpenseForm',
        ];
        
        if (!isset($formMap[$action])) {
            return null;
        }
        
        $method = $formMap[$action];
        return self::$method($data);
    }
    
    /**
     * Check if an action uses a form-based UI
     */
    public static function isFormAction(string $action): bool {
        $formActions = [
            'create_customer', 'update_customer',
            'create_supplier', 'update_supplier',
            'add_product', 'update_product',
            'add_expense', 'update_expense',
        ];
        
        return in_array($action, $formActions);
    }
}
