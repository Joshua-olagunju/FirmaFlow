<?php
/**
 * Supplier Handler - ENHANCED VERSION
 * Handles all supplier-related intents
 * 
 * CAPABILITIES:
 * - create_supplier: Add new supplier
 * - update_supplier: Modify supplier details
 * - delete_supplier: Remove supplier (with safety checks)
 * - view_supplier: Get specific supplier info
 * - supplier_summary: List all suppliers / count
 * - supplier_details: Get detailed supplier profile with purchase history
 * - top_suppliers: Top suppliers by purchases
 * - supplier_transactions: Transaction/purchase history
 * - supplier_balance: Check outstanding amount to supplier
 * - activate_supplier: Enable supplier
 * - deactivate_supplier: Disable supplier
 */

function handleSuppliersIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    error_log("handleSuppliersIntent called with intent: {$intent}");
    error_log("Data: " . json_encode($data));
    
    switch ($intent) {
        case 'create_supplier':
            return createSupplierAction($data, $pdo, $companyId);
            
        case 'update_supplier':
            return updateSupplierAction($data, $pdo, $companyId);
            
        case 'delete_supplier':
            return deleteSupplierAction($data, $pdo, $companyId);
            
        case 'view_supplier':
            return viewSupplierAction($data, $pdo, $companyId);
            
        case 'view_suppliers':
            return viewSuppliers($pdo, $companyId, $data);
            
        case 'supplier_summary':
            return supplierSummary($pdo, $companyId, $data);
            
        case 'supplier_details':
            return supplierDetailsAction($data, $pdo, $companyId);
            
        case 'top_suppliers':
            return topSuppliers($pdo, $companyId, $data);
            
        case 'supplier_transactions':
            return supplierTransactionsAction($data, $pdo, $companyId);
            
        case 'supplier_balance':
            return supplierBalanceAction($data, $pdo, $companyId);
            
        case 'activate_supplier':
        case 'deactivate_supplier':
            return toggleSupplierStatusAction($data, $pdo, $companyId, $intent);
            
        default:
            return [
                'success' => false,
                'error' => 'Unknown supplier intent: ' . $intent,
                'intent' => $intent
            ];
    }
}

// ============================================
// CREATE / UPDATE / DELETE FUNCTIONS
// ============================================

/**
 * Create new supplier
 */
function createSupplierAction($data, $pdo, $companyId) {
    try {
        // Validate required fields
        if (empty($data['company_name']) && empty($data['name'])) {
            return formatSupplierError('Supplier/Company name is required', 'VALIDATION_ERROR');
        }
        
        // Extract data - map from AI extraction to database fields
        $companyName = $data['company_name'] ?? $data['name'] ?? '';
        $contactPerson = $data['contact_person'] ?? $data['contact'] ?? '';
        $phone = $data['phone'] ?? null;
        $email = $data['email'] ?? null;
        $address = $data['address'] ?? null;
        $taxNumber = $data['tax_number'] ?? $data['tax_id'] ?? null;
        $paymentTerms = $data['payment_terms'] ?? 'Net 30 days';
        // Use is_active (tinyint 0/1) as per actual database schema
        $isActive = (isset($data['is_active']) && !$data['is_active']) ? 0 : 1;
        
        // Check for duplicate
        $stmt = $pdo->prepare("SELECT id FROM suppliers WHERE company_id = ? AND name = ?");
        $stmt->execute([$companyId, $companyName]);
        if ($stmt->fetch()) {
            return formatSupplierError("A supplier named '{$companyName}' already exists", 'DUPLICATE');
        }
        
        // Insert supplier
        $stmt = $pdo->prepare("
            INSERT INTO suppliers 
            (company_id, name, contact_person, phone, email, address, tax_number, payment_terms, is_active, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $companyId, $companyName, $contactPerson, $phone, $email, 
            $address, $taxNumber, $paymentTerms, $isActive
        ]);
        
        $supplierId = $pdo->lastInsertId();
        
        // Fetch created supplier
        $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE id = ?");
        $stmt->execute([$supplierId]);
        $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'status' => 'success',
            'message' => "✅ **Supplier Created Successfully!**\n\n" .
                        "📋 **Details:**\n" .
                        "• **Company:** {$companyName}\n" .
                        ($contactPerson ? "• **Contact:** {$contactPerson}\n" : "") .
                        ($phone ? "• **Phone:** {$phone}\n" : "") .
                        ($email ? "• **Email:** {$email}\n" : "") .
                        ($address ? "• **Address:** {$address}\n" : "") .
                        "• **Payment Terms:** {$paymentTerms}\n" .
                        "• **Status:** " . ($isActive ? 'Active' : 'Inactive'),
            'data' => $supplier
        ];
        
    } catch (Exception $e) {
        error_log("Error creating supplier: " . $e->getMessage());
        return formatSupplierError('Failed to create supplier: ' . $e->getMessage());
    }
}

