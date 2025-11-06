<?php
// Floating Chat System with Subscription Restrictions
// Only Starter, Professional, and Enterprise users can access chat
// Free users are blocked from chat functionality

// Check if user has chat access based on subscription
require_once __DIR__ . '/subscription_helper.php';

$has_chat_access = false;
$subscription_message = '';

if (isset($_SESSION['user_id'])) {
    try {
        $subscription_info = getUserSubscriptionInfo($_SESSION['user_id']);
        
        if ($subscription_info) {
            $plan = $subscription_info['subscription_plan'] ?? 'free';
            
            // Allow chat for all paid plans (Starter, Professional, Enterprise)
            if (in_array($plan, ['starter', 'professional', 'enterprise'])) {
                $has_chat_access = true;
            } else {
                // Free users get upgrade message
                $subscription_message = 'Chat is available for Starter plans and above. <a href="subscription.php" class="text-decoration-none">Upgrade now</a> to unlock team messaging!';
            }
        } else {
            $subscription_message = 'Chat is available for Starter plans and above. <a href="subscription.php" class="text-decoration-none">Upgrade now</a> to unlock team messaging!';
        }
    } catch (Exception $e) {
        // If there's an error checking subscription, don't show chat
        $subscription_message = 'Chat is temporarily unavailable. Please try again later.';
    }
} else {
    $subscription_message = 'Please log in to access chat features.';
}

// Only show chat if user has access
if (!$has_chat_access) {
    // Show upgrade prompt for free users
    echo '<div id="chat-upgrade-prompt" class="position-fixed" style="bottom: 20px; right: 20px; z-index: 1050;">';
    echo '<div class="card shadow-lg border-0" style="max-width: 300px;">';
    echo '<div class="card-body p-3">';
    echo '<div class="d-flex align-items-center mb-2">';
    echo '<i class="ti ti-message-circle text-primary me-2"></i>';
    echo '<strong class="text-primary">Team Chat</strong>';
    echo '<button type="button" class="btn-close ms-auto" onclick="document.getElementById(\'chat-upgrade-prompt\').style.display=\'none\';"></button>';
    echo '</div>';
    echo '<p class="small mb-2 text-muted">' . $subscription_message . '</p>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    
    // Add a script to prevent any chat functions from running
    echo '<script>';
    echo 'window.chatDisabled = true;';
    echo '</script>';
    return; // Don't show chat interface or any JavaScript
}
?>

<!-- Floating Chat System -->
<style>
/* Floating Chat Button */
.floating-chat-btn {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: move;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    z-index: 1050;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.floating-chat-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
}

.floating-chat-btn.dragging {
    opacity: 0.8;
    transform: scale(0.95);
}

.floating-chat-btn.has-unread {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    box-shadow: 0 4px 20px rgba(239, 68, 68, 0.5);
    animation: pulseRed 1.5s infinite;
}

.floating-chat-btn.has-unread:hover {
    box-shadow: 0 6px 25px rgba(239, 68, 68, 0.7);
}

/* Red pulsing animation for unread messages */
@keyframes pulseRed {
    0% {
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.5);
        transform: scale(1);
    }
    50% {
        box-shadow: 0 6px 30px rgba(239, 68, 68, 0.8);
        transform: scale(1.05);
    }
    100% {
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.5);
        transform: scale(1);
    }
}

/* Unread messages badge */
.chat-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ff0000;
    color: white;
    border-radius: 50%;
    min-width: 22px;
    height: 22px;
    font-size: 11px;
    font-weight: bold;
    display: none;
    align-items: center;
    justify-content: center;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3);
    animation: pulse-badge 2s infinite;
}

.chat-reminder {
    position: absolute;
    bottom: 70px;
    right: -10px;
    background: #667eea;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.65rem;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
    opacity: 0;
    transform: translateX(20px);
    pointer-events: none;
    z-index: 1051;
}

.chat-reminder.show {
    opacity: 1;
    transform: translateX(0);
}

@keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

.chat-badge.show {
    display: flex;
}

@keyframes pulse-badge {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

@keyframes pulse-notification {
    0% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
    50% { box-shadow: 0 6px 30px rgba(255, 0, 0, 0.6); }
    100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
}

/* Notification popup animations */
@keyframes slideInUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes fadeOutDown {
    from {
        transform: translateY(0);
        opacity: 1;
    }
    to {
        transform: translateY(20px);
        opacity: 0;
    }
}

/* Enhanced notification styles */
.chat-notification-popup {
    animation: slideInUp 0.3s ease-out, fadeOutDown 0.3s ease-in 2.7s !important;
}

/* Chat Modal */
.chat-modal .modal-dialog {
    max-width: 800px;
    height: 90vh;
}

.chat-modal .modal-content {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.chat-modal .modal-body {
    flex: 1;
    display: flex;
    padding: 0;
    overflow: hidden;
}

/* Chat sidebar */
.chat-sidebar {
    width: 300px;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    background: #f8f9fa;
}

.chat-sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: white;
}

.chat-users-list {
    flex: 1;
    overflow-y: auto;
    padding: 0;
}

.chat-user-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    transition: background-color 0.2s;
}

.chat-user-item:hover {
    background-color: #f3f4f6;
}

.chat-user-item.active {
    background-color: #dbeafe;
    border-right: 3px solid #3b82f6;
}

.chat-user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    margin-right: 0.75rem;
    position: relative;
}

.online-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: #22c55e;
    border: 2px solid white;
    border-radius: 50%;
}

