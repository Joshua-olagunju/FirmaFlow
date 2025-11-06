<?php
// Staff Login Page
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Redirect if already logged in
if (isset($_SESSION['staff_id'])) {
    header('Location: staff_dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Login - Firmaflow</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Tabler Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons@latest/icons-sprite.svg">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons@latest/tabler-icons.min.css">
    
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .login-card {
            border: none;
            border-radius: 1rem;
            box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07);
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
        }
        .btn-primary:hover {
            background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }
        .form-control:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
    </style>
</head>
<body class="d-flex align-items-center">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-5 col-lg-4">
                <div class="card login-card">
                    <div class="card-body p-4">
                        <!-- Logo and Title -->
                        <div class="text-center mb-4">
                            <div class="mb-3">
                                <div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                                    <i class="ti ti-users-group" style="font-size: 2rem;"></i>
                                </div>
                            </div>
                            <h3 class="fw-bold text-dark mb-1">Staff Portal</h3>
                            <p class="text-muted mb-0">Customer Support Access</p>
                        </div>

                        <!-- Alert Container -->
                        <div id="alertContainer"></div>

                        <!-- Login Form -->
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="username" class="form-label">Username</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="ti ti-user"></i>
                                    </span>
                                    <input type="text" class="form-control" id="username" name="username" required placeholder="Enter your username" autocomplete="username">
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="ti ti-lock"></i>
                                    </span>
                                    <input type="password" class="form-control" id="password" name="password" required placeholder="Enter your password" autocomplete="current-password">
                                </div>
                            </div>

                            <div class="d-grid mb-3">
                                <button type="submit" class="btn btn-primary btn-lg" id="loginBtn">
                                    <i class="ti ti-login me-2"></i>
                                    <span id="loginBtnText">Sign In</span>
                                </button>
                            </div>
                        </form>

                        <!-- Footer -->
                        <div class="text-center mt-4 pt-3 border-top">
                            <p class="text-muted small mb-0">
                                Staff Portal for Customer Support
                            </p>
                            <a href="../index.php" class="text-decoration-none small">
                                <i class="ti ti-arrow-left me-1"></i>Back to SuperAdmin
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        // Handle login form submission
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('loginBtn');
            const loginBtnText = document.getElementById('loginBtnText');
            
            // Show loading state
            loginBtn.disabled = true;
            loginBtnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Signing In...';
            
            // Clear previous alerts
            document.getElementById('alertContainer').innerHTML = '';
            
            try {
                const response = await fetch('api/staff_auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'login',
                        username: username,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showAlert('Login successful! Redirecting...', 'success');
                    
                    // Redirect after a short delay
                    setTimeout(() => {
                        window.location.href = 'staff_dashboard.php';
                    }, 1500);
                } else {
                    showAlert(data.error || 'Login failed. Please try again.', 'danger');
                    
                    // Reset form
                    loginBtn.disabled = false;
                    loginBtnText.textContent = 'Sign In';
                }
            } catch (error) {
                console.error('Login error:', error);
                showAlert('Network error. Please check your connection and try again.', 'danger');
                
                // Reset form
                loginBtn.disabled = false;
                loginBtnText.textContent = 'Sign In';
            }
        });
        
        // Show alert function
        function showAlert(message, type) {
            const alertContainer = document.getElementById('alertContainer');
            const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
            
            const alertHtml = `
                <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                    <i class="ti ti-${type === 'success' ? 'check-circle' : 'alert-circle'} me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            
            alertContainer.innerHTML = alertHtml;
        }
        
        // Focus on username field
        document.getElementById('username').focus();
    </script>
</body>
</html>