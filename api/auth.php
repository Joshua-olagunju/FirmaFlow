<?php
// api/auth.php - fixed, improved & updated version
// Start session (secure-ish defaults)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Always return JSON
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
// Add CORS headers for React frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
// Note: X-XSS-Protection is deprecated in modern browsers; kept out for clarity.

// Load DB (adjust path if needed)
require_once __DIR__ . '/../includes/db.php'; // must provide $pdo (PDO instance)

// Helper: safe JSON error response and exit
function jsonError(string $msg, int $code = 400, array $extra = []) {
    http_response_code($code);
    echo json_encode(array_merge(['success' => false, 'error' => $msg], $extra));
    exit;
}

// OPTIONS preflight handling (simple)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Get raw input
$raw = file_get_contents('php://input');
$input = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($raw)) {
        jsonError('POST request requires JSON body', 400);
    }
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        jsonError('Invalid JSON input: ' . json_last_error_msg(), 400);
    }
}

// Dispatch
try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'POST') {
        $action = trim((string)($input['action'] ?? ''));
        switch ($action) {
            case 'login':
                handleLogin($input);
                break;
            case 'signup':
                handleSignup($input);
                break;
            case 'verify_otp':
                handleVerifyOTP($input);
                break;
            case 'resend_otp':
                handleResendOTP($input);
                break;
            case 'logout':
                handleLogout();
                break;
            case 'get_user':
                handleGetUser();
                break;
            case 'switch_user_account':
                handleSwitchUserAccount($input);
                break;
            default:
                jsonError('Invalid action', 400);
        }
    } elseif ($method === 'GET') {
        $action = $_GET['action'] ?? '';
        if ($action === 'check') {
            checkSession();
        } else {
            jsonError('Invalid request', 400);
        }
    } else {
        jsonError('Method not allowed', 405);
    }
} catch (PDOException $e) {
    // Database-specific error (do not leak DB details)
    error_log("Database error in auth API: " . $e->getMessage());
    jsonError('Database error occurred', 500);
} catch (Exception $e) {
    // Generic error
    error_log("Auth API error: " . $e->getMessage() . " | Input: " . print_r($input, true));
    jsonError($e->getMessage(), 400);
}

/* ---------------------------
   HANDLERS
   --------------------------- */

function handleLogin(array $input) {
    global $pdo;

    $email = strtolower(trim((string)($input['email'] ?? '')));
    $password = $input['password'] ?? '';

    if ($email === '' || $password === '') {
        jsonError('Email and password are required', 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('Invalid email format', 400);
    }

    $stmt = $pdo->prepare("
        SELECT u.*, c.name as company_name, c.is_active as company_active
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.email = ? AND u.is_active = 1
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        jsonError('Invalid email or password', 401);
    }

    if (!empty($user['company_id']) && isset($user['company_active']) && !$user['company_active']) {
        jsonError('Company account is deactivated', 403);
    }

    // Update last login
    $uStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $uStmt->execute([$user['id']]);

    // Regenerate session
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
    $_SESSION['company_id'] = $user['company_id'] ? (int)$user['company_id'] : null;
    $_SESSION['company_name'] = $user['company_name'] ?? null;
    $_SESSION['user_role'] = $user['role'] ?? 'user';
    $_SESSION['logged_in'] = true;
    $_SESSION['last_activity'] = time();

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'name' => $_SESSION['user_name'],
            'role' => $_SESSION['user_role'],
            'company_id' => $_SESSION['company_id'],
            'company_name' => $_SESSION['company_name']
        ]
    ]);
    exit;
}

