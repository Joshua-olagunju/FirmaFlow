<?php
header('Content-Type: application/json');
require_once '../includes/auth.php';

// Check if user is logged in (customer side)
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

// Include SuperAdmin database after auth check
require_once '../superadmin/includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$session_id = $input['session_id'] ?? '';

if (empty($session_id)) {
    echo json_encode(['success' => false, 'message' => 'Session ID is required']);
    exit;
}

try {
    $pdo = getSuperAdminDB();
    $currentUser = getCurrentUser();
    
    // Verify the chat session belongs to this user
    $checkStmt = $pdo->prepare("
        SELECT * FROM chat_sessions 
        WHERE session_id = ? AND visitor_email = ? AND status IN ('waiting', 'active')
    ");
    $checkStmt->execute([$session_id, $currentUser['email']]);
    $session = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Invalid chat session or already closed']);
        exit;
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Update session status to closed
        $stmt = $pdo->prepare("
            UPDATE chat_sessions 
            SET status = 'closed', ended_at = NOW(), last_activity = NOW() 
            WHERE session_id = ?
        ");
        $stmt->execute([$session_id]);
        
        // Remove from queue if still there
        $queueStmt = $pdo->prepare("DELETE FROM chat_queue WHERE session_id = ?");
        $queueStmt->execute([$session_id]);
        
        // Add system message
        $msgStmt = $pdo->prepare("
            INSERT INTO chat_messages (session_id, sender_type, sender_name, message, message_type) 
            VALUES (?, 'system', 'System', ?, 'system')
        ");
        $msgStmt->execute([$session_id, "Chat ended by customer"]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Chat session ended successfully'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Customer end chat error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to end chat session']);
}
?>
