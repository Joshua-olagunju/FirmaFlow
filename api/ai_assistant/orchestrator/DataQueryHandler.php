<?php
/**
 * DATA QUERY HANDLER MODULE
 * 
 * Fast-path execution for data queries.
 * 
 * Bypasses AI for common query patterns to improve response time.
 * Pattern matching happens before AI is called.
 * 
 * Now includes Business Intelligence queries:
 * - Customer purchase history
 * - Product inventory status
 * - Sales analytics
 */

namespace FirmaFlow\AIOrchestrator;

class DataQueryHandler {
    
    /**
     * Try fast-path for common patterns
     * 
     * Returns null if pattern not matched (continue with AI)
     */
    public static function tryFastPath(string $message, $pdo, int $companyId, int $userId): ?array {
        $message = strtolower(trim($message));
        
        // Greeting patterns - clear context for fresh start
        if (self::isGreeting($message)) {
            FollowUpHandler::clearLastTopic();
            return ResponseBuilder::greeting(
                "👋 Hello! I'm your FirmaFlow assistant. I can help you manage customers, suppliers, products, sales, expenses, and more. What would you like to do?"
            );
        }
        
        // Help patterns - clear topic for fresh start
        if (self::isHelpRequest($message)) {
            FollowUpHandler::clearLastTopic();
            return self::getHelpResponse();
        }
        
        // === BUSINESS INTELLIGENCE QUERIES ===
        
        // Customer purchase history
        if ($result = self::tryCustomerPurchaseQuery($message, $pdo, $companyId)) {
            return $result;
        }
        
        // Product inventory queries
        if ($result = self::tryProductInventoryQuery($message, $pdo, $companyId)) {
            return $result;
        }
        
        // Sales analytics queries  
        if ($result = self::trySalesAnalyticsQuery($message, $pdo, $companyId)) {
            return $result;
        }
        
        // === STANDARD CRUD PATTERNS ===
        
        // Single word entity requests - "customers", "suppliers", "products"
        if (preg_match('/^(customers?|suppliers?|products?)$/i', $message, $matches)) {
            $entity = strtolower($matches[1]);
            // Set topic for follow-up
            FollowUpHandler::setLastTopic(rtrim($entity, 's') . 's');
            
            switch (rtrim($entity, 's')) {
                case 'customer':
                    return self::execute('customers', 'list_customers', [], $pdo, $companyId, $userId);
                case 'supplier':
                    return self::execute('suppliers', 'list_suppliers', [], $pdo, $companyId, $userId);
                case 'product':
                    return self::execute('inventory', 'list_products', [], $pdo, $companyId, $userId);
            }
        }
        
        // List customers - flexible patterns
        if (preg_match('/(show|list|get|display|view|what)\s+(all\s+)?(my\s+)?customers?/i', $message) ||
            preg_match('/customers?\s+(i\s+have|list)/i', $message)) {
            FollowUpHandler::setLastTopic('customers');
            return self::execute('customers', 'list_customers', [], $pdo, $companyId, $userId);
        }
        
        // List suppliers - flexible patterns
        if (preg_match('/(show|list|get|display|view|what)\s+(all\s+)?(my\s+)?suppliers?/i', $message) ||
            preg_match('/suppliers?\s+(i\s+have|list)/i', $message)) {
            FollowUpHandler::setLastTopic('suppliers');
            return self::execute('suppliers', 'list_suppliers', [], $pdo, $companyId, $userId);
        }
        
        // List products - flexible patterns
        if (preg_match('/(show|list|get|display|view|what)\s+(all\s+)?(my\s+)?products?/i', $message) ||
            preg_match('/products?\s+(i\s+have|list|do\s+i\s+have)/i', $message)) {
            FollowUpHandler::setLastTopic('products');
            return self::execute('inventory', 'list_products', [], $pdo, $companyId, $userId);
        }
        
        // List sales
        if (preg_match('/^(show|list|get|display|view)\s+(all\s+)?(my\s+)?sales?$/i', $message)) {
            return self::execute('sales', 'list_sales', [], $pdo, $companyId, $userId);
        }
        
        // List expenses
        if (preg_match('/^(show|list|get|display|view)\s+(all\s+)?(my\s+)?expenses?$/i', $message)) {
            return self::execute('expenses', 'list_expenses', [], $pdo, $companyId, $userId);
        }
        
        // How many customers/suppliers/products
        if (preg_match('/^how\s+many\s+(customers?|suppliers?|products?)(\s+do\s+i\s+have)?/i', $message, $matches)) {
            return self::getCountResponse($matches[1], $pdo, $companyId);
        }
        
        // Create customer patterns - show form directly
        if (preg_match('/(add|create|new|register)\s+(a\s+)?(new\s+)?customer/i', $message) ||
            preg_match('/^let\'?s?\s+(add|create)\s+(a\s+)?customer/i', $message) ||
            preg_match('/^(ok|okay|sure|yes|i want to|i\'d like to|i would like to)\s+(add|create)\s+(a\s+)?customer/i', $message)) {
            return self::showCreateForm('customers', 'create_customer');
        }
        
        // Create supplier patterns - show form directly
        if (preg_match('/(add|create|new|register)\s+(a\s+)?(new\s+)?supplier/i', $message) ||
            preg_match('/^let\'?s?\s+(add|create)\s+(a\s+)?supplier/i', $message) ||
            preg_match('/^(ok|okay|sure|yes|i want to|i\'d like to|i would like to)\s+(add|create)\s+(a\s+)?supplier/i', $message)) {
            return self::showCreateForm('suppliers', 'create_supplier');
        }
        
        // Create product patterns - show form directly
        if (preg_match('/(add|create|new|register)\s+(a\s+)?(new\s+)?product/i', $message) ||
            preg_match('/^let\'?s?\s+(add|create)\s+(a\s+)?product/i', $message) ||
            preg_match('/^(ok|okay|sure|yes|i want to|i\'d like to|i would like to)\s+(add|create)\s+(a\s+)?product/i', $message)) {
            return self::showCreateForm('inventory', 'create_product');
        }
        
        // Create expense patterns - show form directly
        if (preg_match('/(add|create|new|record)\s+(an?\s+)?(new\s+)?expense/i', $message) ||
            preg_match('/^let\'?s?\s+(add|record)\s+(an?\s+)?expense/i', $message) ||
            preg_match('/^(ok|okay|sure|yes|i want to|i\'d like to|i would like to)\s+(add|create|record)\s+(an?\s+)?expense/i', $message)) {
            return self::showCreateForm('expenses', 'create_expense');
        }
        
        // Edit/update patterns with conversational prefix
        if (preg_match('/(edit|update|modify|change)\s+(a\s+)?(my\s+)?customer/i', $message) ||
            preg_match('/^(ok|okay|sure|yes|i want to)\s+(edit|update|modify)\s+(a\s+)?customer/i', $message)) {
            FollowUpHandler::setLastTopic('customers');
            return ['type' => 'selection_needed', 'action' => 'update', 'module' => 'customers', 
                    'fullAction' => 'update_customer', 'entity' => 'customer', 
                    'message' => 'Which customer would you like to update?'];
        }
        
        if (preg_match('/(edit|update|modify|change)\s+(a\s+)?(my\s+)?product/i', $message) ||
            preg_match('/^(ok|okay|sure|yes|i want to)\s+(edit|update|modify)\s+(a\s+)?product/i', $message)) {
            FollowUpHandler::setLastTopic('products');
            return ['type' => 'selection_needed', 'action' => 'update', 'module' => 'inventory', 
                    'fullAction' => 'update_product', 'entity' => 'product', 
                    'message' => 'Which product would you like to update?'];
        }
        
        if (preg_match('/(edit|update|modify|change)\s+(a\s+)?(my\s+)?supplier/i', $message) ||
            preg_match('/^(ok|okay|sure|yes|i want to)\s+(edit|update|modify)\s+(a\s+)?supplier/i', $message)) {
            FollowUpHandler::setLastTopic('suppliers');
            return ['type' => 'selection_needed', 'action' => 'update', 'module' => 'suppliers', 
                    'fullAction' => 'update_supplier', 'entity' => 'supplier', 
                    'message' => 'Which supplier would you like to update?'];
        }
        
        // FALLBACK: Catch-all for entity mentions - handle gracefully
        // This prevents AI calls for ambiguous entity mentions like "hmmm, products"
        if (preg_match('/\b(customers?|products?|suppliers?)\b/i', $message, $matches)) {
            $entity = strtolower($matches[1]);
            $singularEntity = rtrim($entity, 's');
            
            // If there's a clear intent word, process it
            if (preg_match('/\b(show|list|view|see|display)\b/i', $message)) {
                FollowUpHandler::setLastTopic($singularEntity . 's');
                switch ($singularEntity) {
                    case 'customer':
                        return self::execute('customers', 'list_customers', [], $pdo, $companyId, $userId);
                    case 'product':
                        return self::execute('inventory', 'list_products', [], $pdo, $companyId, $userId);
                    case 'supplier':
                        return self::execute('suppliers', 'list_suppliers', [], $pdo, $companyId, $userId);
                }
            }
            
            // Set topic and ask what they want to do
            FollowUpHandler::setLastTopic($singularEntity . 's');
            return ResponseBuilder::clarification(
                "What would you like to do with {$singularEntity}s? For example:\n" .
                "• 'Show {$singularEntity}s' - view your list\n" .
                "• 'Add {$singularEntity}' - create a new one\n" .
                "• 'Edit {$singularEntity}' - update an existing one",
                []
            );
        }
        
        // Not a fast-path pattern
        return null;
    }
    
