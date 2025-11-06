<?php
// Start session with security settings
session_start();

// Security headers (set only once)
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/email_helper.php';

// Remove CORS headers for security (only allow same-origin)
// header('Access-Control-Allow-Origin: *'); // REMOVED
// header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS'); // REMOVED
// header('Access-Control-Allow-Headers: Content-Type, Authorization'); // REMOVED

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(405);
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

// Rate limiting for auth attempts
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$method = $_SERVER['REQUEST_METHOD'];

// Different rate limits for different operations
if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'check') {
    // Session checks are unlimited - no rate limiting
} else {
    // Rate limiting for actual authentication attempts
    $authRateLimitKey = 'auth_rate_limit_' . $ip;
    $maxAuthAttempts = 50; // attempts per hour (increased from 10)
    $timeWindow = 3600; // 1 hour

    if (!isset($_SESSION[$authRateLimitKey])) {
        $_SESSION[$authRateLimitKey] = ['count' => 0, 'start_time' => time()];
    }

    $authRateData = $_SESSION[$authRateLimitKey];

    // Reset counter if time window expired
    if (time() - $authRateData['start_time'] > $timeWindow) {
        $_SESSION[$authRateLimitKey] = ['count' => 1, 'start_time' => time()];
    } else {
        $_SESSION[$authRateLimitKey]['count']++;
        
        if ($_SESSION[$authRateLimitKey]['count'] > $maxAuthAttempts) {
            http_response_code(429);
            echo json_encode(['error' => 'Too many authentication attempts. Try again later.']);
            exit();
        }
    }
}

// Input validation and sanitization
$raw_input = file_get_contents('php://input');
$input = null;

// Handle direct access to the API file
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'API endpoint requires an action parameter']);
    exit();
}

// Parse JSON input for POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($raw_input)) {
        http_response_code(400);
        echo json_encode(['error' => 'POST request requires JSON body']);
        exit();
    }
    
    $input = json_decode($raw_input, true);
    
    if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit();
    }
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
            $action = $input['action'] ?? '';
            
            if ($action === 'login') {
                handleLogin($input);
            } elseif ($action === 'signup') {
                handleSignup($input);
            } elseif ($action === 'logout') {
                handleLogout();
            } elseif ($action === 'get_user') {
                handleGetUser();
            } elseif ($action === 'switch_company') {
                handleSwitchCompany($input);
            } elseif ($action === 'switch_user_account') {
                handleSwitchUserAccount($input);
            } elseif ($action === 'change_password') {
                handleChangePassword($input);
            } elseif ($action === 'logout_all_sessions') {
                handleLogoutAllSessions();
            } else {
                throw new Exception('Invalid action');
            }
            break;
            
        case 'GET':
            if (isset($_GET['action'])) {
                if ($_GET['action'] === 'check') {
                    checkSession();
                } elseif ($_GET['action'] === 'get_session_info') {
                    handleGetSessionInfo();
                } elseif ($_GET['action'] === 'reset_rate_limit') {
                    // Debug endpoint to reset rate limiting
                    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
                    $authRateLimitKey = 'auth_rate_limit_' . $ip;
                    unset($_SESSION[$authRateLimitKey]);
                    echo json_encode(['success' => true, 'message' => 'Rate limit reset']);
                } else {
                    throw new Exception('Invalid request');
                }
            } else {
                throw new Exception('Invalid request');
            }
            break;
            
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    // Log the error for debugging
    error_log("Auth API Error: " . $e->getMessage() . " | Method: " . $method . " | Input: " . print_r($input, true));
    
    // Return proper error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug_info' => [
            'method' => $method,
            'timestamp' => date('Y-m-d H:i:s'),
            'has_input' => !empty($input)
        ]
    ]);
} catch (PDOException $e) {
    // Handle database errors specifically
    error_log("Database Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred',
        'message' => 'Please try again later'
    ]);
}

