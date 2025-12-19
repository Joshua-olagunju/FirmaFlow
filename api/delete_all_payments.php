<?php
require_once __DIR__ . '/../includes/db.php';

$email = 'toperotimi@icloud.com';

$stmt = $pdo->prepare("SELECT company_id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo "User not found\n";
    exit;
}

$company_id = $user['company_id'];
echo "Company ID: $company_id\n\n";

// Get all payments
$stmt = $pdo->prepare("SELECT id, reference, amount, payment_date, notes FROM payments WHERE company_id = ? ORDER BY id");
$stmt->execute([$company_id]);
$payments = $stmt->fetchAll();

echo "Found " . count($payments) . " payment(s):\n";
echo str_repeat("=", 100) . "\n";

foreach ($payments as $p) {
    printf("ID: %d | Ref: %s | Amount: ₦%s | Date: %s\n",
        $p['id'],
        $p['reference'],
        number_format($p['amount'], 2),
        $p['payment_date']
    );
    if ($p['notes']) echo "   Notes: {$p['notes']}\n";
}

echo str_repeat("=", 100) . "\n";
echo "\nDo you want to DELETE ALL these payments AND their journal entries? (y/n): ";
$handle = fopen("php://stdin", "r");
$line = fgets($handle);
fclose($handle);

if (trim(strtolower($line)) !== 'y') {
    echo "\nCancelled. No changes made.\n";
    exit;
}

$pdo->beginTransaction();

try {
    $payment_ids = array_column($payments, 'id');
    
    if (!empty($payment_ids)) {
        $placeholders = implode(',', array_fill(0, count($payment_ids), '?'));
        
        // Find and delete journal entries for these payments
        $stmt = $pdo->prepare("SELECT id FROM journal_entries WHERE company_id = ? AND reference_type IN ('payment', 'payment_refund') AND reference_id IN ($placeholders)");
        $stmt->execute(array_merge([$company_id], $payment_ids));
        $journal_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($journal_ids)) {
            $je_placeholders = implode(',', array_fill(0, count($journal_ids), '?'));
            
            // Delete journal lines
            $stmt = $pdo->prepare("DELETE FROM journal_lines WHERE journal_id IN ($je_placeholders)");
            $stmt->execute($journal_ids);
            $lines_deleted = $stmt->rowCount();
            
            // Delete journal entries
            $stmt = $pdo->prepare("DELETE FROM journal_entries WHERE id IN ($je_placeholders)");
            $stmt->execute($journal_ids);
            $je_deleted = $stmt->rowCount();
            
            echo "Deleted $je_deleted journal entries and $lines_deleted journal lines\n";
        }
        
        // Delete payments
        $stmt = $pdo->prepare("DELETE FROM payments WHERE id IN ($placeholders)");
        $stmt->execute($payment_ids);
        $payments_deleted = $stmt->rowCount();
        
        echo "Deleted $payments_deleted payments\n";
    }
    
    $pdo->commit();
    
    echo "\n✅ Successfully deleted all payments and their journal entries!\n";
    echo "🎉 Your Trial Balance should now show ₦0.00!\n";
    
} catch (Exception $e) {
    $pdo->rollBack();
    echo "\n❌ Error: " . $e->getMessage() . "\n";
}