    // =========================================================================
    // BUSINESS INTELLIGENCE QUERIES
    // =========================================================================
    
    /**
     * Handle customer purchase queries
     * - "What did John buy?"
     * - "Show purchases by customer X"
     * - "What has Jane purchased this month?"
     */
    private static function tryCustomerPurchaseQuery(string $message, $pdo, int $companyId): ?array {
        $bi = new BusinessIntelligence($pdo, $companyId);
        
        // Pattern: "what did [customer] buy/purchase" or "show [customer]'s purchases"
        $patterns = [
            '/what\s+(did|has)\s+([a-z\s]+?)\s+(buy|bought|purchase|purchased|order|ordered)/i',
            '/show\s+([a-z\s]+?)(?:\'s)?\s+(purchases?|orders?|history)/i',
            '/([a-z\s]+?)(?:\'s)?\s+(purchase|order)\s+(history)/i',
            '/purchases?\s+(?:by|for|from)\s+([a-z\s]+)/i',
            '/what\s+products?\s+(?:did|has)\s+([a-z\s]+?)\s+(buy|bought|purchase)/i',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $message, $matches)) {
                // Extract customer name (position varies by pattern)
                $customerName = trim($matches[2] ?? $matches[1] ?? '');
                $customerName = preg_replace('/\s+(buy|bought|purchase|purchased).*$/i', '', $customerName);
                
                if (strlen($customerName) < 2) continue;
                
                // Find customer
                $customer = $bi->findCustomerByName($customerName);
                if (!$customer) {
                    return ResponseBuilder::assistant(
                        "🔍 I couldn't find a customer named \"{$customerName}\". Would you like to see your customer list?",
                        ['Show customers', 'Add new customer']
                    );
                }
                
                // Get date filter if specified
                $period = self::extractPeriod($message);
                $startDate = $period['start'] ?? null;
                $endDate = $period['end'] ?? null;
                
                // Get purchase history
                $purchases = $bi->getCustomerPurchaseHistory($customer['id'], $startDate, $endDate);
                $summary = $bi->getCustomerSpendingSummary($customer['id']);
                
                if (empty($purchases)) {
                    return ResponseBuilder::assistant(
                        "📊 **{$customer['name']}** hasn't made any purchases" . 
                        ($period['label'] ? " {$period['label']}" : " yet") . ".",
                        ['Show all customers', 'Create a sale']
                    );
                }
                
                // Format response
                $total = array_sum(array_column($purchases, 'total_price'));
                $periodLabel = $period['label'] ?? 'all time';
                
                $message = "📊 **{$customer['name']}**'s purchases ({$periodLabel}):\n\n";
                
                // Group by sale/invoice
                $groupedBySale = [];
                foreach ($purchases as $p) {
                    $saleId = $p['sale_id'];
                    if (!isset($groupedBySale[$saleId])) {
                        $groupedBySale[$saleId] = [
                            'date' => $p['sale_date'],
                            'invoice' => $p['invoice_number'],
                            'items' => []
                        ];
                    }
                    $groupedBySale[$saleId]['items'][] = [
                        'product' => $p['product_name'],
                        'qty' => $p['quantity'],
                        'price' => $p['unit_price'],
                        'total' => $p['total_price']
                    ];
                }
                
                foreach ($groupedBySale as $sale) {
                    $date = date('M j, Y', strtotime($sale['date']));
                    $message .= "**{$date}** (#{$sale['invoice']}):\n";
                    foreach ($sale['items'] as $item) {
                        $message .= "  • {$item['product']} × {$item['qty']} = " . 
                                   ResponseBuilder::formatCurrency($item['total']) . "\n";
                    }
                    $message .= "\n";
                }
                
                $message .= "💰 **Total Spent**: " . ResponseBuilder::formatCurrency($total);
                
                if ($summary && $summary['total_orders'] > 0) {
                    $message .= "\n📈 **Stats**: {$summary['total_orders']} orders, avg " . 
                               ResponseBuilder::formatCurrency($summary['avg_order_value'] ?? 0) . "/order";
                }
                
                return ResponseBuilder::dataReport($message, $purchases, [
                    'total_spent' => $total,
                    'order_count' => count($groupedBySale),
                    'customer_name' => $customer['name']
                ]);
            }
        }
        
        return null;
    }
    
    /**
     * Handle product inventory queries
     * - "How many iPhones remain?"
     * - "Show stock for Product X"
     * - "How many sold today?"
     * - "Low stock products"
     */
    private static function tryProductInventoryQuery(string $message, $pdo, int $companyId): ?array {
        $bi = new BusinessIntelligence($pdo, $companyId);
        
        // Low stock query
        if (preg_match('/low\s+stock|out\s+of\s+stock|stock\s+alert|need\s+to\s+restock/i', $message)) {
            $lowStock = $bi->getLowStockProducts();
            
            if (empty($lowStock)) {
                return ResponseBuilder::success(
                    "✅ Great news! All products have healthy stock levels.",
                    ['low_stock_count' => 0]
                );
            }
            
            $msg = "⚠️ **Products needing attention** ({$lowStock[0]['alert']}):\n\n";
            foreach ($lowStock as $product) {
                $msg .= "• **{$product['name']}**: {$product['current_stock']} {$product['unit']} remaining";
                if ($product['current_stock'] <= 0) {
                    $msg .= " 🔴";
                }
                $msg .= "\n";
            }
            
            return ResponseBuilder::dataReport($msg, $lowStock, [
                'low_stock_count' => count($lowStock)
            ]);
        }
        
        // Stock level for specific product
        $stockPatterns = [
            '/how\s+many\s+([a-z\s]+?)\s+(remain|remaining|left|in\s+stock|do\s+i\s+have)/i',
            '/stock\s+(?:level\s+)?(?:for|of)\s+([a-z\s]+)/i',
            '/([a-z\s]+?)\s+stock\s+level/i',
            '/check\s+stock\s+(?:for|of)?\s*([a-z\s]+)/i',
        ];
        
        foreach ($stockPatterns as $pattern) {
            if (preg_match($pattern, $message, $matches)) {
                $productName = trim($matches[1]);
                if (strlen($productName) < 2) continue;
                
                $product = $bi->findProductByName($productName);
                if (!$product) {
                    return ResponseBuilder::assistant(
                        "🔍 I couldn't find a product named \"{$productName}\". Would you like to see your product list?",
                        ['Show products', 'Add new product']
                    );
                }
                
                $stock = $bi->getProductStock($product['id']);
                
                $emoji = $stock['status'] === 'out_of_stock' ? '🔴' : 
                        ($stock['status'] === 'low_stock' ? '🟡' : '🟢');
                
                $msg = "{$emoji} **{$stock['name']}**\n\n";
                $msg .= "📦 **Current Stock**: {$stock['current_stock']} {$stock['unit']}\n";
                $msg .= "📉 **Min Level**: {$stock['min_stock_level']} {$stock['unit']}\n";
                $msg .= "📊 **Status**: " . ucwords(str_replace('_', ' ', $stock['status']));
                
                return ResponseBuilder::insight($msg, $stock);
            }
        }
        
        // Sales of specific product
        $salesPatterns = [
            '/how\s+many\s+([a-z\s]+?)\s+(sold|were\s+sold)\s*(today|this\s+week|this\s+month)?/i',
            '/([a-z\s]+?)\s+sales?\s+(today|this\s+week|this\s+month)/i',
        ];
        
        foreach ($salesPatterns as $pattern) {
            if (preg_match($pattern, $message, $matches)) {
                $productName = trim($matches[1]);
                $period = trim($matches[3] ?? $matches[2] ?? 'today');
                
                // Normalize period
                $period = str_replace(' ', '_', strtolower($period));
                if (!in_array($period, ['today', 'this_week', 'this_month', 'yesterday'])) {
                    $period = 'today';
                }
                
                if (strlen($productName) < 2) continue;
                
                $product = $bi->findProductByName($productName);
                if (!$product) {
                    return ResponseBuilder::assistant(
                        "🔍 I couldn't find a product named \"{$productName}\".",
                        ['Show products']
                    );
                }
                
                $sales = $bi->getProductSales($product['id'], $period);
                $periodLabel = str_replace('_', ' ', $period);
                
                $msg = "📊 **{$sales['product_name']}** - Sales ({$periodLabel})\n\n";
                $msg .= "🛒 **Quantity Sold**: {$sales['quantity_sold']}\n";
                $msg .= "💰 **Revenue**: " . ResponseBuilder::formatCurrency($sales['revenue']) . "\n";
                $msg .= "📋 **Orders**: {$sales['order_count']}";
                
                return ResponseBuilder::insight($msg, $sales);
            }
        }
        
        return null;
    }
    
    /**
     * Handle sales analytics queries
     * - "Sales today"
     * - "Top selling products"
     * - "Best customers"
     */
    private static function trySalesAnalyticsQuery(string $message, $pdo, int $companyId): ?array {
        $bi = new BusinessIntelligence($pdo, $companyId);
        
        // Top selling products
        if (preg_match('/top\s+(selling|sold)\s+products?|best\s+selling|popular\s+products?/i', $message)) {
            $period = self::extractPeriod($message);
            $topProducts = $bi->getTopSellingProducts($period['key'] ?? 'all_time', 10);
            
            if (empty($topProducts)) {
                return ResponseBuilder::assistant(
                    "📊 No sales data found" . ($period['label'] ? " for {$period['label']}" : "") . ". Start selling to see analytics!",
                    ['Create a sale']
                );
            }
            
            $periodLabel = $period['label'] ?? 'all time';
            $msg = "🏆 **Top Selling Products** ({$periodLabel})\n\n";
            
            foreach ($topProducts as $i => $product) {
                $rank = $i + 1;
                $msg .= "**{$rank}. {$product['name']}**\n";
                $msg .= "   📦 Sold: {$product['quantity_sold']} units\n";
                $msg .= "   💰 Revenue: " . ResponseBuilder::formatCurrency($product['revenue']) . "\n\n";
            }
            
            return ResponseBuilder::dataReport($msg, $topProducts);
        }
        
        // Top customers
        if (preg_match('/top\s+customers?|best\s+customers?|biggest\s+(buyers?|spenders?)/i', $message)) {
            $period = self::extractPeriod($message);
            $topCustomers = $bi->getTopCustomers($period['key'] ?? 'all_time', 10);
            
            if (empty($topCustomers)) {
                return ResponseBuilder::assistant(
                    "📊 No customer sales data found. Start selling to see who your best customers are!",
                    ['Create a sale', 'Add customer']
                );
            }
            
            $periodLabel = $period['label'] ?? 'all time';
            $msg = "🏆 **Top Customers** ({$periodLabel})\n\n";
            
            foreach ($topCustomers as $i => $customer) {
                $rank = $i + 1;
                $msg .= "**{$rank}. {$customer['name']}**\n";
                $msg .= "   🛒 Orders: {$customer['order_count']}\n";
                $msg .= "   💰 Total: " . ResponseBuilder::formatCurrency($customer['total_spent']) . "\n\n";
            }
            
            return ResponseBuilder::dataReport($msg, $topCustomers);
        }
        
        // Sales summary
        if (preg_match('/sales?\s+(today|this\s+week|this\s+month|yesterday|summary|report)/i', $message, $matches)) {
            $period = strtolower(str_replace(' ', '_', trim($matches[1])));
            if ($period === 'summary' || $period === 'report') {
                $period = 'today';
            }
            
            $summary = $bi->getSalesSummary($period);
            $periodLabel = str_replace('_', ' ', $period);
            
            $msg = "📊 **Sales Summary** ({$periodLabel})\n\n";
            $msg .= "🧾 **Total Sales**: {$summary['total_sales']}\n";
            $msg .= "💰 **Total Revenue**: " . ResponseBuilder::formatCurrency($summary['total_revenue']) . "\n";
            $msg .= "📈 **Average Sale**: " . ResponseBuilder::formatCurrency($summary['avg_sale_value']) . "\n";
            $msg .= "👥 **Unique Customers**: {$summary['unique_customers']}";
            
            return ResponseBuilder::insight($msg, $summary);
        }
        
        return null;
    }
    
    /**
     * Extract time period from message
     */
    private static function extractPeriod(string $message): array {
        $periods = [
            'today' => ['key' => 'today', 'label' => 'today', 'start' => date('Y-m-d'), 'end' => date('Y-m-d')],
            'yesterday' => ['key' => 'yesterday', 'label' => 'yesterday', 'start' => date('Y-m-d', strtotime('-1 day')), 'end' => date('Y-m-d', strtotime('-1 day'))],
            'this week' => ['key' => 'this_week', 'label' => 'this week', 'start' => date('Y-m-d', strtotime('monday this week')), 'end' => date('Y-m-d')],
            'last week' => ['key' => 'last_week', 'label' => 'last week', 'start' => date('Y-m-d', strtotime('monday last week')), 'end' => date('Y-m-d', strtotime('sunday last week'))],
            'this month' => ['key' => 'this_month', 'label' => 'this month', 'start' => date('Y-m-01'), 'end' => date('Y-m-d')],
            'last month' => ['key' => 'last_month', 'label' => 'last month', 'start' => date('Y-m-01', strtotime('first day of last month')), 'end' => date('Y-m-t', strtotime('last month'))],
            'this year' => ['key' => 'this_year', 'label' => 'this year', 'start' => date('Y-01-01'), 'end' => date('Y-m-d')],
        ];
        
        foreach ($periods as $key => $data) {
            if (stripos($message, $key) !== false) {
                return $data;
            }
        }
        
        return ['key' => 'all_time', 'label' => null, 'start' => null, 'end' => null];
    }
    
    /**
     * Show create form for an entity
     */
    private static function showCreateForm(string $module, string $action): array {
        switch ($action) {
            case 'create_customer':
                $formConfig = FormBuilder::buildCustomerForm([]);
                return ResponseBuilder::form(
                    "Let's create a customer! Please fill in the details below:",
                    $formConfig,
                    $action,
                    $module
                );
            case 'create_supplier':
                $formConfig = FormBuilder::buildSupplierForm([]);
                return ResponseBuilder::form(
                    "Let's add a supplier! Please fill in the details below:",
                    $formConfig,
                    $action,
                    $module
                );
            case 'create_product':
                $formConfig = FormBuilder::buildProductForm([]);
                return ResponseBuilder::form(
                    "Let's create a product! Please fill in the details below:",
                    $formConfig,
                    $action,
                    $module
                );
            case 'create_expense':
                $formConfig = FormBuilder::buildExpenseForm([]);
                return ResponseBuilder::form(
                    "Let's record an expense! Please fill in the details below:",
                    $formConfig,
                    $action,
                    $module
                );
            default:
                return ResponseBuilder::assistant("I can help you create something. What would you like to create?");
        }
    }
    
    /**
     * Execute data query
     */
    public static function execute(string $module, string $action, array $data, $pdo, int $companyId, int $userId): array {
        $executor = new TaskExecutor($pdo, $companyId, $userId);
        
        $result = $executor->execute([
            'module' => $module,
            'action' => $action,
            'data' => $data
        ], $data);
        
        if ($result['success']) {
            return ResponseBuilder::success($result['message'], $result['data'] ?? []);
        }
        
        return ResponseBuilder::error($result['error'] ?? 'Query failed');
    }
    
    /**
     * Check if message is a greeting
     */
    private static function isGreeting(string $message): bool {
        // Exact match greetings
        $exactGreetings = [
            'hi', 'hello', 'hey', 'yo', 'sup', 'howdy', 'greetings'
        ];
        
        // Prefix greetings (must be followed by space or end of string)
        $prefixGreetings = [
            'good morning', 'good afternoon', 'good evening',
            'hi there', 'hello there', 'hey there'
        ];
        
        // Check exact matches
        if (in_array($message, $exactGreetings, true)) {
            return true;
        }
        
        // Check prefix matches
        foreach ($prefixGreetings as $greeting) {
            if ($message === $greeting || strpos($message, $greeting . ' ') === 0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if message is a help request
     */
    private static function isHelpRequest(string $message): bool {
        // First check for common conversational phrases that are NOT help requests
        $notHelpPatterns = ['how are you', 'how do you do', 'nice to meet you', 'what did', 'what has'];
        foreach ($notHelpPatterns as $pattern) {
            if (strpos($message, $pattern) !== false) {
                return false;
            }
        }
        
        $helpPatterns = [
            'help', 'what can you do', 'what do you do',
            'how can you help', 'what are your capabilities',
            'show capabilities', 'list capabilities',
            'commands', 'what commands',
            'tell me what you can do', 'tell me what u can do',
            'tell me the things you can do', 'tell me the things u can do',
            'what are the things you can do', 'what are the things u can do',
            'list things you can do', 'list things u can do',
            'show me what you can do', 'show me what u can do',
            'what can i do', 'what can i ask', 'what features',
            'list of things', 'what are you capable of',
            'show me your features', 'tell me your features',
            'things you can do', 'things u can do'
        ];
        
        // Only match single '?' if it's the entire message (not part of a question)
        if (trim($message) === '?') {
            return true;
        }
        
        foreach ($helpPatterns as $pattern) {
            if ($message === $pattern || strpos($message, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get help response
     */
    private static function getHelpResponse(): array {
        // Mark this as a capability_offer context - NOT actionable without more input
        // We use a special marker so handleAffirmative knows to ask what they want
        $offeredActions = [
            ['type' => 'capability_offer', 'module' => null, 'action' => null]
        ];
        WorldState::setLastOfferedActions($offeredActions);
        
        return ResponseBuilder::capabilityOffer(
            "📚 Here's what I can help you with:",
            [
                [
                    'category' => '👥 Customers',
                    'commands' => [
                        'Create/update/delete customer',
                        'Show my customers',
                        '"What did John buy?"',
                        '"John\'s purchase history this month"',
                        'Top customers'
                    ]
                ],
                [
                    'category' => '📦 Products & Inventory',
                    'commands' => [
                        'Create/update/delete product',
                        '"How many iPhones remain?"',
                        '"How many sold today?"',
                        'Low stock products',
                        'Top selling products'
                    ]
                ],
                [
                    'category' => '💰 Sales & Analytics',
                    'commands' => [
                        'Sales today/this week/this month',
                        'Best customers',
                        'Top selling products',
                        'Revenue report'
                    ]
                ],
                [
                    'category' => '🏭 Suppliers & Expenses',
                    'commands' => [
                        'Add/update supplier',
                        'Record an expense',
                        'Show my expenses'
                    ]
                ]
            ]
        );
    }
    
    /**
     * Get count response
     */
    private static function getCountResponse(string $entity, $pdo, int $companyId): array {
        $entity = rtrim(strtolower($entity), 's') . 's'; // Normalize to plural
        
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM {$entity} WHERE company_id = ?");
            $stmt->execute([$companyId]);
            $count = $stmt->fetchColumn();
            
            $singular = rtrim($entity, 's');
            $label = $count == 1 ? $singular : $entity;
            
            return ResponseBuilder::success(
                "You have **{$count}** {$label}.",
                ['count' => $count, 'entity' => $entity]
            );
        } catch (\Exception $e) {
            return ResponseBuilder::error("Couldn't count {$entity}.");
        }
    }
}
