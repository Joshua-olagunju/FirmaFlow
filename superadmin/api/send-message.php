<?php
// Clean output buffer and disable error output to prevent JSON contamination
ob_clean();
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
require_once '../includes/auth.php';
require_once '../includes/db.php';

// Check if superadmin is logged in
if (!isSuperAdmin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

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
    
    // Get current superadmin info
    if (!isset($_SESSION['superadmin_user']['username'])) {
        echo json_encode(['success' => false, 'message' => 'Admin username not found in session']);
        exit;
    }
    
    $adminUsername = $_SESSION['superadmin_user']['username'];
    
    // Verify the chat session is active and assigned to this admin
    $checkStmt = $pdo->prepare("
        SELECT * FROM chat_sessions 
        WHERE session_id = ? AND status = 'active' AND assigned_admin = ?
    ");
    $checkStmt->execute([$session_id, $adminUsername]);
    $session = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Invalid chat session or not assigned to you']);
        exit;
    }
    
    // Insert the message
    $stmt = $pdo->prepare("
        INSERT INTO chat_messages (session_id, sender_type, sender_name, message) 
        VALUES (?, 'admin', ?, ?)
    ");
    $stmt->execute([$session_id, $adminUsername, $message]);
    
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
            'sender_name' => $adminUsername,
            'message' => $message,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Send message error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to send message']);
}
?>