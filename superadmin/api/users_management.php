<?php
// SuperAdmin Users Management API
require_once '../includes/auth.php';

// Check if user is SuperAdmin using the standardized function
if (!isSuperAdmin()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    // Use the PDO connection from auth file
    
    switch ($method) {
        case 'GET':
            handleGetRequest($pdo, $action);
            break;
            
        case 'POST':
            handlePostRequest($pdo);
            break;
            
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    error_log("Users Management API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function handleGetRequest($pdo, $action) {
    switch ($action) {
        case 'get_companies':
            getCompanies($pdo);
            break;
            
        case 'get_user':
            getUser($pdo);
            break;
            
        case 'export':
            exportUsers($pdo);
            break;
            
        default:
            getUsers($pdo);
            break;
    }
}

function handlePostRequest($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'create_user':
            createUser($pdo, $input);
            break;
            
        case 'toggle_status':
            toggleUserStatus($pdo, $input);
            break;
            
        case 'reset_password':
            resetUserPassword($pdo, $input);
            break;
            
        case 'change_password':
            changeUserPassword($pdo, $input);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
}

function getUsers($pdo) {
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    $search = $_GET['search'] ?? '';
    $role = $_GET['role'] ?? '';
    $status = $_GET['status'] ?? '';
    $companyId = $_GET['company_id'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    // Build WHERE clause
    $whereConditions = [];
    $params = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR c.name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    if (!empty($role)) {
        $whereConditions[] = "u.role = ?";
        $params[] = $role;
    }
    
    if ($status !== '') {
        $whereConditions[] = "u.is_active = ?";
        $params[] = (int)$status;
    }
    
    if (!empty($companyId)) {
        $whereConditions[] = "u.company_id = ?";
        $params[] = $companyId;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Get total count
    $countSql = "
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        {$whereClause}
    ";
    
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $totalCount = $stmt->fetch()['total'];
    
    // Get users
    $sql = "
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.role,
            u.is_active,
            u.last_login,
            u.created_at,
            u.company_id,
            c.name as company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        {$whereClause}
        ORDER BY u.created_at DESC
        LIMIT {$limit} OFFSET {$offset}
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();
    
    // Get statistics
    $stats = getUserStats($pdo);
    
    // Pagination info
    $totalPages = ceil($totalCount / $limit);
    
    echo json_encode([
        'success' => true,
        'users' => $users,
        'stats' => $stats,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $totalPages,
            'total_count' => $totalCount,
            'per_page' => $limit
        ]
    ]);
}

function getUserStats($pdo) {
    // Total users
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $totalUsers = $stmt->fetch()['total'];
    
    // Active users
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE is_active = 1");
    $activeUsers = $stmt->fetch()['total'];
    
    // Admin users
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE role = 'admin'");
    $adminUsers = $stmt->fetch()['total'];
    
    // Companies with users
    $stmt = $pdo->query("SELECT COUNT(DISTINCT company_id) as total FROM users WHERE company_id IS NOT NULL");
    $companiesWithUsers = $stmt->fetch()['total'];
    
    return [
        'total_users' => $totalUsers,
        'active_users' => $activeUsers,
        'admin_users' => $adminUsers,
        'companies_with_users' => $companiesWithUsers
    ];
}

function getCompanies($pdo) {
    $sql = "SELECT id, name FROM companies ORDER BY name";
    $stmt = $pdo->query($sql);
    $companies = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'companies' => $companies
    ]);
}

function getUser($pdo) {
    $userId = $_GET['id'] ?? '';
    
    if (empty($userId)) {
        throw new Exception('User ID is required');
    }
    
    $sql = "
        SELECT 
            u.*,
            c.name as company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.id = ?
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    echo json_encode([
        'success' => true,
        'user' => $user
    ]);
}

function toggleUserStatus($pdo, $input) {
    $userId = $input['user_id'] ?? '';
    $isActive = $input['is_active'] ?? '';
    
    if (empty($userId) || $isActive === '') {
        throw new Exception('User ID and status are required');
    }
    
    $sql = "UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([(int)$isActive, $userId]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('User not found or no changes made');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'User status updated successfully'
    ]);
}

function resetUserPassword($pdo, $input) {
    $userId = $input['user_id'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    
    if (empty($userId) || empty($newPassword)) {
        throw new Exception('User ID and new password are required');
    }
    
    if (strlen($newPassword) < 6) {
        throw new Exception('Password must be at least 6 characters long');
    }
    
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $sql = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$hashedPassword, $userId]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('User not found or no changes made');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Password reset successfully'
    ]);
}

