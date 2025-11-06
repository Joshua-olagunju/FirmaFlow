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

if (empty($session_id)) {
    echo json_encode(['success' => false, 'message' => 'Session ID is required']);
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
    
    // Verify the chat session is assigned to this admin
    $checkStmt = $pdo->prepare("
        SELECT * FROM chat_sessions 
        WHERE session_id = ? AND assigned_admin = ? AND status = 'active'
    ");
    $checkStmt->execute([$session_id, $adminUsername]);
    $session = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Invalid chat session or not assigned to you']);
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
        $msgStmt->execute([$session_id, "Chat ended by support agent $adminUsername"]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Chat session closed successfully'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("SuperAdmin close chat error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to close chat session']);
}
?>