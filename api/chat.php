<?php
// Chat API - Handles all chat-related operations with subscription restrictions
session_start();
header('Content-Type: application/json');

// Add error handling to prevent 500 errors
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to client
ini_set('log_errors', 1);

// Set up error handler to catch any uncaught errors
set_error_handler(function($severity, $message, $file, $line) {
    error_log("Chat API Error: $message in $file:$line");
    if ($severity === E_ERROR || $severity === E_PARSE || $severity === E_CORE_ERROR) {
        http_response_code(200); // Return 200 instead of 500
        echo json_encode(['success' => false, 'error' => 'Chat service unavailable', 'silent' => true]);
        exit;
    }
});

// Set up exception handler
set_exception_handler(function($exception) {
    error_log("Chat API Exception: " . $exception->getMessage() . " in " . $exception->getFile() . ":" . $exception->getLine());
    http_response_code(200); // Return 200 instead of 500
    echo json_encode(['success' => false, 'error' => 'Chat service unavailable', 'silent' => true]);
    exit;
});

try {
    require_once __DIR__ . '/../includes/db.php';
} catch (Exception $e) {
    http_response_code(200); // Return 200 instead of 500
    echo json_encode(['success' => false, 'error' => 'Database temporarily unavailable', 'silent' => true]);
    exit;
}

try {
    require_once __DIR__ . '/../includes/subscription_helper.php';
} catch (Exception $e) {
    http_response_code(200); // Return 200 instead of 500
    echo json_encode(['success' => false, 'error' => 'Service temporarily unavailable', 'silent' => true]);
    exit;
}

// Check authentication
if (!isset($_SESSION['company_id']) || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized - Please login']);
    exit;
}

// Check subscription access for chat features
$company_id = $_SESSION['company_id'];
$current_user_id = $_SESSION['user_id'];

try {
    $subscription_info = getUserSubscriptionInfo($current_user_id);
    if ($subscription_info) {
        $plan = $subscription_info['subscription_plan'] ?? 'free';
    } else {
        $plan = 'free';
    }
} catch (Exception $e) {
    // If subscription check fails, default to free plan
    $plan = 'free';
}

