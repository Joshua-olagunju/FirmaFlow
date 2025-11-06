<?php
// Start Customer Support Chat API
// For company admin users to start a customer support chat session

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to prevent HTML output

try {
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

    // Include database directly (customer support tables are in main DB)
    require_once '../includes/db.php';

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $subject = trim($input['subject'] ?? 'Support Request');
    $message = trim($input['message'] ?? '');

    if (empty($message)) {
        echo json_encode(['success' => false, 'message' => 'Message is required']);
        exit;
    }

    // Generate a unique session ID
    $session_id = 'cs_' . uniqid() . '_' . time();
    
    // Create chat session
    $visitorName = trim($currentUser['first_name'] . ' ' . $currentUser['last_name']);
    if (empty($visitorName)) {
        $visitorName = $currentUser['email'];
    }
    
    $sessionStmt = $pdo->prepare("
        INSERT INTO chat_sessions (
            session_id, visitor_name, visitor_email, 
            status, started_at, last_activity
        ) VALUES (?, ?, ?, 'waiting', NOW(), NOW())
    ");
    $sessionStmt->execute([
        $session_id, 
        $visitorName, 
        $currentUser['email']
    ]);
    
    // Add to chat queue - get current queue position
    $queuePositionStmt = $pdo->prepare("SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position FROM chat_queue");
    $queuePositionStmt->execute();
    $queuePosition = $queuePositionStmt->fetch(PDO::FETCH_ASSOC)['next_position'];
    
    $queueStmt = $pdo->prepare("
        INSERT INTO chat_queue (session_id, queue_position, estimated_wait_time, created_at)
        VALUES (?, ?, ?, NOW())
    ");
    $estimatedWait = $queuePosition * 2; // 2 minutes per person in queue
    $queueStmt->execute([$session_id, $queuePosition, $estimatedWait]);
    
    // Add initial message
    $messageStmt = $pdo->prepare("
        INSERT INTO chat_messages (session_id, sender_type, sender_name, message)
        VALUES (?, 'visitor', ?, ?)
    ");
    $messageStmt->execute([$session_id, $visitorName, $message]);
    
    echo json_encode([
        'success' => true,
        'session_id' => $session_id,
        'message' => 'Chat session started successfully',
        'data' => [
            'session_id' => $session_id,
            'status' => 'waiting',
            'visitor_name' => $visitorName,
            'subject' => $subject,
            'queue_position' => $queuePosition,
            'estimated_wait' => $estimatedWait
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Start chat error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to start chat session: ' . $e->getMessage()]);
}
?>
