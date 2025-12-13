<?php
// Clean output buffer and suppress errors to ensure JSON output
if (ob_get_level()) {
    ob_clean();
}
error_reporting(0);
ini_set('display_errors', 0);

// Start session first
session_start();
header('Content-Type: application/json');

// CORS Headers - allow credentials
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowed_origins, true)) {
    header('Vary: Origin');
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/journal_helpers.php';
require_once __DIR__ . '/../includes/AccountResolver.php';

// Check authentication
if (!isset($_SESSION['company_id'])) {
    error_log("Session check failed - no company_id in session");
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

$company_id = $_SESSION['company_id'];
$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

error_log("PURCHASES API - Method: $method, Company ID: $company_id");

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            // Get single purchase bill
            $stmt = $pdo->prepare("SELECT * FROM purchase_bills WHERE id = ? AND company_id = ?");
            $stmt->execute([$_GET['id'], $company_id]);
            $bill = $stmt->fetch();
            
            if ($bill) {
                // Get purchase lines
                $stmt = $pdo->prepare("
                    SELECT pl.*, p.name as product_name 
                    FROM purchase_lines pl 
                    LEFT JOIN products p ON pl.product_id = p.id
                    WHERE pl.purchase_id = ?
                ");
                $stmt->execute([$bill['id']]);
                $bill['lines'] = $stmt->fetchAll();
            }
            
            echo json_encode($bill ?: []);
        } else {
            // Get all purchase bills
            $search = $_GET['search'] ?? '';
            $whereClause = "WHERE pb.company_id = ?";
            $params = [$company_id];
            
            if (!empty($search)) {
                $whereClause .= " AND s.name LIKE ?";
                $params[] = "%$search%";
            }
            
            $stmt = $pdo->prepare("
                SELECT pb.*, COALESCE(s.name, 'Unknown Supplier') as supplier_name 
                FROM purchase_bills pb 
                LEFT JOIN suppliers s ON pb.supplier_id = s.id 
                $whereClause 
                ORDER BY pb.bill_date DESC
            ");
            $stmt->execute($params);
            $bills = $stmt->fetchAll();
            
            error_log("Retrieved " . count($bills) . " purchase bills");
            echo json_encode($bills);
        }
        
    } else if ($method === 'POST') {
        // Create new purchase
        $supplier_id = $input['supplier_id'] ?? 0;
        $bill_date = $input['bill_date'] ?? date('Y-m-d');
        $due_date = $input['due_date'] ?? date('Y-m-d', strtotime('+30 days'));
        $notes = $input['notes'] ?? '';
        $items = $input['items'] ?? [];

        // Validation
        if (empty($items)) {
            http_response_code(400);
            echo json_encode(['error' => 'Items required']);
            exit;
        }

        // 🎯 Smart Defaults: No manual account selection required!
        // All accounts are automatically resolved when payment is made
        error_log("🔥 Smart Defaults: Creating purchase bill without manual account selection");

        $pdo->beginTransaction();

        try {
            // Generate bill number
            $stmt = $pdo->prepare("SELECT COALESCE(MAX(CAST(SUBSTRING(reference, 4) AS UNSIGNED)), 0) + 1 as next_number FROM purchase_bills WHERE company_id = ?");
            $stmt->execute([$company_id]);
            $next_number = $stmt->fetch()['next_number'];
            $reference = 'PUR' . str_pad($next_number, 4, '0', STR_PAD_LEFT);

            // Calculate totals
            $subtotal = 0;
            $tax_amount = 0;

            foreach ($items as $item) {
                $line_total = $item['quantity'] * $item['unit_cost'];
                $subtotal += $line_total;
                
                // Handle both percentage and fixed tax types
                $tax_type = $item['tax_type'] ?? 'percentage';
                if ($tax_type === 'fixed') {
                    // Fixed tax amount - apply directly
                    $tax_amount += $item['tax_rate'] ?? 0;
                } else {
                    // Percentage tax - apply to line total
                    $tax_amount += $line_total * (($item['tax_rate'] ?? 0) / 100);
                }
            }

            $tax_rate_id = $input['tax_rate_id'] ?? null;

            $total_amount = $subtotal + $tax_amount;

            // Insert bill
            $stmt = $pdo->prepare("
                INSERT INTO purchase_bills (company_id, supplier_id, reference, bill_date, due_date, subtotal, tax, tax_rate_id, total, amount_paid, status, notes, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'received', ?, NOW(), NOW())
            ");
            $stmt->execute([$company_id, $supplier_id, $reference, $bill_date, $due_date, $subtotal, $tax_amount, $tax_rate_id, $total_amount, $notes]);

            $bill_id = $pdo->lastInsertId();

            // Insert bill lines and handle product creation/inventory updates
            foreach ($items as $item) {
                error_log("🔍 Processing item type: " . $item['item_type'] . " - " . $item['description']);
                
                $line_total = $item['quantity'] * $item['unit_cost'];
                $product_id = null;
                
                // Handle different item types appropriately
                if ($item['item_type'] === 'existing' && !empty($item['product_id'])) {
                    $product_id = intval($item['product_id']);
                    error_log("📦 Using existing product ID: $product_id");
                } else if ($item['item_type'] === 'expense') {
                    $product_id = null; // Expenses don't link to products
                    error_log("💰 Processing expense: " . $item['description']);
                }

                // AUTO-CREATE PRODUCT FOR NEW ITEMS (but not for expenses)
                if ($item['item_type'] === 'new' && (!empty($item['description']) || !empty($item['new_product_name']))) {
                    // Use new_product_name if provided, otherwise fall back to description
                    $product_name = !empty($item['new_product_name']) ? $item['new_product_name'] : $item['description'];
                    error_log("🆕 Creating new product from purchase: " . $product_name);
                    
                    try {
                        // Check if product with same name already exists
                        $stmt = $pdo->prepare("SELECT id FROM products WHERE name = ? AND company_id = ? LIMIT 1");
                        $stmt->execute([$product_name, $company_id]);
                        $existing_product = $stmt->fetch();
                        
                        if ($existing_product) {
                            // Use existing product instead of creating duplicate
                            $product_id = $existing_product['id'];
                            error_log("✅ Found existing product with same name: ID $product_id");
                        } else {
                            // Create new product - get selling price from item if provided
                            $selling_price = isset($item['new_product_selling_price']) && floatval($item['new_product_selling_price']) > 0 
                                ? floatval($item['new_product_selling_price']) 
                                : (isset($item['selling_price']) ? floatval($item['selling_price']) : floatval($item['unit_cost']) * 1.3); // 30% markup as default
                            
                            // Use provided SKU or auto-generate
                            $sku = !empty($item['new_product_sku']) ? $item['new_product_sku'] : 'AUTO-' . uniqid();
                            
                            $new_product_data = [
                                'name' => $product_name,
                                'description' => 'Auto-created from Purchase ' . $reference,
                                'sku' => $sku,
                                'unit' => 'pcs',
                                'stock_quantity' => floatval($item['quantity']),
                                'selling_price' => $selling_price,
                                'cost_price' => floatval($item['unit_cost']),
                                'track_inventory' => 1,
                                'is_active' => 1,
                                'company_id' => $company_id
                            ];
                            
                            error_log("💰 New product selling price: $selling_price (from input: " . ($item['selling_price'] ?? 'auto-calculated') . ")");
                            
                            // Build dynamic insert based on available columns
                            $stmt = $pdo->prepare("SELECT * FROM products WHERE company_id = ? LIMIT 1");
                            $stmt->execute([$company_id]);
                            $sample_product = $stmt->fetch();
                            
                            if ($sample_product) {
                                // Detect available columns
                                $available_columns = array_keys($sample_product);
                                
                                // Map our data to available columns
                                $insert_columns = [];
                                $insert_values = [];
                                $placeholders = [];
                                
                                $column_mapping = [
                                    'name' => ['name', 'product_name', 'title'],
                                    'description' => ['description', 'product_description', 'details'],
                                    'sku' => ['sku', 'product_code', 'code', 'item_code'],
                                    'unit' => ['unit', 'unit_of_measure', 'uom'],
                                    'stock_quantity' => ['stock_quantity', 'quantity', 'qty', 'quantity_on_hand'],
                                    'selling_price' => ['selling_price', 'price', 'unit_price', 'sale_price'],
                                    'cost_price' => ['cost_price', 'cost', 'unit_cost', 'purchase_price'],
                                    'track_inventory' => ['track_inventory', 'track_stock', 'inventory_tracking'],
                                    'is_active' => ['is_active', 'active', 'status'],
                                    'company_id' => ['company_id']
                                ];
                                
                                foreach ($column_mapping as $data_key => $possible_columns) {
                                    foreach ($possible_columns as $col) {
                                        if (in_array($col, $available_columns) && isset($new_product_data[$data_key])) {
                                            $insert_columns[] = "`$col`";
                                            $insert_values[] = $new_product_data[$data_key];
                                            $placeholders[] = '?';
                                            break;
                                        }
                                    }
                                }
                                
                                // Add timestamp columns if they exist
                                if (in_array('created_at', $available_columns)) {
                                    $insert_columns[] = '`created_at`';
                                    $insert_values[] = date('Y-m-d H:i:s');
                                    $placeholders[] = '?';
                                }
                                
                                if (in_array('updated_at', $available_columns)) {
                                    $insert_columns[] = '`updated_at`';
                                    $insert_values[] = date('Y-m-d H:i:s');
                                    $placeholders[] = '?';
                                }
                                
                                if (!empty($insert_columns)) {
                                    $insert_sql = "INSERT INTO products (" . implode(', ', $insert_columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
                                    $stmt = $pdo->prepare($insert_sql);
                                    $stmt->execute($insert_values);
                                    
                                    $product_id = $pdo->lastInsertId();
                                    error_log("✅ Created new product: ID $product_id - " . $item['description']);
                                    error_log("📦 Product created with quantity: " . $item['quantity'] . ", cost: " . $item['unit_cost'] . ", selling price: $selling_price");
                                } else {
                                    error_log("⚠️ Could not create product - no compatible columns found");
                                }
                            }
                        }
                    } catch (Exception $product_error) {
                        error_log("❌ Failed to create product: " . $product_error->getMessage());
                        // Continue with purchase even if product creation fails
                    }
                }

                $stmt = $pdo->prepare("
                    INSERT INTO purchase_lines (purchase_id, product_id, description, quantity, unit_cost, line_total, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([$bill_id, $product_id, $item['description'], $item['quantity'], $item['unit_cost'], $line_total]);

                // UPDATE INVENTORY FOR EXISTING PRODUCTS ONLY (skip new products and expenses)
                if ($product_id && $item['item_type'] === 'existing') {
                    error_log("🔄 Updating inventory for product ID: $product_id");
                    
                    try {
                        // Get current product details (try different column name variations)
                        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND company_id = ? LIMIT 1");
                        $stmt->execute([$product_id, $company_id]);
                        $current_product = $stmt->fetch();
                        
                        if (!$current_product) {
                            error_log("⚠️ Product not found: ID $product_id");
                            continue;
                        }
                        
                        // Determine correct column names from the fetched data
                        $quantity_column = null;
                        $cost_column = null;
                        
                        // Common quantity column names (most common first)
                        $quantity_options = ['stock_quantity', 'quantity', 'qty', 'quantity_on_hand', 'current_stock', 'available_qty'];
                        foreach ($quantity_options as $col) {
                            if (array_key_exists($col, $current_product)) {
                                $quantity_column = $col;
                                break;
                            }
                        }
                        
                        // Common cost price column names (most common first)
                        $cost_options = ['cost_price', 'price', 'cost', 'unit_cost', 'purchase_price', 'buy_price', 'unit_price'];
                        foreach ($cost_options as $col) {
                            if (array_key_exists($col, $current_product)) {
                                $cost_column = $col;
                                break;
                            }
                        }
                        
                        if (!$quantity_column || !$cost_column) {
                            error_log("⚠️ Could not find quantity or cost columns for product ID $product_id");
                            error_log("Available columns: " . implode(', ', array_keys($current_product)));
                            error_log("❌ Skipping inventory update for this product");
                            continue;
                        }
                        
                        error_log("✅ Using columns: quantity='{$quantity_column}', cost='{$cost_column}'");
                        
                        // Calculate inventory updates using dynamic column names
                        $current_quantity = floatval($current_product[$quantity_column] ?? 0);
                        $purchased_quantity = floatval($item['quantity']);
                        $new_total_quantity = $current_quantity + $purchased_quantity;
                        $new_unit_cost = floatval($item['unit_cost']);
                        $current_cost_price = floatval($current_product[$cost_column] ?? 0);
                            
                        // Calculate weighted average cost price
                        $weighted_avg_cost = $current_cost_price; // Default to current
                        
                        if ($new_total_quantity > 0) {
                            // Weighted Average Cost = (Current Value + New Purchase Value) / New Total Quantity
                            $current_inventory_value = $current_quantity * $current_cost_price;
                            $new_purchase_value = $purchased_quantity * $new_unit_cost;
                            $total_inventory_value = $current_inventory_value + $new_purchase_value;
                            $weighted_avg_cost = $total_inventory_value / $new_total_quantity;
                        }
                        
                        error_log("📦 Product inventory update:");
                        error_log("   Current quantity: $current_quantity");
                        error_log("   Purchased quantity: $purchased_quantity");
                        error_log("   New total quantity: $new_total_quantity");
                        error_log("   Current cost price: $current_cost_price");
                        error_log("   New purchase cost: $new_unit_cost");
                        error_log("   Weighted average cost: $weighted_avg_cost");
                        
                        // Build and execute dynamic update SQL
                        $update_fields = [];
                        $update_values = [];
                        
                        // Add quantity update
                        $update_fields[] = "`{$quantity_column}` = ?";
                        $update_values[] = $new_total_quantity;
                        
                        // Add cost update
                        $update_fields[] = "`{$cost_column}` = ?";
                        $update_values[] = $weighted_avg_cost;
                        
                        // Add updated_at if column exists
                        if (array_key_exists('updated_at', $current_product)) {
                            $update_fields[] = "`updated_at` = NOW()";
                        }
                        
                        // Execute update
                        $update_sql = "UPDATE products SET " . implode(', ', $update_fields) . " WHERE id = ? AND company_id = ?";
                        $update_values[] = $product_id;
                        $update_values[] = $company_id;
                        
                        $stmt = $pdo->prepare($update_sql);
                        $stmt->execute($update_values);
                        
                        $affected_rows = $stmt->rowCount();
                        error_log("✅ Product updated successfully. Rows affected: $affected_rows");
                        
                        // Log inventory movement for tracking
                        error_log("📊 Inventory Movement Log:");
                        error_log("   Product ID: $product_id");
                        error_log("   Transaction: Purchase (Bill: $reference)");
                        error_log("   Quantity Added: $purchased_quantity");
                        error_log("   New Stock Level: $new_total_quantity");
                        error_log("   Cost Price: $current_cost_price → $weighted_avg_cost (Weighted Avg)");
                        
                    } catch (Exception $inventory_error) {
                        error_log("❌ Inventory update failed for product ID $product_id: " . $inventory_error->getMessage());
                        // Continue with purchase creation even if inventory update fails
                    }
                }
            }

            // Create proper journal entries according to accounting principles:
            // Buy inventory → Dr. Inventory, Cr. Accounts Payable (if on credit)
            $resolver = new AccountResolver($pdo, $company_id);
            $inventory_account_id = $resolver->inventory(false); // Use existing account
            $ap_account_id = $resolver->ap(false); // Use existing account
            
            if ($inventory_account_id && $ap_account_id && $total_amount > 0) {
                $journal_lines = [
                    [
                        'account_id' => $inventory_account_id,
                        'debit' => $total_amount,
                        'credit' => 0
                    ],
                    [
                        'account_id' => $ap_account_id,
                        'debit' => 0,
                        'credit' => $total_amount
                    ]
                ];
                
                try {
                    $journal_entry_id = createAutomaticJournalEntry(
                        $pdo,
                        $company_id,
                        'purchase_bill',
                        $bill_id,
                        "Inventory purchase - Bill: $reference",
                        $journal_lines,
                        $bill_date
                    );
                    
                    if ($journal_entry_id) {
                        error_log("✅ Purchase journal entry created (ID: $journal_entry_id): Dr. Inventory $total_amount, Cr. AP $total_amount for Bill $reference");
                    } else {
                        error_log("❌ Failed to create purchase journal entry for Bill $reference");
                    }
                } catch (Exception $journal_error) {
                    error_log("❌ Purchase journal entry failed for Bill $reference: " . $journal_error->getMessage());
                    // Continue with purchase creation even if journal entry fails
                }
            } else {
                error_log("❌ Cannot create purchase journal: Inventory account ($inventory_account_id) or AP account ($ap_account_id) not found, or zero total ($total_amount)");
            }

            $pdo->commit();

            echo json_encode(['success' => true, 'id' => $bill_id, 'reference' => $reference]);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }

    } else if ($method === 'PUT') {
        // Update existing purchase
        $purchase_id = $input['id'] ?? null;
        if (!$purchase_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Purchase ID is required for update']);
            exit;
        }

        // Check if purchase exists and belongs to company
        $stmt = $pdo->prepare("SELECT * FROM purchase_bills WHERE id = ? AND company_id = ?");
        $stmt->execute([$purchase_id, $company_id]);
        $existing_purchase = $stmt->fetch();
        
        if (!$existing_purchase) {
            http_response_code(404);
            echo json_encode(['error' => 'Purchase not found']);
            exit;
        }

        $supplier_id = $input['supplier_id'] ?? $existing_purchase['supplier_id'];
        $bill_date = $input['bill_date'] ?? $existing_purchase['bill_date'];
        $due_date = $input['due_date'] ?? $existing_purchase['due_date'];
        $notes = $input['notes'] ?? $existing_purchase['notes'];
        $items = $input['items'] ?? [];

        $pdo->beginTransaction();

        try {
            // Calculate new totals
            $subtotal = 0;
            $tax_amount = 0;

            foreach ($items as $item) {
                $line_total = $item['quantity'] * $item['unit_cost'];
                $subtotal += $line_total;
                
                // Handle both percentage and fixed tax types
                $tax_type = $item['tax_type'] ?? 'percentage';
                if ($tax_type === 'fixed') {
                    // Fixed tax amount - apply directly
                    $tax_amount += $item['tax_rate'] ?? 0;
                } else {
                    // Percentage tax - apply to line total
                    $tax_amount += $line_total * (($item['tax_rate'] ?? 0) / 100);
                }
            }

            $tax_rate_id = $input['tax_rate_id'] ?? null;
            $total_amount = $subtotal + $tax_amount;

            // Update purchase bill
            $stmt = $pdo->prepare("
                UPDATE purchase_bills 
                SET supplier_id = ?, bill_date = ?, due_date = ?, subtotal = ?, tax = ?, tax_rate_id = ?, total = ?, notes = ?, updated_at = NOW()
                WHERE id = ? AND company_id = ?
            ");
            $stmt->execute([$supplier_id, $bill_date, $due_date, $subtotal, $tax_amount, $tax_rate_id, $total_amount, $notes, $purchase_id, $company_id]);

            // Delete existing purchase lines
            $stmt = $pdo->prepare("DELETE FROM purchase_lines WHERE purchase_id = ?");
            $stmt->execute([$purchase_id]);

            // Insert new purchase lines
            foreach ($items as $item) {
                $line_total = $item['quantity'] * $item['unit_cost'];
                $product_id = ($item['item_type'] === 'existing') ? ($item['product_id'] ?? null) : null;

                $stmt = $pdo->prepare("
                    INSERT INTO purchase_lines (purchase_id, product_id, description, quantity, unit_cost, line_total, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([$purchase_id, $product_id, $item['description'], $item['quantity'], $item['unit_cost'], $line_total]);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'id' => $purchase_id, 'message' => 'Purchase updated successfully']);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }

    } else if ($method === 'DELETE') {
        // Delete purchase
        $purchase_id = $_GET['id'] ?? null;
        if (!$purchase_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Purchase ID is required']);
            exit;
        }

        // Check if purchase exists and belongs to company
        $stmt = $pdo->prepare("SELECT * FROM purchase_bills WHERE id = ? AND company_id = ?");
        $stmt->execute([$purchase_id, $company_id]);
        $existing_purchase = $stmt->fetch();
        
        if (!$existing_purchase) {
            http_response_code(404);
            echo json_encode(['error' => 'Purchase not found']);
            exit;
        }

        $pdo->beginTransaction();

        try {
            // Delete purchase lines first (foreign key constraint)
            $stmt = $pdo->prepare("DELETE FROM purchase_lines WHERE purchase_id = ?");
            $stmt->execute([$purchase_id]);

            // Delete related journal entries if any exist
            $stmt = $pdo->prepare("SELECT id FROM journal_entries WHERE reference_type = 'purchase_bill' AND reference_id = ?");
            $stmt->execute([$purchase_id]);
            $journal_entries = $stmt->fetchAll();

            foreach ($journal_entries as $journal_entry) {
                // Delete journal lines
                $stmt = $pdo->prepare("DELETE FROM journal_lines WHERE journal_id = ?");
                $stmt->execute([$journal_entry['id']]);
                
                // Delete journal entry
                $stmt = $pdo->prepare("DELETE FROM journal_entries WHERE id = ?");
                $stmt->execute([$journal_entry['id']]);
            }

            // Delete the purchase bill
            $stmt = $pdo->prepare("DELETE FROM purchase_bills WHERE id = ? AND company_id = ?");
            $stmt->execute([$purchase_id, $company_id]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Purchase deleted successfully']);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("PURCHASES API ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Exception', 'message' => $e->getMessage()]);
}
?>
