<?php
// Staff Chat Page - Staff-only access to live chat support
require_once '../includes/staff_auth_check.php';
requireStaffPermission('chat');

$currentStaff = getCurrentStaff();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Chat Support - Staff Portal</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Tabler Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons@latest/tabler-icons.min.css">
    
    <style>
        body {
            background-color: #f8f9fa;
            font-size: 0.9rem;
        }
        .chat-container {
            height: calc(100vh - 120px);
        }
        .chat-list {
            border-right: 1px solid #e9ecef;
            height: 100%;
            overflow-y: auto;
        }
        .chat-area {
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .chat-header {
            border-bottom: 1px solid #e9ecef;
            padding: 1rem;
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
        }
        .chat-input {
            border-top: 1px solid #e9ecef;
            padding: 1rem;
        }
        .chat-item {
            cursor: pointer;
            transition: all 0.2s;
            border-radius: 0.5rem;
            margin: 0.25rem 0;
        }
        .chat-item:hover {
            background-color: #f8f9fa;
        }
        .chat-item.active {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
        }
        .message {
            margin-bottom: 1rem;
        }
        .message.customer {
            text-align: left;
        }
        .message.staff {
            text-align: right;
        }
        .message-bubble {
            display: inline-block;
            max-width: 70%;
            padding: 0.75rem;
            border-radius: 1rem;
            word-wrap: break-word;
        }
        .message.customer .message-bubble {
            background-color: #e9ecef;
            color: #000;
            border-bottom-left-radius: 0.25rem;
        }
        .message.staff .message-bubble {
            background-color: #2196f3;
            color: #fff;
            border-bottom-right-radius: 0.25rem;
        }
        .typing-indicator {
            font-style: italic;
            color: #6c757d;
            font-size: 0.8rem;
        }
        .online-indicator {
            width: 8px;
            height: 8px;
            background-color: #28a745;
            border-radius: 50%;
            display: inline-block;
        }
        .offline-indicator {
            width: 8px;
            height: 8px;
            background-color: #dc3545;
            border-radius: 50%;
            display: inline-block;
        }
        .no-chat-selected {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container-fluid p-3">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h4 class="mb-1">Live Chat Support</h4>
                <p class="text-muted mb-0 small">Provide real-time support to customers</p>
            </div>
            <div class="d-flex gap-2">
                <span class="badge bg-success" id="onlineStatus">
                    <i class="ti ti-circle-filled me-1"></i>Online
                </span>
                <button class="btn btn-outline-primary btn-sm" onclick="refreshChatList()">
                    <i class="ti ti-refresh me-1"></i>Refresh
                </button>
                <div class="dropdown">
                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="ti ti-settings"></i> Settings
                    </button>
                    <div class="dropdown-menu dropdown-menu-end">
                        <h6 class="dropdown-header">Chat Settings</h6>
                        <div class="dropdown-item-text">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="autoAccept" checked>
                                <label class="form-check-label" for="autoAccept">Auto-accept chats</label>
                            </div>
                        </div>
                        <div class="dropdown-item-text">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="soundNotifications" checked>
                                <label class="form-check-label" for="soundNotifications">Sound notifications</label>
                            </div>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item" onclick="setStatusAway()">
                            <i class="ti ti-moon me-2"></i>Set Away
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="row g-3 mb-4">
            <div class="col-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="fw-bold h5 mb-1" id="activeChatCount">0</div>
                                <div class="small text-muted">Active Chats</div>
                            </div>
                            <div class="text-primary opacity-75">
                                <i class="ti ti-message-circle" style="font-size: 1.5rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="fw-bold h5 mb-1" id="pendingChatCount">0</div>
                                <div class="small text-muted">Pending</div>
                            </div>
                            <div class="text-warning opacity-75">
                                <i class="ti ti-clock" style="font-size: 1.5rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="fw-bold h5 mb-1" id="todayChatsCount">0</div>
                                <div class="small text-muted">Today's Chats</div>
                            </div>
                            <div class="text-info opacity-75">
                                <i class="ti ti-calendar" style="font-size: 1.5rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="fw-bold h5 mb-1" id="avgResponseTime">0s</div>
                                <div class="small text-muted">Avg Response</div>
                            </div>
                            <div class="text-success opacity-75">
                                <i class="ti ti-timer" style="font-size: 1.5rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chat Interface -->
        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <div class="row g-0 chat-container">
                    <!-- Chat List -->
                    <div class="col-md-4">
                        <div class="chat-list p-3">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="mb-0 fw-bold">Chat Queue</h6>
                                <span class="badge bg-primary" id="queueCount">0</span>
                            </div>
                            
                            <!-- Search -->
                            <div class="mb-3">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text">
                                        <i class="ti ti-search"></i>
                                    </span>
                                    <input type="text" class="form-control" id="chatSearch" placeholder="Search chats...">
                                </div>
                            </div>
                            
                            <!-- Filter Tabs -->
                            <ul class="nav nav-pills nav-fill mb-3" id="chatTabs">
                                <li class="nav-item">
                                    <a class="nav-link active small" data-filter="all" onclick="filterChats('all')">All</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link small" data-filter="active" onclick="filterChats('active')">Active</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link small" data-filter="pending" onclick="filterChats('pending')">Pending</a>
                                </li>
                            </ul>
                            
                            <!-- Chat Items -->
                            <div id="chatListContainer">
                                <div class="text-center py-4 text-muted">
                                    <div class="spinner-border spinner-border-sm" role="status"></div>
                                    <p class="mt-2 mb-0 small">Loading chats...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Chat Area -->
                    <div class="col-md-8">
                        <div class="chat-area">
                            <div id="chatContent" class="no-chat-selected">
                                <div class="text-center">
                                    <i class="ti ti-message-circle text-muted" style="font-size: 4rem;"></i>
                                    <h5 class="mt-3 text-muted">Select a chat to start</h5>
                                    <p class="text-muted">Choose a conversation from the chat queue</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        let chatsData = [];
        let currentChatId = null;
        let currentFilter = 'all';
        let messagesInterval = null;
        let chatListInterval = null;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            loadChatList();
            setupSearchFilter();
            startAutoRefresh();
        });

        // Setup search functionality
        function setupSearchFilter() {
            const searchInput = document.getElementById('chatSearch');
            let searchTimeout;
            
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    filterAndDisplayChats();
                }, 300);
            });
        }

        // Start auto-refresh intervals
        function startAutoRefresh() {
            // Refresh chat list every 10 seconds
            chatListInterval = setInterval(loadChatList, 10000);
            
            // Refresh current chat messages every 3 seconds
            messagesInterval = setInterval(() => {
                if (currentChatId) {
                    loadChatMessages(currentChatId, false);
                }
            }, 3000);
        }

        // Load chat list
        async function loadChatList() {
            try {
                const response = await fetch('../api/staff_chat.php?action=get_chats&staff_id=<?= $currentStaff['id'] ?>');
                const data = await response.json();
                
                if (data.success) {
                    chatsData = data.chats || [];
                    updateChatStats(chatsData);
                    filterAndDisplayChats();
                } else {
                    console.error('Failed to load chats:', data.error);
                }
            } catch (error) {
                console.error('Error loading chats:', error);
            }
        }

        // Update chat statistics
        function updateChatStats(chats) {
            const activeCount = chats.filter(c => c.status === 'active').length;
            const pendingCount = chats.filter(c => c.status === 'pending').length;
            const todayCount = chats.filter(c => {
                const today = new Date().toDateString();
                return new Date(c.created_at).toDateString() === today;
            }).length;
            
            document.getElementById('activeChatCount').textContent = activeCount;
            document.getElementById('pendingChatCount').textContent = pendingCount;
            document.getElementById('todayChatsCount').textContent = todayCount;
            document.getElementById('queueCount').textContent = chats.length;
            
            // Calculate average response time (placeholder)
            document.getElementById('avgResponseTime').textContent = '2m';
        }

        // Filter and display chats
        function filterAndDisplayChats() {
            let filtered = chatsData;
            
            // Apply status filter
            if (currentFilter !== 'all') {
                filtered = filtered.filter(c => c.status === currentFilter);
            }
            
            // Apply search filter
            const searchTerm = document.getElementById('chatSearch').value.toLowerCase();
            if (searchTerm) {
                filtered = filtered.filter(c => 
                    c.company_name.toLowerCase().includes(searchTerm) ||
                    c.customer_name.toLowerCase().includes(searchTerm)
                );
            }
            
            displayChatList(filtered);
        }

        // Display chat list
        function displayChatList(chats) {
            const container = document.getElementById('chatListContainer');
            
            if (chats.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4 text-muted">
                        <i class="ti ti-message-off" style="font-size: 2rem;"></i>
                        <p class="mt-2 mb-0 small">No chats available</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = chats.map(chat => `
                <div class="chat-item p-3 ${currentChatId === chat.id ? 'active' : ''}" onclick="selectChat(${chat.id})">
                    <div class="d-flex align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <h6 class="mb-0 small fw-bold">${escapeHtml(chat.company_name)}</h6>
                                <span class="badge ${getStatusBadgeClass(chat.status)} small">${getStatusText(chat.status)}</span>
                            </div>
                            <p class="mb-1 small text-muted">${escapeHtml(chat.customer_name || 'Anonymous')}</p>
                            <p class="mb-1 small">${truncateText(chat.last_message || 'No messages yet', 60)}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">${formatTime(chat.updated_at)}</small>
                                ${chat.unread_count > 0 ? `<span class="badge bg-danger rounded-pill">${chat.unread_count}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Select chat
        function selectChat(chatId) {
            currentChatId = chatId;
            
            // Update active chat in list
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
            });
            event.currentTarget.classList.add('active');
            
            // Load chat interface
            loadChatInterface(chatId);
        }

        // Load chat interface
        function loadChatInterface(chatId) {
            const chat = chatsData.find(c => c.id === chatId);
            if (!chat) return;
            
            const chatContent = document.getElementById('chatContent');
            chatContent.innerHTML = `
                <!-- Chat Header -->
                <div class="chat-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1 fw-bold">${escapeHtml(chat.company_name)}</h6>
                            <div class="d-flex align-items-center">
                                <span class="online-indicator me-2"></span>
                                <small class="text-muted">${escapeHtml(chat.customer_name || 'Anonymous Customer')}</small>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="loadChatMessages(${chatId}, true)">
                                <i class="ti ti-refresh"></i>
                            </button>
                            <div class="dropdown">
                                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                                    <i class="ti ti-dots-vertical"></i>
                                </button>
                                <div class="dropdown-menu dropdown-menu-end">
                                    <a class="dropdown-item" onclick="transferChat(${chatId})">
                                        <i class="ti ti-arrow-forward me-2"></i>Transfer Chat
                                    </a>
                                    <a class="dropdown-item" onclick="endChat(${chatId})">
                                        <i class="ti ti-x me-2"></i>End Chat
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chat Messages -->
                <div class="chat-messages" id="chatMessagesContainer">
                    <div class="text-center py-4">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        <p class="mt-2 mb-0 text-muted small">Loading messages...</p>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="chat-input">
                    <div class="input-group">
                        <textarea class="form-control" id="messageInput" rows="2" placeholder="Type your message..." onkeypress="handleKeyPress(event)"></textarea>
                        <button class="btn btn-primary" onclick="sendMessage()" id="sendButton">
                            <i class="ti ti-send"></i>
                        </button>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-secondary btn-sm" onclick="insertQuickReply('Hello! How can I help you today?')">
                                👋 Greeting
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="insertQuickReply('Thank you for contacting us. Let me check that for you.')">
                                🔍 Checking
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="insertQuickReply('Thank you for your patience. Is there anything else I can help you with?')">
                                ✅ Follow-up
                            </button>
                        </div>
                        <div class="typing-indicator" id="typingIndicator" style="display: none;">
                            Customer is typing...
                        </div>
                    </div>
                </div>
            `;
            
            // Load messages
            loadChatMessages(chatId, true);
        }

        // Load chat messages
        async function loadChatMessages(chatId, scrollToBottom = false) {
            try {
                const response = await fetch(`../../api/chat-messages.php?action=get_messages&chat_id=${chatId}`);
                const data = await response.json();
                
                if (data.success) {
                    displayMessages(data.messages || [], scrollToBottom);
                }
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        }

        // Display messages
        function displayMessages(messages, scrollToBottom = false) {
            const container = document.getElementById('chatMessagesContainer');
            
            container.innerHTML = messages.map(message => `
                <div class="message ${message.sender_type}">
                    <div class="message-bubble">
                        ${escapeHtml(message.message)}
                        <div class="small mt-1 opacity-75">
                            ${formatTime(message.created_at)}
                        </div>
                    </div>
                </div>
            `).join('');
            
            if (scrollToBottom) {
                container.scrollTop = container.scrollHeight;
            }
        }

        // Send message
        async function sendMessage() {
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value.trim();
            
            if (!message || !currentChatId) return;
            
            const sendButton = document.getElementById('sendButton');
            sendButton.disabled = true;
            sendButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
            
            try {
                const response = await fetch('../../api/send-message.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'send_message',
                        chat_id: currentChatId,
                        message: message,
                        sender_type: 'staff',
                        sender_id: '<?= $currentStaff['id'] ?>'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    messageInput.value = '';
                    loadChatMessages(currentChatId, true);
                } else {
                    alert('Failed to send message: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Error sending message');
            } finally {
                sendButton.disabled = false;
                sendButton.innerHTML = '<i class="ti ti-send"></i>';
                messageInput.focus();
            }
        }

        // Handle key press for message input
        function handleKeyPress(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }

        // Insert quick reply
        function insertQuickReply(text) {
            const messageInput = document.getElementById('messageInput');
            messageInput.value = text;
            messageInput.focus();
        }

        // Filter chats
        function filterChats(filter) {
            currentFilter = filter;
            
            // Update tab appearance
            document.querySelectorAll('#chatTabs .nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
            
            filterAndDisplayChats();
        }

        // Transfer chat (placeholder)
        function transferChat(chatId) {
            alert('Transfer chat functionality will be implemented.');
        }

        // End chat
        async function endChat(chatId) {
            if (!confirm('Are you sure you want to end this chat?')) return;
            
            try {
                const response = await fetch('../../api/chat-queue.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'end_chat',
                        chat_id: chatId,
                        staff_id: '<?= $currentStaff['id'] ?>'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    currentChatId = null;
                    document.getElementById('chatContent').innerHTML = `
                        <div class="no-chat-selected">
                            <div class="text-center">
                                <i class="ti ti-message-circle text-muted" style="font-size: 4rem;"></i>
                                <h5 class="mt-3 text-muted">Chat ended</h5>
                                <p class="text-muted">Select another conversation from the chat queue</p>
                            </div>
                        </div>
                    `;
                    loadChatList();
                } else {
                    alert('Failed to end chat: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error ending chat:', error);
                alert('Error ending chat');
            }
        }

        // Set status away (placeholder)
        function setStatusAway() {
            const status = document.getElementById('onlineStatus');
            status.innerHTML = '<i class="ti ti-moon me-1"></i>Away';
            status.className = 'badge bg-warning';
        }

        // Refresh chat list
        function refreshChatList() {
            loadChatList();
        }

        // Utility functions
        function getStatusBadgeClass(status) {
            const classes = {
                'pending': 'bg-warning',
                'active': 'bg-success',
                'ended': 'bg-secondary'
            };
            return classes[status] || 'bg-secondary';
        }

        function getStatusText(status) {
            const texts = {
                'pending': 'Pending',
                'active': 'Active',
                'ended': 'Ended'
            };
            return texts[status] || 'Unknown';
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }

        function truncateText(text, length) {
            if (!text) return '';
            return text.length > length ? text.substring(0, length) + '...' : text;
        }

        function formatTime(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
            return date.toLocaleDateString();
        }

        // Cleanup intervals when page unloads
        window.addEventListener('beforeunload', function() {
            if (messagesInterval) clearInterval(messagesInterval);
            if (chatListInterval) clearInterval(chatListInterval);
        });
    </script>
</body>
</html>