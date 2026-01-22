<?php
/**
 * FORM BUILDER MODULE
 * 
 * Builds form configurations for data collection.
 * 
 * Forms are used for create/update operations where the user
 * needs to provide structured data.
 */

namespace FirmaFlow\AIOrchestrator;

class FormBuilder {
    
    /**
     * Check if action requires a form
     */
    public static function isFormAction(string $action): bool {
        $formActions = [
            'create_customer', 'update_customer',
            'create_supplier', 'update_supplier',
            'create_product', 'update_product',
            'create_expense'
        ];
        
        return in_array($action, $formActions);
    }
    
    /**
     * Get form configuration for action
     */
    public static function getFormForAction(string $action, array $data = []): array {
        switch ($action) {
            case 'create_customer':
            case 'update_customer':
                return self::buildCustomerForm($data);
                
            case 'create_supplier':
            case 'update_supplier':
                return self::buildSupplierForm($data);
                
            case 'create_product':
            case 'update_product':
                return self::buildProductForm($data);
                
            case 'create_expense':
                return self::buildExpenseForm($data);
                
            default:
                return self::buildGenericForm($data);
        }
    }
    
    /**
     * Build customer form
     */
    public static function buildCustomerForm(array $data = []): array {
        return [
            'title' => empty($data['id']) ? 'New Customer' : 'Edit Customer',
            'submitLabel' => empty($data['id']) ? 'Create Customer' : 'Update Customer',
            'fields' => [
                [
                    'name' => 'name',
                    'label' => 'Customer Name',
                    'type' => 'text',
                    'required' => true,
                    'value' => $data['name'] ?? $data['customer_name'] ?? '',
                    'placeholder' => 'Enter customer name'
                ],
                [
                    'name' => 'email',
                    'label' => 'Email',
                    'type' => 'email',
                    'required' => false,
                    'value' => $data['email'] ?? '',
                    'placeholder' => 'customer@example.com'
                ],
                [
                    'name' => 'phone',
                    'label' => 'Phone',
                    'type' => 'tel',
                    'required' => false,
                    'value' => $data['phone'] ?? '',
                    'placeholder' => '+1 234 567 8900'
                ],
                [
                    'name' => 'address',
                    'label' => 'Address',
                    'type' => 'textarea',
                    'required' => false,
                    'value' => $data['address'] ?? '',
                    'placeholder' => 'Street address'
                ],
                [
                    'name' => 'city',
                    'label' => 'City',
                    'type' => 'text',
                    'required' => false,
                    'value' => $data['city'] ?? '',
                    'placeholder' => 'City'
                ],
                [
                    'name' => 'tax_id',
                    'label' => 'Tax ID',
                    'type' => 'text',
                    'required' => false,
                    'value' => $data['tax_id'] ?? '',
                    'placeholder' => 'Tax identification number'
                ]
            ],
            'hiddenFields' => [
                'id' => $data['id'] ?? $data['customer_id'] ?? null
            ]
        ];
    }
    
    /**
     * Build supplier form
     */
    public static function buildSupplierForm(array $data = []): array {
        return [
            'title' => empty($data['id']) ? 'New Supplier' : 'Edit Supplier',
            'submitLabel' => empty($data['id']) ? 'Create Supplier' : 'Update Supplier',
            'fields' => [
                [
                    'name' => 'name',
                    'label' => 'Supplier Name',
                    'type' => 'text',
                    'required' => true,
                    'value' => $data['name'] ?? $data['supplier_name'] ?? '',
                    'placeholder' => 'Enter supplier name'
                ],
                [
                    'name' => 'email',
                    'label' => 'Email',
                    'type' => 'email',
                    'required' => false,
                    'value' => $data['email'] ?? '',
                    'placeholder' => 'supplier@example.com'
                ],
                [
                    'name' => 'phone',
                    'label' => 'Phone',
                    'type' => 'tel',
                    'required' => false,
                    'value' => $data['phone'] ?? '',
                    'placeholder' => '+1 234 567 8900'
                ],
                [
                    'name' => 'address',
                    'label' => 'Address',
                    'type' => 'textarea',
                    'required' => false,
                    'value' => $data['address'] ?? '',
                    'placeholder' => 'Business address'
                ],
                [
                    'name' => 'contact_person',
                    'label' => 'Contact Person',
                    'type' => 'text',
                    'required' => false,
                    'value' => $data['contact_person'] ?? '',
                    'placeholder' => 'Primary contact name'
                ]
            ],
            'hiddenFields' => [
                'id' => $data['id'] ?? $data['supplier_id'] ?? null
            ]
        ];
    }
    
