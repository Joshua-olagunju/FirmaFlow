<?php
/**
 * Prompt Loader & Task Prompt Generator
 * 
 * PRODUCTION-GRADE PROMPT MANAGEMENT
 * 
 * Loads prompts in order:
 * 1. GLOBAL prompt (always loaded)
 * 2. MODULE prompt (one per task)
 * 3. TASK prompt (generated per task)
 * 
 * Rules:
 * - ONE task per prompt
 * - NO chaining
 * - NO state mutation by AI
 */

class PromptLoader {
    
    private static $promptsDir = __DIR__ . '/prompts/';
    
    /**
     * Load and combine prompts for a task
     * 
     * @param string $module The module name
     * @param string $action The action name
     * @param array $taskContext Current task context (FSM state, data)
     * @return string Combined prompt
     */
    public static function loadPromptForTask(string $module, string $action, array $taskContext = []): string {
        // 1. Load GLOBAL prompt
        $globalPrompt = self::loadGlobalPrompt();
        
        // 2. Load MODULE prompt
        $modulePrompt = self::loadModulePrompt($module);
        
        // 3. Generate TASK prompt
        $taskPrompt = self::generateTaskPrompt($module, $action, $taskContext);
        
        // Combine in order
        return self::combinePrompts($globalPrompt, $modulePrompt, $taskPrompt);
    }
    
    /**
     * Load GLOBAL prompt (always stable, small)
     */
    public static function loadGlobalPrompt(): string {
        $path = self::$promptsDir . 'global.prompt';
        
        if (!file_exists($path)) {
            error_log("Global prompt not found: {$path}");
            return self::getDefaultGlobalPrompt();
        }
        
        return file_get_contents($path);
    }
    
    /**
     * Load MODULE prompt (domain-specific)
     */
    public static function loadModulePrompt(string $module): string {
        $path = self::$promptsDir . strtolower($module) . '.prompt';
        
        if (!file_exists($path)) {
            error_log("Module prompt not found: {$path}");
            return ""; // Module prompt is optional
        }
        
        return file_get_contents($path);
    }
    
    /**
     * Generate TASK prompt (ephemeral, per-task)
     */
    public static function generateTaskPrompt(string $module, string $action, array $taskContext): string {
        $fsmState = $taskContext['fsmState'] ?? 'INTENT_DETECTED';
        $userMessage = $taskContext['userMessage'] ?? '';
        $previousData = $taskContext['previousData'] ?? [];
        
        // Get required fields for this action
        $schema = self::getActionSchema($module, $action);
        
        $prompt = "
═══════════════════════════════════════════════════════════════════
CURRENT TASK (EPHEMERAL)
═══════════════════════════════════════════════════════════════════

FSM STATE: {$fsmState}
MODULE: {$module}
ACTION: {$action}

═══════════════════════════════════════════════════════════════════
USER MESSAGE
═══════════════════════════════════════════════════════════════════

\"{$userMessage}\"

═══════════════════════════════════════════════════════════════════
REQUIRED OUTPUT SCHEMA
═══════════════════════════════════════════════════════════════════

{$schema}

═══════════════════════════════════════════════════════════════════
TASK INSTRUCTIONS
═══════════════════════════════════════════════════════════════════

1. Extract ONLY the data specified in the schema
2. For this action ({$action}), focus on: " . self::getActionFocus($action) . "
3. Set confidence based on data completeness
4. List any missing REQUIRED fields
5. If data is incomplete, provide clarification question

Return ONLY valid JSON matching the output format.
Do NOT execute the action. Do NOT assume missing data.
";

        // Add previous data context if available (for clarification flows)
        if (!empty($previousData)) {
            $previousJson = json_encode($previousData, JSON_PRETTY_PRINT);
            $prompt .= "

═══════════════════════════════════════════════════════════════════
PREVIOUSLY EXTRACTED DATA
═══════════════════════════════════════════════════════════════════

{$previousJson}

Merge new information with previous data if user is providing clarification.
";
        }
        
        return $prompt;
    }
    
    /**
     * Combine prompts in correct order
     */
    private static function combinePrompts(string $global, string $module, string $task): string {
        $separator = "\n\n";
        
        $combined = $global;
        
        if (!empty($module)) {
            $combined .= $separator . $module;
        }
        
        $combined .= $separator . $task;
        
        return $combined;
    }
    
