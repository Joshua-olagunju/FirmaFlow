<?php
require_once __DIR__ . '/../includes/db.php';

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

// Find orphaned journal entries (product_opening type where product no longer exists)
$stmt = $pdo->prepare("
    SELECT je.id, je.reference_id, je.entry_date, je.narration, je.total_amount
    FROM journal_entries je
    LEFT JOIN products p ON je.reference_id = p.id
    WHERE je.company_id = ?
    AND je.reference_type = 'product_opening'
    AND p.id IS NULL
");
$stmt->execute([$company_id]);
$orphaned = $stmt->fetchAll();

if (empty($orphaned)) {
    echo "✅ No orphaned journal entries found!\n";
    exit;
}

echo "Found " . count($orphaned) . " orphaned journal entries:\n";
echo str_repeat("=", 80) . "\n";

foreach ($orphaned as $entry) {
    echo "Entry ID: {$entry['id']}\n";
    echo "Date: {$entry['entry_date']}\n";
    echo "Narration: {$entry['narration']}\n";
    echo "Amount: ₦" . number_format($entry['total_amount'], 2) . "\n";
    echo str_repeat("-", 80) . "\n";
}

echo "\nDo you want to delete these orphaned entries? (y/n): ";
$handle = fopen("php://stdin", "r");
$line = fgets($handle);
fclose($handle);

if (trim(strtolower($line)) === 'y') {
    $pdo->beginTransaction();
    
    try {
        $ids = array_column($orphaned, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        
        // Delete journal lines first
        $stmt = $pdo->prepare("DELETE FROM journal_lines WHERE journal_id IN ($placeholders)");
        $stmt->execute($ids);
        $lines_deleted = $stmt->rowCount();
        
        // Delete journal entries
        $stmt = $pdo->prepare("DELETE FROM journal_entries WHERE id IN ($placeholders)");
        $stmt->execute($ids);
        $entries_deleted = $stmt->rowCount();
        
        $pdo->commit();
        
        echo "\n✅ Deleted:\n";
        echo "   - $entries_deleted journal entries\n";
        echo "   - $lines_deleted journal lines\n";
        echo "\n🎉 Your Trial Balance should now show ₦0.00!\n";
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo "\n❌ Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "\nCancelled. No changes made.\n";
}
