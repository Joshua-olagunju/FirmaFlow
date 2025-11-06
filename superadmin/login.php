<?php
session_start();

// Include required files
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/email_helper.php';

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Redirect if already logged in as superadmin
if (isset($_SESSION['superadmin_logged_in']) && $_SESSION['superadmin_logged_in'] === true) {
    header('Location: index.php');
    exit;
}

$error = '';
$success = '';

// Check for logout success message
if (isset($_SESSION['logout_success'])) {
    $success = $_SESSION['logout_success'];
    unset($_SESSION['logout_success']);
}

// Check for logged out status
if (isset($_GET['logged_out']) && $_GET['logged_out'] == '1' && empty($success)) {
    $success = 'You have been successfully logged out. Please login again to continue.';
}

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password';
    } else {
        try {
            // First check the staff_accounts table (existing system)
            $stmt = $pdo->prepare("
                SELECT id, username, email, password_hash, full_name, role, department, is_active 
                FROM staff_accounts 
                WHERE (username = ? OR email = ?) AND is_active = 1 AND role IN ('superadmin', 'admin', 'manager')
            ");
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // If not found in database, check demo accounts (existing functionality)
            if (!$user) {
                $demoAccounts = [
                    'superadmin' => [
                        'id' => 'demo_1',
                        'username' => 'superadmin',
                        'email' => 'superadmin@firmaflow.com',
                        'password' => 'SuperAdmin123!',
                        'full_name' => 'Super Administrator',
                        'role' => 'superadmin',
                        'department' => 'System Administration'
                    ],
                    'admin' => [
                        'id' => 'demo_2',
                        'username' => 'admin',
                        'email' => 'admin@firmaflow.com',
                        'password' => 'Admin123!',
                        'full_name' => 'System Administrator',
                        'role' => 'admin',
                        'department' => 'Administration'
                    ],
                    'support' => [
                        'id' => 'demo_3',
                        'username' => 'support',
                        'email' => 'support@firmaflow.com',
                        'password' => 'Support123!',
                        'full_name' => 'Support Manager',
                        'role' => 'manager',
                        'department' => 'Customer Support'
                    ]
                ];
                
                if (isset($demoAccounts[$username]) && $demoAccounts[$username]['password'] === $password) {
                    $user = $demoAccounts[$username];
                    $user['is_demo'] = true; // Flag for demo accounts
                }
            } else {
                // Verify password for database users
                if (!password_verify($password, $user['password_hash'])) {
                    $user = null;
                }
            }
            
            if ($user) {
                // Generate OTP
                $otpCode = sprintf('%06d', mt_rand(0, 999999));
                $email = $user['email'];
                $firstName = explode(' ', $user['full_name'])[0];
                
                // Store OTP in database
                $stmt = $pdo->prepare("
                    INSERT INTO superadmin_otps (user_id, email, otp_code, expires_at) 
                    VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
                ");
                $stmt->execute([$user['id'], $email, $otpCode]);
                
                // Send OTP email
                $emailSent = EmailHelper::sendOTPEmail($email, $otpCode, $firstName);
                
                if ($emailSent) {
                    // Store user data in session for OTP verification
                    $_SESSION['otp_user_data'] = $user;
                    $_SESSION['otp_email'] = $email;
                    $_SESSION['otp_timestamp'] = time();
                    
                    // Log the OTP request
                    try {
                        $stmt = $pdo->prepare("INSERT INTO superadmin_logs (username, action, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, NOW())");
                        $stmt->execute([$user['username'], 'otp_requested', $_SERVER['REMOTE_ADDR'] ?? 'unknown', $_SERVER['HTTP_USER_AGENT'] ?? 'unknown']);
                    } catch (Exception $e) {
                        // Ignore logging errors
                    }
                    
                    // Redirect to OTP verification page
                    header('Location: verify_otp.php');
                    exit;
                } else {
                    $error = 'Failed to send verification code. Please try again.';
                }
            } else {
                $error = 'Invalid username or password';
            }
        } catch (Exception $e) {
            $error = 'A system error occurred. Please try again.';
            error_log("SuperAdmin login error: " . $e->getMessage());
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SuperAdmin Login - Firmaflow</title>
    
    <!-- Bootstrap 5.3.0 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Tabler Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons@2.44.0/tabler-icons.min.css">
    
    <style>
        :root {
            --primary: #dc2626;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .login-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
            width: 100%;
            max-width: 400px;
        }
        
        .login-header {
            background: linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .login-body {
            padding: 2rem;
        }
        
        .form-control {
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            padding: 0.75rem 1rem;
            font-size: 14px;
        }
        
        .form-control:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 0.2rem rgba(220, 38, 38, 0.25);
        }
        
        .btn-primary {
            background-color: var(--primary);
            border-color: var(--primary);
            border-radius: 8px;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
        }
        
        .btn-primary:hover {
            background-color: #b91c1c;
            border-color: #b91c1c;
        }
        
        .alert {
            border-radius: 8px;
            font-size: 14px;
        }
        
        .login-footer {
            background-color: #f8fafc;
            padding: 1rem 2rem;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        @media (max-width: 576px) {
            .login-container {
                padding: 10px;
            }
            
            .login-header {
                padding: 1.5rem;
            }
            
            .login-body {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>

<div class="login-container">
    <div class="login-card">
        <div class="login-header">
            <div class="mb-3">
                <i class="ti ti-shield-lock" style="font-size: 3rem;"></i>
            </div>
            <h1 class="h3 mb-1">SuperAdmin Portal</h1>
            <p class="mb-0 opacity-75">Firmaflow System Control</p>
        </div>
        
        <div class="login-body">
            <?php if ($error): ?>
                <div class="alert alert-danger" role="alert">
                    <i class="ti ti-alert-circle me-2"></i><?= htmlspecialchars($error) ?>
                </div>
            <?php endif; ?>
            
            <?php if ($success): ?>
                <div class="alert alert-success" role="alert">
                    <i class="ti ti-check me-2"></i><?= htmlspecialchars($success) ?>
                </div>
            <?php endif; ?>
            
            <form method="POST" action="">
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="ti ti-user"></i>
                        </span>
                        <input type="text" class="form-control border-start-0" id="username" name="username" 
                               required autocomplete="username" placeholder="Enter username"
                               value="<?= htmlspecialchars($_POST['username'] ?? '') ?>">
                    </div>
                </div>
                
                <div class="mb-4">
                    <label for="password" class="form-label">Password</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="ti ti-lock"></i>
                        </span>
                        <input type="password" class="form-control border-start-0" id="password" name="password" 
                               required autocomplete="current-password" placeholder="Enter password">
                        <button class="btn btn-outline-secondary border-start-0" type="button" id="togglePassword">
                            <i class="ti ti-eye"></i>
                        </button>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary w-100 mb-3">
                    <i class="ti ti-login me-2"></i>Login to SuperAdmin
                </button>
                
                <div class="text-center">
                    <small class="text-muted">
                        <i class="ti ti-info-circle me-1"></i>
                        Authorized personnel only
                    </small>
                    <br>
                    <small class="text-muted mt-2 d-block">
                        Need an account? <a href="create_superadmin.php" class="text-decoration-none" style="color: var(--primary);">Create SuperAdmin</a>
                        | <a href="setup_otp_table.php" class="text-decoration-none" style="color: var(--primary);">Setup Database</a>
                    </small>
                </div>
            </form>
        </div>
        
        <div class="login-footer">
            <div class="d-flex justify-content-between align-items-center">
                <div>© <?= date('Y') ?> Firmaflow</div>
                <div>
                    <i class="ti ti-shield-check me-1"></i>Secure Login
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Demo Credentials Notice -->
<div class="position-fixed bottom-0 start-0 p-3">
    <div class="card border-warning">
        <div class="card-body p-3">
            <h6 class="card-title text-warning mb-2">
                <i class="ti ti-info-circle me-1"></i>Demo Credentials
            </h6>
            <div class="small">
                <strong>Username:</strong> superadmin<br>
                <strong>Password:</strong> SuperAdmin123!<br>
                <em class="text-muted">Other users: admin/Admin123!, support/Support123!</em>
            </div>
        </div>
    </div>
</div>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
// Password toggle functionality
document.getElementById('togglePassword').addEventListener('click', function() {
    const password = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (password.type === 'password') {
        password.type = 'text';
        icon.className = 'ti ti-eye-off';
    } else {
        password.type = 'password';
        icon.className = 'ti ti-eye';
    }
});

// Auto-hide demo credentials on mobile
if (window.innerWidth < 768) {
    setTimeout(() => {
        const demoCard = document.querySelector('.position-fixed.bottom-0');
        if (demoCard) {
            demoCard.style.transform = 'translateY(100%)';
            demoCard.style.transition = 'transform 0.3s ease';
        }
    }, 5000);
}

// Form validation
document.querySelector('form').addEventListener('submit', function(e) {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        e.preventDefault();
        alert('Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        e.preventDefault();
        alert('Password must be at least 6 characters long');
        return;
    }
});
</script>

</body>
</html>