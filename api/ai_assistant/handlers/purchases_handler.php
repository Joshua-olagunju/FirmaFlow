<?php
/**
 * Purchase Handler
 * Handles all purchase-related intents
 */

function handlePurchasesIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    switch ($intent) {
        case 'create_purchase_order':
            return createPurchaseOrder($data, $pdo, $companyId, $userId);
        
        case 'update_purchase_order':
            return updatePurchaseOrder($data, $pdo, $companyId, $userId);
        
        case 'receive_goods':
            return receiveGoods($data, $pdo, $companyId, $userId);
        
        case 'purchase_summary':
            return getPurchaseSummary($data, $pdo, $companyId);
        
        default:
            return formatErrorResponse("Unknown purchase intent: $intent");
    }
}

/**
 * Create a new purchase order
 */
function createPurchaseOrder($data, $pdo, $companyId, $userId) {
    try {
        // Find supplier
        $supplier = findSupplier($pdo, $companyId, $data['supplier_name']);
        if (!$supplier) {
            return formatErrorResponse(
                "Supplier '{$data['supplier_name']}' not found. Please create the supplier first.",
                'SUPPLIER_NOT_FOUND'
            );
        }
        
        // Validate items
        if (empty($data['items']) || !is_array($data['items'])) {
            return formatErrorResponse('Purchase order must have at least one item');
        }
        
        // Generate purchase number
        $purchaseNumber = generatePurchaseNumber($pdo, $companyId);
        
        // Calculate totals
        $subtotal = 0;
        $validatedItems = [];
        
        foreach ($data['items'] as $item) {
            $product = findProduct($pdo, $companyId, $item['product_name']);
            if (!$product) {
                return formatErrorResponse(
                    "Product '{$item['product_name']}' not found in inventory",
                    'PRODUCT_NOT_FOUND'
                );
            }
            
            $quantity = $item['quantity'] ?? 1;
            $unitPrice = $item['unit_price'] ?? $product['cost_price'] ?? 0;
            $lineTotal = $quantity * $unitPrice;
            $subtotal += $lineTotal;
            
            $validatedItems[] = [
                'product_id' => $product['id'],
                'product_name' => $product['name'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total' => $lineTotal
            ];
        }
        
        $tax = $subtotal * 0.075; // 7.5% default tax
        $total = $subtotal + $tax;
        
        // Create purchase order via API
        $apiUrl = "http://localhost/FirmaFlow/api/purchases.php";
        
        $purchaseData = [
            'supplier_id' => $supplier['id'],
            'purchase_number' => $purchaseNumber,
            'purchase_date' => date('Y-m-d'),
            'due_date' => $data['due_date'] ?? date('Y-m-d', strtotime('+30 days')),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'status' => 'pending',
            'notes' => $data['notes'] ?? '',
            'items' => $validatedItems
        ];
        
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($purchaseData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: ' . session_name() . '=' . session_id()
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 201 || $httpCode === 200) {
            $result = json_decode($response, true);
            return [
                'success' => true,
                'action' => 'create_purchase_order',
                'result' => [
                    'purchase_id' => $result['purchase_id'] ?? null,
                    'purchase_number' => $purchaseNumber,
                    'supplier' => $supplier['name'],
                    'items_count' => count($validatedItems),
                    'total' => formatCurrency($total),
                    'status' => 'pending'
                ],
                'message' => "Purchase order #$purchaseNumber created successfully for {$supplier['name']} with " . count($validatedItems) . " items totaling " . formatCurrency($total)
            ];
        } else {
            return formatErrorResponse('Failed to create purchase order: ' . $response);
        }
        
    } catch (Exception $e) {
        return formatErrorResponse('Error creating purchase order: ' . $e->getMessage());
    }
}

/**
 * Update existing purchase order
 */
function updatePurchaseOrder($data, $pdo, $companyId, $userId) {
    try {
        $purchaseId = $data['purchase_id'];
        
        // Verify purchase exists and belongs to company
        $stmt = $pdo->prepare("
            SELECT id, purchase_number, status 
            FROM purchases 
            WHERE id = ? AND company_id = ?
        ");
        $stmt->execute([$purchaseId, $companyId]);
        $purchase = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$purchase) {
            return formatErrorResponse('Purchase order not found', 'NOT_FOUND');
        }
        
        // Prepare update data
        $updateData = ['id' => $purchaseId];
        
        if (isset($data['status'])) {
            $updateData['status'] = $data['status'];
        }
        if (isset($data['notes'])) {
            $updateData['notes'] = $data['notes'];
        }
        
        // Call API
        $apiUrl = "http://localhost/FirmaFlow/api/purchases.php";
        
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: ' . session_name() . '=' . session_id()
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return [
            'success' => true,
            'action' => 'update_purchase_order',
            'result' => [
                'purchase_number' => $purchase['purchase_number'],
                'updated_fields' => array_keys($updateData)
            ],
            'message' => "Purchase order #{$purchase['purchase_number']} updated successfully"
        ];
        
    } catch (Exception $e) {
        return formatErrorResponse('Error updating purchase order: ' . $e->getMessage());
    }
}

/**
 * Mark goods as received
 */
function receiveGoods($data, $pdo, $companyId, $userId) {
    try {
        $purchaseId = $data['purchase_id'];
        
        // Update purchase status to received
        $updateData = [
            'id' => $purchaseId,
            'status' => 'received',
            'received_date' => date('Y-m-d')
        ];
        
        $apiUrl = "http://localhost/FirmaFlow/api/purchases.php";
        
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: ' . session_name() . '=' . session_id()
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return [
            'success' => true,
            'action' => 'receive_goods',
            'result' => ['status' => 'received'],
            'message' => 'Goods received successfully. Inventory has been updated.'
        ];
        
    } catch (Exception $e) {
        return formatErrorResponse('Error receiving goods: ' . $e->getMessage());
    }
}

/**
 * Get purchase summary
 */
function getPurchaseSummary($data, $pdo, $companyId) {
    try {
        $conditions = ["company_id = ?"];
        $params = [$companyId];
        
        // Filter by supplier if provided
        if (!empty($data['supplier'])) {
            $supplier = findSupplier($pdo, $companyId, $data['supplier']);
            if ($supplier) {
                $conditions[] = "supplier_id = ?";
                $params[] = $supplier['id'];
            }
        }
        
        // Date range filter
        if (!empty($data['date_range'])) {
            $dateRange = parseDateRange($data['date_range']);
            $conditions[] = "purchase_date >= ?";
            $conditions[] = "purchase_date <= ?";
            $params[] = $dateRange['start'];
            $params[] = $dateRange['end'];
        }
        
        $sql = "SELECT 
                    COUNT(*) as total_orders,
                    SUM(total) as total_amount,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                    COUNT(CASE WHEN status = 'received' THEN 1 END) as received_orders
                FROM purchases 
                WHERE " . implode(" AND ", $conditions);
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $summary = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get recent purchases
        $recentSql = "SELECT purchase_number, purchase_date, total, status 
                      FROM purchases 
                      WHERE " . implode(" AND ", $conditions) . "
                      ORDER BY purchase_date DESC 
                      LIMIT 5";
        
        $stmt = $pdo->prepare($recentSql);
        $stmt->execute($params);
        $recentPurchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'action' => 'purchase_summary',
            'result' => [
                'total_orders' => (int)$summary['total_orders'],
                'total_amount' => formatCurrency($summary['total_amount'] ?? 0),
                'pending_orders' => (int)$summary['pending_orders'],
                'received_orders' => (int)$summary['received_orders'],
                'recent_purchases' => $recentPurchases
            ],
            'message' => "Found {$summary['total_orders']} purchase orders"
        ];
        
    } catch (Exception $e) {
        return formatErrorResponse('Error fetching purchase summary: ' . $e->getMessage());
    }
}

/**
 * Find supplier by name
 */
function findSupplier($pdo, $companyId, $supplierName) {
    $stmt = $pdo->prepare("
        SELECT id, name, email, phone 
        FROM suppliers 
        WHERE company_id = ? AND LOWER(name) LIKE LOWER(?)
        LIMIT 1
    ");
    $stmt->execute([$companyId, "%$supplierName%"]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
