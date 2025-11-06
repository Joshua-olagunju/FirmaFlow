<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

require_once __DIR__ . '/../includes/db.php';

$company_id = $_SESSION['company_id'];
$current_year = date('Y');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get next invoice number for this company and year
        $next_number = getNextInvoiceNumber($pdo, $company_id, $current_year);
        
        echo json_encode([
            'success' => true,
            'invoice_number' => $next_number,
            'year' => $current_year,
            'company_id' => $company_id
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Reserve/confirm an invoice number when creating invoice
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['invoice_number'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invoice number is required']);
            exit;
        }
        
        $invoice_number = $input['invoice_number'];
        
        // Confirm this invoice number is still available and reserve it
        $confirmed = confirmInvoiceNumber($pdo, $company_id, $current_year, $invoice_number);
        
        if ($confirmed) {
            echo json_encode([
                'success' => true,
                'message' => 'Invoice number confirmed',
                'invoice_number' => $invoice_number
            ]);
        } else {
            // Number was taken, get the next available one
            $next_number = getNextInvoiceNumber($pdo, $company_id, $current_year);
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'Invoice number no longer available',
                'suggested_number' => $next_number
            ]);
        }
    }
    
} catch (Exception $e) {
    error_log("Invoice Numbers API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

function getNextInvoiceNumber($pdo, $company_id, $year) {
    // First, ensure the sequence table exists
    createSequenceTableIfNotExists($pdo);
    
    $pdo->beginTransaction();
    
    try {
        // Get or create sequence for this company and year
        $stmt = $pdo->prepare("
            SELECT next_number 
            FROM invoice_sequences 
            WHERE company_id = ? AND year = ? 
            FOR UPDATE
        ");
        $stmt->execute([$company_id, $year]);
        $sequence = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$sequence) {
            // Create new sequence for this company/year starting at 1
            $stmt = $pdo->prepare("
                INSERT INTO invoice_sequences (company_id, year, next_number, created_at, updated_at) 
                VALUES (?, ?, 1, NOW(), NOW())
            ");
            $stmt->execute([$company_id, $year]);
            $next_number = 1;
        } else {
            $next_number = $sequence['next_number'];
        }
        
        // Format: INV-YYYY-NNNN (e.g., INV-2025-0001)
        $formatted_number = sprintf("INV-%s-%04d", $year, $next_number);
        
        // Check if this number already exists in sales_invoices
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM sales_invoices 
            WHERE company_id = ? AND invoice_no = ?
        ");
        $stmt->execute([$company_id, $formatted_number]);
        $exists = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($exists['count'] > 0) {
            // Number exists, increment and try again
            $stmt = $pdo->prepare("
                UPDATE invoice_sequences 
                SET next_number = next_number + 1, updated_at = NOW() 
                WHERE company_id = ? AND year = ?
            ");
            $stmt->execute([$company_id, $year]);
            
            $pdo->commit();
            // Recursive call to get next available number
            return getNextInvoiceNumber($pdo, $company_id, $year);
        }
        
        $pdo->commit();
        return $formatted_number;
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function confirmInvoiceNumber($pdo, $company_id, $year, $invoice_number) {
    // Extract number from format INV-YYYY-NNNN
    if (!preg_match('/^INV-(\d{4})-(\d{4})$/', $invoice_number, $matches)) {
        return false;
    }
    
    $inv_year = $matches[1];
    $inv_number = intval($matches[2]);
    
    if ($inv_year != $year) {
        return false;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Check if this number is still available
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM sales_invoices 
            WHERE company_id = ? AND invoice_no = ?
        ");
        $stmt->execute([$company_id, $invoice_number]);
        $exists = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($exists['count'] > 0) {
            $pdo->rollBack();
            return false; // Already taken
        }
        
        // Update sequence to ensure we don't reuse this number
        $stmt = $pdo->prepare("
            UPDATE invoice_sequences 
            SET next_number = GREATEST(next_number, ?) + 1, updated_at = NOW() 
            WHERE company_id = ? AND year = ?
        ");
        $stmt->execute([$inv_number, $company_id, $year]);
        
        $pdo->commit();
        return true;
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function createSequenceTableIfNotExists($pdo) {
    $sql = "
        CREATE TABLE IF NOT EXISTS invoice_sequences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT NOT NULL,
            year YEAR NOT NULL,
            next_number INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_company_year (company_id, year),
            INDEX idx_company_year (company_id, year)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($sql);
}
?>
