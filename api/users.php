<?php
// Start session and set headers
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/subscription_helper.php';

// Check authentication
if (!isset($_SESSION['company_id']) || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized - Please login']);
    exit;
}

$company_id = $_SESSION['company_id'];
$current_user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

try {
    if ($method === 'GET') {
        // Check if action parameter is provided
        $action = $_GET['action'] ?? null;
        
        if ($action === 'get_admin_users') {
            // Get all users created by the current admin (same company)
            $stmt = $pdo->prepare("
                SELECT u.id, u.company_id, u.first_name, u.last_name, u.email, u.phone, u.role, 
                       u.is_active, u.last_login, u.created_at, c.name as company_name
                FROM users u
                LEFT JOIN companies c ON u.company_id = c.id
                WHERE u.company_id = ?
                ORDER BY u.first_name, u.last_name
            ");
            $stmt->execute([$company_id]);
            $users = $stmt->fetchAll();

            echo json_encode(['success' => true, 'users' => $users]);
        } else if ($action === 'validate_current_user') {
            // Validate current user account status
            $stmt = $pdo->prepare("
                SELECT u.*, c.name as company_name, c.is_active as company_active
                FROM users u 
                LEFT JOIN companies c ON u.company_id = c.id 
                WHERE u.id = ? AND u.is_active = 1
            ");
            $stmt->execute([$current_user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                echo json_encode([
                    'success' => false, 
                    'user_active' => false,
                    'message' => 'User account not found or inactive'
                ]);
                exit;
            }
            
            // Check company status if user belongs to a company
            if ($user['company_id'] && !$user['company_active']) {
                echo json_encode([
                    'success' => false, 
                    'user_active' => false,
                    'message' => 'Company account is inactive'
                ]);
                exit;
            }
            
            echo json_encode([
                'success' => true, 
                'user_active' => true,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'name' => $user['first_name'] . ' ' . $user['last_name'],
                    'role' => $user['role'],
                    'company_id' => $user['company_id'],
                    'company_name' => $user['company_name']
                ]
            ]);
            
        } else if ($action === 'get_companies') {
            // Get all companies that the current user has access to
            // For now, we'll get all companies (this could be restricted based on business logic)
            $stmt = $pdo->prepare("
                SELECT c.id, c.name, c.business_type, c.created_at
                FROM companies c
                ORDER BY c.name
            ");
            $stmt->execute();
            $companies = $stmt->fetchAll();

            echo json_encode(['success' => true, 'companies' => $companies]);
        } else if (isset($_GET['id'])) {
            // Get single user
            $stmt = $pdo->prepare("
                SELECT id, company_id, first_name, last_name, email, phone, role, 
                       is_active, last_login, created_at 
                FROM users 
                WHERE id = ? AND company_id = ?
            ");
            $stmt->execute([$_GET['id'], $company_id]);
            $user = $stmt->fetch();

            if ($user) {
                echo json_encode(['success' => true, 'user' => $user]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'User not found']);
            }
        } else {
            // Get all users for the company (default behavior)
            $stmt = $pdo->prepare("
                SELECT id, company_id, first_name, last_name, email, phone, role, 
                       is_active, last_login, created_at 
                FROM users 
                WHERE company_id = ?
                ORDER BY first_name, last_name
            ");
            $stmt->execute([$company_id]);
            $users = $stmt->fetchAll();

            echo json_encode(['success' => true, 'users' => $users]);
        }
    } else if ($method === 'POST') {
        // Create new user
        $first_name = trim($input['first_name'] ?? '');
        $last_name = trim($input['last_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? 'user';
        $is_active = isset($input['is_active']) ? (int)$input['is_active'] : 1;

        // Validate required fields
        if (empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'First name, last name, email, and password are required']);
            exit;
        }

        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid email format']);
            exit;
        }

        // Validate password length
        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters long']);
            exit;
        }

        // Validate role
        $valid_roles = ['admin', 'manager', 'user'];
        if (!in_array($role, $valid_roles)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid role specified']);
            exit;
        }

        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email already exists']);
            exit;
        }

        // Check subscription-based user limits
        $subscriptionInfo = getUserSubscriptionInfo($current_user_id);
        $plan = $subscriptionInfo['subscription_plan'] ?? 'free';
        
        // Define user limits by plan (excluding the admin user)
        $userLimits = [
            'free' => 1,         // 1 extra user
            'starter' => 1,      // 1 extra user
            'professional' => 4, // 4 extra users
            'enterprise' => 8    // 8 extra users
        ];
        
        $maxUsers = $userLimits[$plan] ?? $userLimits['free'];
        
        // Count existing users in the company (excluding admin)
        $stmt = $pdo->prepare("SELECT COUNT(*) as user_count FROM users WHERE company_id = ? AND role != 'admin'");
        $stmt->execute([$company_id]);
        $currentUserCount = $stmt->fetch()['user_count'];
        
        if ($currentUserCount >= $maxUsers) {
            http_response_code(403);
            $upgradeMessage = '';
            switch($plan) {
                case 'free':
                    $upgradeMessage = 'Upgrade to Starter, Professional, or Enterprise to add more users.';
                    break;
                case 'starter':
                    $upgradeMessage = 'Upgrade to Professional (4 users) or Enterprise (8 users) to add more team members.';
                    break;
                case 'professional':
                    $upgradeMessage = 'Upgrade to Enterprise to add more than 4 additional users.';
                    break;
                default:
                    $upgradeMessage = 'User limit reached for your current plan.';
            }
            echo json_encode([
                'success' => false, 
                'error' => "User limit reached. Your {$plan} plan allows {$maxUsers} additional user(s).",
                'message' => $upgradeMessage,
                'plan' => $plan,
                'current_users' => $currentUserCount,
                'max_users' => $maxUsers,
                'upgrade_required' => true
            ]);
            exit;
        }

        // Hash password
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        // Insert new user
        $stmt = $pdo->prepare("
            INSERT INTO users (company_id, first_name, last_name, email, phone, password, role, is_active, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $company_id,
            $first_name,
            $last_name,
            $email,
            $phone,
            $hashed_password,
            $role,
            $is_active
        ]);

        $user_id = $pdo->lastInsertId();

        // Create company_users entry if table exists
        try {
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO company_users (company_id, user_id, role, created_at, updated_at) 
                VALUES (?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$company_id, $user_id, $role]);
        } catch (Exception $e) {
            // Table might not exist, that's okay
        }

        echo json_encode(['success' => true, 'message' => 'User created successfully', 'user_id' => $user_id]);

    } else if ($method === 'PUT') {
        // Update user
        $user_id = $input['id'] ?? null;
        
        if (!$user_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'User ID is required']);
            exit;
        }

        // Prevent users from editing themselves
        if ($user_id == $current_user_id) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'You cannot edit your own account through user management.']);
            exit;
        }

        // Verify user belongs to the company and check if it's an admin
        $stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ? AND company_id = ?");
        $stmt->execute([$user_id, $company_id]);
        $existingUser = $stmt->fetch();
        
        if (!$existingUser) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'User not found']);
            exit;
        }
        
        // Prevent editing admin users
        if ($existingUser['role'] === 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Admin users cannot be edited through user management.']);
            exit;
        }

        // Build update query dynamically based on provided fields
        $update_fields = [];
        $update_values = [];

        if (isset($input['first_name'])) {
            $first_name = trim($input['first_name']);
            if (empty($first_name)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'First name cannot be empty']);
                exit;
            }
            $update_fields[] = 'first_name = ?';
            $update_values[] = $first_name;
        }

        if (isset($input['last_name'])) {
            $last_name = trim($input['last_name']);
            if (empty($last_name)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Last name cannot be empty']);
                exit;
            }
            $update_fields[] = 'last_name = ?';
            $update_values[] = $last_name;
        }

        if (isset($input['email'])) {
            $email = trim($input['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid email format']);
                exit;
            }
            
            // Check if email already exists for other users
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$email, $user_id]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Email already exists']);
                exit;
            }
            
            $update_fields[] = 'email = ?';
            $update_values[] = $email;
        }

        if (isset($input['phone'])) {
            $update_fields[] = 'phone = ?';
            $update_values[] = trim($input['phone']);
        }

        if (isset($input['password']) && !empty($input['password'])) {
            $password = $input['password'];
            if (strlen($password) < 6) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters long']);
                exit;
            }
            $update_fields[] = 'password = ?';
            $update_values[] = password_hash($password, PASSWORD_DEFAULT);
        }

        if (isset($input['role'])) {
            $role = $input['role'];
            $valid_roles = ['manager', 'user'];
            if (!in_array($role, $valid_roles)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid role. Only manager and user roles are allowed.']);
                exit;
            }
            $update_fields[] = 'role = ?';
            $update_values[] = $role;

            // Update company_users table if it exists
            try {
                $stmt = $pdo->prepare("
                    UPDATE company_users 
                    SET role = ?, updated_at = NOW() 
                    WHERE company_id = ? AND user_id = ?
                ");
                $stmt->execute([$role, $company_id, $user_id]);
            } catch (Exception $e) {
                // Table might not exist, that's okay
            }
        }

        if (isset($input['is_active'])) {
            $update_fields[] = 'is_active = ?';
            $update_values[] = (int)$input['is_active'];
        }

        if (empty($update_fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit;
        }

        // Add updated_at timestamp
        $update_fields[] = 'updated_at = NOW()';
        $update_values[] = $user_id; // For WHERE clause

        $sql = "UPDATE users SET " . implode(', ', $update_fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($update_values);

        echo json_encode(['success' => true, 'message' => 'User updated successfully']);

    } else if ($method === 'DELETE') {
        // Delete user
        $user_id = $_GET['id'] ?? null;
        
        if (!$user_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'User ID is required']);
            exit;
        }

        // Prevent deleting yourself
        if ($user_id == $current_user_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'You cannot delete your own account']);
            exit;
        }

        // Verify user belongs to the company and check role
        $stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ? AND company_id = ?");
        $stmt->execute([$user_id, $company_id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'User not found']);
            exit;
        }
        
        // Prevent deleting admin users
        if ($user['role'] === 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Admin users cannot be deleted.']);
            exit;
        }

        // Delete from company_users first (if table exists)
        try {
            $stmt = $pdo->prepare("DELETE FROM company_users WHERE company_id = ? AND user_id = ?");
            $stmt->execute([$company_id, $user_id]);
        } catch (Exception $e) {
            // Table might not exist, that's okay
        }

        // Delete user
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND company_id = ?");
        $stmt->execute([$user_id, $company_id]);

        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("User management error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
?>
