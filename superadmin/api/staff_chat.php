<?php
// Staff Chat API - For staff members to access chat functionality
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include database and auth check
require_once '../includes/db.php';
require_once '../includes/staff_auth_check.php';

// Require staff authentication and chat permission
requireStaffPermission('chat');

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
        case 'get_chats':
            $staffId = $_GET['staff_id'] ?? null;
            getChats($pdo, $staffId);
            break;
        case 'get_messages':
            $chatId = $_GET['chat_id'] ?? null;
            if (!$chatId) {
                echo json_encode(['success' => false, 'error' => 'Chat ID required']);
                return;
            }
            getChatMessages($pdo, $chatId);
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
        case 'send_message':
            sendMessage($pdo, $input);
            break;
        case 'end_chat':
            endChat($pdo, $input);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

// Get chats for staff member
function getChats($pdo, $staffId) {
    try {
        // Check if chat tables exist, if not return mock data
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'chat_sessions'");
        if ($tableCheck->rowCount() == 0) {
            // Return mock chat data
            echo json_encode([
                'success' => true,
                'chats' => [
                    [
                        'id' => 1,
                        'company_name' => 'Test Company Ltd',
                        'customer_name' => 'John Doe',
                        'status' => 'active',
                        'last_message' => 'Hello, I need help with my account',
                        'unread_count' => 2,
                        'created_at' => date('Y-m-d H:i:s', strtotime('-30 minutes')),
                        'updated_at' => date('Y-m-d H:i:s', strtotime('-5 minutes'))
                    ],
                    [
                        'id' => 2,
                        'company_name' => 'ABC Corp',
                        'customer_name' => 'Jane Smith',
                        'status' => 'pending',
                        'last_message' => 'Can someone assist me?',
                        'unread_count' => 1,
                        'created_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
                        'updated_at' => date('Y-m-d H:i:s', strtotime('-15 minutes'))
                    ],
                    [
                        'id' => 3,
                        'company_name' => 'XYZ Business',
                        'customer_name' => 'Mike Johnson',
                        'status' => 'ended',
                        'last_message' => 'Thank you for your help!',
                        'unread_count' => 0,
                        'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
                        'updated_at' => date('Y-m-d H:i:s', strtotime('-45 minutes'))
                    ]
                ]
            ]);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT cs.*, c.company_name, u.full_name as customer_name,
                   (SELECT message FROM chat_messages WHERE chat_session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT COUNT(*) FROM chat_messages WHERE chat_session_id = cs.id AND sender_type = 'customer' AND read_at IS NULL) as unread_count
            FROM chat_sessions cs
            LEFT JOIN companies c ON cs.company_id = c.id
            LEFT JOIN users u ON cs.customer_id = u.id
            WHERE cs.assigned_staff_id = ? OR cs.assigned_staff_id IS NULL
            ORDER BY cs.updated_at DESC
        ");
        $stmt->execute([$staffId]);
        
        $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'chats' => $chats]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch chats: ' . $e->getMessage()]);
    }
}

// Get messages for a chat session
function getChatMessages($pdo, $chatId) {
    try {
        // Check if chat tables exist, if not return mock data
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'chat_messages'");
        if ($tableCheck->rowCount() == 0) {
            // Return mock messages
            $mockMessages = [
                1 => [
                    [
                        'id' => 1,
                        'message' => 'Hello, I need help with my account',
                        'sender_type' => 'customer',
                        'sender_name' => 'John Doe',
                        'created_at' => date('Y-m-d H:i:s', strtotime('-30 minutes'))
                    ],
                    [
                        'id' => 2,
                        'message' => 'Hi! I\'m here to help. What seems to be the issue?',
                        'sender_type' => 'staff',
                        'sender_name' => getCurrentStaff()['full_name'],
                        'created_at' => date('Y-m-d H:i:s', strtotime('-25 minutes'))
                    ],
                    [
                        'id' => 3,
                        'message' => 'I can\'t access my dashboard. It keeps showing an error.',
                        'sender_type' => 'customer',
                        'sender_name' => 'John Doe',
                        'created_at' => date('Y-m-d H:i:s', strtotime('-20 minutes'))
                    ]
                ],
                2 => [
                    [
                        'id' => 4,
                        'message' => 'Can someone assist me?',
                        'sender_type' => 'customer',
                        'sender_name' => 'Jane Smith',
                        'created_at' => date('Y-m-d H:i:s', strtotime('-15 minutes'))
                    ]
                ]
            ];
            
            $messages = $mockMessages[$chatId] ?? [];
            echo json_encode(['success' => true, 'messages' => $messages]);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT cm.*, 
                   CASE 
                       WHEN cm.sender_type = 'customer' THEN u.full_name
                       WHEN cm.sender_type = 'staff' THEN sm.full_name
                       ELSE 'System'
                   END as sender_name
            FROM chat_messages cm
            LEFT JOIN users u ON (cm.sender_type = 'customer' AND cm.sender_id = u.id)
            LEFT JOIN staff_members sm ON (cm.sender_type = 'staff' AND cm.sender_id = sm.id)
            WHERE cm.chat_session_id = ?
            ORDER BY cm.created_at ASC
        ");
        $stmt->execute([$chatId]);
        
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'messages' => $messages]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch messages: ' . $e->getMessage()]);
    }
}

// Send message
function sendMessage($pdo, $data) {
    try {
        // Mock success if table doesn't exist
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'chat_messages'");
        if ($tableCheck->rowCount() == 0) {
            echo json_encode(['success' => true, 'message' => 'Message sent successfully (mock)']);
            return;
        }
        
        if (empty($data['chat_id']) || empty($data['message'])) {
            echo json_encode(['success' => false, 'error' => 'Chat ID and message are required']);
            return;
        }
        
        $staffId = getCurrentStaff()['id'];
        
        // Insert message
        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (chat_session_id, sender_type, sender_id, message, created_at)
            VALUES (?, 'staff', ?, ?, NOW())
        ");
        $stmt->execute([$data['chat_id'], $staffId, $data['message']]);
        
        // Update chat session last activity
        $stmt = $pdo->prepare("
            UPDATE chat_sessions 
            SET updated_at = NOW(), assigned_staff_id = ?
            WHERE id = ?
        ");
        $stmt->execute([$staffId, $data['chat_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Message sent successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to send message: ' . $e->getMessage()]);
    }
}

// End chat session
function endChat($pdo, $data) {
    try {
        // Mock success if table doesn't exist
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'chat_sessions'");
        if ($tableCheck->rowCount() == 0) {
            echo json_encode(['success' => true, 'message' => 'Chat ended successfully (mock)']);
            return;
        }
        
        if (empty($data['chat_id'])) {
            echo json_encode(['success' => false, 'error' => 'Chat ID is required']);
            return;
        }
        
        $staffId = getCurrentStaff()['id'];
        
        // Update chat status to ended
        $stmt = $pdo->prepare("
            UPDATE chat_sessions 
            SET status = 'ended', updated_at = NOW(), ended_by = ?
            WHERE id = ?
        ");
        $stmt->execute([$staffId, $data['chat_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Chat ended successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to end chat: ' . $e->getMessage()]);
    }
}
?>