function handleSignup(array $input) {
    global $pdo;

    $firstName = trim((string)($input['first_name'] ?? ''));
    $lastName  = trim((string)($input['last_name'] ?? ''));
    $email     = strtolower(trim((string)($input['email'] ?? '')));
    $password  = $input['password'] ?? '';
    $confirm   = $input['confirm_password'] ?? $input['confirmPassword'] ?? '';
    $company   = trim((string)($input['company_name'] ?? ''));
    $phone     = trim((string)($input['phone'] ?? ''));

    // Basic validation
    if ($firstName === '' || $lastName === '' || $email === '' || $password === '' || $company === '') {
        jsonError('All required fields must be filled', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('Invalid email format', 400);
    }
    if (strlen($password) < 6) {
        jsonError('Password must be at least 6 characters', 400);
    }
    if ($password !== $confirm) {
        jsonError('Passwords do not match', 400);
    }
    if (strlen($firstName) > 100 || strlen($lastName) > 100) {
        jsonError('Name too long', 400);
    }
    if (strlen($company) < 2 || strlen($company) > 255) {
        jsonError('Invalid company name length', 400);
    }

    // Check existing email in users table
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $check->execute([$email]);
    if ($check->fetch()) {
        jsonError('Email address is already registered', 409);
    }

    try {
        // Include EmailHelper for OTP functionality
        require_once __DIR__ . '/../includes/email_helper.php';

        // Generate OTP code
        $otpCode = EmailHelper::generateOTP();
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

        // Clean up any existing OTP records for this email
        $cleanup = $pdo->prepare("DELETE FROM otp_verification WHERE email = ? AND verified = FALSE");
        $cleanup->execute([$email]);

        // Insert new OTP record with registration data
        $stmt = $pdo->prepare("
            INSERT INTO otp_verification 
            (email, otp_code, first_name, last_name, company_name, phone, password_hash, expires_at, verified, attempts) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, 0)
        ");
        $stmt->execute([$email, $otpCode, $firstName, $lastName, $company, $phone, $passwordHash, $expiresAt]);

        // Send OTP email
        $emailSent = EmailHelper::sendOTPEmail($email, $otpCode, $firstName);

        if ($emailSent) {
            echo json_encode([
                'success' => true,
                'message' => 'Verification code sent to your email',
                'requires_verification' => true,
                'email' => $email
            ]);
        } else {
            // If email fails, clean up the OTP record
            $cleanup = $pdo->prepare("DELETE FROM otp_verification WHERE email = ? AND otp_code = ?");
            $cleanup->execute([$email, $otpCode]);
            jsonError('Failed to send verification email. Please try again.');
        }

    } catch (PDOException $e) {
        error_log("OTP creation error: " . $e->getMessage());
        jsonError('Database error occurred', 500);
    } catch (Exception $e) {
        error_log("Signup error: " . $e->getMessage());
        jsonError('Unable to process registration, please try again later', 500);
    }
}

function handleLogout() {
    // Destroy session
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
    exit;
}

function handleGetUser() {
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        jsonError('Not logged in', 401);
    }
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => (int)$_SESSION['user_id'],
            'email' => $_SESSION['user_email'],
            'name' => $_SESSION['user_name'],
            'role' => $_SESSION['user_role'],
            'company_id' => isset($_SESSION['company_id']) ? (int)$_SESSION['company_id'] : null,
            'company_name' => $_SESSION['company_name'] ?? null
        ]
    ]);
    exit;
}