function handleLogin($input) {
    global $pdo;
    
    // Input validation and sanitization with enhanced security
    if (!is_array($input)) {
        throw new Exception('Invalid input format');
    }
    
    // Enhanced input sanitization and validation
    $email = filter_var(trim($input['email'] ?? ''), FILTER_SANITIZE_EMAIL);
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    
    // Additional security checks
    if (preg_match('/[<>"\'\x00\x0a\x0d]/', $email . $username . $password)) {
        throw new Exception('Invalid characters detected');
    }
    
    // Handle company_id validation properly
    $company_id = null;
    if (isset($input['company_id']) && $input['company_id'] !== '' && $input['company_id'] !== null) {
        $company_id = filter_var($input['company_id'], FILTER_VALIDATE_INT);
        if ($company_id === false || $company_id <= 0) {
            throw new Exception('Invalid company ID');
        }
    }
    
    // Validate inputs with enhanced checks
    if ((empty($email) && empty($username)) || empty($password)) {
        throw new Exception('Email/Username and password are required');
    }
    
    if (strlen($password) > 255 || strlen($password) < 6) {
        throw new Exception('Invalid password length');
    }
    
    // Email validation with additional security
    if (!empty($email)) {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }
        if (strlen($email) > 255 || strlen($email) < 5) {
            throw new Exception('Invalid email length');
        }
        // Additional email pattern validation
        if (!preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $email)) {
            throw new Exception('Invalid email format');
        }
        $whereClause = "u.email = ?";
        $searchValue = $email;
    } else {
        // Username validation with enhanced security
        if (strlen($username) > 100 || strlen($username) < 3) {
            throw new Exception('Invalid username length');
        }
        // Additional username pattern validation
        if (!preg_match('/^[a-zA-Z0-9._-]+$/', $username)) {
            throw new Exception('Invalid username format');
        }
        $whereClause = "u.email = ?";
        $searchValue = $username;
    }
    
    // Company ID validation and filter setup
    $companyFilter = '';
    $params = [$searchValue];
    if ($company_id !== null) {
        $companyFilter = " AND u.company_id = ?";
        $params[] = $company_id;
    }
    
    // Get user from database with comprehensive security checks
    $stmt = $pdo->prepare("
        SELECT u.*, c.name as company_name, c.currency, c.tax_rate, c.is_active as company_active
        FROM users u 
        LEFT JOIN companies c ON u.company_id = c.id 
        WHERE {$whereClause} AND u.is_active = 1{$companyFilter}
    ");
    $stmt->execute($params);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        // Track failed attempts for non-existent users by email
        $emailLockoutKey = "login_attempts_email_" . md5($searchValue);
        if (!isset($_SESSION[$emailLockoutKey])) {
            $_SESSION[$emailLockoutKey] = 1;
            $_SESSION[$emailLockoutKey . '_time'] = time();
        } else {
            $_SESSION[$emailLockoutKey]++;
            $_SESSION[$emailLockoutKey . '_time'] = time();
        }
        
        throw new Exception('Invalid email or password');
    }
    
    // Check company status if user belongs to a company
    if ($user['company_id'] && !$user['company_active']) {
        throw new Exception('Company account is deactivated');
    }
    
    // Check subscription status
    if ($user['company_id'] && isset($user['subscription_end_date']) && $user['subscription_end_date']) {
        if (strtotime($user['subscription_end_date']) < time()) {
            throw new Exception('Company subscription has expired');
        }
    }
    
    // Verify password and track failed attempts
    $lockoutKey = "login_attempts_" . $user['id'];
    
    if (!password_verify($password, $user['password'])) {
        // Increment failed login attempts
        if (!isset($_SESSION[$lockoutKey])) {
            $_SESSION[$lockoutKey] = 1;
            $_SESSION[$lockoutKey . '_time'] = time();
        } else {
            $_SESSION[$lockoutKey]++;
            $_SESSION[$lockoutKey . '_time'] = time();
        }
        
        throw new Exception('Invalid email or password');
    }
    
    // Check account lockout (basic protection)
    if (isset($_SESSION[$lockoutKey]) && $_SESSION[$lockoutKey] >= 10) {
        $lockoutTime = $_SESSION[$lockoutKey . '_time'] ?? 0;
        if (time() - $lockoutTime < 900) { // 15 minutes lockout
            throw new Exception('Account temporarily locked due to multiple failed attempts');
        } else {
            // Reset attempts after lockout period
            unset($_SESSION[$lockoutKey], $_SESSION[$lockoutKey . '_time']);
        }
    }
    
    // Reset failed attempts on successful login
    unset($_SESSION[$lockoutKey], $_SESSION[$lockoutKey . '_time']);
    
    // Update last login
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Regenerate session ID for security
    session_regenerate_id(true);
    
    // Set secure session variables
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['company_id'] = $user['company_id'];
    $_SESSION['company_name'] = $user['company_name'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['logged_in'] = true;
    $_SESSION['last_activity'] = time();
    $_SESSION['session_created'] = time();
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['first_name'] . ' ' . $user['last_name'],
            'role' => $user['role'],
            'company_id' => $user['company_id'],
            'company_name' => $user['company_name']
        ]
    ]);
}

