<?php
require_once __DIR__ . '/../includes/db.php';

$email = 'toperotimi@icloud.com';

// Get user's company
$stmt = $pdo->prepare("SELECT company_id, first_name, last_name FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo "User not found with email: $email\n";
    exit;
}

$company_id = $user['company_id'];
echo "User: {$user['first_name']} {$user['last_name']}\n";
echo "Company ID: $company_id\n\n";

// Get all journal entries for this company
$stmt = $pdo->prepare("
    SELECT 
        je.id,
        je.entry_date,
        je.narration,
        je.reference_type,
        je.reference_id,
        jl.account_id,
        a.code,
        a.name,
        a.type,
        jl.debit,
        jl.credit
    FROM journal_entries je
    JOIN journal_lines jl ON je.id = jl.journal_id
    JOIN accounts a ON jl.account_id = a.id
    WHERE je.company_id = ?
    ORDER BY je.entry_date, je.id, jl.id
");
$stmt->execute([$company_id]);
$entries = $stmt->fetchAll();

if (empty($entries)) {
    echo "No journal entries found for this company.\n\n";
} else {
    echo "Journal Entries Found:\n";
    echo str_repeat("=", 100) . "\n";
    
    $current_entry = null;
    foreach ($entries as $line) {
        if ($current_entry != $line['id']) {
            if ($current_entry !== null) echo "\n";
            echo "\nEntry #{$line['id']} - {$line['entry_date']} - {$line['narration']} ({$line['reference_type']} #{$line['reference_id']})\n";
            echo str_repeat("-", 100) . "\n";
            $current_entry = $line['id'];
        }
        
        $debit = $line['debit'] > 0 ? "₦" . number_format($line['debit'], 2) : "";
        $credit = $line['credit'] > 0 ? "₦" . number_format($line['credit'], 2) : "";
        
        printf("  %-10s %-30s | Debit: %-15s | Credit: %-15s\n", 
            $line['code'], 
            $line['name'], 
            $debit, 
            $credit
        );
    }
    echo "\n";
}

// Calculate totals
$stmt = $pdo->prepare("
    SELECT 
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(jl.debit), 0) as total_debits,
        COALESCE(SUM(jl.credit), 0) as total_credits
    FROM accounts a
    LEFT JOIN journal_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_id = je.id
    WHERE a.company_id = ?
    GROUP BY a.id
    HAVING total_debits > 0 OR total_credits > 0
    ORDER BY a.code
");
$stmt->execute([$company_id]);
$accounts = $stmt->fetchAll();

echo "\nAccount Balances Summary:\n";
echo str_repeat("=", 100) . "\n";
$grand_debits = 0;
$grand_credits = 0;

foreach ($accounts as $acc) {
    $debits = floatval($acc['total_debits']);
    $credits = floatval($acc['total_credits']);
    $grand_debits += $debits;
    $grand_credits += $credits;
    
    printf("%-10s %-30s %-12s | Debits: ₦%-12s | Credits: ₦%-12s\n",
        $acc['code'],
        $acc['name'],
        "({$acc['type']})",
        number_format($debits, 2),
        number_format($credits, 2)
    );
}

echo str_repeat("=", 100) . "\n";
printf("%-54s | Debits: ₦%-12s | Credits: ₦%-12s\n",
    "TOTALS:",
    number_format($grand_debits, 2),
    number_format($grand_credits, 2)
);
echo str_repeat("=", 100) . "\n";

$difference = abs($grand_debits - $grand_credits);
if ($difference < 0.01) {
    echo "✅ Books are balanced!\n";
} else {
    echo "⚠️ Books are OUT OF BALANCE by ₦" . number_format($difference, 2) . "\n";
}
