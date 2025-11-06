<?php
declare(strict_types=1);

/**
 * password_reset_api.php
 * OTP password-reset flow using PHPMailer (SMTP) with fallback to mail()
 *
 * NOTE:
 *  - Ensure ../includes/db.php provides $pdo (a PDO instance)
 *  - Composer PHPMailer (vendor/autoload.php) is preferred. If not available,
 *    place PHPMailer in ../includes/PHPMailer/ and the script will try that.
 *
 * SMTP settings (update only on server, do not commit publicly):
 *  Host: mail.firmaflowledger.com
 *  Port: 465
 *  Username: noreply@firmaflowledger.com
 *  Password: TemiladeLov1
 *  Encryption: ssl
 *
 * Security:
 *  - Set API_DEBUG = false in production
 *  - Keep credentials secure on server
 */

define('API_DEBUG', true); // set to false in production
ini_set('display_errors', API_DEBUG ? '1' : '0');
error_reporting(E_ALL);

// JSON + CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Restrict to origin in production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

require_once __DIR__ . '/../includes/db.php';
if (!isset($pdo) || !($pdo instanceof PDO)) {
    error_log('password_reset_api.php: $pdo not available or invalid.');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server configuration error']);
    exit;
}

// SMTP configuration
$smtpConfig = [
    'host'       => 'mail.firmaflowledger.com',
    'port'       => 465,
    'username'   => 'noreply@firmaflowledger.com',
    'password'   => 'TemiladeLov1',
    'secure'     => 'ssl', // 'ssl' for 465 or 'tls' for 587
    'from_email' => 'noreply@firmaflowledger.com',
    'from_name'  => 'FirmaFlow Support',
    'bcc_privacy' => 'privacy@firmaflowledger.com'
];

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Helpers
function jsonResponse(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

// Ensure DB tables exist (best-effort)
checkAndCreateTables();

// Read JSON body
$raw = file_get_contents('php://input');
$input = null;
if (!empty($raw)) {
    $input = json_decode($raw, true);
    if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
        jsonResponse(['success' => false, 'error' => 'Invalid JSON: ' . json_last_error_msg()], 400);
    }
}

// Route (only POST actions supported)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$action = $input['action'] ?? ($_GET['action'] ?? null);

