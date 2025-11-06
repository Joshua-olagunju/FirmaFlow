<?php
// Journal entry helper functions

function createAutomaticJournalEntry($pdo, $company_id, $reference_type, $reference_id, $narration, $journal_lines, $entry_date) {
    try {
        // Validate double-entry accounting rules
        if (empty($journal_lines) || count($journal_lines) < 2) {
            throw new Exception("Journal entry must have at least 2 lines for double-entry");
        }
        
        $total_debits = 0;
        $total_credits = 0;
        
        foreach ($journal_lines as $line) {
            if (empty($line['account_id']) || !is_numeric($line['account_id'])) {
                throw new Exception("Invalid account_id in journal line");
            }
            
            $debit = floatval($line['debit'] ?? 0);
            $credit = floatval($line['credit'] ?? 0);
            
            // Ensure a line has either debit OR credit, not both
            if ($debit > 0 && $credit > 0) {
                throw new Exception("Journal line cannot have both debit and credit amounts");
            }
            
            // Ensure a line has some amount
            if ($debit <= 0 && $credit <= 0) {
                throw new Exception("Journal line must have either a debit or credit amount");
            }
            
            $total_debits += $debit;
            $total_credits += $credit;
        }
        
        // Validate that debits equal credits (fundamental accounting equation)
        if (abs($total_debits - $total_credits) > 0.01) {
            throw new Exception("Debits ($total_debits) must equal Credits ($total_credits) for balanced entry");
        }
        
        // Calculate total amount (use debit total)
        $total_amount = $total_debits;
        
        // Check if there's already an active transaction
        $transactionStarted = false;
        if (!$pdo->inTransaction()) {
            $pdo->beginTransaction();
            $transactionStarted = true;
        }
        
        // Insert journal entry
        $stmt = $pdo->prepare("
            INSERT INTO journal_entries (company_id, reference_type, reference_id, narration, is_posted, total_amount, entry_date, created_at, updated_at) 
            VALUES (?, ?, ?, ?, 1, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$company_id, $reference_type, $reference_id, $narration, $total_amount, $entry_date]);
        $journal_id = $pdo->lastInsertId();
        
        // Insert journal lines
        $lineStmt = $pdo->prepare("
            INSERT INTO journal_lines (journal_id, account_id, debit, credit, created_at, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW())
        ");
        
        foreach ($journal_lines as $line) {
            $lineStmt->execute([
                $journal_id,
                $line['account_id'],
                floatval($line['debit'] ?? 0),
                floatval($line['credit'] ?? 0)
            ]);
        }
        
        // Only commit if we started the transaction
        if ($transactionStarted) {
            $pdo->commit();
        }
        
        // Log successful creation
        error_log("✅ Journal Entry Created: ID=$journal_id, Type=$reference_type, RefID=$reference_id, Debits=$total_debits, Credits=$total_credits");
        
        return $journal_id;
        
    } catch (Exception $e) {
        // Only rollback if we started the transaction
        if ($transactionStarted && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        
        error_log("❌ Journal Entry Failed: Type=$reference_type, RefID=$reference_id, Error=" . $e->getMessage());
        throw new Exception("Failed to create journal entry: " . $e->getMessage());
    }
}
?>
