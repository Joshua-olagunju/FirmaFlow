<?php
/**
 * Supplier Intent Handler
 * Handles all supplier-related intents and queries
 */

function handleSuppliersIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    switch ($intent) {
        case 'view_suppliers':
            return viewSuppliers($pdo, $companyId, $data);
            
        case 'supplier_summary':
            return supplierSummary($pdo, $companyId, $data);
            
        case 'top_suppliers':
            return topSuppliers($pdo, $companyId, $data);
            
        default:
            return [
                'success' => false,
                'error' => 'Unknown supplier intent',
                'intent' => $intent
            ];
    }
}

/**
 * View all suppliers with optional filtering
 */
function viewSuppliers($pdo, $companyId, $data) {
    try {
        $query = "SELECT s.*, 
                  COUNT(DISTINCT pb.id) as total_purchases,
                  SUM(pb.total) as total_spent
                  FROM suppliers s
                  LEFT JOIN purchase_bills pb ON s.id = pb.supplier_id AND pb.company_id = s.company_id
                  WHERE s.company_id = ?";
        
        $params = [$companyId];
        
        // Filter by status if provided
        if (isset($data['status'])) {
            $query .= " AND s.status = ?";
            $params[] = $data['status'];
        }
        
        $query .= " GROUP BY s.id ORDER BY s.name ASC";
        
        // Apply limit
        $limit = isset($data['limit']) ? intval($data['limit']) : 50;
        $query .= " LIMIT $limit";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($suppliers)) {
            return [
                'success' => true,
                'message' => "You don't have any suppliers yet. Would you like to add one?",
                'data' => [],
                'count' => 0
            ];
        }
        
        return [
            'success' => true,
            'message' => sprintf("Found %d supplier%s", count($suppliers), count($suppliers) !== 1 ? 's' : ''),
            'data' => $suppliers,
            'count' => count($suppliers)
        ];
        
    } catch (Exception $e) {
        error_log("Error viewing suppliers: " . $e->getMessage());
        return [
            'success' => false,
            'error' => 'Failed to retrieve suppliers',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Get summary information for a specific supplier or all suppliers
 */
function supplierSummary($pdo, $companyId, $data) {
    try {
        // If supplier_id provided, get specific supplier details
        if (isset($data['supplier_id'])) {
            $stmt = $pdo->prepare("
                SELECT s.*,
                    COUNT(DISTINCT pb.id) as total_purchases,
                    SUM(pb.total) as total_spent,
                    SUM(pb.total - COALESCE(p.total_paid, 0)) as outstanding_balance,
                    MAX(pb.bill_date) as last_purchase_date
                FROM suppliers s
                LEFT JOIN purchase_bills pb ON s.id = pb.supplier_id AND pb.company_id = s.company_id
                LEFT JOIN (
                    SELECT reference_id as purchase_bill_id, SUM(amount) as total_paid
                    FROM payments
                    WHERE company_id = ? AND reference_type = 'purchase_bill'
                    GROUP BY reference_id
                ) p ON pb.id = p.purchase_bill_id
                WHERE s.company_id = ? AND s.id = ?
                GROUP BY s.id
            ");
            $stmt->execute([$companyId, $companyId, $data['supplier_id']]);
            $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$supplier) {
                return [
                    'success' => false,
                    'error' => 'Supplier not found'
                ];
            }
            
            return [
                'success' => true,
                'message' => sprintf("Summary for supplier: %s", $supplier['name']),
                'data' => $supplier
            ];
        }
        
        // Otherwise, get overall supplier statistics
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(DISTINCT s.id) as total_suppliers,
                COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_suppliers,
                COUNT(DISTINCT pb.id) as total_purchases,
                SUM(pb.total) as total_spent,
                AVG(pb.total) as avg_purchase_amount
            FROM suppliers s
            LEFT JOIN purchase_bills pb ON s.id = pb.supplier_id AND pb.company_id = s.company_id
            WHERE s.company_id = ?
        ");
        $stmt->execute([$companyId]);
        $summary = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'message' => sprintf("You have %d supplier%s with %d total purchase%s", 
                $summary['total_suppliers'],
                $summary['total_suppliers'] !== 1 ? 's' : '',
                $summary['total_purchases'],
                $summary['total_purchases'] !== 1 ? 's' : ''
            ),
            'data' => $summary
        ];
        
    } catch (Exception $e) {
        error_log("Error getting supplier summary: " . $e->getMessage());
        return [
            'success' => false,
            'error' => 'Failed to retrieve supplier summary',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Get top suppliers by total purchase amount or other metrics
 */
function topSuppliers($pdo, $companyId, $data) {
    try {
        $limit = isset($data['limit']) ? intval($data['limit']) : 10;
        $metric = isset($data['metric']) ? $data['metric'] : 'total_spent';
        
        // Build date filter if provided
        $dateFilter = "";
        $params = [$companyId];
        
        if (isset($data['date_range'])) {
            if ($data['date_range'] === 'this_month') {
                $dateFilter = "AND pb.bill_date >= DATE_FORMAT(NOW(), '%Y-%m-01')";
            } elseif ($data['date_range'] === 'last_month') {
                $dateFilter = "AND pb.bill_date >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') 
                              AND pb.bill_date < DATE_FORMAT(NOW(), '%Y-%m-01')";
            } elseif ($data['date_range'] === 'this_year') {
                $dateFilter = "AND YEAR(pb.bill_date) = YEAR(NOW())";
            }
        }
        
        $orderBy = "total_spent DESC";
        if ($metric === 'purchase_count') {
            $orderBy = "purchase_count DESC";
        } elseif ($metric === 'avg_purchase') {
            $orderBy = "avg_purchase DESC";
        }
        
        $stmt = $pdo->prepare("
            SELECT s.id, s.name, s.email, s.phone, s.status,
                COUNT(DISTINCT pb.id) as purchase_count,
                SUM(pb.total) as total_spent,
                AVG(pb.total) as avg_purchase,
                MAX(pb.bill_date) as last_purchase_date
            FROM suppliers s
            INNER JOIN purchase_bills pb ON s.id = pb.supplier_id AND pb.company_id = s.company_id
            WHERE s.company_id = ? $dateFilter
            GROUP BY s.id
            ORDER BY $orderBy
            LIMIT $limit
        ");
        
        $stmt->execute($params);
        $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($suppliers)) {
            return [
                'success' => true,
                'message' => "No supplier data available for the selected period",
                'data' => [],
                'count' => 0
            ];
        }
        
        $metricLabel = $metric === 'purchase_count' ? 'purchase count' : 
                       ($metric === 'avg_purchase' ? 'average purchase value' : 'total spent');
        
        return [
            'success' => true,
            'message' => sprintf("Top %d supplier%s by %s", 
                count($suppliers),
                count($suppliers) !== 1 ? 's' : '',
                $metricLabel
            ),
            'data' => $suppliers,
            'count' => count($suppliers),
            'metric' => $metric
        ];
        
    } catch (Exception $e) {
        error_log("Error getting top suppliers: " . $e->getMessage());
        return [
            'success' => false,
            'error' => 'Failed to retrieve top suppliers',
            'details' => $e->getMessage()
        ];
    }
}
