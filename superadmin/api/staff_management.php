<?php
// Staff Management API
// Handles CRUD operations for staff members

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Ensure session is started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include database connection
require_once '../includes/db.php';

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Verify superadmin authentication (only superadmin can manage staff)
function verifySuperAdmin() {
    if (!isset($_SESSION['superadmin_logged_in']) || $_SESSION['superadmin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized access - SuperAdmin required']);
        exit;
    }
}

// Check if user is authenticated (superadmin or staff)
function isAuthenticated() {
    return (isset($_SESSION['superadmin_logged_in']) && $_SESSION['superadmin_logged_in'] === true) || isset($_SESSION['staff_id']);
}

// Check if user is staff
function isStaff() {
    return isset($_SESSION['staff_id']);
}

// Get database connection
function getDB() {
    try {
        return getSuperAdminDB();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed']);
        exit;
    }
}

// Main request handling
try {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    // Route requests
    switch ($method) {
        case 'GET':
            handleGetRequest($action);
            break;
        case 'POST':
            handlePostRequest();
            break;
        case 'PUT':
            handlePutRequest();
            break;
        case 'DELETE':
            handleDeleteRequest();
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}

function handleGetRequest($action) {
    verifySuperAdmin();
    $pdo = getDB();
    
    switch ($action) {
        case 'get_staff':
            getStaffList($pdo);
            break;
        case 'get_staff_by_id':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['success' => false, 'error' => 'Staff ID required']);
                return;
            }
            getStaffById($pdo, $id);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

function handlePostRequest() {
    verifySuperAdmin();
    $pdo = getDB();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'create_staff':
            createStaff($pdo, $input);
            break;
        case 'setup_tables':
            setupStaffTables($pdo);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

function handlePutRequest() {
    verifySuperAdmin();
    $pdo = getDB();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'update_staff':
            updateStaff($pdo, $input);
            break;
        case 'toggle_status':
            toggleStaffStatus($pdo, $input);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

function handleDeleteRequest() {
    verifySuperAdmin();
    $pdo = getDB();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'delete_staff':
            deleteStaff($pdo, $input);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

// Setup staff tables
function setupStaffTables($pdo) {
    try {
        // Read and execute the SQL schema
        $sqlFile = '../database/staff_management_schema.sql';
        if (!file_exists($sqlFile)) {
            echo json_encode(['success' => false, 'error' => 'SQL schema file not found']);
            return;
        }
        
        $sql = file_get_contents($sqlFile);
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        
        foreach ($statements as $statement) {
            if (!empty($statement)) {
                $pdo->exec($statement);
            }
        }
        
        echo json_encode(['success' => true, 'message' => 'Staff tables created successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to create tables: ' . $e->getMessage()]);
    }
}

// Get staff list
function getStaffList($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT id, full_name, username, email, role, status, permissions, 
                   created_at, updated_at, last_login
            FROM staff_members 
            ORDER BY created_at DESC
        ");
        
        $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON permissions
        foreach ($staff as &$member) {
            $member['permissions'] = json_decode($member['permissions'] ?? '[]', true);
        }
        
        echo json_encode(['success' => true, 'staff' => $staff]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch staff: ' . $e->getMessage()]);
    }
}

// Get staff by ID
function getStaffById($pdo, $id) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, full_name, username, email, role, status, permissions, 
                   created_at, updated_at, last_login
            FROM staff_members 
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        
        $staff = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$staff) {
            echo json_encode(['success' => false, 'error' => 'Staff member not found']);
            return;
        }
        
        // Parse JSON permissions
        $staff['permissions'] = json_decode($staff['permissions'] ?? '[]', true);
        
        echo json_encode(['success' => true, 'staff' => $staff]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch staff: ' . $e->getMessage()]);
    }
}

// Create new staff member
function createStaff($pdo, $data) {
    try {
        // Validate required fields
        $required = ['full_name', 'username', 'email', 'password'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                echo json_encode(['success' => false, 'error' => "Field '$field' is required"]);
                return;
            }
        }
        
        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'error' => 'Invalid email format']);
            return;
        }
        
        // Check if username or email already exists
        $stmt = $pdo->prepare("SELECT id FROM staff_members WHERE username = ? OR email = ?");
        $stmt->execute([$data['username'], $data['email']]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'Username or email already exists']);
            return;
        }
        
        // Hash password
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        // Set default permissions
        $permissions = json_encode(['complaints', 'chat']);
        
        // Create staff member
        $stmt = $pdo->prepare("
            INSERT INTO staff_members (full_name, username, email, password_hash, permissions, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        // Get superadmin ID (use 1 as default since there's typically one superadmin)
        $superadminId = isset($_SESSION['superadmin_user']['id']) ? $_SESSION['superadmin_user']['id'] : 1;
        
        $stmt->execute([
            $data['full_name'],
            $data['username'],
            $data['email'],
            $passwordHash,
            $permissions,
            $superadminId
        ]);
        
        $staffId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Staff member created successfully',
            'staff_id' => $staffId
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to create staff: ' . $e->getMessage()]);
    }
}

// Update staff member
function updateStaff($pdo, $data) {
    try {
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'error' => 'Staff ID is required']);
            return;
        }
        
        $updateFields = [];
        $updateValues = [];
        
        // Build dynamic update query
        if (!empty($data['full_name'])) {
            $updateFields[] = 'full_name = ?';
            $updateValues[] = $data['full_name'];
        }
        
        if (!empty($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                echo json_encode(['success' => false, 'error' => 'Invalid email format']);
                return;
            }
            
            // Check if email exists for other staff
            $stmt = $pdo->prepare("SELECT id FROM staff_members WHERE email = ? AND id != ?");
            $stmt->execute([$data['email'], $data['id']]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Email already exists']);
                return;
            }
            
            $updateFields[] = 'email = ?';
            $updateValues[] = $data['email'];
        }
        
        if (!empty($data['password'])) {
            $updateFields[] = 'password_hash = ?';
            $updateValues[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (empty($updateFields)) {
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            return;
        }
        
        $updateValues[] = $data['id'];
        
        $sql = "UPDATE staff_members SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($updateValues);
        
        echo json_encode(['success' => true, 'message' => 'Staff member updated successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to update staff: ' . $e->getMessage()]);
    }
}

// Toggle staff status
function toggleStaffStatus($pdo, $data) {
    try {
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'error' => 'Staff ID is required']);
            return;
        }
        
        $newStatus = $data['status'] ?? 'active';
        if (!in_array($newStatus, ['active', 'inactive'])) {
            echo json_encode(['success' => false, 'error' => 'Invalid status']);
            return;
        }
        
        $stmt = $pdo->prepare("UPDATE staff_members SET status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $data['id']]);
        
        echo json_encode(['success' => true, 'message' => 'Staff status updated successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to update status: ' . $e->getMessage()]);
    }
}

// Delete staff member
function deleteStaff($pdo, $data) {
    try {
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'error' => 'Staff ID is required']);
            return;
        }
        
        // Check if staff member exists
        $stmt = $pdo->prepare("SELECT id FROM staff_members WHERE id = ?");
        $stmt->execute([$data['id']]);
        if (!$stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'Staff member not found']);
            return;
        }
        
        // Delete staff member (sessions will be deleted automatically due to foreign key)
        $stmt = $pdo->prepare("DELETE FROM staff_members WHERE id = ?");
        $stmt->execute([$data['id']]);
        
        echo json_encode(['success' => true, 'message' => 'Staff member deleted successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to delete staff: ' . $e->getMessage()]);
    }
}
?>