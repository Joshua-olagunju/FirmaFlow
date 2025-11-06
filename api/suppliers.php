<?php
// Start session first
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

// Check authentication
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

$company_id = $_SESSION['company_id'];
$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            // Get single supplier
            $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $supplier = $stmt->fetch();
            
            if ($supplier) {
                // Get total amount owed to supplier
                $stmt = $pdo->prepare("
                    SELECT COALESCE(SUM(total - amount_paid), 0) as balance_due
                    FROM purchase_bills 
                    WHERE supplier_id = ? AND status != 'cancelled'
                ");
                $stmt->execute([$supplier['id']]);
                $balance = $stmt->fetch();
                $supplier['balance_due'] = floatval($balance['balance_due']);
                
                // Get recent purchases count
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as purchase_count
                    FROM purchase_bills 
                    WHERE supplier_id = ? AND bill_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                ");
                $stmt->execute([$supplier['id']]);
                $purchases = $stmt->fetch();
                $supplier['recent_purchases'] = intval($purchases['purchase_count']);
            }
            
            echo json_encode($supplier ?: []);
        } else {
            // Get all suppliers
            $search = $_GET['search'] ?? '';
            
            $sql = "
                SELECT s.*, 
                       COALESCE(SUM(pb.total - pb.amount_paid), 0) as balance_due,
                       COUNT(pb.id) as total_bills
                FROM suppliers s 
                LEFT JOIN purchase_bills pb ON s.id = pb.supplier_id AND pb.status != 'cancelled'
                WHERE s.company_id = ?
            ";
            
            $params = [$company_id];
            
            if ($search) {
                $sql .= " AND (s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            $sql .= " GROUP BY s.id ORDER BY s.name";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $suppliers = $stmt->fetchAll();
            
            echo json_encode($suppliers);
        }
    } else if ($method === 'POST') {
        $name = $input['name'] ?? '';
        $email = $input['email'] ?? '';
        $phone = $input['phone'] ?? '';
        $address = $input['address'] ?? '';
        $tax_number = $input['tax_number'] ?? '';
        $contact_person = $input['contact_person'] ?? '';
        $payment_terms = $input['payment_terms'] ?? 'Net 30';
        $is_active = $input['is_active'] ?? 1;

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['error' => 'name required']);
            exit;
        }

        // Check for duplicate name
        $stmt = $pdo->prepare("SELECT id FROM suppliers WHERE name = ? AND company_id = ?");
        $stmt->execute([$name, $company_id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Supplier name already exists']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO suppliers (company_id, name, email, phone, address, tax_number, contact_person, payment_terms, is_active, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$company_id, $name, $email, $phone, $address, $tax_number, $contact_person, $payment_terms, $is_active]);
        
        $supplier_id = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE id = ?");
        $stmt->execute([$supplier_id]);
        $supplier = $stmt->fetch();
        $supplier['balance_due'] = 0;
        $supplier['recent_purchases'] = 0;
        
        echo json_encode($supplier);
        
    } else if ($method === 'PUT') {
        $id = $_GET['id'] ?? $input['id'] ?? 0;
        $name = $input['name'] ?? '';
        $email = $input['email'] ?? '';
        $phone = $input['phone'] ?? '';
        $address = $input['address'] ?? '';
        $tax_number = $input['tax_number'] ?? '';
        $contact_person = $input['contact_person'] ?? '';
        $payment_terms = $input['payment_terms'] ?? 'Net 30';
        $is_active = $input['is_active'] ?? 1;

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['error' => 'name required']);
            exit;
        }

        // Check for duplicate name (excluding current supplier)
        $stmt = $pdo->prepare("SELECT id FROM suppliers WHERE name = ? AND id != ? AND company_id = ?");
        $stmt->execute([$name, $id, $company_id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Supplier name already exists']);
            exit;
        }

        $stmt = $pdo->prepare("
            UPDATE suppliers 
            SET name = ?, email = ?, phone = ?, address = ?, tax_number = ?, 
                contact_person = ?, payment_terms = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$name, $email, $phone, $address, $tax_number, $contact_person, $payment_terms, $is_active, $id]);

        // Get updated supplier
        $stmt = $pdo->prepare("
            SELECT s.*, 
                   COALESCE(SUM(pb.total - pb.amount_paid), 0) as balance_due,
                   COUNT(pb.id) as total_bills
            FROM suppliers s 
            LEFT JOIN purchase_bills pb ON s.id = pb.supplier_id AND pb.status != 'cancelled'
            WHERE s.id = ?
            GROUP BY s.id
        ");
        $stmt->execute([$id]);
        $supplier = $stmt->fetch();
        
        echo json_encode($supplier);
        
    } else if ($method === 'DELETE') {
        $id = $_GET['id'] ?? 0;

        // Check if supplier has purchase bills
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM purchase_bills WHERE supplier_id = ? AND company_id = ?");
        $stmt->execute([$id, $company_id]);
        $result = $stmt->fetch();
        
        if ($result['count'] > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete supplier with existing purchase bills']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM suppliers WHERE id = ? AND company_id = ?");
        $stmt->execute([$id, $company_id]);        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'exception', 'message' => $e->getMessage()]);
}
?>
