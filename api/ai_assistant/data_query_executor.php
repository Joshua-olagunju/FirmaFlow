<?php
/**
 * Data Query Executor
 * 
 * SINGLE RESPONSIBILITY: Execute read-only data queries
 * 
 * This class handles "fast path" queries - common data requests
 * that can be routed directly without AI extraction.
 * 
 * Benefits:
 * - Faster response (no AI call needed)
 * - More reliable (pattern-based, deterministic)
 * - Reduces AI load and costs
 */

class DataQueryExecutor {
    
    private $pdo;
    private $companyId;
    private $userId;
    
    public function __construct($pdo, $companyId, $userId) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
        $this->userId = $userId;
    }
    
    /**
     * Detect and execute fast-path data queries
     * 
     * Returns null if not a fast-path query (proceed to semantic analysis)
     * Returns array response if handled
     * 
     * @param string $message User input
     * @return array|null Response or null
     */
    public function tryFastPath(string $message): ?array {
        $lower = strtolower(trim($message));
        
        // Customer queries
        if ($result = $this->tryCustomerQuery($message, $lower)) {
            return $result;
        }
        
        // Inventory queries
        if ($result = $this->tryInventoryQuery($message, $lower)) {
            return $result;
        }
        
        // Sales queries
        if ($result = $this->trySalesQuery($message, $lower)) {
            return $result;
        }
        
        // Expense queries
        if ($result = $this->tryExpenseQuery($message, $lower)) {
            return $result;
        }
        
        // Supplier queries
        if ($result = $this->trySupplierQuery($message, $lower)) {
            return $result;
        }
        
        return null; // Not a fast-path query
    }
    
    /**
     * Try to match customer-related queries
     */
    private function tryCustomerQuery(string $message, string $lower): ?array {
        // Pattern: "tell me about [customer name]"
        if (preg_match('/\b(tell\s+me\s+about|info\s+about|details\s+(about|of|for))\s+(.+)/i', $message, $matches)) {
            $possibleName = trim($matches[count($matches) - 1]);
            
            if (preg_match('/\bcustomer\b/i', $lower) || 
                preg_match('/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+/', $possibleName)) {
                
                $cleanName = preg_replace('/\b(customer|client|that|this)\b/i', '', $possibleName);
                $cleanName = trim($cleanName);
                
                return $this->buildIntent('customers', 'customer_details', [
                    'customer_name' => $cleanName,
                    'raw_input' => $message
                ]);
            }
        }
        
        // Pattern: "who is my top customer"
        if (preg_match('/\b(who\s+is|show|give\s+me|what\s+is).*\btop\s+(customer|client)s?\b/i', $lower)) {
            return $this->buildIntent('customers', 'top_customers', [
                'limit' => 10,
                'metric' => 'revenue'
            ]);
        }
        
        // Pattern: "who is my best customer"
        if (preg_match('/\b(who\s+is|show|give\s+me).*\b(best|biggest|largest)\s+(customer|client)s?\b/i', $lower)) {
            return $this->buildIntent('customers', 'top_customers', [
                'limit' => 10,
                'metric' => 'revenue'
            ]);
        }
        
        // Pattern: "show my customers"
        if (preg_match('/\b(show|list|view|give\s+me|display)\s+(my\s+)?customers?\b/i', $lower) &&
            !preg_match('/\b(create|add|new|delete|remove|update|edit)\b/i', $lower)) {
            return $this->buildIntent('customers', 'customer_summary', []);
        }
        
        return null;
    }
    
    /**
     * Try to match inventory-related queries
     */
    private function tryInventoryQuery(string $message, string $lower): ?array {
        // Pattern: "show my products"
        if (preg_match('/\b(show|list|view|give\s+me|display)\s+(my\s+)?(products?|inventory|items?)\b/i', $lower) &&
            !preg_match('/\b(create|add|new|delete|remove|update|edit)\b/i', $lower)) {
            return $this->buildIntent('inventory', 'inventory_summary', []);
        }
        
        // Pattern: "low stock" or "what's running low"
        if (preg_match('/\b(low\s+stock|running\s+low|out\s+of\s+stock|reorder)\b/i', $lower)) {
            return $this->buildIntent('inventory', 'low_stock', []);
        }
        
        return null;
    }
    
    /**
     * Try to match sales-related queries
     */
    private function trySalesQuery(string $message, string $lower): ?array {
        // Pattern: "today's sales", "sales summary"
        $isSalesQuery = preg_match('/\b(show|give\s+me|display|what\s+(is|are)|tell\s+me).*\b(sales?|revenue|earnings?|summary)\b/i', $lower) ||
                        preg_match('/\bsales?\s+(summary|report|today|this\s+(month|week|year))\b/i', $lower) ||
                        preg_match('/\b(today|today\'?s|this\s+(month|week|year))\s+(summary|report|sales?)\b/i', $lower);
        
        if ($isSalesQuery) {
            $data = [];
            
            // Add date filters
            if (preg_match('/\b(today|today\'?s)\b/i', $lower)) {
                $data['date_range'] = 'today';
            } elseif (preg_match('/\bthis\s+month\b/i', $lower)) {
                $data['date_range'] = 'this_month';
            } elseif (preg_match('/\bthis\s+week\b/i', $lower)) {
                $data['date_range'] = 'this_week';
            } elseif (preg_match('/\bthis\s+year\b/i', $lower)) {
                $data['date_range'] = 'this_year';
            }
            
            return $this->buildIntent('sales', 'sales_summary', $data);
        }
        
        return null;
    }
    
    /**
     * Try to match expense-related queries
     */
    private function tryExpenseQuery(string $message, string $lower): ?array {
        // Pattern: "show my expenses"
        if (preg_match('/\b(show|list|view|give\s+me|display)\s+(my\s+)?expenses?\b/i', $lower) ||
            preg_match('/\bexpenses?\s+summary\b/i', $lower)) {
            return $this->buildIntent('expenses', 'expense_summary', []);
        }
        
        return null;
    }
    
    /**
     * Try to match supplier-related queries
     */
    private function trySupplierQuery(string $message, string $lower): ?array {
        // Pattern: "show my suppliers"
        if (preg_match('/\b(show|list|view|give\s+me|display)\s+(my\s+)?(suppliers?|vendors?)\b/i', $lower) &&
            !preg_match('/\b(create|add|new|delete|remove|update|edit)\b/i', $lower)) {
            return $this->buildIntent('suppliers', 'supplier_summary', []);
        }
        
        return null;
    }
    
    /**
     * Build intent structure for fast-path execution
     */
    private function buildIntent(string $module, string $action, array $data): array {
        return [
            'module' => $module,
            'action' => $action,
            'data' => $data,
            'is_fast_path' => true
        ];
    }
    
    /**
     * Execute a data query through the appropriate handler
     * 
     * @param array $intent Intent from fast-path or router
     * @param string $originalQuery Original user message
     * @return array Response
     */
    public function execute(array $intent, string $originalQuery): array {
        $module = $intent['module'];
        $action = $intent['action'];
        $data = $intent['data'] ?? [];
        
        // Load handler
        $handlerFile = __DIR__ . '/handlers/' . $module . '_handler.php';
        if (!file_exists($handlerFile)) {
            return [
                'status' => 'error',
                'message' => "I'd like to help with that query, but I don't have access to {$module} data yet."
            ];
        }
        
        require_once $handlerFile;
        $handlerFunction = 'handle' . ucfirst($module) . 'Intent';
        
        if (!function_exists($handlerFunction)) {
            return [
                'status' => 'error',
                'message' => "I can access {$module}, but the handler isn't configured."
            ];
        }
        
        // Execute query to get REAL data
        $result = $handlerFunction(
            $action,
            $data,
            'executing',
            $this->pdo,
            $this->companyId,
            $this->userId
        );
        
        // Store result in session for follow-up questions
        $isSuccess = (!empty($result['success']) || (!empty($result['status']) && $result['status'] === 'success'));
        
        if ($isSuccess && !empty($result['data'])) {
            $_SESSION['last_query_result'] = [
                'query' => $originalQuery,
                'module' => $module,
                'action' => $action,
                'data' => $result['data'],
                'timestamp' => time()
            ];
        }
        
        return $result;
    }
    
    /**
     * Determine the specific action for a data query
     * 
     * Analyzes the query to determine the best action to use
     */
    public function determineAction(array $intent, string $query): array {
        $query = strtolower($query);
        
        // "Top" queries for customers
        if (preg_match('/\b(top|best|biggest|highest)\b.*\b(customer|client)/i', $query)) {
            $intent['action'] = 'top_customers';
            $intent['data']['limit'] = 10;
            $intent['data']['metric'] = 'revenue';
        }
        // Sales/revenue queries
        elseif (preg_match('/\b(sales?|revenue|earnings?|income)\b/i', $query)) {
            $intent['module'] = 'sales';
            $intent['action'] = 'sales_summary';
            
            // Time-based filters
            if (preg_match('/\b(today|today\'?s)\b/i', $query)) {
                $intent['data']['date_range'] = 'today';
            } elseif (preg_match('/\b(this\s+month|monthly)\b/i', $query)) {
                $intent['data']['date_range'] = 'this_month';
            } elseif (preg_match('/\b(this\s+week|weekly)\b/i', $query)) {
                $intent['data']['date_range'] = 'this_week';
            } elseif (preg_match('/\b(this\s+year|yearly|annual)\b/i', $query)) {
                $intent['data']['date_range'] = 'this_year';
            }
        }
        // "Recent" queries
        elseif (preg_match('/\b(recent|latest|last)\b/i', $query)) {
            $intent['data']['sort'] = 'recent';
        }
        
        return $intent;
    }
}
