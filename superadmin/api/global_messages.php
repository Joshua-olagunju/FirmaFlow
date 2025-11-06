<?php
// SuperAdmin Global Messages API - Simple Version
session_start();
header('Content-Type: application/json');

// Get database connection
require_once __DIR__ . '/../../includes/db.php';

// Check if user is superadmin for write operations
function isSuperAdmin() {
    return isset($_SESSION['superadmin_logged_in']) && $_SESSION['superadmin_logged_in'] === true;
}

// Check if user is regular admin for read operations  
function isRegularAdmin() {
    return isset($_SESSION['user_id']) && isset($_SESSION['company_id']);
}

$method = $_SERVER['REQUEST_METHOD'];

// Get action from appropriate source
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    $input = null; // No input for GET requests
} else {
    // For POST requests, get action from JSON body
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
}

try {
    switch ($action) {
        case 'get_active_messages':
            // Anyone logged in can see active messages
            if (!isRegularAdmin() && !isSuperAdmin()) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Please log in']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                SELECT id, title, message as content, message_type as type, 'medium' as priority, created_at
                FROM global_messages 
                WHERE is_active = 1
                ORDER BY created_at DESC
                LIMIT 5
            ");
            $stmt->execute();
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'messages' => $messages]);
            break;
            
        case 'get_all_messages':
            // Only superadmin can see all messages
            if (!isSuperAdmin()) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Access denied']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                SELECT id, title, message as content, message_type as type, 'medium' as priority, is_active, created_at
                FROM global_messages 
                ORDER BY created_at DESC
            ");
            $stmt->execute();
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'messages' => $messages]);
            break;
            
        case 'create_message':
            // Only superadmin can create messages
            if (!isSuperAdmin()) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Access denied']);
                exit;
            }
            
            // $input is already defined above
            $title = $input['title'] ?? '';
            $content = $input['content'] ?? '';
            $type = $input['type'] ?? 'info';
            
            if (empty($title) || empty($content)) {
                echo json_encode(['success' => false, 'error' => 'Title and content are required']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO global_messages (title, message, message_type, is_active, created_by) 
                VALUES (?, ?, ?, 1, 'superadmin')
            ");
            $stmt->execute([$title, $content, $type]);
            
            echo json_encode(['success' => true, 'message' => 'Message created successfully']);
            break;
            
        case 'delete_message':
            // Only superadmin can delete messages
            if (!isSuperAdmin()) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Access denied']);
                exit;
            }
            
            // $input is already defined above
            $id = $input['message_id'] ?? ($input['id'] ?? 0);
            
            $stmt = $pdo->prepare("DELETE FROM global_messages WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Message deleted successfully']);
            break;
            
        case 'toggle_message':
            // Only superadmin can toggle messages
            if (!isSuperAdmin()) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Access denied']);
                exit;
            }
            
            // $input is already defined above
            $id = $input['message_id'] ?? ($input['id'] ?? 0);
            $is_active = $input['is_active'] ?? 0;
            
            $stmt = $pdo->prepare("UPDATE global_messages SET is_active = ? WHERE id = ?");
            $stmt->execute([$is_active, $id]);
            
            echo json_encode(['success' => true, 'message' => 'Message status updated']);
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
    
} catch (Exception $e) {
    error_log("Global Messages API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>