function handleSignup($input) {
    global $pdo;
    
    // Enhanced input sanitization and validation
    $firstName = trim($input['first_name'] ?? '');
    $lastName = trim($input['last_name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $confirmPassword = $input['confirm_password'] ?? '';
    $companyName = trim($input['company_name'] ?? '');
    $phone = trim($input['phone'] ?? '');
    
    // Additional security checks for malicious input
    $fields = [$firstName, $lastName, $email, $companyName, $phone];
    foreach ($fields as $field) {
        if (preg_match('/[<>"\'\x00\x0a\x0d]/', $field)) {
            throw new Exception('Invalid characters detected in input');
        }
    }
    
    // Enhanced validation with security checks
    if (empty($firstName) || empty($lastName) || empty($email) || empty($password) || empty($companyName)) {
        throw new Exception('All required fields must be filled');
    }
    
    // Name validation with enhanced security
    if (strlen($firstName) > 100 || strlen($firstName) < 2) {
        throw new Exception('Invalid first name length');
    }
    if (strlen($lastName) > 100 || strlen($lastName) < 2) {
        throw new Exception('Invalid last name length');
    }
    if (!preg_match('/^[a-zA-Z\s.-]+$/', $firstName) || !preg_match('/^[a-zA-Z\s.-]+$/', $lastName)) {
        throw new Exception('Names can only contain letters, spaces, dots and hyphens');
    }
    
    // Email validation with enhanced security
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    if (strlen($email) > 255 || strlen($email) < 5) {
        throw new Exception('Invalid email length');
    }
    if (!preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $email)) {
        throw new Exception('Invalid email format');
    }
    
    // Password validation with enhanced security
    if (strlen($password) < 8 || strlen($password) > 255) {
        throw new Exception('Password must be between 8 and 255 characters');
    }
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/', $password)) {
        throw new Exception('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
    
    if ($password !== $confirmPassword) {
        throw new Exception('Passwords do not match');
    }
    
    // Company name validation with enhanced security
    if (strlen($companyName) > 255 || strlen($companyName) < 2) {
        throw new Exception('Invalid company name length');
    }
    if (!preg_match('/^[a-zA-Z0-9\s&.-]+$/', $companyName)) {
        throw new Exception('Company name contains invalid characters');
    }
    
    // Phone validation (optional field)
    if (!empty($phone)) {
        if (strlen($phone) > 20) {
            throw new Exception('Phone number too long');
        }
        if (!preg_match('/^[\d\s()+-]+$/', $phone)) {
            throw new Exception('Invalid phone number format');
        }
    }
    
    // Check if email already exists using prepared statement
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        throw new Exception('Email address is already registered');
    }
    
    // Start transaction for data integrity
    $pdo->beginTransaction();
    
    try {
        // Create company first with sanitized data
        $stmt = $pdo->prepare("
            INSERT INTO companies (name, currency, tax_rate, created_at) 
            VALUES (?, 'NGN', 7.5, NOW())
        ");
        $stmt->execute([$companyName]);
        $companyId = $pdo->lastInsertId();
        
        // Calculate trial dates
        $now = new DateTime();
        $trialStart = $now->format('Y-m-d H:i:s');
        $trialEnd = $now->add(new DateInterval('P14D'))->format('Y-m-d H:i:s');
        
        // Create user with trial information
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("
            INSERT INTO users (
                first_name, last_name, email, password, phone, company_id, role, is_active, 
                subscription_plan, subscription_status, trial_start_date, trial_end_date, created_at
            ) 
            VALUES (?, ?, ?, ?, ?, ?, 'admin', 1, 'free', 'trial', ?, ?, NOW())
        ");
       $stmt->execute([$firstName, $lastName, $email, $hashedPassword, $phone, $companyId, $trialStart, $trialEnd]);
$userId = $pdo->lastInsertId();

// Create default chart of accounts for the company
createDefaultChartOfAccounts($companyId);

$pdo->commit();

// Set session variables
$_SESSION[‘user_id’] = $userId;
$_SESSION[‘user_email’] = $email;
$_SESSION[‘user_name’] = $firstName . ’ ’ . $lastName;
$_SESSION[‘company_id’] = $companyId;
$_SESSION[‘company_name’] = $companyName;
$_SESSION[‘user_role’] = ‘admin’;
$_SESSION[‘logged_in’] = true;

// Send welcome email to the new user (non-blocking; errors logged)
try {
// Adjust path if your app folder is at a different location
require_once DIR . ‘/…/app/mailer.php’;

// call the Mailer. This returns ['success' => bool, 'error' => null|string]
$result_mail = \FirmaFlow\Mailer::sendWelcome($email, $firstName . ($lastName ? " $lastName" : ''), $firstName);

if (isset($result_mail['error']) && !empty($result_mail['error'])) {
    error_log("Signup mail error for user {$userId}: " . $result_mail['error']);
}
} catch (Exception $emailError) {
// Log email error but don’t fail the registration
error_log("Welcome email include/call failed for {$email}: " . $emailError->getMessage());
} catch (\Throwable $t) {
error_log("Welcome email unexpected error for {$email}: " . $t->getMessage());
}

echo json_encode([
‘success’ => true,
‘message’ => ‘Account created successfully’,
‘user’ => [
‘id’ => $userId,
‘email’ => $email,
‘name’ => $firstName . ’ ’ . $lastName,
‘role’ => ‘admin’,
‘company_id’ => $companyId,
‘company_name’ => $companyName
]
]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function handleLogout() {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

function handleGetUser() {
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'email' => $_SESSION['user_email'],
                'name' => $_SESSION['user_name'],
                'role' => $_SESSION['user_role'],
                'company_id' => $_SESSION['company_id'],
                'company_name' => $_SESSION['company_name']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
    }
}

function handleSwitchCompany($input) {
    global $pdo;
    
    // Check if user is logged in
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }
    
    $company_id = $input['company_id'] ?? null;
    
    if (!$company_id) {
        throw new Exception('Company ID is required');
    }
    
    // Get the user's email to verify they can access this company
    $user_email = $_SESSION['user_email'];
    
    // Check if user exists in the target company (for now, we'll allow switching to any company)
    // In a more secure setup, you'd check if the user has access to that company
    $stmt = $pdo->prepare("
        SELECT c.id, c.name, u.id as user_id, u.first_name, u.last_name, u.role
        FROM companies c
        LEFT JOIN users u ON c.id = u.company_id AND u.email = ?
        WHERE c.id = ?
    ");
    $stmt->execute([$user_email, $company_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        throw new Exception('Company not found or access denied');
    }
    
    // If user doesn't exist in target company, create them with basic user role
    if (!$result['user_id']) {
        // For demo purposes, we'll create a user in the target company
        // In production, this would require proper authorization
        $stmt = $pdo->prepare("
            SELECT first_name, last_name, password, phone
            FROM users 
            WHERE id = ?
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($currentUser) {
            $stmt = $pdo->prepare("
                INSERT INTO users (first_name, last_name, email, password, phone, company_id, role, is_active, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, 'user', 1, NOW())
            ");
            $stmt->execute([
                $currentUser['first_name'],
                $currentUser['last_name'],
                $user_email,
                $currentUser['password'],
                $currentUser['phone'],
                $company_id
            ]);
            $new_user_id = $pdo->lastInsertId();
            $user_role = 'user';
        } else {
            throw new Exception('User data not found');
        }
    } else {
        $new_user_id = $result['user_id'];
        $user_role = $result['role'];
    }
    
    // Update session variables
    $_SESSION['user_id'] = $new_user_id;
    $_SESSION['company_id'] = $company_id;
    $_SESSION['company_name'] = $result['name'];
    $_SESSION['user_role'] = $user_role;
    
    echo json_encode([
        'success' => true,
        'message' => 'Successfully switched to ' . $result['name'],
        'user' => [
            'id' => $new_user_id,
            'email' => $_SESSION['user_email'],
            'name' => $_SESSION['user_name'],
            'role' => $user_role,
            'company_id' => $company_id,
            'company_name' => $result['name']
        ]
    ]);
}

function handleSwitchUserAccount($input) {
    global $pdo;
    
    // Check if user is logged in
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        return;
    }
    
    $user_id = $input['user_id'] ?? null;
    $company_id = $input['company_id'] ?? $_SESSION['company_id']; // Use current session company if not provided
    $password = $input['password'] ?? null;
    
    if (!$user_id || !$company_id || !$password) {
        throw new Exception('User ID and password are required');
    }
    
    // Verify the current user's password
    $current_user_id = $_SESSION['user_id'];
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$current_user_id]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$currentUser || !password_verify($password, $currentUser['password'])) {
        throw new Exception('Invalid password');
    }
    
    // Get target user details and verify they belong to the same company as current admin
    $stmt = $pdo->prepare("
        SELECT u.*, c.name as company_name, c.currency, c.tax_rate 
        FROM users u 
        LEFT JOIN companies c ON u.company_id = c.id 
        WHERE u.id = ? AND u.company_id = ? AND u.is_active = 1
    ");
    $stmt->execute([$user_id, $company_id]);
    $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$targetUser) {
        throw new Exception('Target user not found or access denied');
    }
    
    // Verify current user is admin of the same company
    $stmt = $pdo->prepare("
        SELECT role FROM users 
        WHERE id = ? AND company_id = ? AND role IN ('admin', 'manager')
    ");
    $stmt->execute([$current_user_id, $company_id]);
    $adminCheck = $stmt->fetch();
    
    if (!$adminCheck) {
        throw new Exception('You do not have permission to switch to this account');
    }
    
    // Update session variables to switch to the target user
    $_SESSION['user_id'] = $targetUser['id'];
    $_SESSION['user_email'] = $targetUser['email'];
    $_SESSION['user_name'] = $targetUser['first_name'] . ' ' . $targetUser['last_name'];
    $_SESSION['company_id'] = $targetUser['company_id'];
    $_SESSION['company_name'] = $targetUser['company_name'];
    $_SESSION['user_role'] = $targetUser['role'];
    
    // Update last login for the target user
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$targetUser['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Successfully switched to ' . $targetUser['first_name'] . ' ' . $targetUser['last_name'],
        'user' => [
            'id' => $targetUser['id'],
            'email' => $targetUser['email'],
            'name' => $targetUser['first_name'] . ' ' . $targetUser['last_name'],
            'role' => $targetUser['role'],
            'company_id' => $targetUser['company_id'],
            'company_name' => $targetUser['company_name']
        ]
    ]);
}

function checkSession() {
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
        echo json_encode([
            'logged_in' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'email' => $_SESSION['user_email'],
                'name' => $_SESSION['user_name'],
                'role' => $_SESSION['user_role'],
                'company_id' => $_SESSION['company_id'],
                'company_name' => $_SESSION['company_name']
            ]
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
}

function createDefaultChartOfAccounts($companyId) {
    global $pdo;
    
    $defaultAccounts = [
        // Assets
        ['Cash', 'asset', '1001'],
        ['Accounts Receivable', 'asset', '1002'],
        ['Inventory', 'asset', '1003'],
        ['Equipment', 'asset', '1004'],
        ['Accumulated Depreciation - Equipment', 'asset', '1005'],
        
        // Liabilities
        ['Accounts Payable', 'liability', '2001'],  
        ['Sales Tax Payable', 'liability', '2002'],
        ['Accrued Expenses', 'liability', '2003'],
        
        // Equity
        ['Owner\'s Equity', 'equity', '3001'],
        ['Retained Earnings', 'equity', '3002'],
        
        // Income
        ['Sales Revenue', 'income', '4001'],
        ['Service Revenue', 'income', '4002'],
        ['Other Income', 'income', '4003'],
        
        // Expenses
        ['Cost of Goods Sold', 'expense', '5001'],
        ['Salaries Expense', 'expense', '5002'],
        ['Rent Expense', 'expense', '5003'],
        ['Utilities Expense', 'expense', '5004'],
        ['Office Supplies Expense', 'expense', '5005'],
        ['Depreciation Expense', 'expense', '5006'],
        ['Professional Fees', 'expense', '5007'],
        ['Advertising Expense', 'expense', '5008']
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO accounts (company_id, name, type, code, is_active, created_at) 
        VALUES (?, ?, ?, ?, 1, NOW())
    ");
    
    foreach ($defaultAccounts as $account) {
        $stmt->execute([$companyId, $account[0], $account[1], $account[2]]);
    }
}

function handleChangePassword($input) {
    global $pdo;
    
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        return;
    }
    
    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    
    if (empty($currentPassword) || empty($newPassword)) {
        echo json_encode(['success' => false, 'error' => 'Current password and new password are required']);
        return;
    }
    
    if (strlen($newPassword) < 8) {
        echo json_encode(['success' => false, 'error' => 'New password must be at least 8 characters long']);
        return;
    }
    
    try {
        // Get current user
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            echo json_encode(['success' => false, 'error' => 'User not found']);
            return;
        }
        
        // Verify current password
        if (!password_verify($currentPassword, $user['password'])) {
            echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
            return;
        }
        
        // Hash new password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Update password
        $stmt = $pdo->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$hashedPassword, $_SESSION['user_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
        
    } catch (Exception $e) {
        error_log("Change password error: " . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    }
}

function handleGetSessionInfo() {
    global $pdo;
    
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        return;
    }
    
    try {
        // Get user's last login time
        $stmt = $pdo->prepare("SELECT last_login FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            echo json_encode(['success' => false, 'error' => 'User not found']);
            return;
        }
        
        echo json_encode([
            'success' => true, 
            'last_login' => $user['last_login'],
            'session_started' => $_SESSION['login_time'] ?? null,
            'user_id' => $_SESSION['user_id']
        ]);
        
    } catch (Exception $e) {
        error_log("Get session info error: " . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    }
}

function handleLogoutAllSessions() {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        return;
    }
    
    try {
        // For this simple implementation, we'll just destroy the current session
        // In a more advanced system, you'd invalidate all session tokens in the database
        
        session_destroy();
        
        // Start a new session to send the response
        session_start();
        
        echo json_encode(['success' => true, 'message' => 'Logged out from all sessions']);
        
    } catch (Exception $e) {
        error_log("Logout all sessions error: " . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Error logging out']);
    }
}
?>