/**
 * Update existing supplier
 */
function updateSupplierAction($data, $pdo, $companyId) {
    try {
        // Find supplier
        $supplier = findSupplierByData($data, $pdo, $companyId);
        if (!$supplier) {
            return formatSupplierError('Supplier not found. Please check the name and try again.');
        }
        
        $supplierId = $supplier['id'];
        $updates = [];
        $params = [];
        
        // Build update query dynamically
        $fieldMap = [
            'company_name' => 'name',
            'new_name' => 'name',
            'contact_person' => 'contact_person',
            'contact' => 'contact_person',
            'phone' => 'phone',
            'email' => 'email',
            'address' => 'address',
            'tax_number' => 'tax_number',
            'tax_id' => 'tax_number',
            'payment_terms' => 'payment_terms'
        ];
        
        foreach ($fieldMap as $inputField => $dbField) {
            if (isset($data[$inputField]) && $data[$inputField] !== '' && $data[$inputField] !== null) {
                // Skip if it's the identifier field
                if ($inputField === 'company_name' && isset($data['supplier_name'])) continue;
                if (!in_array("$dbField = ?", $updates)) {
                    $updates[] = "$dbField = ?";
                    $params[] = $data[$inputField];
                }
            }
        }
        
        // Handle is_active (tinyint 0/1)
        if (isset($data['is_active'])) {
            $updates[] = "is_active = ?";
            $params[] = $data['is_active'] ? 1 : 0;
        }
        
        if (empty($updates)) {
            return formatSupplierError('No fields to update provided');
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $supplierId;
        $params[] = $companyId;
        
        $sql = "UPDATE suppliers SET " . implode(', ', $updates) . " WHERE id = ? AND company_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Fetch updated supplier
        $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE id = ?");
        $stmt->execute([$supplierId]);
        $updatedSupplier = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'status' => 'success',
            'message' => "✅ **Supplier Updated Successfully!**\n\n" .
                        "📋 **{$updatedSupplier['name']}** has been updated.",
            'data' => $updatedSupplier
        ];
        
    } catch (Exception $e) {
        error_log("Error updating supplier: " . $e->getMessage());
        return formatSupplierError('Failed to update supplier: ' . $e->getMessage());
    }
}

/**
 * Delete supplier
 */
