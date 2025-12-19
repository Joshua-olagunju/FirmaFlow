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

// Check what actually exists
echo "=== CURRENT RECORDS ===\n\n";

// Check invoices
$stmt = $pdo->prepare("SELECT COUNT(*) FROM sales_invoices WHERE company_id = ?");
$stmt->execute([$company_id]);
$invoice_count = $stmt->fetchColumn();
echo "Sales Invoices: $invoice_count\n";

// Check payments
$stmt = $pdo->prepare("SELECT COUNT(*) FROM payments WHERE company_id = ?");
$stmt->execute([$company_id]);
$payment_count = $stmt->fetchColumn();
echo "Payments: $payment_count\n";

// Check purchases
try {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM purchase_invoices WHERE company_id = ?");
    $stmt->execute([$company_id]);
    $purchase_count = $stmt->fetchColumn();
    echo "Purchase Invoices: $purchase_count\n\n";
} catch (Exception $e) {
    echo "Purchase Invoices: Table doesn't exist\n\n";
    $purchase_count = 0;
}

echo "=== ORPHANED JOURNAL ENTRIES ===\n\n";

// Find orphaned journal entries
$orphaned = [];

// 1. Sales invoice entries where invoice doesn't exist
$stmt = $pdo->prepare("
    SELECT je.id, je.reference_type, je.reference_id, je.entry_date, je.narration, je.total_amount
    FROM journal_entries je
    LEFT JOIN sales_invoices si ON je.reference_id = si.id
    WHERE je.company_id = ?
    AND je.reference_type IN ('sales_invoice', 'sales_cogs')
    AND si.id IS NULL
");
$stmt->execute([$company_id]);
$orphaned_sales = $stmt->fetchAll();
if (!empty($orphaned_sales)) {
    echo "Orphaned SALES INVOICE entries: " . count($orphaned_sales) . "\n";
    foreach ($orphaned_sales as $entry) {
        echo "  - Entry #{$entry['id']}: {$entry['narration']} (₦" . number_format($entry['total_amount'], 2) . ")\n";
        $orphaned[] = $entry['id'];
    }
    echo "\n";
}

// 2. Payment entries where payment doesn't exist
$stmt = $pdo->prepare("
    SELECT je.id, je.reference_type, je.reference_id, je.entry_date, je.narration, je.total_amount
    FROM journal_entries je
    LEFT JOIN payments p ON je.reference_id = p.id
    WHERE je.company_id = ?
    AND je.reference_type IN ('payment', 'payment_refund')
    AND p.id IS NULL
");
$stmt->execute([$company_id]);
$orphaned_payments = $stmt->fetchAll();
if (!empty($orphaned_payments)) {
    echo "Orphaned PAYMENT entries: " . count($orphaned_payments) . "\n";
    foreach ($orphaned_payments as $entry) {
        echo "  - Entry #{$entry['id']}: {$entry['narration']} (₦" . number_format($entry['total_amount'], 2) . ")\n";
        $orphaned[] = $entry['id'];
    }
    echo "\n";
}

// 3. Purchase entries where purchase doesn't exist
if ($purchase_count > 0) {
    try {
        $stmt = $pdo->prepare("
            SELECT je.id, je.reference_type, je.reference_id, je.entry_date, je.narration, je.total_amount
            FROM journal_entries je
            LEFT JOIN purchase_invoices pi ON je.reference_id = pi.id
            WHERE je.company_id = ?
            AND je.reference_type = 'purchase_bill'
            AND pi.id IS NULL
        ");
        $stmt->execute([$company_id]);
        $orphaned_purchases = $stmt->fetchAll();
        if (!empty($orphaned_purchases)) {
            echo "Orphaned PURCHASE entries: " . count($orphaned_purchases) . "\n";
            foreach ($orphaned_purchases as $entry) {
                echo "  - Entry #{$entry['id']}: {$entry['narration']} (₦" . number_format($entry['total_amount'], 2) . ")\n";
                $orphaned[] = $entry['id'];
            }
            echo "\n";
        }
    } catch (Exception $e) {
        // Skip if table doesn't exist
    }
}

if (empty($orphaned)) {
    echo "✅ No orphaned journal entries found!\n";
    exit;
}

echo str_repeat("=", 80) . "\n";
echo "Total orphaned entries: " . count($orphaned) . "\n\n";

echo "Do you want to DELETE all these orphaned journal entries? (y/n): ";
$handle = fopen("php://stdin", "r");
$line = fgets($handle);
fclose($handle);

if (trim(strtolower($line)) !== 'y') {
    echo "\nCancelled. No changes made.\n";
    exit;
}

$pdo->beginTransaction();

try {
    $placeholders = implode(',', array_fill(0, count($orphaned), '?'));
    
    // Delete journal lines first
    $stmt = $pdo->prepare("DELETE FROM journal_lines WHERE journal_id IN ($placeholders)");
    $stmt->execute($orphaned);
    $lines_deleted = $stmt->rowCount();
    
    // Delete journal entries
    $stmt = $pdo->prepare("DELETE FROM journal_entries WHERE id IN ($placeholders)");
    $stmt->execute($orphaned);
    $entries_deleted = $stmt->rowCount();
    
    $pdo->commit();
    
    echo "\n✅ CLEANED UP:\n";
    echo "   - Deleted $entries_deleted journal entries\n";
    echo "   - Deleted $lines_deleted journal lines\n";
    echo "\n🎉 Your Trial Balance should now be clean!\n";
    
} catch (Exception $e) {
    $pdo->rollBack();
    echo "\n❌ Error: " . $e->getMessage() . "\n";
}