function handleSwitchUserAccount(array $input) {
    global $pdo;
    
    // Verify current user is logged in
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        jsonError('Not logged in', 401);
    }
    
    $targetUserId = (int)($input['user_id'] ?? 0);
    $targetCompanyId = (int)($input['company_id'] ?? 0);
    $password = $input['password'] ?? '';
    
    if (!$targetUserId || !$password) {
        jsonError('User ID and password are required', 400);
    }
    
    // Verify current user's password
    $currentUserId = (int)$_SESSION['user_id'];
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ? AND is_active = 1");
    $stmt->execute([$currentUserId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$currentUser || !password_verify($password, $currentUser['password'])) {
        jsonError('Invalid password', 401);
    }
    
    // Get target user details
    $stmt = $pdo->prepare("
        SELECT u.*, c.name as company_name, c.is_active as company_active
        FROM users u 
        LEFT JOIN companies c ON u.company_id = c.id 
        WHERE u.id = ? AND u.is_active = 1
    ");
    $stmt->execute([$targetUserId]);
    $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$targetUser) {
        jsonError('Target user not found or inactive', 404);
    }
    
    // Verify company matches if provided
    if ($targetCompanyId && $targetUser['company_id'] != $targetCompanyId) {
        jsonError('User does not belong to specified company', 403);
    }
    
    // Check company status
    if ($targetUser['company_id'] && !$targetUser['company_active']) {
        jsonError('Target company account is inactive', 403);
    }
    
    // Switch session to target user
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$targetUser['id'];
    $_SESSION['user_email'] = $targetUser['email'];
    $_SESSION['user_name'] = trim(($targetUser['first_name'] ?? '') . ' ' . ($targetUser['last_name'] ?? ''));
    $_SESSION['company_id'] = $targetUser['company_id'] ? (int)$targetUser['company_id'] : null;
    $_SESSION['company_name'] = $targetUser['company_name'] ?? null;
    $_SESSION['user_role'] = $targetUser['role'] ?? 'user';
    $_SESSION['logged_in'] = true;
    $_SESSION['last_activity'] = time();
    
    echo json_encode([
        'success' => true,
        'message' => 'Account switched successfully',
        'user' => [
            'id' => (int)$targetUser['id'],
            'email' => $targetUser['email'],
            'name' => $_SESSION['user_name'],
            'role' => $_SESSION['user_role'],
            'company_id' => $_SESSION['company_id'],
            'company_name' => $_SESSION['company_name']
        ]
    ]);
    exit;
}

