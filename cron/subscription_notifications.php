<?php
/**
 * Subscription Expiry Email Notifications Cron Job
 *
 * Works with:
 *  - users.subscription_end_date (preferred)
 *  - fallback to latest subscription_payments.subscription_end (if users.subscription_end_date is NULL)
 *
 * Save as:
 * /home/wiyzwzpp/public_html/cron/subscription_notifications.php
 *
 * Run with the same PHP binary your cron uses, e.g.:
 * /usr/local/bin/ea-php83 /home/wiyzwzpp/public_html/cron/subscription_notifications.php
 */

declare(strict_types=1);
date_default_timezone_set('Africa/Lagos');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/email_helper.php';

echo "=== FirmaFlow Subscription Notification Cron Job ===\n";
echo "Started at: " . date('Y-m-d H:i:s') . "\n\n";

// Basic environment checks
if (!isset($pdo) || !$pdo) {
    echo "❌ Database connection (\$pdo) not available. Check includes/db.php\n";
    exit(1);
}

if (!class_exists('EmailHelper')) {
    echo "❌ EmailHelper class not found!\n";
    exit(1);
}
if (!method_exists('EmailHelper', 'sendExpiryWarning') || !method_exists('EmailHelper', 'sendExpiryNotice')) {
    echo "❌ Required EmailHelper methods not found (sendExpiryWarning/sendExpiryNotice)!\n";
    exit(1);
}

echo "✅ Environment OK — EmailHelper available, DB connection present.\n\n";

/**
 * Configuration
 */
$targetRoles = ['admin']; // change to ['admin','manager'] or [] to include more roles
$daysToNotify = [7, 3, 1]; // days before expiry to notify

/**
 * Helper: fetch users with an effective_end_date (either users.subscription_end_date
 * or the latest subscription_payments.subscription_end for that user)
 *
 * We compute effective_end_date using a scalar subquery and then use HAVING to filter.
 */
function fetchUsersWithEffectiveEnd(PDO $pdo, int $dayOffset, array $roles = ['admin']): array
{
    // Build role placeholder list for readability (we will filter post-query if roles empty)
    $rolePlaceholders = implode(',', array_fill(0, count($roles), '?'));
    $sql = "
        SELECT 
            u.id,
            u.email,
            u.first_name,
            u.last_name,
            u.subscription_plan,
            u.subscription_status,
            u.role,
            c.name AS company_name,
            COALESCE(
                u.subscription_end_date,
                (
                    SELECT MAX(sp.subscription_end)
                    FROM subscription_payments sp
                    WHERE sp.user_id = u.id
                      AND sp.status IN ('success', 'completed', 'paid') -- common success states
                )
            ) AS effective_end_date
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.email IS NOT NULL
    ";

    // We'll allow role filtering after query if $roles is empty; otherwise bind placeholders and use HAVING
    $sql .= " HAVING effective_end_date IS NOT NULL AND DATE(effective_end_date) = DATE_ADD(CURDATE(), INTERVAL ? DAY)";

    $stmt = $pdo->prepare($sql);

    // Bind: first the role params (if any) — but since we didn't inject role placeholders in WHERE, we skip that.
    // We'll only bind the day param for the INTERVAL.
    $stmt->execute([$dayOffset]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function fetchExpiredUsers(PDO $pdo): array
{
    $sql = "
        SELECT 
            u.id,
            u.email,
            u.first_name,
            u.last_name,
            u.subscription_plan,
            u.subscription_status,
            u.role,
            c.name AS company_name,
            COALESCE(
                u.subscription_end_date,
                (
                    SELECT MAX(sp.subscription_end)
                    FROM subscription_payments sp
                    WHERE sp.user_id = u.id
                      AND sp.status IN ('success','completed','paid')
                )
            ) AS effective_end_date
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        HAVING effective_end_date IS NOT NULL AND DATE(effective_end_date) < CURDATE()
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Send notifications for the given rows using EmailHelper.
 * EmailHelper::sendExpiryWarning($email, $fullName, $plan, $endDate, $daysRemaining)
 */
function notifyAndReport(array $rows, int $days): array
{
    $sent = 0; $failed = 0;
    foreach ($rows as $r) {
        $email = $r['email'] ?? null;
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $failed++;
            continue;
        }
        $fullName = trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? ''));
        $plan = $r['subscription_plan'] ?? 'N/A';
        $endDate = $r['effective_end_date'];

        try {
            $ok = EmailHelper::sendExpiryWarning($email, $fullName, ucfirst($plan), $endDate, $days);
            if ($ok) {
                echo "✅ Sent {$days}-day warning to: {$email} ({$r['company_name']})\n";
                $sent++;
            } else {
                echo "❌ Failed to send {$days}-day warning to: {$email}\n";
                $failed++;
            }
        } catch (Throwable $e) {
            echo "❌ Error sending {$days}-day warning to {$email}: " . $e->getMessage() . "\n";
            $failed++;
        }
        // throttle slightly
        usleep(150000);
    }
    return ['sent' => $sent, 'failed' => $failed];
}

