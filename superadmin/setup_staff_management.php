<?php
// Staff Management Setup Script
// Run this script to set up the staff management system

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include database connection
require_once 'includes/db.php';

// Verify superadmin authentication
if (!isset($_SESSION['superadmin_logged_in']) || $_SESSION['superadmin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

$messages = [];
$errors = [];

// Process setup if requested
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['setup'])) {
    try {
        $pdo = getSuperAdminDB();
        
        // Read and execute the SQL schema
        $sqlFile = 'database/staff_management_schema.sql';
        if (!file_exists($sqlFile)) {
            $errors[] = 'SQL schema file not found: ' . $sqlFile;
        } else {
            $sql = file_get_contents($sqlFile);
            $statements = array_filter(array_map('trim', explode(';', $sql)));
            
            foreach ($statements as $statement) {
                if (!empty($statement) && !preg_match('/^\s*--/', $statement)) {
                    try {
                        $pdo->exec($statement);
                        $messages[] = 'Executed: ' . substr($statement, 0, 50) . '...';
                    } catch (Exception $e) {
                        $errors[] = 'Error executing statement: ' . $e->getMessage();
                    }
                }
            }
            
            if (empty($errors)) {
                $messages[] = '✅ Staff management tables created successfully!';
                $messages[] = '✅ You can now access Staff Management from the sidebar.';
            }
        }
    } catch (Exception $e) {
        $errors[] = 'Database error: ' . $e->getMessage();
    }
}

// Check if tables already exist
$tablesExist = false;
try {
    $pdo = getSuperAdminDB();
    $stmt = $pdo->query("SHOW TABLES LIKE 'staff_members'");
    $tablesExist = $stmt->rowCount() > 0;
} catch (Exception $e) {
    $errors[] = 'Could not check database: ' . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Management Setup - Firmaflow</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Tabler Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons@latest/tabler-icons.min.css">
    
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .setup-card {
            border: none;
            border-radius: 1rem;
            box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07);
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
        }
    </style>
</head>
<body class="d-flex align-items-center">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card setup-card">
                    <div class="card-body p-4">
                        <!-- Header -->
                        <div class="text-center mb-4">
                            <div class="mb-3">
                                <div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                                    <i class="ti ti-users-group" style="font-size: 2rem;"></i>
                                </div>
                            </div>
                            <h3 class="fw-bold text-dark mb-1">Staff Management Setup</h3>
                            <p class="text-muted mb-0">Initialize the staff management system for customer support</p>
                        </div>

                        <!-- Status Messages -->
                        <?php if (!empty($messages)): ?>
                        <div class="alert alert-success">
                            <h6 class="alert-heading"><i class="ti ti-check-circle me-2"></i>Setup Messages</h6>
                            <?php foreach ($messages as $message): ?>
                                <div><?= htmlspecialchars($message) ?></div>
                            <?php endforeach; ?>
                        </div>
                        <?php endif; ?>

                        <?php if (!empty($errors)): ?>
                        <div class="alert alert-danger">
                            <h6 class="alert-heading"><i class="ti ti-alert-circle me-2"></i>Setup Errors</h6>
                            <?php foreach ($errors as $error): ?>
                                <div><?= htmlspecialchars($error) ?></div>
                            <?php endforeach; ?>
                        </div>
                        <?php endif; ?>

                        <!-- Setup Information -->
                        <div class="row mb-4">
                            <div class="col-12">
                                <h5 class="fw-bold mb-3">What this setup will do:</h5>
                                <ul class="list-unstyled">
                                    <li class="mb-2">
                                        <i class="ti ti-check text-success me-2"></i>
                                        Create <code>staff_members</code> table for staff accounts
                                    </li>
                                    <li class="mb-2">
                                        <i class="ti ti-check text-success me-2"></i>
                                        Create <code>staff_sessions</code> table for authentication
                                    </li>
                                    <li class="mb-2">
                                        <i class="ti ti-check text-success me-2"></i>
                                        Set up proper indexes and relationships
                                    </li>
                                    <li class="mb-2">
                                        <i class="ti ti-check text-success me-2"></i>
                                        Enable staff management functionality
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <!-- Current Status -->
                        <div class="card bg-light border-0 mb-4">
                            <div class="card-body">
                                <h6 class="fw-bold mb-3">Current Status</h6>
                                <div class="row">
                                    <div class="col-6">
                                        <div class="d-flex align-items-center">
                                            <?php if ($tablesExist): ?>
                                                <div class="badge bg-success rounded-circle me-2" style="width: 12px; height: 12px;"></div>
                                                <small>Tables exist</small>
                                            <?php else: ?>
                                                <div class="badge bg-warning rounded-circle me-2" style="width: 12px; height: 12px;"></div>
                                                <small>Tables not found</small>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="d-flex align-items-center">
                                            <div class="badge bg-success rounded-circle me-2" style="width: 12px; height: 12px;"></div>
                                            <small>API endpoints ready</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Setup Actions -->
                        <?php if (!$tablesExist || !empty($errors)): ?>
                        <form method="POST">
                            <div class="d-grid mb-3">
                                <button type="submit" name="setup" class="btn btn-primary btn-lg">
                                    <i class="ti ti-settings me-2"></i>
                                    <?= $tablesExist ? 'Re-run Setup' : 'Initialize Staff Management' ?>
                                </button>
                            </div>
                        </form>
                        <?php else: ?>
                        <div class="alert alert-success">
                            <div class="d-flex align-items-center">
                                <i class="ti ti-check-circle me-2"></i>
                                <strong>Staff Management is ready!</strong>
                            </div>
                        </div>
                        <?php endif; ?>

                        <!-- Navigation -->
                        <div class="text-center">
                            <a href="index.php" class="btn btn-outline-secondary me-2">
                                <i class="ti ti-arrow-left me-1"></i>Back to Dashboard
                            </a>
                            <?php if ($tablesExist): ?>
                            <a href="pages/staff.php" class="btn btn-outline-primary">
                                <i class="ti ti-users-group me-1"></i>Go to Staff Management
                            </a>
                            <?php endif; ?>
                        </div>

                        <!-- Footer Info -->
                        <div class="text-center mt-4 pt-3 border-top">
                            <p class="text-muted small mb-0">
                                After setup, staff members can access:
                                <span class="badge bg-light text-dark ms-1">Complaints</span>
                                <span class="badge bg-light text-dark ms-1">Live Chat</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>