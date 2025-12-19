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

// Get all payments and refunds
$stmt = $pdo->prepare("
    SELECT 
        id,
        reference,
        type,
        method,
        amount,
        payment_date,
        status,
        notes,
        invoice_number
    FROM payments
    WHERE company_id = ?
    ORDER BY payment_date DESC, id DESC
");
$stmt->execute([$company_id]);
$payments = $stmt->fetchAll();

echo "All Payments & Refunds:\n";
echo str_repeat("=", 120) . "\n";

foreach ($payments as $p) {
    printf("ID: %-4d | Ref: %-10s | Type: %-10s | Method: %-10s | Amount: ₦%-12s | Date: %s | Status: %-10s | Invoice: %s\n",
        $p['id'],
        $p['reference'],
        $p['type'],
        $p['method'],
        number_format($p['amount'], 2),
        $p['payment_date'],
        $p['status'],
        $p['invoice_number'] ?: 'N/A'
    );
    if ($p['notes']) {
        echo "   Notes: {$p['notes']}\n";
    }
    echo str_repeat("-", 120) . "\n";
}
