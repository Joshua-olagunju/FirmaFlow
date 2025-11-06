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

// Handle both GET and POST requests
$session_id = '';
$since_id = 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $session_id = $input['session_id'] ?? '';
    $since_id = isset($input['since_id']) ? intval($input['since_id']) : 0;
} else {
    $session_id = $_GET['session_id'] ?? '';
    $since_id = isset($_GET['since_id']) ? intval($_GET['since_id']) : 0;
}

if (empty($session_id)) {
    echo json_encode(['success' => false, 'message' => 'Session ID is required']);
    exit;
}

try {
    $pdo = getSuperAdminDB();
    $currentUser = getCurrentUser();
    
    // Verify the chat session belongs to this user
    $checkStmt = $pdo->prepare("
        SELECT cs.* 
        FROM chat_sessions cs 
        WHERE cs.session_id = ? AND cs.visitor_email = ?
    ");
    $checkStmt->execute([$session_id, $currentUser['email']]);
    $session = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Invalid chat session']);
        exit;
    }
    
    // Get chat messages (optionally filter by since_id for polling)
    $messageQuery = "
        SELECT * FROM chat_messages 
        WHERE session_id = ?
    ";
    $messageParams = [$session_id];
    
    if ($since_id > 0) {
        $messageQuery .= " AND id > ?";
        $messageParams[] = $since_id;
    }
    
    $messageQuery .= " ORDER BY created_at ASC";
    
    $stmt = $pdo->prepare($messageQuery);
    $stmt->execute($messageParams);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return comprehensive response
    echo json_encode([
        'success' => true,
        'messages' => $messages,
        'session_info' => [
            'status' => $session['status'],
            'assigned_admin' => $session['assigned_admin'],
            'assigned_agent' => $session['assigned_admin'] ?: 'Support Agent',
            'started_at' => $session['started_at'],
            'last_activity' => $session['last_activity']
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Customer get messages error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error loading messages']);
}
?>
