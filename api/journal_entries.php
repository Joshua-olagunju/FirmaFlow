<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            // Get single journal entry with lines
            $stmt = $pdo->prepare("
                SELECT je.*, 
                       (SELECT SUM(debit) FROM journal_lines WHERE journal_id = je.id) as total_debits,
                       (SELECT SUM(credit) FROM journal_lines WHERE journal_id = je.id) as total_credits
                FROM journal_entries je 
                WHERE je.id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $entry = $stmt->fetch();
            
            if ($entry) {
                // Get journal lines
                $stmt = $pdo->prepare("
                    SELECT jl.*, a.code as account_code, a.name as account_name, a.type as account_type
                    FROM journal_lines jl 
                    INNER JOIN accounts a ON jl.account_id = a.id
                    WHERE jl.journal_id = ?
                    ORDER BY jl.id
                ");
                $stmt->execute([$entry['id']]);
                $entry['lines'] = $stmt->fetchAll();
            }
            
            echo json_encode($entry ?: []);
        } else {
            // Get all journal entries
            $company_id = $_GET['company_id'] ?? 1;
            $limit = intval($_GET['limit'] ?? 50);
            $offset = intval($_GET['offset'] ?? 0);
            
            $stmt = $pdo->prepare("
                SELECT je.*, 
                       (SELECT SUM(debit) FROM journal_lines WHERE journal_id = je.id) as total_debits,
                       (SELECT SUM(credit) FROM journal_lines WHERE journal_id = je.id) as total_credits,
                       COUNT(jl.id) as line_count
                FROM journal_entries je 
                LEFT JOIN journal_lines jl ON je.id = jl.journal_id
                WHERE je.company_id = ?
                GROUP BY je.id
                ORDER BY je.entry_date DESC, je.id DESC
                LIMIT $limit OFFSET $offset
            ");
            $stmt->execute([$company_id]);
            $entries = $stmt->fetchAll();
            
            echo json_encode($entries);
        }
        exit;
    }

    if ($method === 'POST') {
        $company_id = $input['company_id'] ?? 1;
        $reference_type = $input['reference_type'] ?? null;
        $reference_id = $input['reference_id'] ?? null;
        $narration = $input['narration'] ?? '';
        $entry_date = $input['entry_date'] ?? date('Y-m-d');
        $lines = $input['lines'] ?? [];

        if (empty($lines)) {
            http_response_code(400);
            echo json_encode(['error' => 'Journal lines required']);
            exit;
        }

        // Validate that debits equal credits
        $totalDebits = 0;
        $totalCredits = 0;
        
        foreach ($lines as $line) {
            $totalDebits += floatval($line['debit'] ?? 0);
            $totalCredits += floatval($line['credit'] ?? 0);
        }
        
        if (abs($totalDebits - $totalCredits) > 0.01) {
            http_response_code(400);
            echo json_encode(['error' => 'Debits must equal credits', 'debits' => $totalDebits, 'credits' => $totalCredits]);
            exit;
        }

        $pdo->beginTransaction();

        try {
            // Insert journal entry
            $stmt = $pdo->prepare("
                INSERT INTO journal_entries (company_id, reference_type, reference_id, narration, entry_date, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$company_id, $reference_type, $reference_id, $narration, $entry_date]);
            $journal_id = $pdo->lastInsertId();

            // Insert journal lines
            $lineStmt = $pdo->prepare("
                INSERT INTO journal_lines (journal_id, account_id, debit, credit, created_at, updated_at) 
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ");

            foreach ($lines as $line) {
                $account_id = $line['account_id'];
                $debit = floatval($line['debit'] ?? 0);
                $credit = floatval($line['credit'] ?? 0);

                // Validate that line has either debit or credit, not both
                if ($debit > 0 && $credit > 0) {
                    throw new Exception('A line cannot have both debit and credit amounts');
                }
                
                if ($debit == 0 && $credit == 0) {
                    throw new Exception('A line must have either debit or credit amount');
                }

                $lineStmt->execute([$journal_id, $account_id, $debit, $credit]);
            }

            $pdo->commit();

            // Return the created entry
            $stmt = $pdo->prepare("
                SELECT je.*, 
                       (SELECT SUM(debit) FROM journal_lines WHERE journal_id = je.id) as total_debits,
                       (SELECT SUM(credit) FROM journal_lines WHERE journal_id = je.id) as total_credits
                FROM journal_entries je 
                WHERE je.id = ?
            ");
            $stmt->execute([$journal_id]);
            $entry = $stmt->fetch();
            
            // Get journal lines
            $stmt = $pdo->prepare("
                SELECT jl.*, a.code as account_code, a.name as account_name 
                FROM journal_lines jl 
                INNER JOIN accounts a ON jl.account_id = a.id
                WHERE jl.journal_id = ?
            ");
            $stmt->execute([$journal_id]);
            $entry['lines'] = $stmt->fetchAll();

            echo json_encode($entry);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        exit;
    }

    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'id required']);
            exit;
        }
        
        $id = (int)$_GET['id'];
        
        $pdo->beginTransaction();
        
        try {
            // Delete journal lines first
            $stmt = $pdo->prepare("DELETE FROM journal_lines WHERE journal_id = ?");
            $stmt->execute([$id]);
            
            // Delete journal entry
            $stmt = $pdo->prepare("DELETE FROM journal_entries WHERE id = ?");
            $stmt->execute([$id]);
            
            $pdo->commit();
            echo json_encode(['success' => true]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'method not allowed']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'exception', 'message' => $e->getMessage()]);
}

// Helper function to create automatic journal entries
function createAutomaticJournalEntry($pdo, $company_id, $reference_type, $reference_id, $narration, $lines, $entry_date = null) {
    if (!$entry_date) {
        $entry_date = date('Y-m-d');
    }
    
    // Validate that debits equal credits
    $totalDebits = 0;
    $totalCredits = 0;
    
    foreach ($lines as $line) {
        $totalDebits += floatval($line['debit'] ?? 0);
        $totalCredits += floatval($line['credit'] ?? 0);
    }
    
    if (abs($totalDebits - $totalCredits) > 0.01) {
        throw new Exception('Debits must equal credits in journal entry');
    }

    // Insert journal entry with all required fields
    $stmt = $pdo->prepare("
        INSERT INTO journal_entries (company_id, reference_type, reference_id, narration, is_posted, total_amount, entry_date, created_at, updated_at) 
        VALUES (?, ?, ?, ?, 1, ?, ?, NOW(), NOW())
    ");
    $stmt->execute([$company_id, $reference_type, $reference_id, $narration, $totalDebits, $entry_date]);
    $journal_id = $pdo->lastInsertId();

    // Insert journal lines
    $lineStmt = $pdo->prepare("
        INSERT INTO journal_lines (journal_id, account_id, debit, credit, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
    ");

    foreach ($lines as $line) {
        $lineStmt->execute([
            $journal_id, 
            $line['account_id'], 
            floatval($line['debit'] ?? 0), 
            floatval($line['credit'] ?? 0)
        ]);
    }
    
    return $journal_id;
}
?>