    /**
     * Build product form
     */
    public static function buildProductForm(array $data = []): array {
        return [
            'title' => empty($data['id']) ? 'New Product' : 'Edit Product',
            'submitLabel' => empty($data['id']) ? 'Create Product' : 'Update Product',
            'fields' => [
                [
                    'name' => 'name',
                    'label' => 'Product Name',
                    'type' => 'text',
                    'required' => true,
                    'value' => $data['name'] ?? $data['product_name'] ?? '',
                    'placeholder' => 'Enter product name'
                ],
                [
                    'name' => 'sku',
                    'label' => 'SKU',
                    'type' => 'text',
                    'required' => false,
                    'value' => $data['sku'] ?? '',
                    'placeholder' => 'Stock keeping unit'
                ],
                [
                    'name' => 'price',
                    'label' => 'Selling Price',
                    'type' => 'number',
                    'required' => false,
                    'value' => $data['price'] ?? '',
                    'placeholder' => '0.00',
                    'step' => '0.01'
                ],
                [
                    'name' => 'cost',
                    'label' => 'Cost Price',
                    'type' => 'number',
                    'required' => false,
                    'value' => $data['cost'] ?? '',
                    'placeholder' => '0.00',
                    'step' => '0.01'
                ],
                [
                    'name' => 'quantity',
                    'label' => 'Initial Quantity',
                    'type' => 'number',
                    'required' => false,
                    'value' => $data['quantity'] ?? 0,
                    'placeholder' => '0'
                ],
                [
                    'name' => 'category',
                    'label' => 'Category',
                    'type' => 'text',
                    'required' => false,
                    'value' => $data['category'] ?? '',
                    'placeholder' => 'Product category'
                ]
            ],
            'hiddenFields' => [
                'id' => $data['id'] ?? $data['product_id'] ?? null
            ]
        ];
    }
    
    /**
     * Build expense form
     */
    public static function buildExpenseForm(array $data = []): array {
        return [
            'title' => 'Record Expense',
            'submitLabel' => 'Save Expense',
            'fields' => [
                [
                    'name' => 'description',
                    'label' => 'Description',
                    'type' => 'text',
                    'required' => true,
                    'value' => $data['description'] ?? '',
                    'placeholder' => 'What was this expense for?'
                ],
                [
                    'name' => 'amount',
                    'label' => 'Amount',
                    'type' => 'number',
                    'required' => true,
                    'value' => $data['amount'] ?? '',
                    'placeholder' => '0.00',
                    'step' => '0.01'
                ],
                [
                    'name' => 'category',
                    'label' => 'Category',
                    'type' => 'select',
                    'required' => false,
                    'value' => $data['category'] ?? 'General',
                    'options' => [
                        'General' => 'General',
                        'Office Supplies' => 'Office Supplies',
                        'Utilities' => 'Utilities',
                        'Rent' => 'Rent',
                        'Travel' => 'Travel',
                        'Marketing' => 'Marketing',
                        'Salaries' => 'Salaries',
                        'Other' => 'Other'
                    ]
                ],
                [
                    'name' => 'expense_date',
                    'label' => 'Date',
                    'type' => 'date',
                    'required' => false,
                    'value' => $data['expense_date'] ?? $data['date'] ?? date('Y-m-d')
                ],
                [
                    'name' => 'vendor',
                    'label' => 'Vendor/Payee',
                    'type' => 'text',
                    'required' => false,
                    'value' => $data['vendor'] ?? '',
                    'placeholder' => 'Who was paid?'
                ]
            ],
            'hiddenFields' => []
        ];
    }
    
    /**
     * Build generic form from data
     */
    public static function buildGenericForm(array $data = []): array {
        $fields = [];
        
        foreach ($data as $key => $value) {
            if ($key === 'id' || strpos($key, '_id') !== false) {
                continue;
            }
            
            $fields[] = [
                'name' => $key,
                'label' => ucwords(str_replace('_', ' ', $key)),
                'type' => self::guessFieldType($key, $value),
                'required' => false,
                'value' => $value
            ];
        }
        
        return [
            'title' => 'Edit Details',
            'submitLabel' => 'Save',
            'fields' => $fields,
            'hiddenFields' => ['id' => $data['id'] ?? null]
        ];
    }
    
    /**
     * Guess field type from name/value
     */
    private static function guessFieldType(string $name, $value): string {
        if (strpos($name, 'email') !== false) return 'email';
        if (strpos($name, 'phone') !== false) return 'tel';
        if (strpos($name, 'date') !== false) return 'date';
        if (strpos($name, 'price') !== false || strpos($name, 'amount') !== false || strpos($name, 'cost') !== false) return 'number';
        if (strpos($name, 'quantity') !== false || strpos($name, 'count') !== false) return 'number';
        if (strpos($name, 'address') !== false || strpos($name, 'description') !== false || strpos($name, 'notes') !== false) return 'textarea';
        if (is_numeric($value)) return 'number';
        
        return 'text';
    }
}
