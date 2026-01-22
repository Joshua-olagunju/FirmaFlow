<?php
/**
 * TASK EXECUTOR MODULE
 * 
 * Executes validated tasks by delegating to appropriate handlers.
 * 
 * This module is the bridge between the orchestrator and domain handlers.
 * It handles the actual execution of create, update, delete, list operations.
 */

namespace FirmaFlow\AIOrchestrator;

class TaskExecutor {
    
    private $pdo;
    private $companyId;
    private $userId;
    
    public function __construct($pdo, $companyId, $userId) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
        $this->userId = $userId;
    }
    
    /**
     * Execute a task
     * 
     * Routes to appropriate handler based on module/action.
     * Returns standardized result format.
     */
    public function execute(array $task, array $data): array {
        $module = $task['module'];
        $action = $task['action'];
        
        try {
            // Route to appropriate handler
            switch ($module) {
                case 'customers':
                    return $this->executeCustomerAction($action, $data);
                    
                case 'suppliers':
                    return $this->executeSupplierAction($action, $data);
                    
                case 'inventory':
                    return $this->executeInventoryAction($action, $data);
                    
                case 'sales':
                    return $this->executeSalesAction($action, $data);
                    
                case 'purchases':
                    return $this->executePurchasesAction($action, $data);
                    
                case 'expenses':
                    return $this->executeExpensesAction($action, $data);
                    
                case 'reports':
                    return $this->executeReportsAction($action, $data);
                    
                default:
                    return [
                        'success' => false,
                        'error' => "Unknown module: {$module}"
                    ];
            }
            
        } catch (\Exception $e) {
            error_log("TaskExecutor error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Execute customer actions
     */
    private function executeCustomerAction(string $action, array $data): array {
        switch ($action) {
            case 'create_customer':
                return $this->createCustomer($data);
                
            case 'list_customers':
                return $this->listCustomers($data);
                
            case 'update_customer':
                return $this->updateCustomer($data);
                
            case 'delete_customer':
                return $this->deleteCustomer($data);
                
            case 'search_customer':
                return $this->searchCustomers($data);
                
            default:
                return ['success' => false, 'error' => "Unknown customer action: {$action}"];
        }
    }
    
    /**
     * Create customer
     */
    private function createCustomer(array $data): array {
        $name = $data['name'] ?? $data['customer_name'] ?? null;
        
        if (!$name) {
            return ['success' => false, 'error' => 'Customer name is required'];
        }
        
        $stmt = $this->pdo->prepare("
            INSERT INTO customers (company_id, name, email, phone, address, city, tax_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $this->companyId,
            $name,
            $data['email'] ?? null,
            $data['phone'] ?? null,
            $data['address'] ?? null,
            $data['city'] ?? null,
            $data['tax_id'] ?? null
        ]);
        
        $id = $this->pdo->lastInsertId();
        
        return [
            'success' => true,
            'message' => "✅ Customer '{$name}' created successfully!",
            'data' => [
                'id' => $id,
                'name' => $name,
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null
            ]
        ];
    }
    
    /**
     * List customers
     */
    private function listCustomers(array $data): array {
        $limit = min($data['limit'] ?? 20, 100);
        $search = $data['search'] ?? null;
        
        $sql = "SELECT id, name, email, phone, customer_type FROM customers WHERE company_id = ?";
        $params = [$this->companyId];
        
        if ($search) {
            $sql .= " AND (name LIKE ? OR email LIKE ?)";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }
        
        $sql .= " ORDER BY name LIMIT " . intval($limit);
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $customers = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        if (empty($customers)) {
            // Track for follow-up
            WorldState::setLastOfferedActions([
                ['type' => 'create', 'module' => 'customers', 'action' => 'create_customer', 
                 'description' => 'Create a new customer']
            ]);
            
            return [
                'success' => true,
                'message' => "No customers found. Would you like to add one?",
                'data' => ['customers' => [], 'count' => 0]
            ];
        }
        
        // Track for follow-up
        WorldState::setLastOfferedActions([
            ['type' => 'create', 'module' => 'customers', 'action' => 'create_customer',
             'description' => 'Add a new customer']
        ]);
        
        return [
            'success' => true,
            'message' => "Found " . count($customers) . " customer(s):",
            'data' => [
                'customers' => $customers,
                'count' => count($customers),
                'displayType' => 'table'
            ]
        ];
    }
    
    /**
     * Update customer
     */
    private function updateCustomer(array $data): array {
        $id = $data['customer_id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            return ['success' => false, 'error' => 'Customer ID is required'];
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'email', 'phone', 'address', 'city', 'tax_id'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                $updateFields[] = "{$field} = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            return ['success' => false, 'error' => 'No fields to update'];
        }
        
        $params[] = $id;
        $params[] = $this->companyId;
        
        $sql = "UPDATE customers SET " . implode(', ', $updateFields) . 
               ", updated_at = NOW() WHERE id = ? AND company_id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            return ['success' => false, 'error' => 'Customer not found'];
        }
        
        return [
            'success' => true,
            'message' => "✅ Customer updated successfully!",
            'data' => ['id' => $id]
        ];
    }
    
    /**
     * Delete customer
     */
    private function deleteCustomer(array $data): array {
        $id = $data['customer_id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            return ['success' => false, 'error' => 'Customer ID is required'];
        }
        
        // Check for related records
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) FROM sales WHERE customer_id = ? AND company_id = ?
        ");
        $stmt->execute([$id, $this->companyId]);
        $salesCount = $stmt->fetchColumn();
        
        if ($salesCount > 0) {
            return [
                'success' => false, 
                'error' => "Cannot delete customer: {$salesCount} related sale(s) exist"
            ];
        }
        
        $stmt = $this->pdo->prepare("
            DELETE FROM customers WHERE id = ? AND company_id = ?
        ");
        $stmt->execute([$id, $this->companyId]);
        
        if ($stmt->rowCount() === 0) {
            return ['success' => false, 'error' => 'Customer not found'];
        }
        
        return [
            'success' => true,
            'message' => "✅ Customer deleted successfully!"
        ];
    }
    
    /**
     * Search customers
     */
    private function searchCustomers(array $data): array {
        $search = $data['search'] ?? $data['query'] ?? $data['name'] ?? '';
        
        $stmt = $this->pdo->prepare("
            SELECT id, name, email, phone 
            FROM customers 
            WHERE company_id = ? AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
            ORDER BY name
            LIMIT 10
        ");
        $stmt->execute([
            $this->companyId,
            "%{$search}%",
            "%{$search}%",
            "%{$search}%"
        ]);
        
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'message' => "Found " . count($results) . " matching customer(s)",
            'data' => ['customers' => $results, 'count' => count($results)]
        ];
    }
    
    /**
     * Execute supplier actions
     */
    private function executeSupplierAction(string $action, array $data): array {
        switch ($action) {
            case 'create_supplier':
                return $this->createSupplier($data);
            case 'list_suppliers':
                return $this->listSuppliers($data);
            case 'update_supplier':
                return $this->updateSupplier($data);
            case 'delete_supplier':
                return $this->deleteSupplier($data);
            default:
                return ['success' => false, 'error' => "Unknown supplier action: {$action}"];
        }
    }
    
    /**
     * Create supplier
     */
    private function createSupplier(array $data): array {
        $name = $data['name'] ?? $data['supplier_name'] ?? null;
        
        if (!$name) {
            return ['success' => false, 'error' => 'Supplier name is required'];
        }
        
        $stmt = $this->pdo->prepare("
            INSERT INTO suppliers (company_id, name, email, phone, address, contact_person, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $this->companyId,
            $name,
            $data['email'] ?? null,
            $data['phone'] ?? null,
            $data['address'] ?? null,
            $data['contact_person'] ?? null
        ]);
        
        return [
            'success' => true,
            'message' => "✅ Supplier '{$name}' created successfully!",
            'data' => ['id' => $this->pdo->lastInsertId(), 'name' => $name]
        ];
    }
    
    /**
     * List suppliers
     */
    private function listSuppliers(array $data): array {
        $limit = min($data['limit'] ?? 20, 100);
        
        $stmt = $this->pdo->prepare("
            SELECT id, name, email, phone, contact_person 
            FROM suppliers WHERE company_id = ?
            ORDER BY name LIMIT " . intval($limit) . "
        ");
        $stmt->execute([$this->companyId]);
        $suppliers = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        if (empty($suppliers)) {
            WorldState::setLastOfferedActions([
                ['type' => 'create', 'module' => 'suppliers', 'action' => 'create_supplier',
                 'description' => 'Create a new supplier']
            ]);
            
            return [
                'success' => true,
                'message' => "No suppliers found. Would you like to add one?",
                'data' => ['suppliers' => [], 'count' => 0]
            ];
        }
        
        return [
            'success' => true,
            'message' => "Found " . count($suppliers) . " supplier(s):",
            'data' => ['suppliers' => $suppliers, 'count' => count($suppliers), 'displayType' => 'table']
        ];
    }
    
    /**
     * Update supplier
     */
    private function updateSupplier(array $data): array {
        $id = $data['supplier_id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            return ['success' => false, 'error' => 'Supplier ID is required'];
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'email', 'phone', 'address', 'contact_person'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                $updateFields[] = "{$field} = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            return ['success' => false, 'error' => 'No fields to update'];
        }
        
        $params[] = $id;
        $params[] = $this->companyId;
        
        $sql = "UPDATE suppliers SET " . implode(', ', $updateFields) . 
               ", updated_at = NOW() WHERE id = ? AND company_id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return [
            'success' => true,
            'message' => "✅ Supplier updated successfully!",
            'data' => ['id' => $id]
        ];
    }
    
    /**
     * Delete supplier
     */
    private function deleteSupplier(array $data): array {
        $id = $data['supplier_id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            return ['success' => false, 'error' => 'Supplier ID is required'];
        }
        
        $stmt = $this->pdo->prepare("DELETE FROM suppliers WHERE id = ? AND company_id = ?");
        $stmt->execute([$id, $this->companyId]);
        
        return [
            'success' => true,
            'message' => "✅ Supplier deleted successfully!"
        ];
    }
    
    /**
     * Execute inventory actions
     */
    private function executeInventoryAction(string $action, array $data): array {
        switch ($action) {
            case 'create_product':
                return $this->createProduct($data);
            case 'list_products':
                return $this->listProducts($data);
            case 'update_product':
                return $this->updateProduct($data);
            case 'delete_product':
                return $this->deleteProduct($data);
            case 'check_stock':
                return $this->checkStock($data);
            default:
                return ['success' => false, 'error' => "Unknown inventory action: {$action}"];
        }
    }
    
    /**
     * Create product
     */
    private function createProduct(array $data): array {
        $name = $data['name'] ?? $data['product_name'] ?? null;
        
        if (!$name) {
            return ['success' => false, 'error' => 'Product name is required'];
        }
        
        $stmt = $this->pdo->prepare("
            INSERT INTO products (company_id, name, sku, price, cost, quantity, category, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $this->companyId,
            $name,
            $data['sku'] ?? null,
            $data['price'] ?? 0,
            $data['cost'] ?? 0,
            $data['quantity'] ?? 0,
            $data['category'] ?? null
        ]);
        
        return [
            'success' => true,
            'message' => "✅ Product '{$name}' created successfully!",
            'data' => ['id' => $this->pdo->lastInsertId(), 'name' => $name]
        ];
    }
    
    /**
     * List products
     */
    private function listProducts(array $data): array {
        $limit = min($data['limit'] ?? 20, 100);
        
        $stmt = $this->pdo->prepare("
            SELECT id, name, sku, selling_price as price, stock_quantity as quantity 
            FROM products WHERE company_id = ?
            ORDER BY name LIMIT " . intval($limit) . "
        ");
        $stmt->execute([$this->companyId]);
        $products = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        if (empty($products)) {
            WorldState::setLastOfferedActions([
                ['type' => 'create', 'module' => 'inventory', 'action' => 'create_product',
                 'description' => 'Add a new product']
            ]);
            
            return [
                'success' => true,
                'message' => "No products found. Would you like to add one?",
                'data' => ['products' => [], 'count' => 0]
            ];
        }
        
        return [
            'success' => true,
            'message' => "Found " . count($products) . " product(s):",
            'data' => ['products' => $products, 'count' => count($products), 'displayType' => 'table']
        ];
    }
    
    /**
     * Update product
     */
    private function updateProduct(array $data): array {
        $id = $data['product_id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            return ['success' => false, 'error' => 'Product ID is required'];
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'sku', 'price', 'cost', 'quantity', 'category'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "{$field} = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            return ['success' => false, 'error' => 'No fields to update'];
        }
        
        $params[] = $id;
        $params[] = $this->companyId;
        
        $sql = "UPDATE products SET " . implode(', ', $updateFields) . 
               ", updated_at = NOW() WHERE id = ? AND company_id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return [
            'success' => true,
            'message' => "✅ Product updated successfully!",
            'data' => ['id' => $id]
        ];
    }
    
    /**
     * Delete product
     */
    private function deleteProduct(array $data): array {
        $id = $data['product_id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            return ['success' => false, 'error' => 'Product ID is required'];
        }
        
        $stmt = $this->pdo->prepare("DELETE FROM products WHERE id = ? AND company_id = ?");
        $stmt->execute([$id, $this->companyId]);
        
        return [
            'success' => true,
            'message' => "✅ Product deleted successfully!"
        ];
    }
    
    /**
     * Check stock levels
     */
    private function checkStock(array $data): array {
        $lowStockThreshold = $data['threshold'] ?? 10;
        
        $stmt = $this->pdo->prepare("
            SELECT name, quantity, sku 
            FROM products 
            WHERE company_id = ? AND quantity <= ?
            ORDER BY quantity ASC
        ");
        $stmt->execute([$this->companyId, $lowStockThreshold]);
        $lowStock = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        if (empty($lowStock)) {
            return [
                'success' => true,
                'message' => "All products have adequate stock levels! 📦",
                'data' => ['lowStockItems' => []]
            ];
        }
        
        return [
            'success' => true,
            'message' => "⚠️ " . count($lowStock) . " product(s) have low stock:",
            'data' => ['lowStockItems' => $lowStock, 'displayType' => 'table']
        ];
    }
    
    /**
     * Execute sales actions
     */
    private function executeSalesAction(string $action, array $data): array {
        switch ($action) {
            case 'list_sales':
                return $this->listSales($data);
            case 'view_sale':
                return $this->viewSale($data);
            default:
                return ['success' => false, 'error' => "Unknown sales action: {$action}"];
        }
    }
    
    /**
     * List sales
     */
    private function listSales(array $data): array {
        $limit = min($data['limit'] ?? 20, 100);
        
        $stmt = $this->pdo->prepare("
            SELECT s.id, s.invoice_number, c.name as customer_name, 
                   s.total_amount, s.sale_date, s.status
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.company_id = ?
            ORDER BY s.sale_date DESC
            LIMIT " . intval($limit) . "
        ");
        $stmt->execute([$this->companyId]);
        $sales = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        if (empty($sales)) {
            return [
                'success' => true,
                'message' => "No sales found.",
                'data' => ['sales' => [], 'count' => 0]
            ];
        }
        
        return [
            'success' => true,
            'message' => "Found " . count($sales) . " sale(s):",
            'data' => ['sales' => $sales, 'count' => count($sales), 'displayType' => 'table']
        ];
    }
    
    /**
     * View sale details
     */
    private function viewSale(array $data): array {
        $id = $data['sale_id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            return ['success' => false, 'error' => 'Sale ID is required'];
        }
        
        $stmt = $this->pdo->prepare("
            SELECT s.*, c.name as customer_name
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ? AND s.company_id = ?
        ");
        $stmt->execute([$id, $this->companyId]);
        $sale = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$sale) {
            return ['success' => false, 'error' => 'Sale not found'];
        }
        
        return [
            'success' => true,
            'message' => "Sale #{$sale['invoice_number']} details:",
            'data' => ['sale' => $sale]
        ];
    }
    
    /**
     * Execute purchases actions
     */
    private function executePurchasesAction(string $action, array $data): array {
        switch ($action) {
            case 'list_purchases':
                return $this->listPurchases($data);
            default:
                return ['success' => false, 'error' => "Unknown purchases action: {$action}"];
        }
    }
    
    /**
     * List purchases
     */
    private function listPurchases(array $data): array {
        $limit = min($data['limit'] ?? 20, 100);
        
        $stmt = $this->pdo->prepare("
            SELECT p.id, p.purchase_number, s.name as supplier_name, 
                   p.total_amount, p.purchase_date, p.status
            FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.company_id = ?
            ORDER BY p.purchase_date DESC
            LIMIT " . intval($limit) . "
        ");
        $stmt->execute([$this->companyId]);
        $purchases = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'message' => "Found " . count($purchases) . " purchase(s):",
            'data' => ['purchases' => $purchases, 'count' => count($purchases), 'displayType' => 'table']
        ];
    }
    
    /**
     * Execute expenses actions
     */
    private function executeExpensesAction(string $action, array $data): array {
        switch ($action) {
            case 'create_expense':
                return $this->createExpense($data);
            case 'list_expenses':
                return $this->listExpenses($data);
            default:
                return ['success' => false, 'error' => "Unknown expenses action: {$action}"];
        }
    }
    
    /**
     * Create expense
     */
    private function createExpense(array $data): array {
        $description = $data['description'] ?? null;
        $amount = $data['amount'] ?? null;
        
        if (!$description || !$amount) {
            return ['success' => false, 'error' => 'Description and amount are required'];
        }
        
        $stmt = $this->pdo->prepare("
            INSERT INTO expenses (company_id, description, amount, category, expense_date, vendor, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $this->companyId,
            $description,
            $amount,
            $data['category'] ?? 'General',
            $data['date'] ?? $data['expense_date'] ?? date('Y-m-d'),
            $data['vendor'] ?? null
        ]);
        
        return [
            'success' => true,
            'message' => "✅ Expense of {$amount} for '{$description}' recorded!",
            'data' => ['id' => $this->pdo->lastInsertId()]
        ];
    }
    
    /**
     * List expenses
     */
    private function listExpenses(array $data): array {
        $limit = min($data['limit'] ?? 20, 100);
        
        $stmt = $this->pdo->prepare("
            SELECT id, description, amount, category, expense_date, vendor
            FROM expenses WHERE company_id = ?
            ORDER BY expense_date DESC
            LIMIT " . intval($limit) . "
        ");
        $stmt->execute([$this->companyId]);
        $expenses = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'message' => "Found " . count($expenses) . " expense(s):",
            'data' => ['expenses' => $expenses, 'count' => count($expenses), 'displayType' => 'table']
        ];
    }
    
    /**
     * Execute reports actions
     */
    private function executeReportsAction(string $action, array $data): array {
        switch ($action) {
            case 'sales_report':
                return $this->salesReport($data);
            case 'expense_report':
                return $this->expenseReport($data);
            case 'profit_loss':
                return $this->profitLossReport($data);
            default:
                return ['success' => false, 'error' => "Unknown report: {$action}"];
        }
    }
    
    /**
     * Sales report
     */
    private function salesReport(array $data): array {
        $startDate = $data['start_date'] ?? date('Y-m-01');
        $endDate = $data['end_date'] ?? date('Y-m-d');
        
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(*) as total_sales,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_sale
            FROM sales
            WHERE company_id = ? AND sale_date BETWEEN ? AND ?
        ");
        $stmt->execute([$this->companyId, $startDate, $endDate]);
        $summary = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'message' => "📊 Sales Report ({$startDate} to {$endDate})",
            'data' => [
                'summary' => $summary,
                'period' => ['start' => $startDate, 'end' => $endDate]
            ]
        ];
    }
    
    /**
     * Expense report
     */
    private function expenseReport(array $data): array {
        $startDate = $data['start_date'] ?? date('Y-m-01');
        $endDate = $data['end_date'] ?? date('Y-m-d');
        
        $stmt = $this->pdo->prepare("
            SELECT 
                category,
                COUNT(*) as count,
                SUM(amount) as total
            FROM expenses
            WHERE company_id = ? AND expense_date BETWEEN ? AND ?
            GROUP BY category
            ORDER BY total DESC
        ");
        $stmt->execute([$this->companyId, $startDate, $endDate]);
        $byCategory = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $total = array_sum(array_column($byCategory, 'total'));
        
        return [
            'success' => true,
            'message' => "📊 Expense Report ({$startDate} to {$endDate})",
            'data' => [
                'byCategory' => $byCategory,
                'total' => $total,
                'period' => ['start' => $startDate, 'end' => $endDate]
            ]
        ];
    }
    
    /**
     * Profit/Loss report
     */
    private function profitLossReport(array $data): array {
        $startDate = $data['start_date'] ?? date('Y-m-01');
        $endDate = $data['end_date'] ?? date('Y-m-d');
        
        // Revenue
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(SUM(total_amount), 0) as revenue
            FROM sales
            WHERE company_id = ? AND sale_date BETWEEN ? AND ?
        ");
        $stmt->execute([$this->companyId, $startDate, $endDate]);
        $revenue = $stmt->fetchColumn();
        
        // Expenses
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(SUM(amount), 0) as expenses
            FROM expenses
            WHERE company_id = ? AND expense_date BETWEEN ? AND ?
        ");
        $stmt->execute([$this->companyId, $startDate, $endDate]);
        $expenses = $stmt->fetchColumn();
        
        $profit = $revenue - $expenses;
        
        return [
            'success' => true,
            'message' => "📊 Profit & Loss ({$startDate} to {$endDate})",
            'data' => [
                'revenue' => $revenue,
                'expenses' => $expenses,
                'profit' => $profit,
                'isProfitable' => $profit > 0,
                'period' => ['start' => $startDate, 'end' => $endDate]
            ]
        ];
    }
    
    /**
     * Fetch entity by type and ID
     */
    public function fetchEntity(string $type, int $id): ?array {
        $table = $type . 's';
        
        $stmt = $this->pdo->prepare("SELECT * FROM {$table} WHERE id = ? AND company_id = ?");
        $stmt->execute([$id, $this->companyId]);
        
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }
    
    /**
     * Fetch entity list for selection
     */
    public function fetchEntityList(string $type, int $limit = 20): array {
        $table = $type . 's';
        
        $stmt = $this->pdo->prepare("
            SELECT id, name FROM {$table} 
            WHERE company_id = ?
            ORDER BY name
            LIMIT " . intval($limit) . "
        ");
        $stmt->execute([$this->companyId]);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