function deleteSupplierAction($data, $pdo, $companyId) {
    try {
        // Find supplier
        $supplier = findSupplierByData($data, $pdo, $companyId);
        if (!$supplier) {
            return formatSupplierError('Supplier not found. Please check the name and try again.');
        }
        
        $supplierId = $supplier['id'];
        $supplierName = $supplier['name'];
        
        // Check for existing purchase bills
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM purchase_bills WHERE supplier_id = ? AND company_id = ?");
        $stmt->execute([$supplierId, $companyId]);
        $purchaseCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($purchaseCount > 0) {
            // Soft delete - deactivate instead
            $stmt = $pdo->prepare("UPDATE suppliers SET is_active = 0, updated_at = NOW() WHERE id = ? AND company_id = ?");
            $stmt->execute([$supplierId, $companyId]);
            
            return [
                'success' => true,
                'status' => 'warning',
                'message' => "⚠️ **Supplier Deactivated**\n\n" .
                            "**{$supplierName}** has {$purchaseCount} purchase record(s) and cannot be permanently deleted.\n\n" .
                            "The supplier has been **deactivated** instead and won't appear in active lists.",
                'data' => ['id' => $supplierId, 'name' => $supplierName, 'deactivated' => true]
            ];
        }
        
        // Hard delete - no purchase history
        $stmt = $pdo->prepare("DELETE FROM suppliers WHERE id = ? AND company_id = ?");
        $stmt->execute([$supplierId, $companyId]);
        
        return [
            'success' => true,
            'status' => 'success',
            'message' => "✅ **Supplier Deleted**\n\n**{$supplierName}** has been permanently removed.",
            'data' => ['id' => $supplierId, 'name' => $supplierName, 'deleted' => true]
        ];
        
    } catch (Exception $e) {
        error_log("Error deleting supplier: " . $e->getMessage());
        return formatSupplierError('Failed to delete supplier: ' . $e->getMessage());
    }
}

/**
 * View specific supplier
 */
function viewSupplierAction($data, $pdo, $companyId) {
    try {
        $supplier = findSupplierByData($data, $pdo, $companyId);
        if (!$supplier) {
            return formatSupplierError('Supplier not found');
        }
        
        return [
            'success' => true,
            'status' => 'success',
            'message' => "📋 **Supplier: {$supplier['name']}**\n\n" .
                        ($supplier['contact_person'] ? "• **Contact:** {$supplier['contact_person']}\n" : "") .
                        ($supplier['phone'] ? "• **Phone:** {$supplier['phone']}\n" : "") .
                        ($supplier['email'] ? "• **Email:** {$supplier['email']}\n" : "") .
                        ($supplier['address'] ? "• **Address:** {$supplier['address']}\n" : "") .
                        "• **Payment Terms:** {$supplier['payment_terms']}\n" .
                        "• **Status:** " . ($supplier['is_active'] ? 'Active' : 'Inactive'),
            'data' => $supplier
        ];
        
    } catch (Exception $e) {
        error_log("Error viewing supplier: " . $e->getMessage());
        return formatSupplierError('Failed to view supplier');
    }
}

/**
 * Supplier details with purchase history
 */