/**
 * Send expiry notices and mark users as expired
 */
function processExpiredUsers(PDO $pdo, array $rows): array
{
    $sent = 0; $failed = 0; $updated = 0;
    foreach ($rows as $r) {
        $email = $r['email'] ?? null;
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $failed++;
            continue;
        }
        $fullName = trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? ''));
        $plan = $r['subscription_plan'] ?? 'N/A';

        try {
            $ok = EmailHelper::sendExpiryNotice($email, $fullName, ucfirst($plan));
            if ($ok) {
                echo "✅ Sent expiry notice to: {$email} ({$r['company_name']})\n";
                $sent++;
            } else {
                echo "❌ Failed to send expiry notice to: {$email}\n";
                $failed++;
            }
            // Update user subscription_status => expired if not already expired
            if (($r['subscription_status'] ?? '') !== 'expired') {
                $update = $pdo->prepare("UPDATE users SET subscription_status = 'expired', updated_at = NOW() WHERE id = ? LIMIT 1");
                $update->execute([$r['id']]);
                $updated++;
                echo "🔄 Updated subscription_status => 'expired' for: {$email}\n";
            }
        } catch (Throwable $e) {
            echo "❌ Error processing expired subscription for {$email}: " . $e->getMessage() . "\n";
            $failed++;
        }
        usleep(150000);
    }
    return ['sent' => $sent, 'failed' => $failed, 'updated' => $updated];
}

/**
 * Main execution:
 */
$totalSent = 0; $totalFailed = 0;
$counts = [];

foreach ($daysToNotify as $d) {
    $rows = fetchUsersWithEffectiveEnd($pdo, $d, $targetRoles);
    $counts[$d] = count($rows);
    echo "Found " . count($rows) . " subscriptions expiring in {$d} days\n";
    $res = notifyAndReport($rows, $d);
    $totalSent += $res['sent'];
    $totalFailed += $res['failed'];
    // small pause between batches
    usleep(250000);
}

// Expired
$expiredRows = fetchExpiredUsers($pdo);
echo "\nFound " . count($expiredRows) . " expired subscriptions\n";
$expiredResult = processExpiredUsers($pdo, $expiredRows);
$totalSent += $expiredResult['sent'];
$totalFailed += $expiredResult['failed'];

echo "\n=== Cron Job Completed Successfully ===\n";
echo "Completed at: " . date('Y-m-d H:i:s') . "\n";
foreach ($daysToNotify as $d) {
    echo "- {$d}-day warnings: " . ($counts[$d] ?? 0) . "\n";
}
echo "- Expiry notices: " . count($expiredRows) . "\n";
echo "Total emails sent (approx): {$totalSent}\n";
echo "Total email failures (approx): {$totalFailed}\n";
exit(0);