function checkSession() {
    global $pdo;
    
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        echo json_encode(['logged_in' => false]);
        exit;
    }
    
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        echo json_encode(['logged_in' => false]);
        exit;
    }
    
    try {
        // Verify user still exists and is active in database
        $stmt = $pdo->prepare("
            SELECT u.*, c.name as company_name, c.is_active as company_active
            FROM users u 
            LEFT JOIN companies c ON u.company_id = c.id 
            WHERE u.id = ? AND u.is_active = 1
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            // User not found or inactive - destroy session
            $_SESSION = [];
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params['path'], $params['domain'],
                    $params['secure'], $params['httponly']
                );
            }
            session_destroy();
            echo json_encode([
                'logged_in' => false,
                'message' => 'User account not found or deactivated'
            ]);
            exit;
        }
        
        // Check company status if user belongs to a company
        if ($user['company_id'] && !$user['company_active']) {
            // Company inactive - destroy session
            $_SESSION = [];
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params['path'], $params['domain'],
                    $params['secure'], $params['httponly']
                );
            }
            session_destroy();
            echo json_encode([
                'logged_in' => false,
                'message' => 'Company account is inactive'
            ]);
            exit;
        }
        
        // Update session with fresh data from database
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        $_SESSION['company_name'] = $user['company_name'] ?? null;
        $_SESSION['user_role'] = $user['role'] ?? 'user';
        $_SESSION['last_activity'] = time();
        
        echo json_encode([
            'logged_in' => true,
            'user' => [
                'id' => (int)$user['id'],
                'email' => $user['email'],
                'name' => $_SESSION['user_name'],
                'role' => $_SESSION['user_role'],
                'company_id' => $user['company_id'] ? (int)$user['company_id'] : null,
                'company_name' => $_SESSION['company_name']
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in session check: " . $e->getMessage());
        echo json_encode(['logged_in' => false, 'error' => 'Database error']);
    }
    exit;
}

/* ---------------------------
   UTILITIES
   --------------------------- */

function createMinimalChartOfAccounts(int $companyId, PDO $pdo, array $requiredKeys = null): array
{
    // Default minimal chart (key => [name, type, code])
    $defaults = [
        'cash'      => ['name' => 'Cash & Bank',            'type' => 'asset',    'code' => '1000'],
        'ar'        => ['name' => 'Accounts Receivable',    'type' => 'asset',    'code' => '1200'],
        'inventory' => ['name' => 'Inventory',              'type' => 'asset',    'code' => '1300'],
        'ap'        => ['name' => 'Accounts Payable',       'type' => 'liability','code' => '2000'],
        'retained'  => ['name' => 'Retained Earnings',      'type' => 'equity',   'code' => '3000'],
        'sales'     => ['name' => 'Sales Revenue',          'type' => 'income',   'code' => '4000'],
        'cogs'      => ['name' => 'Cost of Goods Sold',     'type' => 'expense',  'code' => '5000'],
    ];

    // If caller passed a subset of keys, restrict to them; otherwise use full defaults
    $keysToCreate = $requiredKeys === null ? array_keys($defaults) : array_values($requiredKeys);

    // Prepared statements
    $selectStmt = $pdo->prepare("SELECT id FROM accounts WHERE company_id = ? AND (code = ? OR LOWER(name) = LOWER(?)) LIMIT 1");
    $codeCheckStmt = $pdo->prepare("SELECT id FROM accounts WHERE company_id = ? AND code = ? LIMIT 1");
    $insertStmt = $pdo->prepare("INSERT INTO accounts (company_id, code, name, type, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())");

    $result = [];

    foreach ($keysToCreate as $key) {
        if (!isset($defaults[$key])) {
            // Skip unknown keys but keep process going
            continue;
        }

        $cfg = $defaults[$key];
        $code = $cfg['code'];
        $name = $cfg['name'];
        $type = $cfg['type'];

        // 1) If an account already exists for this company with the same code or name, use it
        $selectStmt->execute([$companyId, $code, $name]);
        $existing = $selectStmt->fetch(PDO::FETCH_ASSOC);
        if ($existing && !empty($existing['id'])) {
            $result[$key] = (int)$existing['id'];
            continue;
        }

        // 2) Ensure code uniqueness for this company — if code exists, generate fallback
        $codeCheckStmt->execute([$companyId, $code]);
        if ($codeCheckStmt->fetch()) {
            // generate fallback code until unique (safe small loop)
            $tries = 0;
            do {
                $code = '99' . mt_rand(100, 999);
                $codeCheckStmt->execute([$companyId, $code]);
                $exists = $codeCheckStmt->fetch();
                $tries++;
            } while ($exists && $tries < 10);

            if ($exists) {
                throw new Exception("Unable to generate unique account code for key {$key}");
            }
        }

        // 3) Insert account
        $insertStmt->execute([$companyId, $code, $name, $type]);
        $newId = (int)$pdo->lastInsertId();

        // 4) Return created id
        $result[$key] = $newId;
    }

    return $result;
}

/**
 * Send welcome email in background (best-effort).
 * This function tries to use PHPMailer (via composer vendor/autoload or local include).
 * If PHPMailer is unavailable it falls back to PHP mail().
 *
 * The function now uses the detailed FirmaFlow HTML + plain-text template,
 * with trial date logic and safe escaping.
 */
function sendWelcomeEmailBackground(string $to, string $fullName, string $companyName) : bool {
    // Sanity check
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        error_log("sendWelcomeEmailBackground: invalid email $to");
        return false;
    }

    // Configurable URLs / addresses (override if needed)
    $loginUrl = 'https://firmaflowledger.com/public/login.php';
    $dashboardUrl = 'https://firmaflowledger.com/public/admin_dashboard.php';
    $supportEmail = 'test@firmaflowledger.com';

    // Safe escaping for HTML output
    $fullNameEsc = htmlspecialchars($fullName ?? 'User', ENT_QUOTES, 'UTF-8');
    $companyEsc  = htmlspecialchars($companyName ?? '', ENT_QUOTES, 'UTF-8');

    // Trial dates
    $trialDays = 14;
    // Use the server timezone; adjust if you want specific tz
    $trialEnds = date('F j, Y', strtotime("+{$trialDays} days"));

    // Subject
    $subject = "Welcome to FirmaFlow — Your {$trialDays}-day trial has started";

    // HTML body (detailed, professional)
    $html = "
<div style='font-family: Arial, sans-serif; max-width:720px; margin:0 auto; padding:24px; color:#0f172a;'>
  <div style='text-align:center; margin-bottom:18px;'>
    <img src='https://firmaflowledger.com/assets/firmaflow-logo.jpg' alt='FirmaFlow' style='width:96px; height:96px; object-fit:cover; border-radius:12px;' />
  </div>

  <h2 style='font-size:20px; margin:0 0 8px;'>Welcome to FirmaFlow, {$fullNameEsc}</h2>

  <p style='margin:0 0 16px; color:#374151;'>
    Your account for <strong>{$companyEsc}</strong> has been successfully created and your {$trialDays}-day trial begins today.
    Your trial will expire on <strong>{$trialEnds}</strong>.
  </p>

  <h3 style='font-size:16px; margin:18px 0 8px;'>What you can do next</h3>
  <ol style='margin:0 0 16px 20px; color:#374151;'>
    <li>Sign in to your dashboard and complete your company profile: <a href='{$loginUrl}'>{$loginUrl}</a></li>
    <li>Connect your financial accounts and set up your first product or service for invoicing</li>
    <li>Invite team members and assign roles from the Users & Permissions area</li>
  </ol>

  <div style='text-align:center; margin:18px 0;'>
    <a href='{$dashboardUrl}' style='display:inline-block; padding:12px 22px; background:#667eea; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600;'>Go to your dashboard</a>
  </div>

  <h3 style='font-size:16px; margin:18px 0 8px;'>Key features to try during your trial</h3>
  <ul style='margin:0 0 16px 20px; color:#374151;'>
    <li>Financials & invoicing — create, send and track invoices</li>
    <li>Inventory & stock management — manage products and stock levels</li>
    <li>CRM — track customers, deals and communications</li>
    <li>Reporting & analytics — exportable reports and real-time insights</li>
    <li>Enterprise-grade security and role-based access controls</li>
  </ul>

  <h3 style='font-size:16px; margin:18px 0 8px;'>Support & onboarding</h3>
  <p style='margin:0 0 16px; color:#374151;'>
    If you need help getting started we offer:
  </p>
  <ul style='margin:0 0 16px 20px; color:#374151;'>
    <li>Guided onboarding on request (email <a href='mailto:{$supportEmail}'>{$supportEmail}</a>)</li>
    <li>Help center and documentation at <a href='https://firmaflowledger.com/docs'>firmaflowledger.com/docs</a></li>
  </ul>

  <p style='margin:0 0 8px; color:#374151;'>
    Security note: we take the security of your data seriously. If you did not create this account or believe this message was sent in error, contact us immediately at <a href='mailto:{$supportEmail}'>{$supportEmail}</a>.
  </p>

  <p style='margin:20px 0 0; color:#6b7280; font-size:13px;'>
    Thank you for choosing FirmaFlow. We look forward to helping you run your business more efficiently.
    <br><br>
    — The FirmaFlow Team
  </p>

  <hr style='border:none; border-top:1px solid #e6e9ef; margin:20px 0;' />

  <p style='color:#9aa4b2; font-size:12px; margin:0;'>You are receiving this email because an account was created for <strong>{$companyEsc}</strong>. If you no longer wish to receive these messages, contact us at <a href='mailto:{$supportEmail}'>{$supportEmail}</a>.</p>
</div>
";

    // Plain-text fallback
    $text = "Welcome to FirmaFlow, {$fullName}!

Your account for {$companyName} has been created and your {$trialDays}-day trial starts today.
Trial end date: {$trialEnds}

Get started:
- Sign in: {$loginUrl}
- Dashboard: {$dashboardUrl}
- Documentation: https://firmaflowledger.com/docs

Key features to try:
- Financials & invoicing
- Inventory & stock management
- CRM and customer tracking
- Reporting & analytics
- Enterprise-grade security

Need help or onboarding? Contact: {$supportEmail}

Thank you,
The FirmaFlow Team
";

    // Try to load PHPMailer through composer first, then local includes
    $mailerLoaded = false;
    
    // First try composer autoload
    if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
        require_once __DIR__ . '/../vendor/autoload.php';
        $mailerLoaded = class_exists('PHPMailer\\PHPMailer\\PHPMailer');
    }
    
    // Fallback to local PHPMailer installation
    if (!$mailerLoaded) {
        $phpmailerPath = __DIR__ . '/../includes/PHPMailer/src/PHPMailer.php';
        if (file_exists($phpmailerPath)) {
            require_once __DIR__ . '/../includes/PHPMailer/src/Exception.php';
            require_once __DIR__ . '/../includes/PHPMailer/src/PHPMailer.php';
            require_once __DIR__ . '/../includes/PHPMailer/src/SMTP.php';
            $mailerLoaded = class_exists('PHPMailer\\PHPMailer\\PHPMailer');
        }
    }

    if ($mailerLoaded && class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        try {
            // Use PHPMailer with proper error handling
            $mailClass = 'PHPMailer\\PHPMailer\\PHPMailer';
            $mail = new $mailClass(true);

            // SMTP config - use your SMTP server details here
            $mail->isSMTP();
            $mail->Host = 'mail.firmaflowledger.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'test@firmaflowledger.com';
            $mail->Password = 'Firmaflow123';
            $mail->SMTPSecure = 'tls';
            $mail->Port = 587;

            // Relax verification for compatibility
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ],
            ];

            $mail->setFrom('test@firmaflowledger.com', 'FirmaFlow');
            $mail->addAddress($to, $fullName);
            $mail->addReplyTo($supportEmail, 'FirmaFlow Support');

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $html;
            $mail->AltBody = $text;

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("PHPMailer send failed: " . $e->getMessage());
            // Continue to fallback below
        }
    }

    // Fallback: use PHP mail()
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=utf-8\r\n";
    $headers .= "From: FirmaFlow <test@firmaflowledger.com>\r\n";
    $headers .= "Reply-To: {$supportEmail}\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $result = @mail($to, $subject, $html, $headers);
    if (!$result) {
        error_log("Fallback mail() failed for $to");
    }
    return (bool)$result;
}