    /**
     * Get action-specific schema for output
     */
    private static function getActionSchema(string $module, string $action): string {
        $schemas = [
            // Customer schemas
            'create_customer' => '{
    "extracted_data": {
        "name": "string (REQUIRED - customer full name)",
        "email": "string | null (email address)",
        "phone": "string | null (phone number with or without formatting)",
        "address": "string | null (full address / billing address)",
        "billing_address": "string | null (alias for address)",
        "customer_type": "individual | business (look for keywords: business, company, corp, individual, personal)",
        "payment_terms": "string | null (e.g., Net 30, Net 60, Cash on Delivery)",
        "credit_limit": "number | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": [],
    "clarification_needed": "string | null",
    "validation_errors": []
}',
            'update_customer' => '{
    "extracted_data": {
        "customer_id": "number | null",
        "customer_name": "string | null (to identify)",
        "name": "string | null (new name)",
        "email": "string | null",
        "phone": "string | null",
        "address": "string | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": ["field names"],
    "clarification_needed": "string | null",
    "validation_errors": []
}',
            'view_customer' => '{
    "extracted_data": {
        "customer_id": "number | null",
        "customer_name": "string | null",
        "customer_email": "string | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": [],
    "clarification_needed": "string | null",
    "validation_errors": []
}',
            'customer_summary' => '{
    "extracted_data": {
        "date_range": "string | null",
        "limit": "number | null",
        "sort_by": "string | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": [],
    "clarification_needed": null,
    "validation_errors": []
}',
            
            // Inventory schemas
            'add_product' => '{
    "extracted_data": {
        "name": "string (REQUIRED)",
        "selling_price": "number (REQUIRED)",
        "cost_price": "number | null",
        "quantity": "number | null",
        "description": "string | null",
        "sku": "string | null",
        "unit": "string | null",
        "reorder_level": "number | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": ["field names"],
    "clarification_needed": "string | null",
    "validation_errors": []
}',
            'view_inventory' => '{
    "extracted_data": {
        "category": "string | null",
        "low_stock_only": "boolean | null",
        "limit": "number | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": [],
    "clarification_needed": null,
    "validation_errors": []
}',
            
            // Sales schemas
            'create_invoice' => '{
    "extracted_data": {
        "customer_name": "string | null",
        "customer_email": "string | null",
        "items": [{"product_name": "string", "quantity": "number", "price": "number | null"}],
        "due_date": "string (YYYY-MM-DD) | null",
        "notes": "string | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": ["field names"],
    "clarification_needed": "string | null",
    "validation_errors": []
}',
            'record_payment' => '{
    "extracted_data": {
        "invoice_id": "number | null",
        "invoice_number": "string | null",
        "amount": "number (REQUIRED)",
        "payment_method": "string | null",
        "payment_date": "string (YYYY-MM-DD) | null",
        "reference": "string | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": ["field names"],
    "clarification_needed": "string | null",
    "validation_errors": []
}',
            'sales_summary' => '{
    "extracted_data": {
        "date_range": "string | null",
        "group_by": "string | null",
        "status": "string | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": [],
    "clarification_needed": null,
    "validation_errors": []
}',
            
            // Expense schemas
            'add_expense' => '{
    "extracted_data": {
        "description": "string (REQUIRED)",
        "amount": "number (REQUIRED)",
        "category": "string | null",
        "expense_date": "string (YYYY-MM-DD) | null",
        "payment_method": "string | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": ["field names"],
    "clarification_needed": "string | null",
    "validation_errors": []
}',
            'expense_summary' => '{
    "extracted_data": {
        "date_range": "string | null",
        "group_by": "string | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": [],
    "clarification_needed": null,
    "validation_errors": []
}',
            
            // Settings schemas
            'create_tax' => '{
    "extracted_data": {
        "name": "string (REQUIRED)",
        "rate": "number (REQUIRED, 0-100 percentage)",
        "description": "string | null",
        "is_default": "boolean | null"
    },
    "confidence": "number 0.0-1.0",
    "missing_required": ["field names"],
    "clarification_needed": "string | null",
    "validation_errors": []
}',
            
            // Default schema for views/queries
            'default' => '{
    "extracted_data": {},
    "confidence": "number 0.0-1.0",
    "missing_required": [],
    "clarification_needed": "string | null",
    "validation_errors": []
}'
        ];
        
        return $schemas[$action] ?? $schemas['default'];
    }
    
    /**
     * Get action-specific focus instructions
     */
    private static function getActionFocus(string $action): string {
        $focus = [
            'create_customer' => 'extracting customer name (REQUIRED), email, phone, billing address, customer type (individual or business), payment terms',
            'update_customer' => 'identifying which customer to update and what fields to change',
            'view_customer' => 'identifying which specific customer to view',
            'customer_summary' => 'any filters like date range or limit',
            'add_product' => 'product name (required), selling price (required), quantity, cost price',
            'update_product' => 'identifying which product and what fields to update',
            'view_inventory' => 'any filters like category or low stock',
            'create_invoice' => 'customer name/email (required), invoice items with product names and quantities',
            'record_payment' => 'invoice identification and payment amount (required)',
            'sales_summary' => 'date range and grouping preferences',
            'add_expense' => 'expense description (required), amount (required), category',
            'expense_summary' => 'date range and category filters',
            'create_tax' => 'tax name (required) and rate as percentage (required)',
            'view_pending_invoices' => 'any customer filters or amount ranges',
            'approve_supplier_payment' => 'purchase order identification and payment details'
        ];
        
        return $focus[$action] ?? 'extracting all relevant data from the user message';
    }
    
    /**
     * Default global prompt if file not found
     */
    private static function getDefaultGlobalPrompt(): string {
        return "You are a DATA EXTRACTION component. Extract structured data from user messages. Return ONLY valid JSON.";
    }
    
    /**
     * Validate prompt loading
     */
    public static function validatePromptSetup(): array {
        $errors = [];
        $warnings = [];
        
        // Check prompts directory
        if (!is_dir(self::$promptsDir)) {
            $errors[] = "Prompts directory not found: " . self::$promptsDir;
            return ['valid' => false, 'errors' => $errors, 'warnings' => $warnings];
        }
        
        // Check global prompt
        if (!file_exists(self::$promptsDir . 'global.prompt')) {
            $errors[] = "Global prompt not found";
        }
        
        // Check module prompts
        $expectedModules = ['customers', 'inventory', 'sales', 'payments', 'expenses', 'purchases', 'suppliers', 'reports', 'settings', 'subscriptions', 'general'];
        
        foreach ($expectedModules as $module) {
            $path = self::$promptsDir . $module . '.prompt';
            if (!file_exists($path)) {
                $warnings[] = "Module prompt missing: {$module}.prompt";
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings
        ];
    }
}
