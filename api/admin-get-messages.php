<?php
// Admin Chat - Get Messages API
// For company admin users to retrieve messages from customer support chats

header('Content-Type: application/json');
require_once '../includes/auth.php';

// Check if user is logged in and is an admin
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

$currentUser = getCurrentUser();
if (!$currentUser || $currentUser['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit;
}

// Include SuperAdmin database for chat system
require_once '../superadmin/includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$session_id = $input['session_id'] ?? '';
$since_id = isset($input['since_id']) ? intval($input['since_id']) : 0;

if (empty($session_id)) {
    echo json_encode(['success' => false, 'message' => 'Session ID is required']);
    exit;
}

try {
    $pdo = getSuperAdminDB();
    
    // Verify the chat session exists and is for this company
    $checkStmt = $pdo->prepare("
        SELECT cs.*, c.id as company_id 
        FROM chat_sessions cs
        LEFT JOIN companies c ON cs.company_id = c.id  
        WHERE cs.session_id = ? AND c.id = ?
    ");
    $checkStmt->execute([$session_id, $currentUser['company_id']]);
    $session = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Invalid chat session']);
        exit;
    }
    
    // Build query based on whether we want all messages or just new ones
    if ($since_id > 0) {
        // Get new messages since the given ID
        $stmt = $pdo->prepare("
            SELECT * FROM chat_messages 
            WHERE session_id = ? AND id > ? 
            ORDER BY created_at ASC
        ");
        $stmt->execute([$session_id, $since_id]);
    } else {
        // Get all messages
        $stmt = $pdo->prepare("
            SELECT * FROM chat_messages 
            WHERE session_id = ? 
            ORDER BY created_at ASC
        ");
        $stmt->execute([$session_id]);
    }
    
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'messages' => $messages,
        'session_info' => [
            'session_id' => $session['session_id'],
            'status' => $session['status'],
            'visitor_name' => $session['visitor_name'],
            'created_at' => $session['created_at']
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Admin get messages error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve messages']);
}
?>
