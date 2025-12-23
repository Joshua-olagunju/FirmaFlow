<?php
/**
 * Inventory Handler
 * Handles all inventory/product-related intents
 */

function handleInventoryIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    switch ($intent) {
        case 'add_product':
        case 'create_product':
            return addProductAction($data, $pdo, $companyId);
            
        case 'add_multiple_products':
            return addMultipleProductsAction($data, $pdo, $companyId);
            
        case 'update_product':
            return updateProductAction($data, $pdo, $companyId);
            
        case 'adjust_stock':
            return adjustStockAction($data, $pdo, $companyId);
            
        case 'view_inventory':
            return viewInventoryAction($data, $pdo, $companyId);
            
        case 'inventory_analysis':
            return inventoryAnalysisAction($data, $pdo, $companyId);
            
        case 'product_analytics':
            return productAnalyticsAction($data, $pdo, $companyId);
            
        default:
            return formatErrorResponse('Unknown inventory intent: ' . $intent);
    }
}

/**
 * Add single product
 */
function addProductAction($data, $pdo, $companyId) {
    try {
        // Validate required fields
        if (empty($data['name'])) {
            return formatErrorResponse('Product name is required', 'VALIDATION_ERROR');
        }
        
        $name = $data['name'];
        $description = $data['description'] ?? '';
        $unit = $data['unit'] ?? 'Pieces';
        $selling_price = $data['selling_price'] ?? $data['price'] ?? 0;
        $cost_price = $data['cost_price'] ?? $selling_price;
        $stock_quantity = $data['quantity'] ?? 0;
        $reorder_level = $data['reorder_level'] ?? 0;
        $track_inventory = 1;
        $is_active = 1;
        
        // Auto-generate SKU if not provided
        $sku = $data['sku'] ?? null;
        if (empty($sku)) {
            $sku = generateProductSKU($name);
        }
        
        // Insert product
        $stmt = $pdo->prepare("
            INSERT INTO products 
            (company_id, name, sku, description, unit, cost_price, selling_price, stock_quantity, reorder_level, track_inventory, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $companyId, $name, $sku, $description, $unit, 
            $cost_price, $selling_price, $stock_quantity, 
            $reorder_level, $track_inventory, $is_active
        ]);
        
        $productId = $pdo->lastInsertId();
        
        return formatSuccessResponse(
            "✅ Product **{$name}** added to inventory!\n📦 SKU: {$sku}\n💰 Price: " . formatCurrency($selling_price) . "\n📊 Stock: {$stock_quantity} units",
            ['product_id' => $productId, 'product_name' => $name, 'sku' => $sku]
        );
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to add product: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Add multiple products at once
 */
function addMultipleProductsAction($data, $pdo, $companyId) {
    try {
        $products = $data['products'] ?? [];
        
        if (empty($products)) {
            return formatErrorResponse('No products provided', 'VALIDATION_ERROR');
        }
        
        $pdo->beginTransaction();
        $added = [];
        $errors = [];
        
        foreach ($products as $productData) {
            $result = addProductAction($productData, $pdo, $companyId);
            
            if ($result['success']) {
                $added[] = $result['data'];
            } else {
                $errors[] = $result['error'];
            }
        }
        
        $pdo->commit();
        
        $message = "✅ Added " . count($added) . " product(s) to inventory!";
        if (!empty($errors)) {
            $message .= "\n⚠️ " . count($errors) . " failed: " . implode(', ', array_slice($errors, 0, 3));
        }
        
        return formatSuccessResponse($message, ['added' => $added, 'errors' => $errors]);
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        return formatErrorResponse('Failed to add products: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Update product details
 */
function updateProductAction($data, $pdo, $companyId) {
    try {
        $productId = $data['product_id'] ?? null;
        
        if (!$productId) {
            return formatErrorResponse('Product ID is required', 'VALIDATION_ERROR');
        }
        
        // Check if product exists
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND company_id = ?");
        $stmt->execute([$productId, $companyId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            return formatErrorResponse('Product not found', 'NOT_FOUND');
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        $allowedFields = ['name', 'description', 'unit', 'selling_price', 'cost_price', 'stock_quantity', 'sku', 'reorder_level'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "{$field} = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updates)) {
            return formatErrorResponse('No fields to update', 'VALIDATION_ERROR');
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $productId;
        $params[] = $companyId;
        
        $sql = "UPDATE products SET " . implode(', ', $updates) . " WHERE id = ? AND company_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Fetch updated product
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        $updatedProduct = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return formatSuccessResponse(
            "✅ Product **{$updatedProduct['name']}** updated successfully!",
            $updatedProduct
        );
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to update product: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Adjust stock levels
 */
function adjustStockAction($data, $pdo, $companyId) {
    try {
        $productId = $data['product_id'] ?? null;
        $adjustment = $data['adjustment'] ?? 0;
        $reason = $data['reason'] ?? 'Manual adjustment';
        
        if (!$productId) {
            return formatErrorResponse('Product ID is required', 'VALIDATION_ERROR');
        }
        
        if ($adjustment == 0) {
            return formatErrorResponse('Adjustment amount cannot be zero', 'VALIDATION_ERROR');
        }
        
        // Get current stock
        $stmt = $pdo->prepare("SELECT name, stock_quantity FROM products WHERE id = ? AND company_id = ?");
        $stmt->execute([$productId, $companyId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            return formatErrorResponse('Product not found', 'NOT_FOUND');
        }
        
        $newStock = $product['stock_quantity'] + $adjustment;
        
        if ($newStock < 0) {
            return formatErrorResponse('Adjustment would result in negative stock', 'VALIDATION_ERROR');
        }
        
        // Update stock
        $stmt = $pdo->prepare("
            UPDATE products 
            SET stock_quantity = ?, updated_at = NOW()
            WHERE id = ? AND company_id = ?
        ");
        $stmt->execute([$newStock, $productId, $companyId]);
        
        $action = ($adjustment > 0) ? "increased" : "decreased";
        $absAdjustment = abs($adjustment);
        
        return formatSuccessResponse(
            "✅ Stock {$action} for **{$product['name']}**\n📊 Old Stock: {$product['stock_quantity']}\n📊 New Stock: {$newStock}\n📝 Reason: {$reason}",
            ['product_name' => $product['name'], 'old_stock' => $product['stock_quantity'], 'new_stock' => $newStock]
        );
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to adjust stock: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * View inventory
 */
function viewInventoryAction($data, $pdo, $companyId) {
    $lowStockOnly = $data['low_stock_only'] ?? false;
    
    if ($lowStockOnly) {
        return queryLowStock($pdo, $companyId, $data);
    }
    
    return queryInventory($pdo, $companyId, $data);
}

/**
 * Inventory analysis
 */
function inventoryAnalysisAction($data, $pdo, $companyId) {
    try {
        // Get inventory statistics
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_products,
                SUM(stock_quantity) as total_units,
                SUM(stock_quantity * selling_price) as total_value,
                SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) as low_stock_count,
                SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
            FROM products
            WHERE company_id = ?
        ");
        $stmt->execute([$companyId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $answer = "📊 **Inventory Analysis:**\n\n";
        $answer .= "📦 Total Products: {$stats['total_products']}\n";
        $answer .= "📊 Total Units: {$stats['total_units']}\n";
        $answer .= "💰 Total Value: " . formatCurrency($stats['total_value']) . "\n";
        $answer .= "⚠️ Low Stock Items: {$stats['low_stock_count']}\n";
        $answer .= "❌ Out of Stock: {$stats['out_of_stock_count']}";
        
        return formatSuccessResponse($answer, $stats);
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to analyze inventory: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Product Analytics - Advanced product performance metrics
 */
function productAnalyticsAction($data, $pdo, $companyId) {
    try {
        $metric = $data['metric'] ?? 'top_selling';
        $limit = isset($data['limit']) ? intval($data['limit']) : 10;
        
        // Build date filter
        $dateFilter = "";
        $params = [$companyId];
        
        if (isset($data['date_range'])) {
            if ($data['date_range'] === 'this_month') {
                $dateFilter = "AND si.invoice_date >= DATE_FORMAT(NOW(), '%Y-%m-01')";
            } elseif ($data['date_range'] === 'last_month') {
                $dateFilter = "AND si.invoice_date >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') 
                              AND si.invoice_date < DATE_FORMAT(NOW(), '%Y-%m-01')";
            } elseif ($data['date_range'] === 'this_year') {
                $dateFilter = "AND YEAR(si.invoice_date) = YEAR(NOW())";
            }
        }
        
        if ($metric === 'top_selling') {
            $stmt = $pdo->prepare("
                SELECT p.id, p.name, p.selling_price, p.stock_quantity,
                    SUM(sii.quantity) as total_sold,
                    SUM(sii.total) as total_revenue,
                    COUNT(DISTINCT si.id) as sales_count
                FROM products p
                INNER JOIN sales_invoice_items sii ON p.id = sii.product_id
                INNER JOIN sales_invoices si ON sii.sales_invoice_id = si.id AND si.company_id = p.company_id
                WHERE p.company_id = ? $dateFilter
                GROUP BY p.id
                ORDER BY total_sold DESC
                LIMIT $limit
            ");
        } elseif ($metric === 'most_profitable') {
            $stmt = $pdo->prepare("
                SELECT p.id, p.name, p.selling_price, p.cost_price, p.stock_quantity,
                    SUM(sii.quantity) as total_sold,
                    SUM(sii.total) as total_revenue,
                    SUM(sii.quantity * p.cost_price) as total_cost,
                    SUM(sii.total - (sii.quantity * p.cost_price)) as profit
                FROM products p
                INNER JOIN sales_invoice_items sii ON p.id = sii.product_id
                INNER JOIN sales_invoices si ON sii.sales_invoice_id = si.id AND si.company_id = p.company_id
                WHERE p.company_id = ? $dateFilter
                GROUP BY p.id
                ORDER BY profit DESC
                LIMIT $limit
            ");
        } elseif ($metric === 'low_stock') {
            $stmt = $pdo->prepare("
                SELECT id, name, stock_quantity, reorder_level, selling_price,
                    (stock_quantity - reorder_level) as stock_deficit
                FROM products
                WHERE company_id = ? AND stock_quantity <= reorder_level
                ORDER BY stock_deficit ASC
                LIMIT $limit
            ");
        } elseif ($metric === 'no_sales') {
            $stmt = $pdo->prepare("
                SELECT p.id, p.name, p.selling_price, p.stock_quantity, p.created_at
                FROM products p
                LEFT JOIN sales_invoice_items sii ON p.id = sii.product_id
                WHERE p.company_id = ? AND sii.id IS NULL
                ORDER BY p.created_at DESC
                LIMIT $limit
            ");
        } else {
            return formatErrorResponse("Unknown metric: $metric", 'VALIDATION_ERROR');
        }
        
        $stmt->execute($params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($products)) {
            return formatSuccessResponse("No product data available for the selected metric", []);
        }
        
        $metricLabel = $metric === 'top_selling' ? 'Top Selling Products' : 
                       ($metric === 'most_profitable' ? 'Most Profitable Products' : 
                       ($metric === 'low_stock' ? 'Low Stock Products' : 'Products With No Sales'));
        
        return formatSuccessResponse(
            "📊 **$metricLabel**",
            [
                'products' => $products,
                'count' => count($products),
                'metric' => $metric,
                'date_range' => $data['date_range'] ?? 'all_time'
            ]
        );
        
    } catch (Exception $e) {
        error_log("Error getting product analytics: " . $e->getMessage());
        return formatErrorResponse('Failed to retrieve product analytics: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}
