<?php
// SuperAdmin Profile Management Page
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$pageTitle = 'SuperAdmin Profile';
require_once '../includes/header.php';
require_once '../includes/sidebar.php';

// Check if user is super admin
if (!isset($_SESSION['superadmin_logged_in']) || $_SESSION['superadmin_logged_in'] !== true) {
    header('Location: ../login.php');
    exit;
}

$success = '';
$error = '';
$currentUser = $_SESSION['superadmin_user'];

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'update_profile') {
        // Update profile information
        $full_name = trim($_POST['full_name'] ?? '');
        $department = trim($_POST['department'] ?? '');
        
        if (empty($full_name)) {
            $error = 'Full name is required.';
        } else {
            // Update session data
            $_SESSION['superadmin_user']['full_name'] = $full_name;
            $_SESSION['superadmin_user']['department'] = $department;
            
            // Log the profile update
            require_once '../includes/db.php';
            try {
                $stmt = $pdo->prepare("INSERT INTO superadmin_logs (username, action, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, NOW())");
                $stmt->execute([
                    $currentUser['username'], 
                    'profile_update', 
                    $_SERVER['REMOTE_ADDR'] ?? 'unknown', 
                    $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
                ]);
            } catch (Exception $e) {
                error_log("Profile update logging error: " . $e->getMessage());
            }
            
            $success = 'Profile updated successfully!';
            $currentUser = $_SESSION['superadmin_user']; // Refresh current user data
        }
    } 
    elseif ($action === 'change_password') {
        // Change password
        $current_password = $_POST['current_password'] ?? '';
        $new_password = $_POST['new_password'] ?? '';
        $confirm_password = $_POST['confirm_password'] ?? '';
        
        // Validate current password
        $superadmin_users = [
            'superadmin' => [
                'password' => 'SuperAdmin123!',
                'full_name' => 'Super Administrator',
                'role' => 'superadmin',
                'department' => 'System Administration'
            ]
        ];
        
        if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
            $error = 'All password fields are required.';
        } elseif ($current_password !== $superadmin_users[$currentUser['username']]['password']) {
            $error = 'Current password is incorrect.';
        } elseif ($new_password !== $confirm_password) {
            $error = 'New passwords do not match.';
        } elseif (strlen($new_password) < 8) {
            $error = 'New password must be at least 8 characters long.';
        } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/', $new_password)) {
            $error = 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
        } else {
            // In a real application, you would update the database here
            // For now, we'll just log the password change attempt
            require_once '../includes/db.php';
            try {
                $stmt = $pdo->prepare("INSERT INTO superadmin_logs (username, action, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, NOW())");
                $stmt->execute([
                    $currentUser['username'], 
                    'password_change_attempt', 
                    $_SERVER['REMOTE_ADDR'] ?? 'unknown', 
                    $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
                ]);
            } catch (Exception $e) {
                error_log("Password change logging error: " . $e->getMessage());
            }
            
            $success = 'Password change request logged. In production, this would update your password in the database.';
        }
    }
}
?>

        <!-- Page Content -->
        <div class="container-fluid p-4">
            <!-- Page Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h3 mb-1">
                        <i class="ti ti-user me-2"></i>SuperAdmin Profile
                    </h1>
                    <p class="text-muted mb-0">Manage your profile information and security settings</p>
                </div>
                <div class="d-flex gap-2">
                    <span class="badge bg-success">
                        <i class="ti ti-shield-check me-1"></i>SuperAdmin
                    </span>
                </div>
            </div>

            <!-- Alert Messages -->
            <?php if ($success): ?>
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <i class="ti ti-check-circle me-2"></i><?= htmlspecialchars($success) ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>

            <?php if ($error): ?>
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="ti ti-exclamation-circle me-2"></i><?= htmlspecialchars($error) ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>

            <div class="row g-4">
                <!-- Profile Information Card -->
                <div class="col-md-6">
                    <div class="card shadow-sm">
                        <div class="card-header bg-primary text-white">
                            <h5 class="card-title mb-0">
                                <i class="ti ti-user-edit me-2"></i>Profile Information
                            </h5>
                        </div>
                        <div class="card-body">
                            <form method="POST" id="profileForm">
                                <input type="hidden" name="action" value="update_profile">
                                
                                <div class="mb-3">
                                    <label for="username" class="form-label">Username</label>
                                    <input type="text" class="form-control" id="username" value="<?= htmlspecialchars($currentUser['username']) ?>" readonly>
                                    <div class="form-text">Username cannot be changed for security reasons.</div>
                                </div>

                                <div class="mb-3">
                                    <label for="full_name" class="form-label">Full Name</label>
                                    <input type="text" class="form-control" id="full_name" name="full_name" 
                                           value="<?= htmlspecialchars($currentUser['full_name'] ?? '') ?>" required>
                                </div>

                                <div class="mb-3">
                                    <label for="role" class="form-label">Role</label>
                                    <input type="text" class="form-control" id="role" value="<?= htmlspecialchars($currentUser['role']) ?>" readonly>
                                    <div class="form-text">Role is system-assigned and cannot be modified.</div>
                                </div>

                                <div class="mb-3">
                                    <label for="department" class="form-label">Department</label>
                                    <input type="text" class="form-control" id="department" name="department" 
                                           value="<?= htmlspecialchars($currentUser['department'] ?? '') ?>">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Last Login</label>
                                    <div class="form-control-plaintext">
                                        <?= isset($_SESSION['superadmin_login_time']) ? date('F j, Y g:i A', $_SESSION['superadmin_login_time']) : 'Current session' ?>
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-primary">
                                    <i class="ti ti-device-floppy me-1"></i>Update Profile
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Password Change Card -->
                <div class="col-md-6">
                    <div class="card shadow-sm">
                        <div class="card-header bg-warning text-dark">
                            <h5 class="card-title mb-0">
                                <i class="ti ti-lock me-2"></i>Change Password
                            </h5>
                        </div>
                        <div class="card-body">
                            <form method="POST" id="passwordForm">
                                <input type="hidden" name="action" value="change_password">
                                
                                <div class="mb-3">
                                    <label for="current_password" class="form-label">Current Password</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="current_password" name="current_password" required>
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePassword('current_password')">
                                            <i class="ti ti-eye" id="current_password_icon"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="new_password" class="form-label">New Password</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="new_password" name="new_password" required>
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePassword('new_password')">
                                            <i class="ti ti-eye" id="new_password_icon"></i>
                                        </button>
                                    </div>
                                    <div class="form-text">
                                        Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="confirm_password" class="form-label">Confirm New Password</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePassword('confirm_password')">
                                            <i class="ti ti-eye" id="confirm_password_icon"></i>
                                        </button>
                                    </div>
                                </div>

                                <!-- Password Strength Indicator -->
                                <div class="mb-3">
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar" id="passwordStrength" role="progressbar" style="width: 0%"></div>
                                    </div>
                                    <div class="form-text">
                                        <span id="passwordStrengthText">Enter a password to see strength</span>
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-warning text-dark">
                                    <i class="ti ti-key me-1"></i>Change Password
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Account Security Information -->
                <div class="col-12">
                    <div class="card shadow-sm">
                        <div class="card-header bg-info text-white">
                            <h5 class="card-title mb-0">
                                <i class="ti ti-shield-check me-2"></i>Account Security
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <div class="d-flex align-items-center">
                                        <div class="bg-success bg-opacity-10 text-success rounded-circle p-3 me-3">
                                            <i class="ti ti-shield-check"></i>
                                        </div>
                                        <div>
                                            <h6 class="mb-0">Admin Status</h6>
                                            <small class="text-muted">Full SuperAdmin Access</small>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4">
                                    <div class="d-flex align-items-center">
                                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3">
                                            <i class="ti ti-clock"></i>
                                        </div>
                                        <div>
                                            <h6 class="mb-0">Session Status</h6>
                                            <small class="text-muted">Active & Secure</small>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4">
                                    <div class="d-flex align-items-center">
                                        <div class="bg-warning bg-opacity-10 text-warning rounded-circle p-3 me-3">
                                            <i class="ti ti-key"></i>
                                        </div>
                                        <div>
                                            <h6 class="mb-0">Password Security</h6>
                                            <small class="text-muted">Change regularly for security</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