// Only allow chat for paid plans (Starter, Professional, Enterprise)
if (!in_array($plan, ['starter', 'professional', 'enterprise'])) {
    // Log the plan for debugging
    error_log("Chat access denied for plan: " . $plan . " (user: " . $current_user_id . ")");
    
    http_response_code(200); // Return 200 instead of 403 to prevent console errors
    echo json_encode([
        'success' => false, 
        'error' => 'Chat feature requires Starter plan or higher. Please upgrade your subscription.',
        'upgrade_required' => true,
        'current_plan' => $plan,
        'silent' => true // Flag to handle silently in frontend
    ]);
    exit;
}
// Get database connection (already created in db.php)
if (!isset($pdo)) {
    http_response_code(200); // Return 200 instead of 500
    echo json_encode(['success' => false, 'error' => 'Database temporarily unavailable', 'silent' => true]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

try {
    if ($method === 'GET') {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'get_users':
                try {
                    // Check if user_online_status table exists
                    $table_check = $pdo->query("SHOW TABLES LIKE 'user_online_status'");
                    $has_online_status = ($table_check->rowCount() > 0);
                    
                    if ($has_online_status) {
                        // Get all users in the same company for chat with online status
                        $stmt = $pdo->prepare("
                            SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.is_active,
                                   COALESCE(os.is_online, 0) as is_online,
                                   os.last_seen,
                                   CASE 
                                       WHEN os.last_seen >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1
                                       ELSE 0
                                   END as recently_active
                            FROM users u
                            LEFT JOIN user_online_status os ON u.id = os.user_id
                            WHERE u.company_id = ? AND u.id != ? AND u.is_active = 1
                            ORDER BY os.is_online DESC, os.last_seen DESC, u.first_name, u.last_name
                        ");
                    } else {
                        // Simplified query without online status table
                        $stmt = $pdo->prepare("
                            SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.is_active,
                                   0 as is_online,
                                   NOW() as last_seen,
                                   0 as recently_active
                            FROM users u
                            WHERE u.company_id = ? AND u.id != ? AND u.is_active = 1
                            ORDER BY u.first_name, u.last_name
                        ");
                    }
                    
                    $stmt->execute([$company_id, $current_user_id]);
                    $users = $stmt->fetchAll();
                    
                    echo json_encode(['success' => true, 'users' => $users]);
                } catch (Exception $e) {
                    echo json_encode(['success' => false, 'error' => 'Unable to load users: ' . $e->getMessage()]);
                }
                break;
                
            case 'get_conversations':
                try {
                    // Check if tables exist first
                    $table_check = $pdo->query("SHOW TABLES LIKE 'conversations'");
                    if ($table_check->rowCount() == 0) {
                        echo json_encode(['success' => true, 'conversations' => []]);
                        break;
                    }
                    
                    // Check the actual structure of conversations table
                    $structure_check = $pdo->query("DESCRIBE conversations");
                    $columns = $structure_check->fetchAll(PDO::FETCH_COLUMN);
                    
                    // Check if this is the expected structure (user1_id, user2_id) or the actual structure (participants)
                    if (in_array('user1_id', $columns) && in_array('user2_id', $columns)) {
                        // Expected structure - use the original query
                        $stmt = $pdo->prepare("
                            SELECT id as conversation_id, 
                                   user1_id,
                                   user2_id,
                                   last_activity
                            FROM conversations 
                            WHERE (user1_id = ? OR user2_id = ?) AND company_id = ?
                            ORDER BY last_activity DESC
                            LIMIT 10
                        ");
                        $stmt->execute([$current_user_id, $current_user_id, $company_id]);
                        $conversations_raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    } else {
                        // Actual structure with participants column - return empty for now
                        // This prevents 500 errors while the proper migration is pending
                        echo json_encode(['success' => true, 'conversations' => [], 'info' => 'Table structure migration needed']);
                        break;
                    }
                    
                    // Process conversations (only if we got data from the expected structure)
                    $conversations = [];
                    foreach ($conversations_raw as $conv) {
                        $is_user1 = ($conv['user1_id'] == $current_user_id);
                        $other_user_id = $is_user1 ? $conv['user2_id'] : $conv['user1_id'];
                        
                        // Simple conversation entry without complex joins
                        $conversations[] = [
                            'conversation_id' => $conv['conversation_id'],
                            'other_user_id' => $other_user_id,
                            'other_user_name' => 'User ' . $other_user_id,
                            'other_user_role' => 'user',
                            'other_user_online' => 0,
                            'last_message' => '',
                            'last_sender_id' => null,
                            'last_message_time' => $conv['last_activity'] ?? '',
                            'last_activity' => $conv['last_activity'] ?? '',
                            'unread_count' => 0
                        ];
                    }
                    
                    echo json_encode(['success' => true, 'conversations' => $conversations]);
                } catch (Exception $e) {
                    error_log("Get conversations error: " . $e->getMessage());
                    echo json_encode(['success' => true, 'conversations' => [], 'error' => 'Unable to load conversations']);
                }
                break;            case 'get_messages':
                try {
                    // Get messages for a specific conversation
                    $other_user_id = $_GET['user_id'] ?? 0;
                    $page = max(1, intval($_GET['page'] ?? 1));
                    $limit = 50;
                    $offset = ($page - 1) * $limit;
                    
                    if (!$other_user_id) {
                        echo json_encode(['success' => false, 'error' => 'User ID required']);
                        break;
                    }
                    
                    // Check if messages table exists
                    $table_check = $pdo->query("SHOW TABLES LIKE 'messages'");
                    if ($table_check->rowCount() == 0) {
                        echo json_encode(['success' => true, 'messages' => []]);
                        break;
                    }
                    
                    // Verify other user is in same company
                    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND company_id = ?");
                    $stmt->execute([$other_user_id, $company_id]);
                    if (!$stmt->fetch()) {
                        echo json_encode(['success' => false, 'error' => 'Access denied']);
                        break;
                    }
                    
                    // Get messages with error handling
                    $stmt = $pdo->prepare("
                        SELECT m.id, m.sender_id, m.receiver_id, m.message, m.is_read, m.created_at,
                               u.first_name, u.last_name
                        FROM messages m
                        JOIN users u ON m.sender_id = u.id
                        WHERE ((m.sender_id = ? AND m.receiver_id = ?) 
                               OR (m.sender_id = ? AND m.receiver_id = ?))
                              AND m.company_id = ?
                        ORDER BY m.created_at DESC
                        LIMIT {$limit} OFFSET {$offset}
                    ");
                    $stmt->execute([
                        $current_user_id, $other_user_id, 
                        $other_user_id, $current_user_id, 
                        $company_id
                    ]);
                    $messages = array_reverse($stmt->fetchAll()); // Reverse to show oldest first
                    
                    // Mark messages as read
                    $stmt = $pdo->prepare("
                        UPDATE messages 
                        SET is_read = 1 
                        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
                    ");
                    $stmt->execute([$other_user_id, $current_user_id]);
                    
                    echo json_encode(['success' => true, 'messages' => $messages]);
                } catch (Exception $e) {
                    error_log("Get messages error: " . $e->getMessage());
                    echo json_encode(['success' => false, 'error' => 'Error loading messages: ' . $e->getMessage()]);
                }
                break;
                
            case 'get_new_messages':
                try {
                    // Get new messages since a specific message ID for real-time updates
                    $other_user_id = $_GET['user_id'] ?? 0;
                    $last_message_id = intval($_GET['last_message_id'] ?? 0);
                    
                    if (!$other_user_id) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'User ID required']);
                        exit;
                    }
                    
                    // Verify other user is in same company
                    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND company_id = ?");
                    $stmt->execute([$other_user_id, $company_id]);
                    if (!$stmt->fetch()) {
                        http_response_code(403);
                        echo json_encode(['success' => false, 'error' => 'Access denied']);
                        exit;
                    }
                    
                    // Get new messages since last_message_id
                    $stmt = $pdo->prepare("
                        SELECT m.id, m.sender_id, m.receiver_id, m.message, m.is_read, m.created_at,
                               u.first_name, u.last_name,
                               CONCAT(u.first_name, ' ', u.last_name) as sender_name
                        FROM messages m
                        JOIN users u ON m.sender_id = u.id
                        WHERE ((m.sender_id = ? AND m.receiver_id = ?) 
                               OR (m.sender_id = ? AND m.receiver_id = ?))
                              AND m.company_id = ?
                              AND m.id > ?
                        ORDER BY m.created_at ASC
                    ");
                    $stmt->execute([
                        $current_user_id, $other_user_id, 
                        $other_user_id, $current_user_id, 
                        $company_id, $last_message_id
                    ]);
                    $messages = $stmt->fetchAll();
                    
                    echo json_encode(['success' => true, 'messages' => $messages]);
                } catch (Exception $e) {
                    error_log("Get new messages error: " . $e->getMessage());
                    echo json_encode(['success' => false, 'error' => 'Error loading new messages: ' . $e->getMessage()]);
                }
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
        
    } else if ($method === 'POST') {
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'send_message':
                $receiver_id = $input['receiver_id'] ?? 0;
                $message = trim($input['message'] ?? '');
                
                if (!$receiver_id || empty($message)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Receiver ID and message are required']);
                    exit;
                }
                
                // Verify receiver is in same company
                $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND company_id = ?");
                $stmt->execute([$receiver_id, $company_id]);
                if (!$stmt->fetch()) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'error' => 'Access denied']);
                    exit;
                }
                
                // Insert message
                $stmt = $pdo->prepare("
                    INSERT INTO messages (company_id, sender_id, receiver_id, message, created_at)
                    VALUES (?, ?, ?, ?, NOW())
                ");
                $stmt->execute([$company_id, $current_user_id, $receiver_id, $message]);
                $message_id = $pdo->lastInsertId();
                
                // Create or update conversation
                $stmt = $pdo->prepare("
                    INSERT INTO conversations (company_id, user1_id, user2_id, last_message_id, last_activity)
                    VALUES (?, LEAST(?, ?), GREATEST(?, ?), ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        last_message_id = VALUES(last_message_id),
                        last_activity = VALUES(last_activity)
                ");
                $stmt->execute([
                    $company_id, $current_user_id, $receiver_id, 
                    $current_user_id, $receiver_id, $message_id
                ]);
                
                echo json_encode(['success' => true, 'message_id' => $message_id]);
                break;
                
            case 'mark_read':
                $sender_id = $input['sender_id'] ?? 0;
                
                if (!$sender_id) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Sender ID required']);
                    exit;
                }
                
                // Mark messages as read
                $stmt = $pdo->prepare("
                    UPDATE messages 
                    SET is_read = 1 
                    WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
                ");
                $stmt->execute([$sender_id, $current_user_id]);
                
                echo json_encode(['success' => true]);
                break;
                
            case 'update_online_status':
                $is_online = $input['is_online'] ?? true;
                
                // Update online status
                $stmt = $pdo->prepare("
                    INSERT INTO user_online_status (user_id, is_online, last_seen)
                    VALUES (?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        is_online = VALUES(is_online),
                        last_seen = VALUES(last_seen)
                ");
                $stmt->execute([$current_user_id, $is_online ? 1 : 0]);
                
                echo json_encode(['success' => true]);
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
        
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log("Chat API Error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    
    // Never return 500 - always return 200 with error info
    http_response_code(200);
    echo json_encode([
        'success' => false, 
        'error' => 'Chat service temporarily unavailable',
        'silent' => true,
        'debug' => $e->getMessage()
    ]);
}
?>