.offline-indicator {
    background: #94a3b8;
}

.chat-user-info {
    flex: 1;
    min-width: 0;
}

.chat-user-name {
    font-weight: 600;
    margin: 0;
    font-size: 0.9rem;
}

.chat-user-role {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
}

.chat-unread-badge {
    background: #ef4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 11px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Chat area */
.chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.chat-header {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: white;
    display: flex;
    align-items: center;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: #f8f9fa;
}

.chat-message {
    margin-bottom: 1rem;
    display: flex;
}

.chat-message.own {
    justify-content: flex-end;
}

.chat-message-content {
    max-width: 70%;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    position: relative;
}

.chat-message.own .chat-message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.chat-message:not(.own) .chat-message-content {
    background: white;
    border: 1px solid #e5e7eb;
}

.chat-message-time {
    font-size: 0.7rem;
    opacity: 0.7;
    margin-top: 0.25rem;
}

.chat-input-area {
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
    background: white;
}

.chat-input-group {
    display: flex;
    gap: 0.5rem;
}

.chat-input {
    flex: 1;
    border: 1px solid #d1d5db;
    border-radius: 1.5rem;
    padding: 0.75rem 1rem;
    outline: none;
    transition: border-color 0.2s;
}

.chat-input:focus {
    border-color: #667eea;
}

.chat-send-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s;
}

.chat-send-btn:hover {
    transform: scale(1.05);
}

.chat-welcome {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: #6b7280;
}

/* Enhanced Mobile Responsive Design */
@media (max-width: 768px) {
    .floating-chat-btn {
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        font-size: 20px;
    }
    
    .chat-modal .modal-dialog {
        max-width: 100%;
        height: 100vh;
        margin: 0;
        border-radius: 0;
    }
    
    .chat-modal .modal-content {
        height: 100vh;
        border-radius: 0;
        border: none;
    }
    
    .chat-container {
        flex-direction: column;
        height: 100vh;
    }
    
    .chat-sidebar {
        width: 100%;
        height: 50vh;
        border-right: none;
        border-bottom: 1px solid #e0e0e0;
        order: 2;
    }
    
    .chat-main {
        height: 50vh;
        order: 1;
    }
    
    .users-list {
        max-height: calc(50vh - 120px);
    }
    
    .chat-messages {
        max-height: calc(50vh - 140px);
        padding: 10px;
    }
    
    .chat-input-container {
        padding: 10px;
        background: #fff;
        border-top: 1px solid #e0e0e0;
        position: sticky;
        bottom: 0;
    }
    
    .chat-input {
        font-size: 16px; /* Prevents zoom on iOS */
        padding: 12px 15px;
        min-height: 44px; /* Touch-friendly */
    }
    
    .chat-send-btn {
        min-width: 44px;
        min-height: 44px; /* Touch-friendly */
        padding: 12px;
    }
    
    .user-item {
        padding: 12px 15px; /* Larger touch targets */
        min-height: 60px;
    }
    
    .user-item:hover {
        background: #f8f9fa; /* More subtle hover on mobile */
    }
    
    .message {
        margin-bottom: 12px;
        max-width: 85%; /* Better mobile message width */
    }
    
    .message.sent {
        margin-left: 15%;
    }
    
    .message.received {
        margin-right: 15%;
    }
}

/* Tablet and small desktop adjustments */
@media (min-width: 769px) and (max-width: 1024px) {
    .chat-modal .modal-dialog {
        max-width: 90%;
        height: 90vh;
        margin: 5vh auto;
    }
    
    .chat-sidebar {
        width: 280px;
    }
}

/* Extra small phones */
@media (max-width: 480px) {
    .chat-modal .modal-dialog {
        max-width: 100%;
        height: 100vh;
        margin: 0;
    }
    
    .chat-sidebar {
        height: 45vh;
    }
    
    .chat-main {
        height: 55vh;
    }
    
    .users-list {
        max-height: calc(45vh - 100px);
    }
    
    .chat-messages {
        max-height: calc(55vh - 120px);
        padding: 8px;
    }
    
    .message {
        max-width: 90%;
        font-size: 14px;
    }
    
    .user-name {
        font-size: 14px;
    }
    
    .user-role {
        font-size: 11px;
    }
}

/* Mobile view state management */
@media (max-width: 768px) {
    .chat-modal.show-users .chat-sidebar {
        display: block;
    }
    
    .chat-modal.show-users .chat-main {
        display: none;
    }
    
    .chat-modal.show-chat .chat-sidebar {
        display: none;
    }
    
    .chat-modal.show-chat .chat-main {
        display: block;
    }
    
    /* Mobile navigation buttons */
    .mobile-show-users,
    .mobile-show-chat {
        display: inline-block;
        padding: 8px 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        margin: 0 5px;
    }
    
    .mobile-show-users:hover,
    .mobile-show-chat:hover {
        background: #0056b3;
    }
}

/* Hide mobile buttons on desktop */
@media (min-width: 769px) {
    .mobile-show-users,
    .mobile-show-chat {
        display: none !important;
    }
}

/* Modal Display Fix */
.chat-modal {
    z-index: 1055 !important;
}

.chat-modal .modal-dialog {
    z-index: 1056 !important;
}

/* Mobile-specific styles when chat is open */
body.chat-open-mobile {
    overflow: hidden; /* Prevent background scrolling */
}

.mobile-chat .modal-backdrop {
    background-color: rgba(0, 0, 0, 0.8); /* Darker backdrop on mobile */
}