<script>
// Password visibility toggle
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(fieldId + '_icon');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'ti ti-eye-off';
    } else {
        field.type = 'password';
        icon.className = 'ti ti-eye';
    }
}

// Password strength checker
document.getElementById('new_password').addEventListener('input', function() {
    const password = this.value;
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('passwordStrengthText');
    
    let strength = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) {
        strength += 25;
    } else {
        feedback.push('at least 8 characters');
    }
    
    // Lowercase check
    if (/[a-z]/.test(password)) {
        strength += 25;
    } else {
        feedback.push('lowercase letter');
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
        strength += 25;
    } else {
        feedback.push('uppercase letter');
    }
    
    // Number and special character check
    if (/\d/.test(password) && /[@$!%*?&]/.test(password)) {
        strength += 25;
    } else {
        if (!/\d/.test(password)) feedback.push('number');
        if (!/[@$!%*?&]/.test(password)) feedback.push('special character');
    }
    
    // Update progress bar
    strengthBar.style.width = strength + '%';
    
    if (strength < 50) {
        strengthBar.className = 'progress-bar bg-danger';
        strengthText.textContent = 'Weak - Missing: ' + feedback.join(', ');
    } else if (strength < 75) {
        strengthBar.className = 'progress-bar bg-warning';
        strengthText.textContent = 'Fair - Missing: ' + feedback.join(', ');
    } else if (strength < 100) {
        strengthBar.className = 'progress-bar bg-info';
        strengthText.textContent = 'Good - Missing: ' + feedback.join(', ');
    } else {
        strengthBar.className = 'progress-bar bg-success';
        strengthText.textContent = 'Strong - All requirements met';
    }
});

