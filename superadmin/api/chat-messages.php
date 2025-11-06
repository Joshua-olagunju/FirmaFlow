<?php
// Clean output buffer and disable error output to prevent JSON contamination
ob_clean();
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
require_once '../includes/auth.php';
require_once '../includes/db.php';

// Ensure only superadmin can access
requireSuperAdmin();

$pdo = getSuperAdminDB();

if (!isset($_GET['session_id'])) {
    echo json_encode(['success' => false, 'message' => 'Session ID is required']);
    exit;
}

$session_id = $_GET['session_id'];

try {
    // Get chat messages
    $stmt = $pdo->prepare("
        SELECT * FROM chat_messages 
        WHERE session_id = ? 
        ORDER BY created_at ASC
    ");
    $stmt->execute([$session_id]);
    $messages = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'messages' => $messages
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error loading messages: ' . $e->getMessage()]);
}
?>