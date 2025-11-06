<?php
// Create a test superadmin account in staff_accounts table
require_once __DIR__ . '/../includes/db.php';

$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $fullName = trim($_POST['full_name'] ?? '');
    $role = $_POST['role'] ?? 'superadmin';
    $department = trim($_POST['department'] ?? 'System Administration');
    
    if (empty($username) || empty($email) || empty($password) || empty($fullName)) {
        $message = 'All fields are required.';
        $messageType = 'danger';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $message = 'Please enter a valid email address.';
        $messageType = 'danger';
    } elseif (strlen($password) < 8) {
        $message = 'Password must be at least 8 characters long.';
        $messageType = 'danger';
    } else {
        try {
            // Check if username or email already exists
            $stmt = $pdo->prepare("SELECT id FROM staff_accounts WHERE username = ? OR email = ?");
            $stmt->execute([$username, $email]);
            if ($stmt->fetch()) {
                $message = 'Username or email already exists.';
                $messageType = 'danger';
            } else {
                // Create account
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("
                    INSERT INTO staff_accounts (username, email, password_hash, full_name, role, department, is_active, created_by) 
                    VALUES (?, ?, ?, ?, ?, ?, 1, 1)
                ");
                $result = $stmt->execute([$username, $email, $passwordHash, $fullName, $role, $department]);
                
                if ($result) {
                    $userId = $pdo->lastInsertId();
                    $message = "✅ SuperAdmin account created successfully! User ID: $userId";
                    $messageType = 'success';
                    
                    // Clear form data on success
                    $_POST = [];
                } else {
                    $message = 'Failed to create account. Please try again.';
                    $messageType = 'danger';
                }
            }
        } catch (Exception $e) {
            $message = 'Database error: ' . $e->getMessage();
            $messageType = 'danger';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create SuperAdmin Account</title>
    
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
        
        .create-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .create-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
            width: 100%;
            max-width: 500px;
        }
        
        .create-header {
            background: linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .create-body {
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
        
        .create-footer {
            background-color: #f8fafc;
            padding: 1rem 2rem;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>

<div class="create-container">
    <div class="create-card">
        <div class="create-header">
            <div class="mb-3">
                <i class="ti ti-user-plus" style="font-size: 3rem;"></i>
            </div>
            <h1 class="h3 mb-1">Create SuperAdmin</h1>
            <p class="mb-0 opacity-75">Add new administrator account</p>
        </div>
        
        <div class="create-body">
            <?php if ($message): ?>
                <div class="alert alert-<?= $messageType ?>" role="alert">
                    <i class="ti ti-<?= $messageType === 'success' ? 'check-circle' : 'alert-circle' ?> me-2"></i>
                    <?= htmlspecialchars($message) ?>
                </div>
            <?php endif; ?>
            
            <form method="POST" action="">
                <div class="mb-3">
                    <label for="username" class="form-label">Username <span class="text-danger">*</span></label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="ti ti-user"></i>
                        </span>
                        <input type="text" class="form-control border-start-0" id="username" name="username" 
                               required autocomplete="username" placeholder="Enter username"
                               value="<?= htmlspecialchars($_POST['username'] ?? '') ?>">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="email" class="form-label">Email Address <span class="text-danger">*</span></label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="ti ti-mail"></i>
                        </span>
                        <input type="email" class="form-control border-start-0" id="email" name="email" 
                               required autocomplete="email" placeholder="Enter email address"
                               value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="full_name" class="form-label">Full Name <span class="text-danger">*</span></label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="ti ti-id"></i>
                        </span>
                        <input type="text" class="form-control border-start-0" id="full_name" name="full_name" 
                               required autocomplete="name" placeholder="Enter full name"
                               value="<?= htmlspecialchars($_POST['full_name'] ?? '') ?>">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="department" class="form-label">Department</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="ti ti-building"></i>
                        </span>
                        <input type="text" class="form-control border-start-0" id="department" name="department" 
                               placeholder="Enter department" 
                               value="<?= htmlspecialchars($_POST['department'] ?? 'System Administration') ?>">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="role" class="form-label">Role</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="ti ti-shield"></i>
                        </span>
                        <select class="form-control border-start-0" id="role" name="role">
                            <option value="superadmin" <?= ($_POST['role'] ?? 'superadmin') === 'superadmin' ? 'selected' : '' ?>>Super Administrator</option>
                            <option value="admin" <?= ($_POST['role'] ?? '') === 'admin' ? 'selected' : '' ?>>Administrator</option>
                            <option value="manager" <?= ($_POST['role'] ?? '') === 'manager' ? 'selected' : '' ?>>Manager</option>
                        </select>
                    </div>
                </div>
                
                <div class="mb-4">
                    <label for="password" class="form-label">Password <span class="text-danger">*</span></label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="ti ti-lock"></i>
                        </span>
                        <input type="password" class="form-control border-start-0" id="password" name="password" 
                               required autocomplete="new-password" placeholder="Enter password (min 8 characters)">
                        <button class="btn btn-outline-secondary border-start-0" type="button" id="togglePassword">
                            <i class="ti ti-eye"></i>
                        </button>
                    </div>
                    <div class="form-text">
                        <small class="text-muted">Password should be at least 8 characters long and include letters, numbers, and special characters.</small>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary w-100 mb-3">
                    <i class="ti ti-plus me-2"></i>Create SuperAdmin Account
                </button>
                
                <div class="text-center">
                    <small class="text-muted">
                        <a href="login.php" class="text-decoration-none">← Back to Login</a>
                    </small>
                </div>
            </form>
        </div>
        
        <div class="create-footer">
            <div class="d-flex justify-content-between align-items-center">
                <div>© <?= date('Y') ?> Firmaflow</div>
                <div>
                    <i class="ti ti-shield-check me-1"></i>Secure Creation
                </div>
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

// Form validation
document.querySelector('form').addEventListener('submit', function(e) {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const fullName = document.getElementById('full_name').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !email || !fullName || !password) {
        e.preventDefault();
        alert('Please fill in all required fields');
        return;
    }
    
    if (password.length < 8) {
        e.preventDefault();
        alert('Password must be at least 8 characters long');
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        e.preventDefault();
        alert('Please enter a valid email address');
        return;
    }
});
</script>

</body>
</html>