/* ---------------------------
   OTP VERIFICATION HANDLERS
   --------------------------- */

function handleVerifyOTP(array $input) {
    global $pdo;

    $email = strtolower(trim((string)($input['email'] ?? '')));
    $otpCode = trim((string)($input['otp_code'] ?? ''));

    if (!$email || !$otpCode) {
        jsonError('Email and OTP code are required');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('Invalid email format');
    }

    if (!preg_match('/^\d{6}$/', $otpCode)) {
        jsonError('OTP must be 6 digits');
    }

    try {
        // Check if OTP exists and is valid
        $stmt = $pdo->prepare("
            SELECT * FROM otp_verification 
            WHERE email = ? AND otp_code = ? AND verified = FALSE AND expires_at > NOW()
        ");
        $stmt->execute([$email, $otpCode]);
        $otpRecord = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$otpRecord) {
            // Increment attempts for this email
            $stmt = $pdo->prepare("UPDATE otp_verification SET attempts = attempts + 1 WHERE email = ? AND verified = FALSE");
            $stmt->execute([$email]);
            
            jsonError('Invalid or expired OTP code');
        }

        // Check attempts limit
        if ($otpRecord['attempts'] >= 5) {
            jsonError('Too many failed attempts. Please request a new OTP.');
        }

        // Begin transaction to create account
        $pdo->beginTransaction();

        try {
            // Create company record
            $stmt = $pdo->prepare("INSERT INTO companies (name, currency, tax_rate, created_at) VALUES (?, 'NGN', 7.5, NOW())");
            $stmt->execute([$otpRecord['company_name']]);
            $companyId = $pdo->lastInsertId();

            // Trial dates
            $now = new DateTime('now');
            $trialStart = $now->format('Y-m-d H:i:s');
            $trialEnd = $now->add(new DateInterval('P14D'))->format('Y-m-d H:i:s');

            // Create user record
            $stmt = $pdo->prepare("
                INSERT INTO users 
                (first_name, last_name, email, password, phone, company_id, role, is_active, subscription_plan, subscription_status, trial_start_date, trial_end_date, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'admin', 1, 'free', 'trial', ?, ?, NOW())
            ");
            $stmt->execute([
                $otpRecord['first_name'],
                $otpRecord['last_name'],
                $otpRecord['email'],
                $otpRecord['password_hash'],
                $otpRecord['phone'],
                $companyId,
                $trialStart,
                $trialEnd
            ]);
            $userId = $pdo->lastInsertId();

            // Mark OTP as verified
            $stmt = $pdo->prepare("UPDATE otp_verification SET verified = TRUE WHERE id = ?");
            $stmt->execute([$otpRecord['id']]);

            // Create minimal chart of accounts
            createMinimalChartOfAccounts($companyId, $pdo);

            $pdo->commit();

            // Set session
            session_regenerate_id(true);
            $_SESSION['user_id'] = $userId;
            $_SESSION['user_email'] = $otpRecord['email'];
            $_SESSION['user_name'] = $otpRecord['first_name'] . ' ' . $otpRecord['last_name'];
            $_SESSION['company_id'] = $companyId;
            $_SESSION['company_name'] = $otpRecord['company_name'];
            $_SESSION['user_role'] = 'admin';
            $_SESSION['logged_in'] = true;

            echo json_encode([
                'success' => true,
                'message' => 'Account created successfully!',
                'user' => [
                    'id' => $userId,
                    'email' => $otpRecord['email'],
                    'first_name' => $otpRecord['first_name'],
                    'last_name' => $otpRecord['last_name'],
                    'company_id' => $companyId,
                    'role' => 'admin'
                ]
            ]);

            // Send welcome email in background
            if (function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            }
            
            try {
                sendWelcomeEmailBackground($otpRecord['email'], $otpRecord['first_name'] . ' ' . $otpRecord['last_name'], $otpRecord['company_name']);
            } catch (Exception $e) {
                error_log("Background email send failed: " . $e->getMessage());
            }

        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Account creation failed: " . $e->getMessage());
            jsonError('Failed to create account');
        }

    } catch (PDOException $e) {
        error_log("OTP verification error: " . $e->getMessage());
        jsonError('Database error occurred');
    }
}

function handleResendOTP(array $input) {
    global $pdo;

    $email = strtolower(trim((string)($input['email'] ?? '')));

    if (!$email) {
        jsonError('Email is required');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('Invalid email format');
    }

    try {
        // Check if there's a pending OTP for this email
        $stmt = $pdo->prepare("
            SELECT * FROM otp_verification 
            WHERE email = ? AND verified = FALSE 
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt->execute([$email]);
        $otpRecord = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$otpRecord) {
            jsonError('No pending verification found for this email');
        }

        // Check rate limiting (max 1 resend per minute)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count FROM otp_verification 
            WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
        ");
        $stmt->execute([$email]);
        $recentCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        if ($recentCount > 1) {
            jsonError('Please wait before requesting another OTP');
        }

        // Generate new OTP
        require_once __DIR__ . '/../includes/email_helper.php';
        $newOtpCode = EmailHelper::generateOTP();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

        // Update existing record with new OTP
        $stmt = $pdo->prepare("
            UPDATE otp_verification 
            SET otp_code = ?, expires_at = ?, attempts = 0, created_at = NOW() 
            WHERE email = ? AND verified = FALSE
        ");
        $stmt->execute([$newOtpCode, $expiresAt, $email]);

        // Send new OTP email
        $emailSent = EmailHelper::sendOTPEmail($email, $newOtpCode, $otpRecord['first_name']);

        if ($emailSent) {
            echo json_encode([
                'success' => true,
                'message' => 'New OTP sent to your email'
            ]);
        } else {
            jsonError('Failed to send OTP email. Please try again.');
        }

    } catch (PDOException $e) {
        error_log("Resend OTP error: " . $e->getMessage());
        jsonError('Database error occurred');
    }
}