function supplierDetailsAction($data, $pdo, $companyId) {
    try {
        error_log("supplierDetailsAction called with data: " . json_encode($data));
        
        $supplier = findSupplierByData($data, $pdo, $companyId);
        if (!$supplier) {
            return formatSupplierError('Supplier not found. Please check the name and try again.');
        }
        
        $supplierId = $supplier['id'];
        
        // Get purchase statistics
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_purchases,
                COALESCE(SUM(total), 0) as total_amount,
                COALESCE(AVG(total), 0) as avg_purchase,
                MAX(bill_date) as last_purchase,
                MIN(bill_date) as first_purchase
            FROM purchase_bills 
            WHERE supplier_id = ? AND company_id = ?
        ");
        $stmt->execute([$supplierId, $companyId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get recent purchases
        $stmt = $pdo->prepare("
            SELECT id, bill_number, total, bill_date, status
            FROM purchase_bills 
            WHERE supplier_id = ? AND company_id = ?
            ORDER BY bill_date DESC
            LIMIT 5
        ");
        $stmt->execute([$supplierId, $companyId]);
        $recentPurchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format message
        $message = "📦 **Supplier Profile: {$supplier['name']}**\n\n";
        $message .= "**📋 Contact Information:**\n";
        $message .= $supplier['contact_person'] ? "• Contact: {$supplier['contact_person']}\n" : "";
        $message .= $supplier['phone'] ? "• Phone: {$supplier['phone']}\n" : "";
        $message .= $supplier['email'] ? "• Email: {$supplier['email']}\n" : "";
        $message .= $supplier['address'] ? "• Address: {$supplier['address']}\n" : "";
        $message .= "• Status: " . ($supplier['is_active'] ? 'Active' : 'Inactive') . "\n";
        $message .= "• Payment Terms: {$supplier['payment_terms']}\n";
        
        $message .= "\n**📊 Purchase Statistics:**\n";
        $message .= "• Total Purchases: {$stats['total_purchases']}\n";
        $message .= "• Total Spent: ₦" . number_format($stats['total_amount'], 2) . "\n";
        $message .= "• Average Purchase: ₦" . number_format($stats['avg_purchase'], 2) . "\n";
        
        if ($stats['last_purchase']) {
            $message .= "• Last Purchase: " . date('M d, Y', strtotime($stats['last_purchase'])) . "\n";
        }
        
        if (!empty($recentPurchases)) {
            $message .= "\n**📜 Recent Purchases:**\n";
            foreach ($recentPurchases as $p) {
                $date = date('M d', strtotime($p['bill_date']));
                $message .= "• {$p['bill_number']} - ₦" . number_format($p['total'], 2) . " ({$date})\n";
            }
        }
        
        return [
            'success' => true,
            'status' => 'success',
            'message' => $message,
            'data' => [
                'supplier' => $supplier,
                'stats' => $stats,
                'recent_purchases' => $recentPurchases
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Error getting supplier details: " . $e->getMessage());
        return formatSupplierError('Failed to get supplier details');
    }
}

/**
 * Supplier transactions/purchase history
 */
function supplierTransactionsAction($data, $pdo, $companyId) {
    try {
        $supplier = findSupplierByData($data, $pdo, $companyId);
        if (!$supplier) {
            return formatSupplierError('Supplier not found');
        }
        
        $limit = isset($data['limit']) ? intval($data['limit']) : 10;
        
        $stmt = $pdo->prepare("
            SELECT pb.*, 
                   (SELECT SUM(amount) FROM payments WHERE reference_type = 'purchase_bill' AND reference_id = pb.id) as paid_amount
            FROM purchase_bills pb
            WHERE pb.supplier_id = ? AND pb.company_id = ?
            ORDER BY pb.bill_date DESC
            LIMIT ?
        ");
        $stmt->execute([$supplier['id'], $companyId, $limit]);
        $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($purchases)) {
            return [
                'success' => true,
                'status' => 'info',
                'message' => "📜 No purchase history found for **{$supplier['name']}**.",
                'data' => []
            ];
        }
        
        $list = "";
        foreach ($purchases as $p) {
            $date = date('M d, Y', strtotime($p['bill_date']));
            $paid = $p['paid_amount'] ?? 0;
            $balance = $p['total'] - $paid;
            $status = $balance > 0 ? "⏳ Owing: ₦" . number_format($balance, 2) : "✅ Paid";
            $list .= "• **{$p['bill_number']}** - ₦" . number_format($p['total'], 2) . " ({$date}) - {$status}\n";
        }
        
        return [
            'success' => true,
            'status' => 'success',
            'message' => "📜 **Purchase History: {$supplier['name']}**\n\n{$list}",
            'data' => $purchases
        ];
        
    } catch (Exception $e) {
        error_log("Error getting supplier transactions: " . $e->getMessage());
        return formatSupplierError('Failed to get supplier transactions');
    }
}

/**
 * Supplier balance (what we owe them)
 */
function supplierBalanceAction($data, $pdo, $companyId) {
    try {
        $supplier = findSupplierByData($data, $pdo, $companyId);
        if (!$supplier) {
            return formatSupplierError('Supplier not found');
        }
        
        // Calculate outstanding balance
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(pb.total), 0) as total_purchases,
                COALESCE(SUM(COALESCE(p.paid, 0)), 0) as total_paid
            FROM purchase_bills pb
            LEFT JOIN (
                SELECT reference_id, SUM(amount) as paid
                FROM payments 
                WHERE reference_type = 'purchase_bill' AND company_id = ?
                GROUP BY reference_id
            ) p ON pb.id = p.reference_id
            WHERE pb.supplier_id = ? AND pb.company_id = ?
        ");
        $stmt->execute([$companyId, $supplier['id'], $companyId]);
        $balance = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $outstanding = $balance['total_purchases'] - $balance['total_paid'];
        
        $message = "💰 **Balance with {$supplier['name']}**\n\n";
        $message .= "• Total Purchases: ₦" . number_format($balance['total_purchases'], 2) . "\n";
        $message .= "• Total Paid: ₦" . number_format($balance['total_paid'], 2) . "\n";
        $message .= "• **Outstanding: ₦" . number_format($outstanding, 2) . "**";
        
        if ($outstanding > 0) {
            $message .= " ⏳";
        } else {
            $message .= " ✅ All paid!";
        }
        
        return [
            'success' => true,
            'status' => 'success',
            'message' => $message,
            'data' => [
                'supplier' => $supplier['name'],
                'total_purchases' => $balance['total_purchases'],
                'total_paid' => $balance['total_paid'],
                'outstanding' => $outstanding
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Error getting supplier balance: " . $e->getMessage());
        return formatSupplierError('Failed to get supplier balance');
    }
}

/**
 * Toggle supplier status (activate/deactivate)
 */
function toggleSupplierStatusAction($data, $pdo, $companyId, $intent) {
    try {
        $supplier = findSupplierByData($data, $pdo, $companyId);
        if (!$supplier) {
            return formatSupplierError('Supplier not found');
        }
        
        $newStatus = ($intent === 'activate_supplier') ? 1 : 0;
        $statusLabel = $newStatus ? 'active' : 'inactive';
        
        $stmt = $pdo->prepare("UPDATE suppliers SET is_active = ?, updated_at = NOW() WHERE id = ? AND company_id = ?");
        $stmt->execute([$newStatus, $supplier['id'], $companyId]);
        
        $icon = $newStatus ? '✅' : '⏸️';
        
        return [
            'success' => true,
            'status' => 'success',
            'message' => "{$icon} **{$supplier['name']}** has been **{$statusLabel}**.",
            'data' => ['id' => $supplier['id'], 'name' => $supplier['name'], 'is_active' => $newStatus]
        ];
        
    } catch (Exception $e) {
        error_log("Error toggling supplier status: " . $e->getMessage());
        return formatSupplierError('Failed to update supplier status');
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Find supplier by ID, name, or email
 */
function findSupplierByData($data, $pdo, $companyId) {
    error_log("findSupplierByData called with: " . json_encode($data));
    
    // By ID
    if (isset($data['supplier_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE id = ? AND company_id = ?");
        $stmt->execute([$data['supplier_id'], $companyId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // By name (exact match first)
    $searchName = $data['supplier_name'] ?? $data['company_name'] ?? $data['name'] ?? null;
    if ($searchName) {
        error_log("Searching supplier by name: {$searchName}");
        
        // Exact match
        $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE company_id = ? AND name = ?");
        $stmt->execute([$companyId, $searchName]);
        $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($supplier) return $supplier;
        
        // LIKE match
        $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE company_id = ? AND name LIKE ?");
        $stmt->execute([$companyId, "%{$searchName}%"]);
        $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($supplier) return $supplier;
    }
    
    // By email
    if (isset($data['supplier_email']) || isset($data['email'])) {
        $email = $data['supplier_email'] ?? $data['email'];
        $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE company_id = ? AND email = ?");
        $stmt->execute([$companyId, $email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    return null;
}

/**
 * Format error response
 */
function formatSupplierError($message, $code = 'ERROR') {
    return [
        'success' => false,
        'status' => 'error',
        'error' => $message,
        'message' => "❌ {$message}",
        'code' => $code
    ];
}

// ============================================
// ORIGINAL FUNCTIONS (VIEW OPERATIONS)
// ============================================

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
