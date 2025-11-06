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
        // Get next expense number for this company and year
        $next_number = getNextExpenseNumber($pdo, $company_id, $current_year);
        
        echo json_encode([
            'success' => true,
            'expense_number' => $next_number,
            'year' => $current_year,
            'company_id' => $company_id
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Reserve/confirm an expense number when creating expense
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['expense_number'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Expense number is required']);
            exit;
        }
        
        $expense_number = $input['expense_number'];
        
        // Confirm this expense number is still available and reserve it
        $confirmed = confirmExpenseNumber($pdo, $company_id, $current_year, $expense_number);
        
        if ($confirmed) {
            echo json_encode([
                'success' => true,
                'message' => 'Expense number confirmed',
                'expense_number' => $expense_number
            ]);
        } else {
            // Number was taken, get the next available one
            $next_number = getNextExpenseNumber($pdo, $company_id, $current_year);
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'Expense number no longer available',
                'suggested_number' => $next_number
            ]);
        }
    }
    
} catch (Exception $e) {
    error_log("Expense Numbers API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

function getNextExpenseNumber($pdo, $company_id, $year) {
    // First, ensure the sequence table exists
    createExpenseSequenceTableIfNotExists($pdo);
    
    $pdo->beginTransaction();
    
    try {
        // Get or create sequence for this company and year
        $stmt = $pdo->prepare("
            SELECT next_number 
            FROM expense_sequences 
            WHERE company_id = ? AND year = ? 
            FOR UPDATE
        ");
        $stmt->execute([$company_id, $year]);
        $sequence = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$sequence) {
            // Create new sequence for this company/year starting at 1
            $stmt = $pdo->prepare("
                INSERT INTO expense_sequences (company_id, year, next_number, created_at, updated_at) 
                VALUES (?, ?, 1, NOW(), NOW())
            ");
            $stmt->execute([$company_id, $year]);
            $next_number = 1;
        } else {
            $next_number = $sequence['next_number'];
        }
        
        // Format: EXP-YYYY-NNNN (e.g., EXP-2025-0001)
        $formatted_number = sprintf("EXP-%s-%04d", $year, $next_number);
        
        // Check if this number already exists in expenses table
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM expenses 
            WHERE company_id = ? AND reference = ?
        ");
        $stmt->execute([$company_id, $formatted_number]);
        $exists = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($exists['count'] > 0) {
            // Number exists, increment and try again
            $stmt = $pdo->prepare("
                UPDATE expense_sequences 
                SET next_number = next_number + 1, updated_at = NOW() 
                WHERE company_id = ? AND year = ?
            ");
            $stmt->execute([$company_id, $year]);
            
            $pdo->commit();
            // Recursive call to get next available number
            return getNextExpenseNumber($pdo, $company_id, $year);
        }
        
        $pdo->commit();
        return $formatted_number;
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function confirmExpenseNumber($pdo, $company_id, $year, $expense_number) {
    // Extract number from format EXP-YYYY-NNNN
    if (!preg_match('/^EXP-(\d{4})-(\d{4})$/', $expense_number, $matches)) {
        return false;
    }
    
    $exp_year = $matches[1];
    $exp_number = intval($matches[2]);
    
    if ($exp_year != $year) {
        return false;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Check if this number is still available
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM expenses 
            WHERE company_id = ? AND reference = ?
        ");
        $stmt->execute([$company_id, $expense_number]);
        $exists = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($exists['count'] > 0) {
            $pdo->rollBack();
            return false; // Already taken
        }
        
        // Update sequence to ensure we don't reuse this number
        $stmt = $pdo->prepare("
            UPDATE expense_sequences 
            SET next_number = GREATEST(next_number, ?) + 1, updated_at = NOW() 
            WHERE company_id = ? AND year = ?
        ");
        $stmt->execute([$exp_number, $company_id, $year]);
        
        $pdo->commit();
        return true;
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function createExpenseSequenceTableIfNotExists($pdo) {
    $sql = "
        CREATE TABLE IF NOT EXISTS expense_sequences (
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
