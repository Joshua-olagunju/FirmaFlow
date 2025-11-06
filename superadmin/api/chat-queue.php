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

try {
    $pdo = getSuperAdminDB();
    
    // Get waiting queue
    $waitingStmt = $pdo->prepare("
        SELECT cs.*, cq.queue_position, cq.estimated_wait_time
        FROM chat_sessions cs
        LEFT JOIN chat_queue cq ON cs.session_id = cq.session_id
        WHERE cs.status = 'waiting'
        ORDER BY cq.queue_position ASC, cs.started_at ASC
    ");
    $waitingStmt->execute();
    $waitingQueue = $waitingStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get active chats
    $activeStmt = $pdo->prepare("
        SELECT * FROM chat_sessions 
        WHERE status = 'active' 
        ORDER BY last_activity DESC
    ");
    $activeStmt->execute();
    $activeChats = $activeStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recent closed chats (last 24 hours)
    $closedStmt = $pdo->prepare("
        SELECT * FROM chat_sessions 
        WHERE status = 'closed' AND ended_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY ended_at DESC 
        LIMIT 50
    ");
    $closedStmt->execute();
    $closedChats = $closedStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate statistics
    $stats = [
        'waiting_count' => count($waitingQueue),
        'active_count' => count($activeChats),
        'closed_today' => count($closedChats),
        'last_updated' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode([
        'success' => true,
        'waiting_queue' => $waitingQueue,
        'active_chats' => $activeChats,
        'closed_chats' => $closedChats,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    error_log("Chat queue API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load chat queue data']);
}
?>