<?php
/**
 * SuperAdmin Companies Management API
 * Handles company CRUD operations, subscriptions, and monitoring
 */

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

// Security headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Require superadmin authentication
requireSuperAdmin();

$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

switch ($action) {
    case 'list':
        listCompanies();
        break;
    case 'details':
        getCompanyDetails();
        break;
    case 'create':
        createCompany();
        break;
    case 'update':
        updateCompany();
        break;
    case 'delete':
        deleteCompany();
        break;
    case 'activate':
        activateCompany();
        break;
    case 'deactivate':
        deactivateCompany();
        break;
    case 'update_subscription':
        updateSubscription();
        break;
    case 'extend_subscription':
        extendSubscription();
        break;
    case 'cancel_subscription':
        cancelSubscription();
        break;
    case 'reset_password':
        resetCompanyPassword();
        break;
    case 'export':
        exportCompanies();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

function listCompanies() {
    global $pdo;
    
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = max(1, min(100, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    
    $search = trim($_GET['search'] ?? '');
    $status = $_GET['status'] ?? '';
    $plan = $_GET['plan'] ?? '';
    $sortBy = $_GET['sort_by'] ?? 'created_at';
    $sortOrder = strtoupper($_GET['sort_order'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
    
    $whereConditions = [];
    $params = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    if (!empty($status)) {
        $whereConditions[] = "c.subscription_status = ?";
        $params[] = $status;
    }
    
    if (!empty($plan)) {
        $whereConditions[] = "c.subscription_plan = ?";
        $params[] = $plan;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    try {
        // Get total count
        $countSql = "SELECT COUNT(*) FROM companies c $whereClause";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $totalCount = $countStmt->fetchColumn();
        
        // Get companies with user count
        $sql = "
            SELECT 
                c.*,
                COUNT(u.id) as user_count,
                MAX(u.last_login) as last_user_login,
                DATEDIFF(c.subscription_end_date, NOW()) as days_until_expiry
            FROM companies c
            LEFT JOIN users u ON c.id = u.company_id
            $whereClause
            GROUP BY c.id
            ORDER BY c.$sortBy $sortOrder
            LIMIT $limit OFFSET $offset
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format the data
        foreach ($companies as &$company) {
            $company['user_count'] = (int)$company['user_count'];
            $company['days_until_expiry'] = $company['days_until_expiry'] ? (int)$company['days_until_expiry'] : null;
            $company['is_trial'] = $company['subscription_plan'] === 'trial';
            $company['is_expired'] = $company['subscription_end_date'] && $company['subscription_end_date'] < date('Y-m-d');
            $company['subscription_amount'] = (float)($company['subscription_amount'] ?? 0);
        }
        
        echo json_encode([
            'success' => true,
            'companies' => $companies,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => ceil($totalCount / $limit),
                'total_count' => (int)$totalCount,
                'per_page' => $limit
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("List companies error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch companies']);
    }
}

function getCompanyDetails() {
    global $pdo;
    
    $companyId = intval($_GET['id'] ?? 0);
    
    if (!$companyId) {
        echo json_encode(['success' => false, 'message' => 'Company ID is required']);
        return;
    }
    
    try {
        // Get company details
        $stmt = $pdo->prepare("
            SELECT c.*, 
                   COUNT(u.id) as user_count,
                   MAX(u.last_login) as last_user_login
            FROM companies c
            LEFT JOIN users u ON c.id = u.company_id
            WHERE c.id = ?
            GROUP BY c.id
        ");
        $stmt->execute([$companyId]);
        $company = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$company) {
            echo json_encode(['success' => false, 'message' => 'Company not found']);
            return;
        }
        
        // Get users
        $stmt = $pdo->prepare("
            SELECT id, username, email, first_name, last_name, role, is_active, last_login, created_at
            FROM users 
            WHERE company_id = ?
            ORDER BY created_at ASC
        ");
        $stmt->execute([$companyId]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get recent payments
        $stmt = $pdo->prepare("
            SELECT id, amount, status, payment_method, created_at, description
            FROM payments 
            WHERE company_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $stmt->execute([$companyId]);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get complaints
        $stmt = $pdo->prepare("
            SELECT id, subject, status, priority, created_at, updated_at
            FROM complaints 
            WHERE company_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $stmt->execute([$companyId]);
        $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate statistics
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_invoices,
                COALESCE(SUM(total_amount), 0) as total_revenue
            FROM invoices 
            WHERE company_id = ?
        ");
        $stmt->execute([$companyId]);
        $invoiceStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'company' => $company,
            'users' => $users,
            'payments' => $payments,
            'complaints' => $complaints,
            'statistics' => [
                'user_count' => (int)$company['user_count'],
                'total_invoices' => (int)$invoiceStats['total_invoices'],
                'total_revenue' => (float)$invoiceStats['total_revenue'],
                'complaints_count' => count($complaints)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Get company details error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch company details']);
    }
}

function createCompany() {
    global $pdo;
    
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $subscriptionPlan = $_POST['subscription_plan'] ?? 'trial';
    $subscriptionStatus = $_POST['subscription_status'] ?? 'active';
    $subscriptionAmount = floatval($_POST['subscription_amount'] ?? 0);
    $billingCycle = $_POST['billing_cycle'] ?? 'monthly';
    
    if (empty($name) || empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Company name and email are required']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }
    
    try {
        // Check if company already exists
        $stmt = $pdo->prepare("SELECT id FROM companies WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetchColumn()) {
            echo json_encode(['success' => false, 'message' => 'Company with this email already exists']);
            return;
        }
        
        // Calculate subscription dates
        $startDate = date('Y-m-d');
        $endDate = date('Y-m-d', strtotime("+1 $billingCycle"));
        
        // Create company
        $stmt = $pdo->prepare("
            INSERT INTO companies (
                name, email, phone, address, 
                subscription_plan, subscription_status, subscription_amount,
                subscription_start_date, subscription_end_date, billing_cycle,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $name, $email, $phone, $address,
            $subscriptionPlan, $subscriptionStatus, $subscriptionAmount,
            $startDate, $endDate, $billingCycle
        ]);
        
        $companyId = $pdo->lastInsertId();
        
        // Log action
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPANY_CREATED', "Created company: $name", 'company', $companyId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Company created successfully',
            'company_id' => $companyId
        ]);
        
    } catch (Exception $e) {
        error_log("Create company error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to create company']);
    }
}

function updateCompany() {
    global $pdo;
    
    $companyId = intval($_POST['id'] ?? 0);
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $address = trim($_POST['address'] ?? '');
    
    if (!$companyId || empty($name) || empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Company ID, name, and email are required']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }
    
    try {
        // Check if company exists
        $stmt = $pdo->prepare("SELECT name FROM companies WHERE id = ?");
        $stmt->execute([$companyId]);
        $currentName = $stmt->fetchColumn();
        
        if (!$currentName) {
            echo json_encode(['success' => false, 'message' => 'Company not found']);
            return;
        }
        
        // Check if email is taken by another company
        $stmt = $pdo->prepare("SELECT id FROM companies WHERE email = ? AND id != ?");
        $stmt->execute([$email, $companyId]);
        if ($stmt->fetchColumn()) {
            echo json_encode(['success' => false, 'message' => 'Email is already taken by another company']);
            return;
        }
        
        // Update company
        $stmt = $pdo->prepare("
            UPDATE companies 
            SET name = ?, email = ?, phone = ?, address = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$name, $email, $phone, $address, $companyId]);
        
        // Log action
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPANY_UPDATED', "Updated company: $name", 'company', $companyId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Company updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Update company error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to update company']);
    }
}

function activateCompany() {
    global $pdo;
    
    $companyId = intval($_POST['id'] ?? 0);
    
    if (!$companyId) {
        echo json_encode(['success' => false, 'message' => 'Company ID is required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            UPDATE companies 
            SET subscription_status = 'active', updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$companyId]);
        
        if ($stmt->rowCount() === 0) {
            echo json_encode(['success' => false, 'message' => 'Company not found']);
            return;
        }
        
        // Log action
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPANY_ACTIVATED', "Activated company ID: $companyId", 'company', $companyId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Company activated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Activate company error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to activate company']);
    }
}

function deactivateCompany() {
    global $pdo;
    
    $companyId = intval($_POST['id'] ?? 0);
    
    if (!$companyId) {
        echo json_encode(['success' => false, 'message' => 'Company ID is required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            UPDATE companies 
            SET subscription_status = 'inactive', updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$companyId]);
        
        if ($stmt->rowCount() === 0) {
            echo json_encode(['success' => false, 'message' => 'Company not found']);
            return;
        }
        
        // Also deactivate all users
        $stmt = $pdo->prepare("UPDATE users SET is_active = 0 WHERE company_id = ?");
        $stmt->execute([$companyId]);
        
        // Log action
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPANY_DEACTIVATED', "Deactivated company ID: $companyId", 'company', $companyId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Company deactivated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Deactivate company error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to deactivate company']);
    }
}

function updateSubscription() {
    global $pdo;
    
    $companyId = intval($_POST['id'] ?? 0);
    $plan = $_POST['subscription_plan'] ?? '';
    $status = $_POST['subscription_status'] ?? '';
    $amount = floatval($_POST['subscription_amount'] ?? 0);
    $billingCycle = $_POST['billing_cycle'] ?? 'monthly';
    
    if (!$companyId || empty($plan) || empty($status)) {
        echo json_encode(['success' => false, 'message' => 'Company ID, plan, and status are required']);
        return;
    }
    
    try {
        // Get current subscription
        $stmt = $pdo->prepare("SELECT name, subscription_plan FROM companies WHERE id = ?");
        $stmt->execute([$companyId]);
        $company = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$company) {
            echo json_encode(['success' => false, 'message' => 'Company not found']);
            return;
        }
        
        // Calculate new end date
        $endDate = date('Y-m-d', strtotime("+1 $billingCycle"));
        
        // Update subscription
        $stmt = $pdo->prepare("
            UPDATE companies 
            SET subscription_plan = ?, subscription_status = ?, subscription_amount = ?,
                billing_cycle = ?, subscription_end_date = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$plan, $status, $amount, $billingCycle, $endDate, $companyId]);
        
        // Log action
        $user = getSuperAdminUser();
        logSuperAdminAction(
            $user['username'], 
            'SUBSCRIPTION_UPDATED', 
            "Updated subscription for {$company['name']}: {$company['subscription_plan']} -> $plan", 
            'company', 
            $companyId
        );
        
        echo json_encode([
            'success' => true,
            'message' => 'Subscription updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Update subscription error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to update subscription']);
    }
}

function deleteCompany() {
    global $pdo;
    
    $companyId = intval($_POST['id'] ?? 0);
    
    if (!$companyId) {
        echo json_encode(['success' => false, 'message' => 'Company ID is required']);
        return;
    }
    
    try {
        // Get company name for logging
        $stmt = $pdo->prepare("SELECT name FROM companies WHERE id = ?");
        $stmt->execute([$companyId]);
        $companyName = $stmt->fetchColumn();
        
        if (!$companyName) {
            echo json_encode(['success' => false, 'message' => 'Company not found']);
            return;
        }
        
        // Delete company (this will cascade delete users due to foreign key)
        $stmt = $pdo->prepare("DELETE FROM companies WHERE id = ?");
        $stmt->execute([$companyId]);
        
        // Log action
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPANY_DELETED', "Deleted company: $companyName", 'company', $companyId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Company deleted successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete company error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to delete company']);
    }
}

function extendSubscription() {
    global $pdo;
    
    $companyId = intval($_POST['id'] ?? 0);
    $months = intval($_POST['months'] ?? 1);
    
    if (!$companyId || $months < 1) {
        echo json_encode(['success' => false, 'message' => 'Company ID and valid months are required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT name, subscription_end_date FROM companies WHERE id = ?");
        $stmt->execute([$companyId]);
        $company = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$company) {
            echo json_encode(['success' => false, 'message' => 'Company not found']);
            return;
        }
        
        $currentEndDate = $company['subscription_end_date'] ?? date('Y-m-d');
        $newEndDate = date('Y-m-d', strtotime($currentEndDate . " +$months months"));
        
        $stmt = $pdo->prepare("
            UPDATE companies 
            SET subscription_end_date = ?, subscription_status = 'active', updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$newEndDate, $companyId]);
        
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'SUBSCRIPTION_EXTENDED', "Extended subscription for {$company['name']} by $months months", 'company', $companyId);
        
        echo json_encode([
            'success' => true,
            'message' => "Subscription extended by $months months",
            'new_end_date' => $newEndDate
        ]);
        
    } catch (Exception $e) {
        error_log("Extend subscription error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to extend subscription']);
    }
}

function cancelSubscription() {
    global $pdo;
    
    $companyId = intval($_POST['id'] ?? 0);
    
    if (!$companyId) {
        echo json_encode(['success' => false, 'message' => 'Company ID is required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT name FROM companies WHERE id = ?");
        $stmt->execute([$companyId]);
        $companyName = $stmt->fetchColumn();
        
        if (!$companyName) {
            echo json_encode(['success' => false, 'message' => 'Company not found']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE companies 
            SET subscription_status = 'cancelled', updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$companyId]);
        
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'SUBSCRIPTION_CANCELLED', "Cancelled subscription for: $companyName", 'company', $companyId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Subscription cancelled successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Cancel subscription error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to cancel subscription']);
    }
}

function resetCompanyPassword() {
    global $pdo;
    
    $companyId = intval($_POST['id'] ?? 0);
    $userId = intval($_POST['user_id'] ?? 0);
    
    if (!$companyId || !$userId) {
        echo json_encode(['success' => false, 'message' => 'Company ID and User ID are required']);
        return;
    }
    
    try {
        // Verify user belongs to company
        $stmt = $pdo->prepare("
            SELECT u.username, c.name as company_name
            FROM users u
            JOIN companies c ON u.company_id = c.id
            WHERE u.id = ? AND u.company_id = ?
        ");
        $stmt->execute([$userId, $companyId]);
        $userInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$userInfo) {
            echo json_encode(['success' => false, 'message' => 'User not found']);
            return;
        }
        
        // Generate new password
        $newPassword = bin2hex(random_bytes(4)) . '!';
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Update password
        $stmt = $pdo->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$hashedPassword, $userId]);
        
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'PASSWORD_RESET', "Reset password for user {$userInfo['username']} in company {$userInfo['company_name']}", 'user', $userId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Password reset successfully',
            'new_password' => $newPassword,
            'username' => $userInfo['username']
        ]);
        
    } catch (Exception $e) {
        error_log("Reset password error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to reset password']);
    }
}

function exportCompanies() {
    global $pdo;
    
    $format = $_GET['format'] ?? 'csv';
    
    try {
        $stmt = $pdo->query("
            SELECT 
                c.id,
                c.name,
                c.email,
                c.phone,
                c.address,
                c.subscription_plan,
                c.subscription_status,
                c.subscription_amount,
                c.subscription_start_date,
                c.subscription_end_date,
                c.billing_cycle,
                c.created_at,
                COUNT(u.id) as user_count
            FROM companies c
            LEFT JOIN users u ON c.id = u.company_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        ");
        $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($format === 'json') {
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="companies_' . date('Y-m-d') . '.json"');
            echo json_encode(['companies' => $companies]);
        } else {
            // CSV format
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="companies_' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            
            // CSV headers
            fputcsv($output, [
                'ID', 'Company Name', 'Email', 'Phone', 'Address',
                'Subscription Plan', 'Status', 'Amount', 'Start Date', 'End Date',
                'Billing Cycle', 'User Count', 'Created At'
            ]);
            
            // CSV data
            foreach ($companies as $company) {
                fputcsv($output, [
                    $company['id'],
                    $company['name'],
                    $company['email'],
                    $company['phone'],
                    $company['address'],
                    $company['subscription_plan'],
                    $company['subscription_status'],
                    $company['subscription_amount'],
                    $company['subscription_start_date'],
                    $company['subscription_end_date'],
                    $company['billing_cycle'],
                    $company['user_count'],
                    $company['created_at']
                ]);
            }
            
            fclose($output);
        }
        
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPANIES_EXPORTED', "Exported companies list in $format format");
        
    } catch (Exception $e) {
        error_log("Export companies error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to export companies']);
    }
}

function logSuperAdminAction($username, $action, $details, $targetType = null, $targetId = null) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            INSERT INTO superadmin_logs (username, action, target_type, target_id, details, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $username,
            $action,
            $targetType,
            $targetId,
            $details,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    } catch (Exception $e) {
        error_log("Failed to log superadmin action: " . $e->getMessage());
    }
}
?>