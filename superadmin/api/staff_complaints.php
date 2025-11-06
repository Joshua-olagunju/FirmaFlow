<?php
// Staff Complaints API - For staff members to access complaints
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include database and auth check
require_once '../includes/db.php';
require_once '../includes/staff_auth_check.php';

// Require staff authentication and complaints permission
requireStaffPermission('complaints');

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
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
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}

function handleGetRequest($action) {
    $pdo = getDB();
    
    switch ($action) {
        case 'get_complaints':
            getComplaints($pdo);
            break;
        case 'get_complaint':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['success' => false, 'error' => 'Complaint ID required']);
                return;
            }
            getComplaint($pdo, $id);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

function handlePostRequest() {
    $pdo = getDB();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'update_status':
            updateComplaintStatus($pdo, $input);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

// Get complaints list
function getComplaints($pdo) {
    try {
        // Check if complaints table exists, if not create mock data
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'complaints'");
        if ($tableCheck->rowCount() == 0) {
            // Return mock data for testing
            echo json_encode([
                'success' => true,
                'complaints' => [
                    [
                        'id' => 1,
                        'subject' => 'Login Issues',
                        'description' => 'Unable to log into the system after password reset.',
                        'company_name' => 'Test Company Ltd',
                        'customer_name' => 'John Doe',
                        'status' => 'new',
                        'priority' => 'high',
                        'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
                        'updated_at' => date('Y-m-d H:i:s', strtotime('-2 hours'))
                    ],
                    [
                        'id' => 2,
                        'subject' => 'Feature Request',
                        'description' => 'Would like to have better reporting features for our accounting needs.',
                        'company_name' => 'ABC Corp',
                        'customer_name' => 'Jane Smith',
                        'status' => 'in_progress',
                        'priority' => 'medium',
                        'created_at' => date('Y-m-d H:i:s', strtotime('-4 hours')),
                        'updated_at' => date('Y-m-d H:i:s', strtotime('-1 hour'))
                    ],
                    [
                        'id' => 3,
                        'subject' => 'Bug Report',
                        'description' => 'The dashboard shows incorrect revenue calculations for this month.',
                        'company_name' => 'XYZ Business',
                        'customer_name' => 'Mike Johnson',
                        'status' => 'resolved',
                        'priority' => 'high',
                        'created_at' => date('Y-m-d H:i:s', strtotime('-6 hours')),
                        'updated_at' => date('Y-m-d H:i:s', strtotime('-30 minutes'))
                    ]
                ]
            ]);
            return;
        }
        
        $stmt = $pdo->query("
            SELECT c.*, co.company_name, u.full_name as customer_name
            FROM complaints c
            LEFT JOIN companies co ON c.company_id = co.id
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        ");
        
        $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'complaints' => $complaints]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch complaints: ' . $e->getMessage()]);
    }
}

// Get single complaint
function getComplaint($pdo, $id) {
    try {
        // Mock data for testing if table doesn't exist
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'complaints'");
        if ($tableCheck->rowCount() == 0) {
            $mockComplaints = [
                1 => [
                    'id' => 1,
                    'subject' => 'Login Issues',
                    'description' => 'Unable to log into the system after password reset. I have tried multiple times but keep getting an error message. Please help resolve this urgently as we need to access our financial data.',
                    'company_name' => 'Test Company Ltd',
                    'customer_name' => 'John Doe',
                    'status' => 'new',
                    'priority' => 'high',
                    'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
                    'updated_at' => date('Y-m-d H:i:s', strtotime('-2 hours'))
                ],
                2 => [
                    'id' => 2,
                    'subject' => 'Feature Request',
                    'description' => 'Would like to have better reporting features for our accounting needs. Current reports are too basic and we need more detailed analytics.',
                    'company_name' => 'ABC Corp',
                    'customer_name' => 'Jane Smith',
                    'status' => 'in_progress',
                    'priority' => 'medium',
                    'created_at' => date('Y-m-d H:i:s', strtotime('-4 hours')),
                    'updated_at' => date('Y-m-d H:i:s', strtotime('-1 hour'))
                ],
                3 => [
                    'id' => 3,
                    'subject' => 'Bug Report',
                    'description' => 'The dashboard shows incorrect revenue calculations for this month. The numbers do not match our internal records and this is causing confusion in our financial planning.',
                    'company_name' => 'XYZ Business',
                    'customer_name' => 'Mike Johnson',
                    'status' => 'resolved',
                    'priority' => 'high',
                    'created_at' => date('Y-m-d H:i:s', strtotime('-6 hours')),
                    'updated_at' => date('Y-m-d H:i:s', strtotime('-30 minutes'))
                ]
            ];
            
            if (isset($mockComplaints[$id])) {
                echo json_encode(['success' => true, 'complaint' => $mockComplaints[$id]]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Complaint not found']);
            }
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT c.*, co.company_name, u.full_name as customer_name
            FROM complaints c
            LEFT JOIN companies co ON c.company_id = co.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        ");
        $stmt->execute([$id]);
        
        $complaint = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$complaint) {
            echo json_encode(['success' => false, 'error' => 'Complaint not found']);
            return;
        }
        
        echo json_encode(['success' => true, 'complaint' => $complaint]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch complaint: ' . $e->getMessage()]);
    }
}

// Update complaint status
function updateComplaintStatus($pdo, $data) {
    try {
        // Mock success response if table doesn't exist
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'complaints'");
        if ($tableCheck->rowCount() == 0) {
            echo json_encode(['success' => true, 'message' => 'Complaint status updated successfully (mock)']);
            return;
        }
        
        if (empty($data['complaint_id']) || empty($data['status'])) {
            echo json_encode(['success' => false, 'error' => 'Complaint ID and status are required']);
            return;
        }
        
        $validStatuses = ['new', 'in_progress', 'resolved'];
        if (!in_array($data['status'], $validStatuses)) {
            echo json_encode(['success' => false, 'error' => 'Invalid status']);
            return;
        }
        
        $staffId = getCurrentStaff()['id'];
        
        // Update complaint status
        $stmt = $pdo->prepare("
            UPDATE complaints 
            SET status = ?, updated_at = NOW(), updated_by = ?
            WHERE id = ?
        ");
        $stmt->execute([$data['status'], $staffId, $data['complaint_id']]);
        
        // Add response if provided
        if (!empty($data['response'])) {
            $stmt = $pdo->prepare("
                INSERT INTO complaint_responses (complaint_id, staff_id, response, created_at)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$data['complaint_id'], $staffId, $data['response']]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Complaint status updated successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to update complaint: ' . $e->getMessage()]);
    }
}
?>