function changeUserPassword($pdo, $input) {
    $userId = $input['user_id'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $notifyUser = $input['notify_user'] ?? false;
    
    if (empty($userId) || empty($newPassword)) {
        throw new Exception('User ID and new password are required');
    }
    
    if (strlen($newPassword) < 6) {
        throw new Exception('Password must be at least 6 characters long');
    }
    
    // Get user details for notification
    $userStmt = $pdo->prepare("SELECT first_name, last_name, email FROM users WHERE id = ?");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch();
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $sql = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$hashedPassword, $userId]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('No changes made');
    }
    
    // Log the password change (optional)
    $logSql = "INSERT INTO superadmin_logs (action, details, created_at) VALUES (?, ?, NOW())";
    try {
        $logStmt = $pdo->prepare($logSql);
        $logStmt->execute([
            'password_change', 
            "Password changed for user {$user['first_name']} {$user['last_name']} (ID: {$userId})"
        ]);
    } catch (Exception $e) {
        // Log error but don't fail the password change
        error_log("Failed to log password change: " . $e->getMessage());
    }
    
    // TODO: Send email notification if notify_user is true
    // if ($notifyUser) {
    //     sendPasswordChangeNotification($user['email'], $user['first_name']);
    // }
    
    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully' . ($notifyUser ? ' and user notified' : '')
    ]);
}

function exportUsers($pdo) {
    $search = $_GET['search'] ?? '';
    $role = $_GET['role'] ?? '';
    $status = $_GET['status'] ?? '';
    $companyId = $_GET['company_id'] ?? '';
    
    // Build WHERE clause
    $whereConditions = [];
    $params = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR c.name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    if (!empty($role)) {
        $whereConditions[] = "u.role = ?";
        $params[] = $role;
    }
    
    if ($status !== '') {
        $whereConditions[] = "u.is_active = ?";
        $params[] = (int)$status;
    }
    
    if (!empty($companyId)) {
        $whereConditions[] = "u.company_id = ?";
        $params[] = $companyId;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Get all users for export
    $sql = "
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.role,
            CASE WHEN u.is_active = 1 THEN 'Active' ELSE 'Inactive' END as status,
            u.last_login,
            u.created_at,
            c.name as company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        {$whereClause}
        ORDER BY u.created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();
    
    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="users_export_' . date('Y-m-d') . '.csv"');
    
    // Create CSV output
    $output = fopen('php://output', 'w');
    
    // CSV headers
    fputcsv($output, [
        'ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Role',
        'Status',
        'Company',
        'Last Login',
        'Created At'
    ]);
    
    // CSV data
    foreach ($users as $user) {
        fputcsv($output, [
            $user['id'],
            $user['first_name'],
            $user['last_name'],
            $user['email'],
            $user['phone'] ?? '',
            $user['role'],
            $user['status'],
            $user['company_name'] ?? 'N/A',
            $user['last_login'] ? date('Y-m-d H:i:s', strtotime($user['last_login'])) : 'Never',
            date('Y-m-d H:i:s', strtotime($user['created_at']))
        ]);
    }
    
    fclose($output);
}

function createUser($pdo, $input) {
    // Validate required fields
    $required = ['first_name', 'last_name', 'email', 'company_id', 'role', 'password'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Field '$field' is required");
        }
    }
    
    // Validate email format
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Validate password length
    if (strlen($input['password']) < 6) {
        throw new Exception('Password must be at least 6 characters long');
    }
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$input['email']]);
    if ($stmt->fetch()) {
        throw new Exception('Email address already exists');
    }
    
    // Validate company exists
    $stmt = $pdo->prepare("SELECT id FROM companies WHERE id = ?");
    $stmt->execute([$input['company_id']]);
    if (!$stmt->fetch()) {
        throw new Exception('Invalid company selected');
    }
    
    // Validate role
    $allowedRoles = ['admin', 'manager', 'user', 'support'];
    if (!in_array($input['role'], $allowedRoles)) {
        throw new Exception('Invalid role selected');
    }
    
    try {
        $pdo->beginTransaction();
        
        // Hash password
        $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
        
        // Insert user
        $stmt = $pdo->prepare("
            INSERT INTO users (
                first_name, last_name, email, phone, company_id, role, 
                password, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $input['first_name'],
            $input['last_name'],
            $input['email'],
            $input['phone'] ?? null,
            $input['company_id'],
            $input['role'],
            $passwordHash,
            $input['is_active'] ?? 1
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Log the creation action
        $superadmin = getSuperAdminUser();
        $stmt = $pdo->prepare("
            INSERT INTO superadmin_logs (
                username, action, target_type, target_id, details, 
                ip_address, user_agent, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $superadmin['username'] ?? 'superadmin',
            'create_user',
            'user',
            $userId,
            json_encode([
                'created_user' => $input['email'],
                'role' => $input['role'],
                'company_id' => $input['company_id']
            ]),
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
        
        $pdo->commit();
        
        // Send welcome email if requested
        if (!empty($input['send_welcome'])) {
            try {
                require_once '../../includes/email_helper.php';
                EmailHelper::sendWelcomeEmail(
                    $input['email'],
                    $input['first_name'] . ' ' . $input['last_name']
                );
            } catch (Exception $e) {
                // Log email error but don't fail user creation
                error_log("Failed to send welcome email: " . $e->getMessage());
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'User created successfully',
            'user_id' => $userId
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}
?>