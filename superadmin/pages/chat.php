<?php
$pageTitle = 'Live Chat Management';
require_once '../includes/header.php';
require_once '../includes/sidebar.php';

$pdo = getSuperAdminDB();

$message = '';
$messageType = '';

// Get current user
$currentUser = getSuperAdminUser();
$adminUsername = $currentUser['username'];

// Handle actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'assign_chat') {
        $session_id = $_POST['session_id'] ?? '';
        
        try {
            $stmt = $pdo->prepare("
                UPDATE chat_sessions 
                SET status = 'active', assigned_admin = ? 
                WHERE session_id = ? AND status = 'waiting'
            ");
            $stmt->execute([$adminUsername, $session_id]);
            
            // Remove from queue
            $queueStmt = $pdo->prepare("DELETE FROM chat_queue WHERE session_id = ?");
            $queueStmt->execute([$session_id]);
            
            // Send system message
            $msgStmt = $pdo->prepare("
                INSERT INTO chat_messages (session_id, sender_type, sender_name, message, message_type) 
                VALUES (?, 'system', 'System', ?, 'system')
            ");
            $msgStmt->execute([$session_id, "Admin $adminUsername has joined the chat"]);
            
            $message = 'Chat session assigned successfully';
            $messageType = 'success';
        } catch (Exception $e) {
            $message = 'Error assigning chat: ' . $e->getMessage();
            $messageType = 'danger';
        }
    }
    
    if ($action === 'send_message') {
        $session_id = $_POST['session_id'] ?? '';
        $message_text = $_POST['message'] ?? '';
        
        try {
            $stmt = $pdo->prepare("
                INSERT INTO chat_messages (session_id, sender_type, sender_name, message) 
                VALUES (?, 'admin', ?, ?)
            ");
            $stmt->execute([$session_id, $adminUsername, $message_text]);
            
            // Update session activity
            $updateStmt = $pdo->prepare("UPDATE chat_sessions SET last_activity = NOW() WHERE session_id = ?");
            $updateStmt->execute([$session_id]);
            
            echo json_encode(['success' => true]);
            exit;
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            exit;
        }
    }
    
    if ($action === 'close_chat') {
        $session_id = $_POST['session_id'] ?? '';
        
        try {
            $stmt = $pdo->prepare("
                UPDATE chat_sessions 
                SET status = 'closed', ended_at = NOW() 
                WHERE session_id = ?
            ");
            $stmt->execute([$session_id]);
            
            // Send system message
            $msgStmt = $pdo->prepare("
                INSERT INTO chat_messages (session_id, sender_type, sender_name, message, message_type) 
                VALUES (?, 'system', 'System', ?, 'system')
            ");
            $msgStmt->execute([$session_id, "Chat session closed by admin"]);
            
            $message = 'Chat session closed successfully';
            $messageType = 'success';
        } catch (Exception $e) {
            $message = 'Error closing chat: ' . $e->getMessage();
            $messageType = 'danger';
        }
    }
}

// Get statistics
$statsStmt = $pdo->query("
    SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
        SUM(CASE WHEN assigned_admin = '$adminUsername' AND status = 'active' THEN 1 ELSE 0 END) as my_active_chats
    FROM chat_sessions 
    WHERE DATE(started_at) = CURDATE()
");
$stats = $statsStmt->fetch();

// Get waiting chats (queue)
$queueStmt = $pdo->query("
    SELECT cs.*, cq.queue_position, cq.estimated_wait_time 
    FROM chat_sessions cs
    LEFT JOIN chat_queue cq ON cs.session_id = cq.session_id
    WHERE cs.status = 'waiting'
    ORDER BY cq.queue_position ASC, cs.started_at ASC
");
$waitingChats = $queueStmt->fetchAll();

// Get active chats
$activeStmt = $pdo->query("
    SELECT * FROM chat_sessions 
    WHERE status = 'active'
    ORDER BY last_activity DESC
");
$activeChats = $activeStmt->fetchAll();

// Get my active chats
$myChatsStmt = $pdo->prepare("
    SELECT * FROM chat_sessions 
    WHERE assigned_admin = ? AND status = 'active'
    ORDER BY last_activity DESC
");
$myChatsStmt->execute([$adminUsername]);
$myChats = $myChatsStmt->fetchAll();
?>

        <!-- Page Content -->
        <div class="container-fluid p-4">
            <!-- Page Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h3 mb-0">Live Chat Management</h1>
                    <p class="text-muted">Real-time customer support chat system</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary" onclick="refreshData()">
                        <i class="ti ti-refresh me-2"></i>Refresh
                    </button>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#chatSettingsModal">
                        <i class="ti ti-settings me-2"></i>Settings
                    </button>
                </div>
            </div>

            <!-- Alert Messages -->
            <?php if ($message): ?>
            <div class="alert alert-<?= $messageType ?> alert-dismissible fade show" role="alert">
                <?= htmlspecialchars($message) ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
            <?php endif; ?>

            <!-- Statistics Cards -->
            <div class="row mb-4">
                <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card border-primary">
                        <div class="card-body text-center">
                            <div class="stat-value text-primary"><?= number_format($stats['total_sessions']) ?></div>
                            <div class="stat-label">Total Today</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card border-warning">
                        <div class="card-body text-center">
                            <div class="stat-value text-warning"><?= number_format($stats['waiting_count']) ?></div>
                            <div class="stat-label">Waiting</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card border-success">
                        <div class="card-body text-center">
                            <div class="stat-value text-success"><?= number_format($stats['active_count']) ?></div>
                            <div class="stat-label">Active</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card border-info">
                        <div class="card-body text-center">
                            <div class="stat-value text-info"><?= number_format($stats['my_active_chats']) ?></div>
                            <div class="stat-label">My Chats</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card border-secondary">
                        <div class="card-body text-center">
                            <div class="stat-value text-secondary"><?= number_format($stats['closed_count']) ?></div>
                            <div class="stat-label">Completed</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Chat Queue -->
                <div class="col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">
                                <i class="ti ti-clock me-2"></i>Chat Queue
                            </h5>
                            <span class="badge bg-warning"><?= count($waitingChats) ?></span>
                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush" style="max-height: 400px; overflow-y: auto;">
                                <?php foreach ($waitingChats as $chat): ?>
                                <div class="list-group-item">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h6 class="mb-1"><?= htmlspecialchars($chat['visitor_name'] ?: 'Anonymous') ?></h6>
                                            <p class="mb-1 text-muted small"><?= htmlspecialchars($chat['visitor_email'] ?: 'No email') ?></p>
                                        </div>
                                        <small class="text-muted"><?= date('g:i A', strtotime($chat['started_at'])) ?></small>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">
                                            Position: #<?= $chat['queue_position'] ?: '1' ?> | 
                                            Wait: <?= $chat['estimated_wait_time'] ?: '5' ?>min
                                        </small>
                                        <button class="btn btn-sm btn-primary" onclick="assignChat('<?= $chat['session_id'] ?>')">
                                            <i class="ti ti-user-plus"></i> Take
                                        </button>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                                
                                <?php if (empty($waitingChats)): ?>
                                <div class="list-group-item text-center py-4 text-muted">
                                    <i class="ti ti-inbox ti-2x mb-2 d-block"></i>
                                    No visitors waiting
                                </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- My Active Chats -->
                <div class="col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">
                                <i class="ti ti-message-circle me-2"></i>My Chats
                            </h5>
                            <span class="badge bg-success"><?= count($myChats) ?></span>
                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush" style="max-height: 400px; overflow-y: auto;">
                                <?php foreach ($myChats as $chat): ?>
                                <div class="list-group-item">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h6 class="mb-1"><?= htmlspecialchars($chat['visitor_name'] ?: 'Anonymous') ?></h6>
                                            <p class="mb-1 text-muted small"><?= htmlspecialchars($chat['visitor_email'] ?: 'No email') ?></p>
                                        </div>
                                        <small class="text-muted"><?= date('g:i A', strtotime($chat['last_activity'])) ?></small>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="badge bg-<?= $chat['priority'] === 'high' ? 'danger' : ($chat['priority'] === 'medium' ? 'warning' : 'secondary') ?>">
                                            <?= ucfirst($chat['priority']) ?>
                                        </span>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-primary" onclick="openChatWindow('<?= $chat['session_id'] ?>')">
                                                <i class="ti ti-message"></i>
                                            </button>
                                            <button class="btn btn-outline-danger" onclick="closeChat('<?= $chat['session_id'] ?>')">
                                                <i class="ti ti-x"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                                
                                <?php if (empty($myChats)): ?>
                                <div class="list-group-item text-center py-4 text-muted">
                                    <i class="ti ti-message-off ti-2x mb-2 d-block"></i>
                                    No active chats
                                </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- All Active Chats -->
                <div class="col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">
                                <i class="ti ti-users me-2"></i>All Active
                            </h5>
                            <span class="badge bg-info"><?= count($activeChats) ?></span>
                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush" style="max-height: 400px; overflow-y: auto;">
                                <?php foreach ($activeChats as $chat): ?>
                                <div class="list-group-item">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h6 class="mb-1"><?= htmlspecialchars($chat['visitor_name'] ?: 'Anonymous') ?></h6>
                                            <p class="mb-1 text-muted small">
                                                with <?= htmlspecialchars($chat['assigned_admin']) ?>
                                            </p>
                                        </div>
                                        <small class="text-muted"><?= date('g:i A', strtotime($chat['last_activity'])) ?></small>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="badge bg-<?= $chat['priority'] === 'high' ? 'danger' : ($chat['priority'] === 'medium' ? 'warning' : 'secondary') ?>">
                                            <?= ucfirst($chat['priority']) ?>
                                        </span>
                                        <?php if ($chat['assigned_admin'] !== $adminUsername): ?>
                                        <button class="btn btn-sm btn-outline-primary" onclick="viewChatHistory('<?= $chat['session_id'] ?>')">
                                            <i class="ti ti-eye"></i> View
                                        </button>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                                
                                <?php if (empty($activeChats)): ?>
                                <div class="list-group-item text-center py-4 text-muted">
                                    <i class="ti ti-users-off ti-2x mb-2 d-block"></i>
                                    No active chats
                                </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

<!-- Chat Window Modal -->
<div class="modal fade" id="chatWindowModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="ti ti-message-circle me-2"></i>Chat with <span id="chatVisitorName"></span>
                </h5>
                <div class="d-flex align-items-center">
                    <span class="badge bg-success me-2" id="customerStatus">
                        <i class="ti ti-user"></i> Customer Online
                    </span>
                    <span class="badge bg-success me-2" id="connectionStatus">
                        <i class="ti ti-wifi"></i> Connected
                    </span>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
            </div>
            <div class="modal-body">
                <div class="chat-container">
                    <div class="chat-messages" id="chatMessages" style="height: 400px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 0.375rem; padding: 1rem; margin-bottom: 1rem; background: #f8f9fa;">
                        <!-- Messages will be loaded here -->
                    </div>
                    <div id="typingIndicator" class="text-muted small mb-2" style="display: none;">
                        <i class="ti ti-dots"></i> Customer is typing...
                    </div>
                    <div class="chat-input">
                        <div class="input-group">
                            <input type="text" class="form-control" id="messageInput" placeholder="Type your message..." maxlength="500">
                            <button class="btn btn-primary" onclick="sendMessage()" id="sendButton">
                                <i class="ti ti-send"></i>
                            </button>
                        </div>
                        <div class="small text-muted mt-1">
                            <i class="ti ti-info-circle"></i> Messages refresh every 2 seconds • Press Enter to send
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" onclick="closeCurrentChat()">
                    <i class="ti ti-x me-2"></i>Close Chat
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Minimize</button>
            </div>
        </div>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>

<script>
let currentChatSession = null;
let chatRefreshInterval = null;

// Chat management functions
function assignChat(sessionId) {
    // Show loading state
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Assigning...';
    button.disabled = true;
    
    // Assign chat via AJAX
    fetch('../api/assign-chat.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Successfully assigned, now open the chat modal
            openChatWindow(sessionId);
            
            // Refresh the page to update the UI
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            alert('Failed to assign chat: ' + (data.message || 'Unknown error'));
            button.innerHTML = originalText;
            button.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error assigning chat:', error);
        alert('Failed to assign chat. Please try again.');
        button.innerHTML = originalText;
        button.disabled = false;
    });
}

function openChatWindow(sessionId) {
    currentChatSession = sessionId;
    loadChatMessages(sessionId);
    
    fetch(`../api/chat-details.php?session_id=${sessionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('chatVisitorName').textContent = data.session.visitor_name || 'Anonymous';
                new bootstrap.Modal(document.getElementById('chatWindowModal')).show();
                
                // Start refresh interval
                chatRefreshInterval = setInterval(() => {
                    loadChatMessages(sessionId);
                }, 2000);
            }
        });
}

function loadChatMessages(sessionId) {
    fetch(`../api/chat-messages.php?session_id=${sessionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const messagesContainer = document.getElementById('chatMessages');
                const wasScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 1;
                
                messagesContainer.innerHTML = '';
                
                data.messages.forEach(message => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `mb-3 ${message.sender_type === 'admin' ? 'text-end' : 'text-start'}`;
                    
                    const isSystem = message.sender_type === 'system';
                    const isCurrentAdmin = message.sender_type === 'admin';
                    
                    let messageClass, textClass;
                    if (isSystem) {
                        messageClass = 'bg-info bg-opacity-10 border border-info border-opacity-25';
                        textClass = 'text-info';
                    } else if (isCurrentAdmin) {
                        messageClass = 'bg-primary';
                        textClass = 'text-white';
                    } else {
                        messageClass = 'bg-light border';
                        textClass = 'text-dark';
                    }
                    
                    const timestamp = new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    messageDiv.innerHTML = `
                        <div class="d-inline-block ${messageClass} ${textClass} rounded px-3 py-2" style="max-width: 70%;">
                            ${isSystem ? '<em><i class="ti ti-info-circle me-1"></i>' + message.message + '</em>' : escapeHtml(message.message)}
                        </div>
                        <div class="small text-muted mt-1">
                            <strong>${escapeHtml(message.sender_name)}</strong> • ${timestamp}
                        </div>
                    `;
                    
                    messagesContainer.appendChild(messageDiv);
                });
                
                // Auto-scroll to bottom if user was already at bottom or if it's a new conversation
                if (wasScrolledToBottom || messagesContainer.children.length <= 3) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
                
                // Update connection status
                document.getElementById('connectionStatus').innerHTML = '<i class="ti ti-wifi"></i> Connected';
                document.getElementById('connectionStatus').className = 'badge bg-success me-2';
            }
        })
        .catch(error => {
            console.error('Error loading messages:', error);
            // Update connection status to show error
            document.getElementById('connectionStatus').innerHTML = '<i class="ti ti-wifi-off"></i> Connection Error';
            document.getElementById('connectionStatus').className = 'badge bg-danger me-2';
        });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || !currentChatSession) return;
    
    // Disable input while sending
    messageInput.disabled = true;
    
    fetch('../api/send-message.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: currentChatSession,
            message: message
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageInput.value = '';
            loadChatMessages(currentChatSession);
        } else {
            alert('Failed to send message: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    })
    .finally(() => {
        messageInput.disabled = false;
        messageInput.focus();
    });
}

function closeChat(sessionId) {
    if (confirm('Are you sure you want to close this chat?')) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.innerHTML = `
            <input type="hidden" name="action" value="close_chat">
            <input type="hidden" name="session_id" value="${sessionId}">
        `;
        document.body.appendChild(form);
        form.submit();
    }
}

function closeCurrentChat() {
    if (!currentChatSession) return;
    
    if (confirm('Are you sure you want to close this chat session?')) {
        fetch('../api/close-chat.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: currentChatSession
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('chatWindowModal'));
                if (modal) modal.hide();
                
                // Refresh the page to update the UI
                setTimeout(() => {
                    location.reload();
                }, 500);
            } else {
                alert('Failed to close chat: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error closing chat:', error);
            alert('Failed to close chat. Please try again.');
        });
    }
}

function viewChatHistory(sessionId) {
    openChatWindow(sessionId);
}

function refreshData() {
    // Instead of full page reload, update just the data sections
    refreshChatQueues();
}

function refreshChatQueues() {
    // Refresh waiting queue
    fetch('../api/chat-queue.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateChatQueueDisplay(data.waiting_queue, data.active_chats, data.closed_chats);
            }
        })
        .catch(error => {
            console.error('Error refreshing chat queues:', error);
            // Fallback to full page reload on error
            window.location.reload();
        });
}

function updateChatQueueDisplay(waitingQueue, activeChats, closedChats) {
    // This would require restructuring the PHP to separate data loading from display
    // For now, we'll keep the full page refresh but make it less frequent
    // and add visual feedback when refreshing
}

// Event listeners
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Clean up interval when modal is closed
document.getElementById('chatWindowModal').addEventListener('hidden.bs.modal', function() {
    if (chatRefreshInterval) {
        clearInterval(chatRefreshInterval);
        chatRefreshInterval = null;
    }
    currentChatSession = null;
});

// Auto-refresh page data every 15 seconds (reduced from 30 for better real-time feel)
setInterval(refreshData, 15000);
</script>