// Password confirmation validation
document.getElementById('confirm_password').addEventListener('input', function() {
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = this.value;
    
    if (confirmPassword && newPassword !== confirmPassword) {
        this.classList.add('is-invalid');
    } else {
        this.classList.remove('is-invalid');
    }
});

// Form validation with AJAX submission
document.getElementById('passwordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match!', 'danger');
        return false;
    }
    
    if (newPassword.length < 8) {
        showAlert('Password must be at least 8 characters long!', 'danger');
        return false;
    }
    
    if (!confirm('Are you sure you want to change your password? You will need to remember the new password for future logins.')) {
        return false;
    }
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ti ti-loader-2 me-1 spinner-border spinner-border-sm"></i>Changing Password...';
    submitBtn.disabled = true;
    
    // Submit via API
    fetch('../api/profile.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'change_password',
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message + (data.note ? ' ' + data.note : ''), 'success');
            this.reset(); // Clear the form
        } else {
            showAlert(data.message, 'danger');
        }
    })
    .catch(error => {
        showAlert('An error occurred while changing password. Please try again.', 'danger');
        console.error('Error:', error);
    })
    .finally(() => {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
});

// Profile form submission
document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('full_name').value.trim();
    const department = document.getElementById('department').value.trim();
    
    if (!fullName) {
        showAlert('Full name is required!', 'danger');
        return false;
    }
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ti ti-loader-2 me-1 spinner-border spinner-border-sm"></i>Updating Profile...';
    submitBtn.disabled = true;
    
    // Submit via API
    fetch('../api/profile.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'update_profile',
            full_name: fullName,
            department: department
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            // Update displayed information
            if (data.user) {
                document.getElementById('full_name').value = data.user.full_name;
                document.getElementById('department').value = data.user.department;
            }
        } else {
            showAlert(data.message, 'danger');
        }
    })
    .catch(error => {
        showAlert('An error occurred while updating profile. Please try again.', 'danger');
        console.error('Error:', error);
    })
    .finally(() => {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
});

// Alert helper function
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <i class="ti ti-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at the top of the container
    const container = document.querySelector('.container-fluid');
    const pageHeader = container.querySelector('.d-flex.justify-content-between');
    container.insertBefore(alertDiv, pageHeader.nextSibling);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
</script>

<?php require_once '../includes/footer.php'; ?>