/* Touch improvements */
.chat-modal .user-item,
.chat-modal .chat-send-btn,
.chat-modal .btn {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
    user-select: none;
}

/* Prevent text selection on buttons and interactive elements */
.chat-modal button,
.chat-modal .user-item {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.chat-modal.show {
    display: block !important;
}

.chat-modal .modal-backdrop {
    z-index: 1054 !important;
}
</style>

<!-- Floating Chat Button -->
<button class="floating-chat-btn" id="floatingChatBtn" title="Open Chat">
    <i class="ti ti-message-circle"></i>
    <span class="chat-badge" id="chatBadge">0</span>
    <div class="chat-reminder" id="chatReminder">Tap here to chat</div>
</button>

<!-- Chat Modal -->
<div class="modal fade chat-modal" id="chatModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="ti ti-message-circle me-2"></i>Team Chat
                </h5>
                <!-- Mobile navigation buttons (hidden on desktop) -->
                <div class="mobile-nav-buttons d-md-none me-2">
                    <button type="button" class="mobile-show-users me-1">
                        <i class="ti ti-users"></i> Users
                    </button>
                    <button type="button" class="mobile-show-chat">
                        <i class="ti ti-message"></i> Chat
                    </button>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <!-- Chat Sidebar -->
                <div class="chat-sidebar">
                    <div class="chat-sidebar-header">
                        <h6 class="mb-0">Team Members</h6>
                        <small class="text-muted">Click to start conversation</small>
                    </div>
                    <div class="chat-users-list" id="chatUsersList">
                        <div class="text-center p-3">
                            <i class="ti ti-loading ti-spin"></i>
                            <p class="mb-0 mt-2 text-muted">Loading users...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Chat Area -->
                <div class="chat-area">
                    <div class="chat-header" id="chatHeader" style="display: none;">
                        <div class="chat-user-avatar" id="activeUserAvatar"></div>
                        <div class="ms-3">
                            <h6 class="mb-0" id="activeUserName">Select a user</h6>
                            <small class="text-muted" id="activeUserStatus">Offline</small>
                        </div>
                    </div>
                    
                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-welcome">
                            <div>
                                <i class="ti ti-message-circle" style="font-size: 3rem; opacity: 0.3;"></i>
                                <h5 class="mt-3">Welcome to Team Chat</h5>
                                <p>Select a team member to start a conversation</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chat-input-area" id="chatInputArea" style="display: none;">
                        <div class="chat-input-group">
                            <input type="text" class="chat-input" id="chatInput" placeholder="Type your message..." maxlength="1000">
                            <button class="chat-send-btn" id="chatSendBtn">
                                <i class="ti ti-send"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
(function() {
    'use strict';
    
    // Chat System Variables
    let currentChatUser = null;
    let chatUsers = [];
    let chatMessages = [];
    let chatUpdateInterval = null;
    let messagePollingInterval = null;
    let isDragging = false;
    let dragStartTime = 0;
    let dragOffset = { x: 0, y: 0 };
    let lastMessageId = 0;
    const currentUserId = <?php echo $_SESSION['user_id']; ?>;
    
    // DOM Elements
    const floatingBtn = document.getElementById('floatingChatBtn');
    const chatModal = document.getElementById('chatModal');
    const chatBadge = document.getElementById('chatBadge');
    const chatReminder = document.getElementById('chatReminder');
    const chatUsersList = document.getElementById('chatUsersList');
    const chatMessages_el = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatHeader = document.getElementById('chatHeader');
    const chatInputArea = document.getElementById('chatInputArea');
    
    // Initialize Chat System
    function initChat() {
        
        // Check for DOM elements
        
        if (!floatingBtn || !chatModal) {
            return;
        }
        
        setupDraggable();
        setupEventListeners();
        setupAudioNotification(); // Setup audio for notifications
        
        loadUsers();
        updateOnlineStatus();
        updateUnreadCount(); // Initial unread count
        
        // Request notification permission on initialization
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Update online status every 30 seconds
        setInterval(updateOnlineStatus, 30000);
        
        // Update unread count every 3 seconds for real-time notifications
        setInterval(updateUnreadCount, 3000);
        
        // Update users list every 60 seconds
        setInterval(loadUsers, 60000);
        
        // Show chat reminder every 10 minutes (600000ms)
        setInterval(showChatReminder, 600000);
    }
    
    // Show periodic chat reminder
    function showChatReminder() {
        if (chatReminder && !chatModal.classList.contains('show')) {
            chatReminder.classList.add('show');
            setTimeout(() => {
                chatReminder.classList.remove('show');
            }, 3000);
        }
    }
    
    // Setup draggable functionality
    function setupDraggable() {
        floatingBtn.addEventListener('mousedown', startDrag);
        floatingBtn.addEventListener('touchstart', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
    }
    
    function startDrag(e) {
        dragStartTime = Date.now();
        isDragging = true;
        floatingBtn.classList.add('dragging');
        
        const rect = floatingBtn.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        dragOffset.x = clientX - rect.left;
        dragOffset.y = clientY - rect.top;
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        let newX = clientX - dragOffset.x;
        let newY = clientY - dragOffset.y;
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - floatingBtn.offsetWidth;
        const maxY = window.innerHeight - floatingBtn.offsetHeight;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        floatingBtn.style.left = newX + 'px';
        floatingBtn.style.top = newY + 'px';
        floatingBtn.style.right = 'auto';
        floatingBtn.style.bottom = 'auto';
        
        e.preventDefault();
    }
    
    function stopDrag() {
        if (isDragging) {
            const dragDuration = Date.now() - dragStartTime;
            floatingBtn.classList.remove('dragging');
            
            // If drag was very short (less than 200ms), treat as click
            if (dragDuration < 200) {
                setTimeout(() => {
                    openChatModal();
                }, 10);
            }
            
            isDragging = false;
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Remove any existing event listeners to prevent duplicates
        floatingBtn.removeEventListener('click', openChatModal);
        chatSendBtn.removeEventListener('click', sendMessage);
        
        // Add fresh event listeners
        floatingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openChatModal();
        });
        
        // Remove existing keypress listener and add new one
        chatInput.removeEventListener('keypress', handleKeyPress);
        chatInput.addEventListener('keypress', handleKeyPress);
        
        // Remove existing send button listener and add new one
        chatSendBtn.removeEventListener('click', sendMessage);
        chatSendBtn.addEventListener('click', sendMessage);
        
        // Close modal functionality
        const closeBtn = chatModal.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.removeEventListener('click', closeChatModal);
            closeBtn.addEventListener('click', closeChatModal);
        }
        
        // Close on backdrop click
        chatModal.removeEventListener('click', handleModalClick);
        chatModal.addEventListener('click', handleModalClick);
        
        // Close on Escape key
        document.removeEventListener('keydown', handleEscapeKey);
        document.addEventListener('keydown', handleEscapeKey);
        
        // Auto-resize chat modal
        chatModal.removeEventListener('shown.bs.modal', handleModalShown);
        chatModal.addEventListener('shown.bs.modal', handleModalShown);
        
        // Update unread count when modal is hidden
        chatModal.removeEventListener('hidden.bs.modal', handleModalHidden);
        chatModal.addEventListener('hidden.bs.modal', handleModalHidden);
        
        // Mobile navigation event listeners
        const mobileShowUsers = document.querySelector('.mobile-show-users');
        const mobileShowChat = document.querySelector('.mobile-show-chat');
        
        if (mobileShowUsers) {
            mobileShowUsers.removeEventListener('click', showUsersView);
            mobileShowUsers.addEventListener('click', showUsersView);
        }
        
        if (mobileShowChat) {
            mobileShowChat.removeEventListener('click', showChatView);
            mobileShowChat.addEventListener('click', showChatView);
        }
    }
    
    // Separate handler functions to prevent issues with removeEventListener
    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    
    function handleModalClick(e) {
        if (e.target === chatModal) {
            closeChatModal();
        }
    }
    
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && chatModal.classList.contains('show')) {
            closeChatModal();
        }
    }
    
    function handleModalShown() {
        loadUsers();
        if (currentChatUser) {
            loadMessages(currentChatUser.id);
            // Mark messages as read when opening chat with selected user
            markMessagesAsRead(currentChatUser.id);
        }
        // Update unread count when modal is opened
        setTimeout(updateUnreadCount, 500);
    }
    
    function handleModalHidden() {
        updateUnreadCount();
        // Stop message polling when closing chat
        if (messagePollingInterval) {
            clearInterval(messagePollingInterval);
            messagePollingInterval = null;
        }
    }
    
    function showUsersView() {
        chatModal.classList.remove('show-chat');
        chatModal.classList.add('show-users');
    }
    
    function showChatView() {
        chatModal.classList.remove('show-users');
        chatModal.classList.add('show-chat');
    }
    
    // Check if device is mobile
    function isMobileDevice() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }
    
    // Open chat modal function
    function openChatModal() {
        if (!chatModal) {
            console.error('❌ Chat modal element not found');
            return;
        }
        
        // Add mobile-specific class if on mobile
        if (isMobileDevice()) {
            chatModal.classList.add('mobile-chat');
            document.body.classList.add('chat-open-mobile');
        }
        
        // Try multiple approaches to open the modal
        try {
            // Method 1: Bootstrap JavaScript API
            if (typeof bootstrap !== 'undefined') {
                const modal = new bootstrap.Modal(chatModal, {
                    backdrop: true,
                    keyboard: true,
                    focus: true
                });
                modal.show();
                loadUsers();
                return;
            }
            
            // Method 2: jQuery fallback (if available)
            if (typeof $ !== 'undefined' && $.fn.modal) {
                $(chatModal).modal('show');
                loadUsers();
                return;
            }
            
            // Method 3: Manual show
            chatModal.classList.add('show');
            chatModal.style.display = 'block';
            chatModal.setAttribute('aria-modal', 'true');
            chatModal.setAttribute('role', 'dialog');
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.setAttribute('data-modal-id', 'chatModal');
            document.body.appendChild(backdrop);
            
            // Prevent body scroll
            document.body.classList.add('modal-open');
            
            loadUsers();
            
            // Set initial mobile view state (show users by default)
            if (isMobileDevice()) {
                chatModal.classList.add('show-users');
                chatModal.classList.remove('show-chat');
            }
            
        } catch (error) {
            console.error('❌ Error opening chat modal:', error);
        }
    }
    
    // Close chat modal function
    function closeChatModal() {
        // Clean up mobile classes
        chatModal.classList.remove('mobile-chat');
        document.body.classList.remove('chat-open-mobile');
        
        try {
            // Try Bootstrap API first
            if (typeof bootstrap !== 'undefined') {
                const modalInstance = bootstrap.Modal.getInstance(chatModal);
                if (modalInstance) {
                    modalInstance.hide();
                    return;
                }
            }
            
            // Manual close
            chatModal.classList.remove('show');
            chatModal.style.display = 'none';
            chatModal.removeAttribute('aria-modal');
            chatModal.removeAttribute('role');
            
            // Remove backdrop
            const backdrop = document.querySelector('.modal-backdrop[data-modal-id="chatModal"]');
            if (backdrop) {
                backdrop.remove();
            }
            
            // Restore body scroll
            document.body.classList.remove('modal-open');
            
        } catch (error) {
            console.error('❌ Error closing modal:', error);
        }
    }
    
    // Load users
    async function loadUsers() {
        // Check if chat is disabled for free users
        if (window.chatDisabled) {
            return;
        }
        
        try {
            const response = await fetch('../api/chat.php?action=get_users', {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            if (!text.startsWith('{')) {
                throw new Error('Invalid JSON response: ' + text.substring(0, 100));
            }
            
            const data = JSON.parse(text);
            
            // Check for subscription restrictions
            if (!data.success && data.upgrade_required) {
                showUpgradePrompt(data.error, data.current_plan);
                return;
            }
            
            if (data.success) {
                chatUsers = data.users;
                renderUsers();
            } else {
                // Handle case where no users are available
                chatUsersList.innerHTML = `
                    <div class="no-users-message">
                        <p>No other users available for chat in your company.</p>
                    </div>
                `;
            }
        } catch (error) {
            chatUsersList.innerHTML = `
                <div class="no-users-message">
                    <p>Error loading users. Please try again.</p>
                </div>
            `;
        }
    }
    
    // Show upgrade prompt for subscription restrictions
    function showUpgradePrompt(message, currentPlan) {
        chatUsersList.innerHTML = `
            <div class="text-center p-4">
                <i class="ti ti-crown text-warning mb-3" style="font-size: 3rem;"></i>
                <h5 class="text-primary mb-2">Upgrade Required</h5>
                <p class="text-muted small mb-3">${message}</p>
                <p class="text-muted small mb-3">Current Plan: <strong class="text-capitalize">${currentPlan}</strong></p>
                <a href="subscription.php" class="btn btn-primary btn-sm">
                    <i class="ti ti-arrow-up-right me-1"></i>
                    Upgrade Now
                </a>
            </div>
        `;
        
        // Also show upgrade prompt in chat area
        if (chatMessages_el) {
            chatMessages_el.innerHTML = `
                <div class="chat-welcome">
                    <div class="text-center">
                        <i class="ti ti-crown text-warning" style="font-size: 3rem; opacity: 0.7;"></i>
                        <h5 class="mt-3 text-primary">Team Chat Available</h5>
                        <p class="text-muted">Upgrade to Starter plan or higher to access team messaging</p>
                        <a href="subscription.php" class="btn btn-primary">
                            <i class="ti ti-arrow-up-right me-1"></i>
                            View Plans
                        </a>
                    </div>
                </div>
            `;
        }
    }
    
    // Render users list
    function renderUsers() {
        if (chatUsers.length === 0) {
            chatUsersList.innerHTML = `
                <div class="text-center p-3">
                    <i class="ti ti-users" style="font-size: 2rem; opacity: 0.3;"></i>
                    <p class="mb-0 mt-2 text-muted">No other team members</p>
                </div>
            `;
            return;
        }
        
        chatUsersList.innerHTML = chatUsers.map(user => `
            <div class="chat-user-item" data-user-id="${user.id}" onclick="selectUser(${user.id})">
                <div class="chat-user-avatar">
                    ${user.first_name.charAt(0)}${user.last_name.charAt(0)}
                    <div class="online-indicator ${user.is_online ? '' : 'offline-indicator'}"></div>
                </div>
                <div class="chat-user-info">
                    <p class="chat-user-name">${user.first_name} ${user.last_name}</p>
                    <p class="chat-user-role">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                </div>
                <div class="chat-unread-badge" id="unread-${user.id}" style="display: none;">0</div>
            </div>
        `).join('');
    }
    
    // Select user for chat
    window.selectUser = async function(userId) {
        const user = chatUsers.find(u => u.id == userId);
        if (!user) return;
        
        currentChatUser = user;
        
        // Stop any existing polling
        if (messagePollingInterval) {
            clearInterval(messagePollingInterval);
        }
        
        // Update active user display
        document.getElementById('activeUserName').textContent = `${user.first_name} ${user.last_name}`;
        document.getElementById('activeUserStatus').textContent = user.is_online ? 'Online' : (user.recently_active ? 'Recently Active' : 'Offline');
        document.getElementById('activeUserAvatar').textContent = user.first_name.charAt(0) + user.last_name.charAt(0);
        
        // Show chat header and input
        chatHeader.style.display = 'flex';
        chatInputArea.style.display = 'block';
        
        // Update active user in sidebar
        document.querySelectorAll('.chat-user-item').forEach(item => {
            item.classList.remove('active');
        });
        const selectedItem = document.querySelector(`[data-user-id="${userId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
        
        // Load messages
        await loadMessages(userId);
        
        // Switch to chat view on mobile when user is selected
        if (isMobileDevice()) {
            chatModal.classList.remove('show-users');
            chatModal.classList.add('show-chat');
        }
        
        // Mark as read and clear unread badge for this user
        await markAsRead(userId);
        
        // Hide unread badge for this user
        const badge = document.getElementById(`unread-${userId}`);
        if (badge) {
            badge.style.display = 'none';
        }
        
        // Update total unread count
        updateUnreadCount();
        
        // Start real-time polling for this conversation
        startMessagePolling(userId);
        
        // Focus on input
        chatInput.focus();
    };
    
    // Load messages
    async function loadMessages(userId) {
        try {
            const response = await fetch(`../api/chat.php?action=get_messages&user_id=${userId}`, {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            if (!text.startsWith('{')) {
                throw new Error('Invalid JSON response: ' + text.substring(0, 100));
            }
            
            const data = JSON.parse(text);
            
            if (data.success) {
                chatMessages = data.messages;
                
                // Track the latest message ID for real-time updates
                if (chatMessages.length > 0) {
                    lastMessageId = Math.max(...chatMessages.map(msg => parseInt(msg.id)));
                }
                
                renderMessages();
                
                // Mark messages as read when loading conversation
                await markMessagesAsRead(userId);
            } else {
                console.error('Error loading messages:', data.error);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }
    
    // Mark messages as read
    async function markMessagesAsRead(senderId) {
        try {
            const response = await fetch('../api/chat.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'mark_read',
                    sender_id: senderId
                })
            });
            
            const data = await response.json();
            if (data.success) {
                // Update unread count after marking as read
                updateUnreadCount();
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }
    
    // Render messages
    function renderMessages() {
        if (chatMessages.length === 0) {
            if (currentChatUser) {
                // User is selected but no messages yet
                chatMessages_el.innerHTML = `
                    <div class="chat-welcome">
                        <div>
                            <i class="ti ti-message-circle" style="font-size: 3rem; opacity: 0.3;"></i>
                            <h5 class="mt-3">Start Conversation</h5>
                            <p>Send the first message to ${currentChatUser.first_name}</p>
                        </div>
                    </div>
                `;
            } else {
                // No user selected
                chatMessages_el.innerHTML = `
                    <div class="chat-welcome">
                        <div>
                            <i class="ti ti-message-circle" style="font-size: 3rem; opacity: 0.3;"></i>
                            <h5 class="mt-3">Welcome to Team Chat</h5>
                            <p>Select a team member to start a conversation</p>
                        </div>
                    </div>
                `;
            }
            return;
        }
        
        const messagesHtml = chatMessages.map(msg => {
            const isOwn = parseInt(msg.sender_id) === currentUserId;
            const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Add visual indicator for messages being sent
            const sendingIndicator = msg.sending ? '<i class="ti ti-clock text-muted ms-1" title="Sending..."></i>' : '';
            
            return `
                <div class="chat-message ${isOwn ? 'own' : ''}">
                    <div class="chat-message-content">
                        <div>${msg.message}</div>
                        <div class="chat-message-time">${time} ${sendingIndicator}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        chatMessages_el.innerHTML = messagesHtml;
        
        // Scroll to bottom
        chatMessages_el.scrollTop = chatMessages_el.scrollHeight;
    }
    
    // Send message
    async function sendMessage() {
        // Check if chat is disabled for free users
        if (window.chatDisabled) {
            showChatNotification('Chat feature requires a paid subscription. Please upgrade your plan.', 'warning');
            return;
        }
        
        const message = chatInput.value.trim();
        if (!message || !currentChatUser) return;
        
        // Prevent multiple rapid submissions
        if (chatSendBtn.disabled) return;
        
        // Disable send button to prevent double sending
        chatSendBtn.disabled = true;
        const originalIcon = chatSendBtn.innerHTML;
        chatSendBtn.innerHTML = '<i class="ti ti-loading ti-spin"></i>';
        
        // Clear input immediately to prevent resubmission
        const originalMessage = message;
        chatInput.value = '';
        
        // Create temporary message object for instant display
        const tempMessage = {
            id: 'temp_' + Date.now(),
            sender_id: currentUserId,
            receiver_id: currentChatUser.id,
            message: originalMessage,
            created_at: new Date().toISOString(),
            first_name: 'You',
            last_name: '',
            is_read: 1,
            sending: true // Flag to indicate this is being sent
        };
        
        // Add message to chat immediately for instant feedback
        chatMessages.push(tempMessage);
        renderMessages();
        
        // Scroll to bottom immediately
        setTimeout(() => {
            chatMessages_el.scrollTop = chatMessages_el.scrollHeight;
        }, 50);
        
        try {
            const response = await fetch('../api/chat.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'send_message',
                    receiver_id: currentChatUser.id,
                    message: originalMessage
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                throw new Error('Server returned invalid response. Please try again.');
            }
            
            if (data.success) {
                // Remove temporary message
                chatMessages = chatMessages.filter(msg => msg.id !== tempMessage.id);
                
                // Reload messages to get the actual sent message
                await loadMessages(currentChatUser.id);
                
                // Focus on input for next message
                chatInput.focus();
                
            } else {
                // Remove temporary message on error
                chatMessages = chatMessages.filter(msg => msg.id !== tempMessage.id);
                renderMessages();
                
                // Handle silent errors (like free users trying to use chat)
                if (data.silent) {
                    // Don't show error messages for silent failures
                    return;
                }
                
                // Show specific error message
                if (data.error && data.error.includes('subscription')) {
                    showChatNotification('Chat feature requires a paid subscription. Please upgrade your plan.', 'warning');
                } else {
                    showChatNotification('Failed to send message: ' + (data.error || 'Unknown error'), 'error');
                }
            }
        } catch (error) {
            // Remove temporary message on error
            chatMessages = chatMessages.filter(msg => msg.id !== tempMessage.id);
            renderMessages();
            
            // Show user-friendly error message
            showChatNotification('Failed to send message. Please check your connection and try again.', 'error');
        } finally {
            // Re-enable send button
            chatSendBtn.disabled = false;
            chatSendBtn.innerHTML = originalIcon;
        }
    }
    
    // Mark messages as read
    async function markAsRead(senderId) {
        try {
            await fetch('../api/chat.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'mark_read',
                    sender_id: senderId
                })
            });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }
    
    // Update online status
    async function updateOnlineStatus() {
        try {
            await fetch('../api/chat.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'update_online_status',
                    is_online: true
                })
            });
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    }
    
    // Store previous unread count for notification comparison
    let previousTotalUnread = 0;
    let previousUserUnreads = new Map();
    
    // Update unread count with enhanced notification detection
    async function updateUnreadCount() {
        // Check if chat is disabled for free users
        if (window.chatDisabled) {
            return;
        }
        
        try {
            const response = await fetch('../api/chat.php?action=get_conversations', {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                // Silently handle API unavailability - don't spam console
                return;
            }
            
            const text = await response.text();
            if (!text.startsWith('{')) {
                // Silently handle invalid responses
                return;
            }
            
            const data = JSON.parse(text);
            
            if (data.success) {
                let totalUnread = 0;
                let hasNewMessages = false;
                let newMessageSenders = [];
                
                data.conversations.forEach(conv => {
                    const unreadCount = parseInt(conv.unread_count || 0);
                    const previousCount = previousUserUnreads.get(conv.other_user_id) || 0;
                    totalUnread += unreadCount;
                    
                    // Check if this user has new messages
                    if (unreadCount > previousCount) {
                        hasNewMessages = true;
                        // Find user name for notification
                        const user = chatUsers.find(u => u.id == conv.other_user_id);
                        if (user) {
                            newMessageSenders.push(`${user.first_name} ${user.last_name}`);
                        }
                    }
                    
                    // Update stored count
                    previousUserUnreads.set(conv.other_user_id, unreadCount);
                    
                    // Update individual user badges
                    const badge = document.getElementById(`unread-${conv.other_user_id}`);
                    if (badge) {
                        if (unreadCount > 0) {
                            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                            badge.style.display = 'flex';
                            
                            // Add pulse animation for new messages
                            if (unreadCount > previousCount) {
                                badge.style.animation = 'pulse-badge 2s infinite';
                            }
                        } else {
                            badge.style.display = 'none';
                            badge.style.animation = 'none';
                        }
                    }
                });
                
                // Trigger notifications for new messages
                if (hasNewMessages && totalUnread > previousTotalUnread && previousTotalUnread >= 0) {
                    const messageText = newMessageSenders.length === 1 
                        ? `New message from ${newMessageSenders[0]}` 
                        : `New messages from ${newMessageSenders.length} people`;
                    
                    // Only show notification if chat modal is not open or user is not currently chatting
                    if (!chatModal.classList.contains('show')) {
                        showNotification(messageText, true); // Play sound
                    } else {
                        // Chat is open, just play a subtle notification sound without popup
                        showNotification(messageText, false); // No sound if already chatting
                    }
                }
                
                previousTotalUnread = totalUnread;
                
                // Update floating button badge
                updateFloatingBadge(totalUnread);
            }
        } catch (error) {
            // Silently handle chat system errors - don't spam console
            // Chat is optional functionality, failing gracefully is appropriate
            if (chatBadge) {
                chatBadge.style.display = 'none';
            }
        }
    }
    
    // Update floating button badge
    function updateFloatingBadge(count) {
        if (count > 0) {
            chatBadge.textContent = count > 99 ? '99+' : count;
            chatBadge.classList.add('show');
            chatBadge.style.display = 'flex';
            
            // Add notification animation to button for unread messages
            floatingBtn.style.animation = 'pulse-notification 2s infinite';
            
            // Add visual indicator class for styling
            floatingBtn.classList.add('has-unread');
            
            // Update document title to show unread count
            const originalTitle = document.title.replace(/^\(\d+\)\s*/, '');
            document.title = count > 0 ? `(${count}) ${originalTitle}` : originalTitle;
            
            // Change favicon to show notification (if supported)
            updateFavicon(true);
        } else {
            chatBadge.classList.remove('show');
            chatBadge.style.display = 'none';
            floatingBtn.style.animation = 'none';
            floatingBtn.classList.remove('has-unread');
            
            // Reset document title
            const originalTitle = document.title.replace(/^\(\d+\)\s*/, '');
            document.title = originalTitle;
            
            // Reset favicon
            updateFavicon(false);
        }
    }
    
    // Update favicon to show notification state
    function updateFavicon(hasNotification) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            
            // Draw base favicon (blue circle)
            ctx.fillStyle = hasNotification ? '#ef4444' : '#667eea';
            ctx.beginPath();
            ctx.arc(16, 16, 15, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add notification dot if needed
            if (hasNotification) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(24, 8, 6, 0, 2 * Math.PI);
                ctx.fill();
                
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(24, 8, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
            
            // Update favicon
            const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/png';
            link.rel = 'shortcut icon';
            link.href = canvas.toDataURL();
            document.getElementsByTagName('head')[0].appendChild(link);
        } catch (error) {
            // Silently handle favicon update errors
        }
    }
    
    // Create and setup audio notification
    let notificationSound = null;
    function setupAudioNotification() {
        // Create audio element for notification sound
        notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmrcBj2Y2+/CbSEFMLrJ8NaFNQcXZbbo6ZUOBR5bv+PkpVEEBjuS0e2+YRQFTKTo6n9ZCgjUq+rlTzYKDK7U8dSOMQcTaa/s55pJEA1QtOXhtUIBC2yE3tl7HQQCrODr3URAC2+D29kP');
        notificationSound.volume = 0.3; // Set moderate volume
    }
    
    // Enhanced notification function with sound
    function showNotification(message, playSound = true) {
        // Play beeping sound for new message notifications
        if (playSound && notificationSound) {
            try {
                notificationSound.currentTime = 0; // Reset to start
                notificationSound.play().catch(e => {
                    console.warn('Could not play notification sound:', e);
                });
            } catch (error) {
                console.warn('Audio notification error:', error);
            }
        }
        
        // Visual pulse animation on floating button
        floatingBtn.style.animation = 'pulse-notification 1s ease-in-out';
        setTimeout(() => {
            floatingBtn.style.animation = 'none';
        }, 1000);
        
        // Check if notifications are supported and permitted
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Firma Flow Chat', {
                    body: message,
                    icon: '/Firmaflow/uploads/logos/logo_2_1759685830.JPG', // Use company logo
                    tag: 'chat-notification',
                    requireInteraction: false,
                    silent: false
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('Firma Flow Chat', {
                            body: message,
                            icon: '/Firmaflow/uploads/logos/logo_2_1759685830.JPG',
                            tag: 'chat-notification',
                            requireInteraction: false,
                            silent: false
                        });
                    }
                });
            }
        }
        
        // Show in-page notification as well
        showInPageNotification(message);
    }
    
    // Show in-page notification
    function showInPageNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'chat-notification-popup';
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1060;
            max-width: 300px;
            font-size: 0.9rem;
            animation: slideInUp 0.3s ease-out, fadeOutDown 0.3s ease-in 2.7s;
            pointer-events: none;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
    
    // Show in-chat notification
    function showChatNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
            margin: 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        notification.innerHTML = `
            <small>${message}</small>
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Set offline when page unloads
    window.addEventListener('beforeunload', () => {
        navigator.sendBeacon('../api/chat.php', JSON.stringify({
            action: 'update_online_status',
            is_online: false
        }));
    });

    // Real-time messaging functions
    function startMessagePolling(userId) {
        // Stop any existing polling
        if (messagePollingInterval) {
            clearInterval(messagePollingInterval);
        }
        
        // Poll for new messages every 1 second for real-time experience
        messagePollingInterval = setInterval(async () => {
            if (currentChatUser && currentChatUser.id == userId) {
                await checkForNewMessages(userId);
            }
        }, 1000); // Reduced from 2000ms to 1000ms for faster updates
    }
    
    async function checkForNewMessages(userId) {
        // Check if chat is disabled for free users
        if (window.chatDisabled) {
            return;
        }
        
        try {
            const response = await fetch(`../api/chat.php?action=get_new_messages&user_id=${userId}&last_message_id=${lastMessageId}`, {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            if (!text.startsWith('{')) {
                throw new Error('Invalid JSON response: ' + text.substring(0, 100));
            }
            
            const data = JSON.parse(text);
            
            if (data.success && data.messages && data.messages.length > 0) {
                // Add new messages to the existing array
                chatMessages = [...chatMessages, ...data.messages];
                
                // Update the last message ID
                lastMessageId = Math.max(...data.messages.map(msg => parseInt(msg.id)));
                
                // Re-render messages
                renderMessages();
                
                // Mark new messages as read
                await markMessagesAsRead(userId);
                
                // Show notification for new messages from others
                data.messages.forEach(message => {
                    if (message.sender_id != currentUserId) {
                        const senderName = `${message.first_name} ${message.last_name}`;
                        const shortMessage = message.message.length > 50 
                            ? message.message.substring(0, 50) + '...' 
                            : message.message;
                        showNotification(`${senderName}: ${shortMessage}`, true);
                    }
                });
                
                // Auto-mark new messages as read since user is viewing the conversation
                await markMessagesAsRead(userId);
                
                // Temporarily increase polling frequency when receiving messages
                if (messagePollingInterval) {
                    clearInterval(messagePollingInterval);
                    // Poll every 500ms for the next 10 seconds for rapid back-and-forth
                    messagePollingInterval = setInterval(async () => {
                        if (currentChatUser && currentChatUser.id == userId) {
                            await checkForNewMessages(userId);
                        }
                    }, 500);
                    
                    // Reset to normal polling after 10 seconds
                    setTimeout(() => {
                        if (messagePollingInterval) {
                            clearInterval(messagePollingInterval);
                            startMessagePolling(userId);
                        }
                    }, 10000);
                }
            }
        } catch (error) {
            console.error('Error checking for new messages:', error);
        }
    }

    // Stop polling when modal is closed
    if (chatModal) {
        chatModal.addEventListener('hidden.bs.modal', () => {
            if (messagePollingInterval) {
                clearInterval(messagePollingInterval);
                messagePollingInterval = null;
            }
        });
    }
    
    // Wait for Bootstrap to be available
    function waitForBootstrap(callback, timeout = 5000) {
        const startTime = Date.now();
        
        function check() {
            if (typeof bootstrap !== 'undefined') {
                callback();
            } else if (Date.now() - startTime < timeout) {
                setTimeout(check, 100);
            } else {
                console.warn('⚠️ Bootstrap not loaded, using fallback methods');
                callback();
            }
        }
        
        check();
    }
    
    // Initialize when DOM is ready and Bootstrap is available
    function initialize() {
        waitForBootstrap(initChat);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
</script>