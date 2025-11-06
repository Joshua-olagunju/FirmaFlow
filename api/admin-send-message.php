<?php
// Admin Chat Message API
// For company admin users to send messages in customer support chats

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
$message = trim($input['message'] ?? '');

if (empty($session_id) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Session ID and message are required']);
    exit;
}

// Validate message length
if (strlen($message) > 500) {
    echo json_encode(['success' => false, 'message' => 'Message too long (max 500 characters)']);
    exit;
}

try {
    $pdo = getSuperAdminDB();
    
    // Verify the chat session exists and is for this company
    $checkStmt = $pdo->prepare("
        SELECT cs.*, c.id as company_id 
        FROM chat_sessions cs
        LEFT JOIN companies c ON cs.company_id = c.id  
        WHERE cs.session_id = ? AND c.id = ? AND cs.status IN ('waiting', 'active')
    ");
    $checkStmt->execute([$session_id, $currentUser['company_id']]);
    $session = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Invalid chat session or session ended']);
        exit;
    }
    
    // Get admin name
    $adminName = trim($currentUser['first_name'] . ' ' . $currentUser['last_name']);
    if (empty($adminName)) {
        $adminName = $currentUser['email'] ?? 'Admin';
    }
    
    // Insert the message
    $stmt = $pdo->prepare("
        INSERT INTO chat_messages (session_id, sender_type, sender_name, message) 
        VALUES (?, 'admin', ?, ?)
    ");
    $stmt->execute([$session_id, $adminName, $message]);
    
    // Update session timestamp
    $updateStmt = $pdo->prepare("
        UPDATE chat_sessions SET last_activity = NOW() WHERE session_id = ?
    ");
    $updateStmt->execute([$session_id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Message sent successfully',
        'data' => [
            'id' => $pdo->lastInsertId(),
            'session_id' => $session_id,
            'sender_type' => 'admin',
            'sender_name' => $adminName,
            'message' => $message,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Admin send message error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to send message. Please try again.']);
}
?>
