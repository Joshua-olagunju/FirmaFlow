<?php
session_start();

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/email_helper.php';

// Check if user data is in session (came from login)
if (!isset($_SESSION['otp_user_data']) || !isset($_SESSION['otp_email'])) {
    header('Location: login.php');
    exit;
}

// Check if OTP session is too old (15 minutes)
if (isset($_SESSION['otp_timestamp']) && (time() - $_SESSION['otp_timestamp']) > 900) {
    unset($_SESSION['otp_user_data']);
    unset($_SESSION['otp_email']);
    unset($_SESSION['otp_timestamp']);
    header('Location: login.php?error=otp_expired');
    exit;
}

$userData = $_SESSION['otp_user_data'];
$email = $_SESSION['otp_email'];
$error = '';
$success = '';

// Handle resend OTP
if (isset($_GET['resend']) && $_GET['resend'] == '1') {
    try {
        // Generate new OTP
        $otpCode = sprintf('%06d', mt_rand(0, 999999));
        $firstName = explode(' ', $userData['full_name'])[0];
        
        // Store new OTP in database
        $stmt = $pdo->prepare("
            INSERT INTO superadmin_otps (user_id, email, otp_code, expires_at) 
            VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
        ");
        $stmt->execute([$userData['id'], $email, $otpCode]);
        
        // Send OTP email
        $emailSent = EmailHelper::sendOTPEmail($email, $otpCode, $firstName);
        
        if ($emailSent) {
            $success = 'New verification code sent to your email.';
            $_SESSION['otp_timestamp'] = time(); // Reset timer
        } else {
            $error = 'Failed to send new verification code. Please try again.';
        }
    } catch (Exception $e) {
        $error = 'An error occurred while resending the code.';
        error_log("OTP resend error: " . $e->getMessage());
    }
}

// Handle OTP verification
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $enteredOTP = trim($_POST['otp'] ?? '');
    
    if (empty($enteredOTP)) {
        $error = 'Please enter the verification code.';
    } elseif (strlen($enteredOTP) !== 6 || !ctype_digit($enteredOTP)) {
        $error = 'Please enter a valid 6-digit code.';
    } else {
        try {
            // Verify OTP
            $stmt = $pdo->prepare("
                SELECT id FROM superadmin_otps 
                WHERE email = ? AND otp_code = ? AND used = 0 AND expires_at > NOW() 
                ORDER BY created_at DESC LIMIT 1
            ");
            $stmt->execute([$email, $enteredOTP]);
            $otpRecord = $stmt->fetch();
            
            if ($otpRecord) {
                // Mark OTP as used
                $stmt = $pdo->prepare("UPDATE superadmin_otps SET used = 1 WHERE id = ?");
                $stmt->execute([$otpRecord['id']]);
                
                // Create superadmin session
                $_SESSION['superadmin_logged_in'] = true;
                $_SESSION['superadmin_user'] = [
                    'id' => $userData['id'],
                    'username' => $userData['username'],
                    'email' => $userData['email'],
                    'full_name' => $userData['full_name'],
                    'role' => $userData['role'],
                    'department' => $userData['department']
                ];
                $_SESSION['superadmin_login_time'] = time();
                
                // Update last login for database users
                if (!isset($userData['is_demo']) && is_numeric($userData['id'])) {
                    try {
                        $stmt = $pdo->prepare("UPDATE staff_accounts SET last_login = NOW() WHERE id = ?");
                        $stmt->execute([$userData['id']]);
                    } catch (Exception $e) {
                        // Ignore update errors for demo accounts
                    }
                }
                
                // Log successful login
                try {
                    $stmt = $pdo->prepare("INSERT INTO superadmin_logs (username, action, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, NOW())");
                    $stmt->execute([$userData['username'], 'login_success', $_SERVER['REMOTE_ADDR'] ?? 'unknown', $_SERVER['HTTP_USER_AGENT'] ?? 'unknown']);
                } catch (Exception $e) {
                    // Ignore logging errors
                }
                
                // Clean up OTP session data
                unset($_SESSION['otp_user_data']);
                unset($_SESSION['otp_email']);
                unset($_SESSION['otp_timestamp']);
                
                // Redirect to dashboard
                header('Location: index.php');
                exit;
            } else {
                $error = 'Invalid or expired verification code. Please try again.';
            }
        } catch (Exception $e) {
            $error = 'An error occurred during verification. Please try again.';
            error_log("OTP verification error: " . $e->getMessage());
        }
    }
}

// Mask email for display
$maskedEmail = substr($email, 0, 2) . '***@' . substr($email, strpos($email, '@') + 1);
$firstName = explode(' ', $userData['full_name'])[0];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - SuperAdmin</title>
    
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
        
        .verify-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .verify-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
            width: 100%;
            max-width: 420px;
        }
        
        .verify-header {
            background: linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .verify-body {
            padding: 2rem;
        }
        
        .form-control {
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            padding: 0.75rem 1rem;
            font-size: 16px;
        }
        
        .form-control:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 0.2rem rgba(220, 38, 38, 0.25);
        }
        
        .otp-input {
            font-size: 1.5rem;
            text-align: center;
            letter-spacing: 0.5rem;
            font-family: 'Courier New', monospace;
            font-weight: bold;
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
        
        .verify-footer {
            background-color: #f8fafc;
            padding: 1rem 2rem;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        @media (max-width: 576px) {
            .verify-container {
                padding: 10px;
            }
            
            .verify-header {
                padding: 1.5rem;
            }
            
            .verify-body {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>

<div class="verify-container">
    <div class="verify-card">
        <div class="verify-header">
            <div class="mb-3">
                <i class="ti ti-mail-check" style="font-size: 3rem;"></i>
            </div>
            <h1 class="h3 mb-1">Email Verification</h1>
            <p class="mb-0 opacity-75">Two-Factor Authentication</p>
        </div>
        
        <div class="verify-body">
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
            
            <div class="mb-4">
                <p class="text-muted text-center">
                    Hello <strong><?= htmlspecialchars($firstName) ?></strong>!<br>
                    We sent a 6-digit verification code to:<br>
                    <strong><?= htmlspecialchars($maskedEmail) ?></strong>
                </p>
            </div>
            
            <form method="POST" action="">
                <div class="mb-4">
                    <label for="otp" class="form-label">Verification Code</label>
                    <input type="text" class="form-control otp-input" id="otp" name="otp" 
                           maxlength="6" required placeholder="000000" autocomplete="one-time-code"
                           pattern="[0-9]{6}" inputmode="numeric">
                    <div class="form-text">Code expires in 15 minutes</div>
                </div>
                
                <button type="submit" class="btn btn-primary w-100 mb-3">
                    <i class="ti ti-check me-2"></i>Verify & Continue
                </button>
                
                <div class="text-center mb-3">
                    <small class="text-muted">
                        Didn't receive the code? 
                        <a href="?resend=1" class="text-decoration-none fw-semibold" style="color: var(--primary);">
                            <i class="ti ti-refresh me-1"></i>Resend Code
                        </a>
                    </small>
                </div>
                
                <div class="text-center">
                    <small class="text-muted">
                        <a href="login.php" class="text-decoration-none">← Back to Login</a>
                    </small>
                </div>
            </form>
        </div>
        
        <div class="verify-footer">
            <div class="d-flex justify-content-between align-items-center">
                <div>© <?= date('Y') ?> Firmaflow</div>
                <div>
                    <i class="ti ti-shield-check me-1"></i>Secure Access
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
// Auto-focus OTP input
document.getElementById('otp').focus();

// Format OTP input to accept only numbers
document.getElementById('otp').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 6) value = value.substring(0, 6);
    e.target.value = value;
    
    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
        setTimeout(() => {
            document.querySelector('form').submit();
        }, 500);
    }
});

// Prevent form submission with incomplete code
document.querySelector('form').addEventListener('submit', function(e) {
    const otp = document.getElementById('otp').value;
    if (otp.length !== 6) {
        e.preventDefault();
        alert('Please enter the complete 6-digit verification code');
        return;
    }
});

// Auto refresh page if stayed too long (14 minutes)
setTimeout(() => {
    if (confirm('Your session is about to expire. Would you like to refresh and request a new code?')) {
        window.location.href = 'verify_otp.php?resend=1';
    }
}, 14 * 60 * 1000);
</script>

</body>
</html>