try {
    switch ($action) {
        case 'request_reset':
            requestPasswordReset($input, $smtpConfig);
            break;
        case 'verify_otp':
            verifyOTP($input);
            break;
        case 'reset_password':
            resetPassword($input);
            break;
        case 'debug':
            debugInfo();
            break;
        default:
            jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (Throwable $e) {
    error_log('Password Reset API Exception: ' . $e->getMessage());
    if (API_DEBUG) {
        jsonResponse(['success' => false, 'error' => 'Server error', 'message' => $e->getMessage()], 500);
    } else {
        jsonResponse(['success' => false, 'error' => 'Server error'], 500);
    }
}

/* ---------- FUNCTIONS ---------- */

function checkAndCreateTables(): void {
    global $pdo;
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'password_reset_tokens'");
        $exists = (bool)$stmt->fetchColumn();
        if (!$exists) {
            $pdo->exec("
                CREATE TABLE `password_reset_tokens` (
                  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                  `user_id` bigint UNSIGNED NOT NULL,
                  `email` varchar(255) NOT NULL,
                  `token` varchar(6) NOT NULL,
                  `expires_at` datetime NOT NULL,
                  `is_used` tinyint(1) NOT NULL DEFAULT 0,
                  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                  `used_at` timestamp NULL DEFAULT NULL,
                  `ip_address` varchar(45) DEFAULT NULL,
                  `user_agent` text DEFAULT NULL,
                  PRIMARY KEY (`id`),
                  KEY `idx_email_token` (`email`, `token`),
                  KEY `idx_expires_at` (`expires_at`),
                  KEY `idx_user_id` (`user_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }

        $stmt = $pdo->query("SHOW TABLES LIKE 'password_reset_logs'");
        $exists = (bool)$stmt->fetchColumn();
        if (!$exists) {
            $pdo->exec("
                CREATE TABLE `password_reset_logs` (
                  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                  `user_id` bigint UNSIGNED DEFAULT NULL,
                  `email` varchar(255) NOT NULL,
                  `action` enum('request','verify','reset','cleanup') NOT NULL,
                  `ip_address` varchar(45) DEFAULT NULL,
                  `user_agent` text DEFAULT NULL,
                  `success` tinyint(1) NOT NULL DEFAULT 0,
                  `error_message` text DEFAULT NULL,
                  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  KEY `idx_email_action` (`email`, `action`),
                  KEY `idx_created_at` (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }
    } catch (Throwable $e) {
        error_log('checkAndCreateTables failed: ' . $e->getMessage());
        // allow script to continue
    }
}

function requestPasswordReset(?array $input, array $smtpConfig): void {
    global $pdo;
    $email = isset($input['email']) ? strtolower(trim((string)$input['email'])) : '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        logPasswordResetAction(null, $email, 'request', $ip, $ua, false, 'Invalid email format');
        jsonResponse(['success' => false, 'error' => 'Invalid email address'], 400);
    }

    // find user (active only)
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, email FROM users WHERE email = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // If user not found, do neutral response (prevents enumeration)
    if (!$user) {
        logPasswordResetAction(null, $email, 'request', $ip, $ua, false, 'User not found / inactive');
        // Still respond with success message that doesn't reveal existence
        jsonResponse(['success' => true, 'message' => 'If your email is registered, you will receive reset instructions.']);
    }

    // Rate limit check (3 per hour)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM password_reset_tokens WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
    $stmt->execute([$email]);
    $count = (int)$stmt->fetchColumn();
    if ($count >= 3) {
        logPasswordResetAction((int)$user['id'], $email, 'request', $ip, $ua, false, 'Rate limit exceeded');
        jsonResponse(['success' => false, 'error' => 'Too many reset requests. Please wait before trying again.'], 429);
    }

    // Generate OTP
    try {
        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    } catch (Throwable $e) {
        $otp = str_pad((string)mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
    }
    $expiresAt = date('Y-m-d H:i:s', time() + 15 * 60);

    // Invalidate previous tokens for this email
    $upd = $pdo->prepare("UPDATE password_reset_tokens SET is_used = 1 WHERE email = ? AND is_used = 0");
    $upd->execute([$email]);

    // Store token
    $ins = $pdo->prepare("INSERT INTO password_reset_tokens (user_id, email, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)");
    $ins->execute([(int)$user['id'], $email, $otp, $expiresAt, $ip, $ua]);

    // Try to send email; we will ALWAYS return success to caller (token generated),
    // but include email_sent flag for diagnostics. This avoids the frontend showing errors
    // when the DB insert succeeded (as you requested).
    $sent = sendOTPEmail($user, $email, $otp, $expiresAt, $smtpConfig);

    logPasswordResetAction((int)$user['id'], $email, 'request', $ip, $ua, true, $sent ? 'OTP generated and sent' : 'OTP generated; email send failed');

    // Always return success (neutral), but indicate whether email was actually delivered
    $message = 'Password reset request processed. If your email is registered, you will receive an OTP code shortly.';
    jsonResponse([
        'success' => true,
        'message' => $message,
        'expires_in_minutes' => 15,
        'email_sent' => $sent ? true : false
    ]);
}

function verifyOTP(?array $input): void {
    global $pdo;
    $email = isset($input['email']) ? strtolower(trim((string)$input['email'])) : '';
    $otp = isset($input['otp']) ? trim((string)$input['otp']) : '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $otp === '') {
        jsonResponse(['success' => false, 'error' => 'Email and OTP are required'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM password_reset_tokens WHERE email = ? AND token = ? AND is_used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$email, $otp]);
    $token = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$token) {
        logPasswordResetAction(null, $email, 'verify', $ip, $ua, false, 'Invalid or expired OTP');
        jsonResponse(['success' => false, 'error' => 'Invalid or expired OTP code'], 400);
    }

    logPasswordResetAction((int)$token['user_id'], $email, 'verify', $ip, $ua, true, 'OTP verified');
    $reset_token = base64_encode($email . ':' . $otp . ':' . time());
    jsonResponse(['success' => true, 'message' => 'OTP verified', 'reset_token' => $reset_token]);
}

function resetPassword(?array $input): void {
    global $pdo;
    $resetToken = $input['reset_token'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $confirm = $input['confirm_password'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

    if (!$resetToken || !$newPassword || !$confirm) {
        jsonResponse(['success' => false, 'error' => 'All fields are required'], 400);
    }
    if ($newPassword !== $confirm) {
        jsonResponse(['success' => false, 'error' => 'Passwords do not match'], 400);
    }
    if (strlen($newPassword) < 8) {
        jsonResponse(['success' => false, 'error' => 'Password must be at least 8 characters'], 400);
    }

    $decoded = base64_decode($resetToken);
    if (!$decoded) {
        jsonResponse(['success' => false, 'error' => 'Invalid reset token'], 400);
    }
    $parts = explode(':', $decoded);
    if (count($parts) !== 3) {
        jsonResponse(['success' => false, 'error' => 'Invalid reset token'], 400);
    }
    [$email, $otp, $timestamp] = $parts;
    if (time() - (int)$timestamp > 1800) {
        jsonResponse(['success' => false, 'error' => 'Reset session expired'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM password_reset_tokens WHERE email = ? AND token = ? AND is_used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$email, $otp]);
    $token = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$token) {
        jsonResponse(['success' => false, 'error' => 'Invalid or expired reset session'], 400);
    }

    $hashed = password_hash($newPassword, PASSWORD_DEFAULT);
    $upd = $pdo->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?");
    $upd->execute([$hashed, $email]);

    $mark = $pdo->prepare("UPDATE password_reset_tokens SET is_used = 1, used_at = NOW() WHERE id = ?");
    $mark->execute([$token['id']]);
    $invalidate = $pdo->prepare("UPDATE password_reset_tokens SET is_used = 1 WHERE email = ? AND id != ?");
    $invalidate->execute([$email, $token['id']]);

    logPasswordResetAction((int)$token['user_id'], $email, 'reset', $ip, $ua, true, 'Password reset success');
    jsonResponse(['success' => true, 'message' => 'Password reset successfully. You can now login.']);
}

/**
 * Send OTP email using PHPMailer (SMTP) or fallback to mail()
 * Returns true if mail() or PHPMailer reports successful send
 */
function sendOTPEmail(array $user, string $userEmail, string $otp, string $expiresAt, array $smtpConfig): bool {
    $name = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
    if ($name === '') $name = 'User';

    $subject = 'FirmaFlow — Password Reset Verification Code';
    $html = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 1.8rem; }
            .content { padding: 2rem; }
            .otp-box { background: #f8f9fa; border: 2px dashed #dc3545; border-radius: 10px; padding: 2rem; text-align: center; margin: 2rem 0; }
            .otp-code { font-size: 2.5rem; font-weight: bold; color: #dc3545; letter-spacing: 0.5rem; margin: 1rem 0; font-family: monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; margin: 1rem 0; color: #856404; }
            .footer { background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.9rem; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🔐 FirmaFlow Ledger</h1>
                <p style='color: rgba(255,255,255,0.9); margin: 0.5rem 0 0 0;'>Password Reset Request</p>
            </div>
            
            <div class='content'>
                <h2>Hello {$name},</h2>
                <p>We received a request to reset your FirmaFlow Ledger account password. Use the verification code below to proceed:</p>
                
                <div class='otp-box'>
                    <p style='margin: 0; color: #333; font-weight: 600; font-size: 1.1rem;'>🔑 Your Verification Code</p>
                    <div class='otp-code'>{$otp}</div>
                    <p style='margin: 0; color: #666; font-size: 0.9rem;'>⏰ This code expires at {$expiresAt}</p>
                    <p style='margin: 0.5rem 0 0 0; color: #666; font-size: 0.85rem;'>(Valid for 15 minutes)</p>
                </div>
                
                <div class='warning'>
                    <strong>⚠️ Security Notice:</strong>
                    <ul style='margin: 0.5rem 0; padding-left: 1.5rem;'>
                        <li>Never share this code with anyone</li>
                        <li>FirmaFlow staff will never ask for this code</li>
                        <li>If you didn't request this reset, please contact support immediately</li>
                    </ul>
                </div>
                
                <p>Need help? Contact our support team at <a href='mailto:support@firmaflow.com' style='color: #667eea;'>support@firmaflow.com</a></p>
                
                <p style='margin-top: 2rem;'>
                    Best regards,<br>
                    <strong>FirmaFlow Security Team</strong>
                </p>
            </div>
            
            <div class='footer'>
                <p>© 2025 FirmaFlow Ledger. All rights reserved.</p>
                <p>This is an automated security message. Please do not reply to this email.</p>
                <p style='font-size: 0.8rem; color: #999;'>Request from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "</p>
            </div>
        </div>
    </body>
    </html>";
    
    $text = "FirmaFlow — Password Reset Verification Code

Hello {$name},

We received a request to reset your FirmaFlow Ledger account password.

Your Verification Code: {$otp}
Expires at: {$expiresAt} (Valid for 15 minutes)

SECURITY NOTICE:
- Never share this code with anyone
- FirmaFlow staff will never ask for this code  
- If you didn't request this reset, contact support immediately

Need help? Email: support@firmaflow.com

Best regards,
FirmaFlow Security Team
© 2025 FirmaFlow Ledger";

    // Try PHPMailer via composer autoload or local includes
    $mailerLoaded = false;
    $autoload = __DIR__ . '/../vendor/autoload.php';
    if (file_exists($autoload)) {
        require_once $autoload;
        $mailerLoaded = class_exists('PHPMailer\PHPMailer\PHPMailer');
    } elseif (file_exists(__DIR__ . '/../includes/PHPMailer/src/PHPMailer.php')) {
        require_once __DIR__ . '/../includes/PHPMailer/src/Exception.php';
        require_once __DIR__ . '/../includes/PHPMailer/src/PHPMailer.php';
        require_once __DIR__ . '/../includes/PHPMailer/src/SMTP.php';
        $mailerLoaded = class_exists('PHPMailer\PHPMailer\PHPMailer');
    }

    if ($mailerLoaded) {
        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $smtpConfig['host'];
            $mail->SMTPAuth = true;
            $mail->Username = $smtpConfig['username'];
            $mail->Password = $smtpConfig['password'];

            if (!empty($smtpConfig['secure']) && strtolower($smtpConfig['secure']) === 'tls') {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = (int)($smtpConfig['port'] ?: 587);
            } else {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
                $mail->Port = (int)($smtpConfig['port'] ?: 465);
            }

            if (API_DEBUG) {
                // Write SMTP debug to error log for diagnosis
                $mail->SMTPDebug = \PHPMailer\PHPMailer\SMTP::DEBUG_CLIENT;
                $mail->Debugoutput = function ($str, $level) {
                    error_log("PHPMailer debug [$level]: $str");
                };
            }

            // If the server has self-signed cert or other TLS issues, relax only while debugging
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ],
            ];

            $mail->setFrom($smtpConfig['from_email'], $smtpConfig['from_name']);
            $mail->addAddress($userEmail, $name);

            if (!empty($smtpConfig['bcc_privacy'])) {
                $mail->addBCC($smtpConfig['bcc_privacy']);
            }
            $mail->addReplyTo('support@firmaflowledger.com', 'FirmaFlow Support');

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $html;
            $mail->AltBody = $text;

            $mail->send();
            return true;
        } catch (\PHPMailer\PHPMailer\Exception $e) {
            error_log('PHPMailer error: ' . $e->getMessage());
            if (API_DEBUG) {
                error_log('PHPMailer ErrorInfo: ' . ($mail->ErrorInfo ?? 'N/A'));
            }
            // fall through to fallback mail()
        } catch (Throwable $e) {
            error_log('PHPMailer general error: ' . $e->getMessage());
        }
    }

    // Fallback to PHP mail()
    $headers = "From: {$smtpConfig['from_name']} <{$smtpConfig['from_email']}>\r\n";
    $headers .= "Reply-To: support@firmaflowledger.com\r\n";
    if (!empty($smtpConfig['bcc_privacy'])) {
        $headers .= "Bcc: {$smtpConfig['bcc_privacy']}\r\n";
    }
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=utf-8\r\n";

    $result = @mail($userEmail, $subject, $html, $headers);
    if (!$result) {
        error_log("Fallback mail() failed sending OTP to {$userEmail}");
    }
    return (bool)$result;
}

function logPasswordResetAction($userId, $email, $action, $ipAddress, $userAgent, $success, $message = null): void {
    global $pdo;
    try {
        $stmt = $pdo->prepare("INSERT INTO password_reset_logs (user_id, email, action, ip_address, user_agent, success, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $email, $action, $ipAddress, $userAgent, $success ? 1 : 0, $message]);
    } catch (Throwable $e) {
        error_log("logPasswordResetAction failed: " . $e->getMessage());
    }
}

function debugInfo(): void {
    global $pdo;
    try {
        $tables = ['users', 'password_reset_tokens', 'password_reset_logs'];
        $exist = [];
        foreach ($tables as $t) {
            $stmt = $pdo->query("SHOW TABLES LIKE " . $pdo->quote($t));
            $exist[$t] = (bool)$stmt->fetchColumn();
        }
        jsonResponse(['success' => true, 'tables' => $exist]);
    } catch (Throwable $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}
