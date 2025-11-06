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
    // Use the SuperAdmin database connection function from db.php
    $pdo = getSuperAdminDB();
    
    // Initialize SuperAdmin tables if they don't exist
    initializeSuperAdminTables();
    
    // Get current superadmin info
    if (!isset($_SESSION['superadmin_user']['username'])) {
        echo json_encode(['success' => false, 'message' => 'Admin username not found in session']);
        exit;
    }
    
    $adminUsername = $_SESSION['superadmin_user']['username'];
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Check if chat is still available
        $checkStmt = $pdo->prepare("
            SELECT * FROM chat_sessions 
            WHERE session_id = ? AND status = 'waiting'
        ");
        $checkStmt->execute([$session_id]);
        $session = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$session) {
            echo json_encode(['success' => false, 'message' => 'Chat session is no longer available']);
            exit;
        }
        
        // Assign chat to admin
        $stmt = $pdo->prepare("
            UPDATE chat_sessions 
            SET status = 'active', assigned_admin = ?, last_activity = NOW() 
            WHERE session_id = ? AND status = 'waiting'
        ");
        $stmt->execute([$adminUsername, $session_id]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('Failed to assign chat session');
        }
        
        // Remove from queue
        $queueStmt = $pdo->prepare("DELETE FROM chat_queue WHERE session_id = ?");
        $queueStmt->execute([$session_id]);
        
        // Send system message
        $msgStmt = $pdo->prepare("
            INSERT INTO chat_messages (session_id, sender_type, sender_name, message, message_type) 
            VALUES (?, 'system', 'System', ?, 'system')
        ");
        $msgStmt->execute([$session_id, "Support agent $adminUsername has joined the chat"]);
        
        // Commit transaction
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Chat session assigned successfully',
            'session' => [
                'session_id' => $session_id,
                'visitor_name' => $session['visitor_name'],
                'visitor_email' => $session['visitor_email'],
                'assigned_admin' => $adminUsername
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Chat assignment error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    echo json_encode([
        'success' => false, 
        'message' => 'Failed to assign chat session'
    ]);
}
?>