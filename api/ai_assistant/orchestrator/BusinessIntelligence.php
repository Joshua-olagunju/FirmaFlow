<?php
/**
 * BUSINESS INTELLIGENCE MODULE
 * 
 * Handles advanced queries about business data:
 * - Customer purchase history
 * - Product inventory status
 * - Sales analytics
 * - Financial insights
 * 
 * JEPA Integration: This module provides the "world understanding" for
 * business metrics, enabling the AI to answer complex questions.
 * 
 * DATABASE SCHEMA:
 * - products: stock_quantity, reorder_level
 * - sales_invoices: invoice_no, invoice_date, customer_id, total
 * - sales_invoice_lines: invoice_id, product_id, quantity, unit_price, line_total
 * - customers: name, email, phone
 */

namespace FirmaFlow\AIOrchestrator;

class BusinessIntelligence {
    
    private $pdo;
    private $companyId;
    
    public function __construct($pdo, int $companyId) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
    }
    
    // =========================================================================
    // CUSTOMER QUERIES
    // =========================================================================
    
    /**
     * Get all products a customer has purchased
     */
    public function getCustomerPurchaseHistory(int $customerId, ?string $startDate = null, ?string $endDate = null): array {
        $sql = "
            SELECT 
                si.id as sale_id,
                si.invoice_date as sale_date,
                si.invoice_no as invoice_number,
                sil.product_id,
                p.name as product_name,
                sil.quantity,
                sil.unit_price,
                sil.line_total as total_price,
                si.total as sale_total
            FROM sales_invoices si
            JOIN sales_invoice_lines sil ON si.id = sil.invoice_id
            JOIN products p ON sil.product_id = p.id
            WHERE si.company_id = ? AND si.customer_id = ?
        ";
        
        $params = [$this->companyId, $customerId];
        
        if ($startDate) {
            $sql .= " AND si.invoice_date >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $sql .= " AND si.invoice_date <= ?";
            $params[] = $endDate;
        }
        
        $sql .= " ORDER BY si.invoice_date DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Get customer spending summary
     */
    public function getCustomerSpendingSummary(int $customerId): array {
        $stmt = $this->pdo->prepare("
            SELECT 
                c.name as customer_name,
                COUNT(DISTINCT si.id) as total_orders,
                COALESCE(SUM(si.total), 0) as total_spent,
                COALESCE(AVG(si.total), 0) as avg_order_value,
                MAX(si.invoice_date) as last_purchase,
                MIN(si.invoice_date) as first_purchase
            FROM customers c
            LEFT JOIN sales_invoices si ON c.id = si.customer_id AND si.company_id = ?
            WHERE c.id = ? AND c.company_id = ?
            GROUP BY c.id, c.name
        ");
        $stmt->execute([$this->companyId, $customerId, $this->companyId]);
        
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];
    }
    
    /**
     * Get top products purchased by a customer
     */
    public function getCustomerTopProducts(int $customerId, int $limit = 5): array {
        $sql = "
            SELECT 
                p.id,
                p.name as product_name,
                SUM(sil.quantity) as total_quantity,
                SUM(sil.line_total) as total_spent,
                COUNT(sil.id) as purchase_count
            FROM sales_invoice_lines sil
            JOIN sales_invoices si ON sil.invoice_id = si.id
            JOIN products p ON sil.product_id = p.id
            WHERE si.company_id = ? AND si.customer_id = ?
            GROUP BY p.id, p.name
            ORDER BY total_quantity DESC
            LIMIT " . intval($limit);
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$this->companyId, $customerId]);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    // =========================================================================
    // PRODUCT QUERIES
    // =========================================================================
    
    /**
     * Get product stock status
     */
    public function getProductStock(int $productId): array {
        $stmt = $this->pdo->prepare("
            SELECT 
                id,
                name,
                stock_quantity as current_stock,
                reorder_level as min_stock_level,
                unit,
                CASE 
                    WHEN stock_quantity <= 0 THEN 'out_of_stock'
                    WHEN stock_quantity <= COALESCE(reorder_level, 5) THEN 'low_stock'
                    ELSE 'in_stock'
                END as status
            FROM products
            WHERE id = ? AND company_id = ?
        ");
        $stmt->execute([$productId, $this->companyId]);
        
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];
    }
    
    /**
     * Get product sales for a period
     */
    public function getProductSales(int $productId, string $period = 'today'): array {
        $dateCondition = $this->getDateCondition($period, 'si.invoice_date');
        
        $stmt = $this->pdo->prepare("
            SELECT 
                p.name as product_name,
                COALESCE(SUM(sil.quantity), 0) as quantity_sold,
                COALESCE(SUM(sil.line_total), 0) as revenue,
                COUNT(DISTINCT si.id) as order_count
            FROM products p
            LEFT JOIN sales_invoice_lines sil ON p.id = sil.product_id
            LEFT JOIN sales_invoices si ON sil.invoice_id = si.id AND si.company_id = ? {$dateCondition}
            WHERE p.id = ? AND p.company_id = ?
            GROUP BY p.id, p.name
        ");
        $stmt->execute([$this->companyId, $productId, $this->companyId]);
        
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        $result['period'] = $period;
        
        return $result ?: [];
    }
    
    /**
     * Get all products with low stock
     */
    public function getLowStockProducts(): array {
        $stmt = $this->pdo->prepare("
            SELECT 
                id,
                name,
                stock_quantity as current_stock,
                reorder_level as min_stock_level,
                unit,
                CASE 
                    WHEN stock_quantity <= 0 THEN 'OUT OF STOCK'
                    ELSE 'LOW STOCK'
                END as alert
            FROM products
            WHERE company_id = ? 
              AND stock_quantity <= COALESCE(reorder_level, 5)
            ORDER BY stock_quantity ASC
        ");
        $stmt->execute([$this->companyId]);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Get top selling products
     */
    public function getTopSellingProducts(string $period = 'all_time', int $limit = 10): array {
        $dateCondition = $this->getDateCondition($period, 'si.invoice_date');
        
        $sql = "
            SELECT 
                p.id,
                p.name,
                COALESCE(SUM(sil.quantity), 0) as quantity_sold,
                COALESCE(SUM(sil.line_total), 0) as revenue,
                COUNT(DISTINCT si.id) as order_count
            FROM products p
            LEFT JOIN sales_invoice_lines sil ON p.id = sil.product_id
            LEFT JOIN sales_invoices si ON sil.invoice_id = si.id AND si.company_id = ? {$dateCondition}
            WHERE p.company_id = ?
            GROUP BY p.id, p.name
            HAVING quantity_sold > 0
            ORDER BY quantity_sold DESC
            LIMIT " . intval($limit);
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$this->companyId, $this->companyId]);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    // =========================================================================
    // SALES ANALYTICS
    // =========================================================================
    
    /**
     * Get sales summary for a period
     */
    public function getSalesSummary(string $period = 'today'): array {
        $dateCondition = $this->getDateCondition($period, 'invoice_date');
        
        $sql = "
            SELECT 
                COUNT(*) as total_sales,
                COALESCE(SUM(total), 0) as total_revenue,
                COALESCE(AVG(total), 0) as avg_sale_value,
                COUNT(DISTINCT customer_id) as unique_customers
            FROM sales_invoices
            WHERE company_id = ? {$dateCondition}
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$this->companyId]);
        
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        $result['period'] = $period;
        
        return $result;
    }
    
    /**
     * Get sales by customer ranking
     */
    public function getTopCustomers(string $period = 'all_time', int $limit = 10): array {
        $dateCondition = $this->getDateCondition($period, 'si.invoice_date');
        
        $sql = "
            SELECT 
                c.id,
                c.name,
                COUNT(si.id) as order_count,
                COALESCE(SUM(si.total), 0) as total_spent
            FROM customers c
            LEFT JOIN sales_invoices si ON c.id = si.customer_id AND si.company_id = ? {$dateCondition}
            WHERE c.company_id = ?
            GROUP BY c.id, c.name
            HAVING order_count > 0
            ORDER BY total_spent DESC
            LIMIT " . intval($limit);
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$this->companyId, $this->companyId]);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    
    /**
     * Generate date condition for SQL queries
     */
    private function getDateCondition(string $period, string $column = 'invoice_date'): string {
        switch (strtolower($period)) {
            case 'today':
                return "AND DATE({$column}) = CURDATE()";
            case 'yesterday':
                return "AND DATE({$column}) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
            case 'this_week':
            case 'week':
                return "AND {$column} >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)";
            case 'last_week':
                return "AND {$column} >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 7 DAY)
                        AND {$column} < DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)";
            case 'this_month':
            case 'month':
                return "AND MONTH({$column}) = MONTH(CURDATE()) AND YEAR({$column}) = YEAR(CURDATE())";
            case 'last_month':
                return "AND MONTH({$column}) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
                        AND YEAR({$column}) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))";
            case 'this_year':
            case 'year':
                return "AND YEAR({$column}) = YEAR(CURDATE())";
            case 'all_time':
            case 'all':
            default:
                return "";
        }
    }
    
    /**
     * Find customer by name (fuzzy search)
     */
    public function findCustomerByName(string $name): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, name, email, phone
            FROM customers
            WHERE company_id = ? AND (name LIKE ? OR name SOUNDS LIKE ?)
            ORDER BY CASE WHEN name LIKE ? THEN 0 ELSE 1 END
            LIMIT 1
        ");
        $stmt->execute([$this->companyId, "%{$name}%", $name, "{$name}%"]);
        
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }
    
    /**
     * Find product by name (fuzzy search)
     */
    public function findProductByName(string $name): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, name, stock_quantity, selling_price
            FROM products
            WHERE company_id = ? AND (name LIKE ? OR name SOUNDS LIKE ?)
            ORDER BY CASE WHEN name LIKE ? THEN 0 ELSE 1 END
            LIMIT 1
        ");
        $stmt->execute([$this->companyId, "%{$name}%", $name, "{$name}%"]);
        
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }
}
