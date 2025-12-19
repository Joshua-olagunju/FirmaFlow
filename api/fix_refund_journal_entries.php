<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/journal_helpers.php';
require_once __DIR__ . '/../includes/AccountResolver.php';

$email = 'toperotimi@icloud.com';

// Get user's company
$stmt = $pdo->prepare("SELECT company_id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo "User not found\n";
    exit;
}

$company_id = $user['company_id'];
echo "Company ID: $company_id\n\n";

// Find refunds that don't have journal entries (check by notes containing "Refund")
$stmt = $pdo->prepare("
    SELECT p.id, p.reference, p.amount, p.payment_date, p.notes, p.invoice_number
    FROM payments p
    LEFT JOIN journal_entries je ON je.reference_type = 'payment_refund' AND je.reference_id = p.id
    WHERE p.company_id = ?
    AND (p.method = 'refund' OR p.notes LIKE '%Refund%' OR p.reference LIKE 'REF%')
    AND je.id IS NULL
    ORDER BY p.payment_date DESC
");
$stmt->execute([$company_id]);
$refunds_without_journal = $stmt->fetchAll();

if (empty($refunds_without_journal)) {
    echo "✅ No refunds found without journal entries!\n";
    exit;
}

echo "Found " . count($refunds_without_journal) . " refund(s) without journal entries:\n";
echo str_repeat("=", 100) . "\n";

foreach ($refunds_without_journal as $refund) {
    printf("ID: %d | Ref: %s | Amount: ₦%s | Date: %s | Invoice: %s\n",
        $refund['id'],
        $refund['reference'],
        number_format($refund['amount'], 2),
        $refund['payment_date'],
        $refund['invoice_number'] ?: 'N/A'
    );
}

echo str_repeat("=", 100) . "\n";
echo "\nDo you want to create journal entries for these refunds? (y/n): ";
$handle = fopen("php://stdin", "r");
$line = fgets($handle);
fclose($handle);

if (trim(strtolower($line)) !== 'y') {
    echo "\nCancelled. No changes made.\n";
    exit;
}

$pdo->beginTransaction();

try {
    $resolver = new AccountResolver($pdo, $company_id);
    $cash_account_id = $resolver->cash();
    $ar_account_id = $resolver->ar();
    
    if (!$cash_account_id || !$ar_account_id) {
        throw new Exception("Required accounts not found (Cash: $cash_account_id, AR: $ar_account_id)");
    }
    
    $created_count = 0;
    
    foreach ($refunds_without_journal as $refund) {
        $journal_lines = [
            [
                'account_id' => $ar_account_id,
                'debit' => $refund['amount'],  // DEBIT Accounts Receivable
                'credit' => 0
            ],
            [
                'account_id' => $cash_account_id,
                'debit' => 0,
                'credit' => $refund['amount']  // CREDIT Cash
            ]
        ];
        
        $narration = $refund['notes'] ?: "Refund - {$refund['reference']}";
        if ($refund['invoice_number']) {
            $narration .= " (Invoice: {$refund['invoice_number']})";
        }
        
        createAutomaticJournalEntry(
            $pdo,
            $company_id,
            'payment_refund',
            $refund['id'],
            $narration,
            $journal_lines,
            $refund['payment_date']
        );
        
        $created_count++;
        echo "✅ Created journal entry for refund {$refund['reference']}\n";
    }
    
    $pdo->commit();
    
    echo "\n🎉 Successfully created $created_count journal entries!\n";
    echo "Your Trial Balance should now reflect all refunds correctly.\n";
    
} catch (Exception $e) {
    $pdo->rollBack();
    echo "\n❌ Error: " . $e->getMessage() . "\n";
}
