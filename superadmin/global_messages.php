<?php
// Global Messages Management Page
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$pageTitle = 'Global Messages Management';
require_once 'includes/header.php';
require_once 'includes/sidebar.php';

// Check if user is super admin
if (!isset($_SESSION['superadmin_logged_in']) || $_SESSION['superadmin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}
?>

        <!-- Page Content -->
        <div class="container-fluid p-4">
            <!-- Page Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h1 class="h3 mb-1">
                <i class="ti ti-broadcast me-2"></i>Global Messages Management
            </h1>
            <p class="text-muted mb-0">Create and manage messages that appear on all admin dashboards</p>
        </div>
        <button class="btn btn-primary" onclick="refreshMessages()">
            <i class="ti ti-refresh me-1"></i>Refresh Messages
        </button>
    </div>

    <div class="row g-4">
        <!-- Create Message Form -->
        <div class="col-lg-4">
            <div class="card h-100">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="ti ti-plus me-2"></i>Create New Message
                    </h5>
                </div>
                <div class="card-body">
                    <form id="globalMessageForm">
                        <div class="mb-3">
                            <label for="messageTitle" class="form-label">Message Title *</label>
                            <input type="text" class="form-control" id="messageTitle" required maxlength="100">
                        </div>
                        
                        <div class="mb-3">
                            <label for="messageContent" class="form-label">Message Content *</label>
                            <textarea class="form-control" id="messageContent" rows="4" required maxlength="500"></textarea>
                            <div class="form-text">Maximum 500 characters</div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="messageType" class="form-label">Message Type</label>
                            <select class="form-select" id="messageType" required>
                                <option value="info">Info (Blue)</option>
                                <option value="success">Success (Green)</option>
                                <option value="warning">Warning (Orange)</option>
                                <option value="error">Error (Red)</option>
                                <option value="announcement">Announcement (Purple)</option>
                            </select>
                        </div>
                        
                        <div class="d-grid mb-3">
                            <button type="submit" class="btn btn-primary" id="createMessageBtn">
                                <i class="ti ti-send me-1"></i>Create & Broadcast Message
                            </button>
                        </div>
                        
                        <div class="alert alert-info">
                            <small>
                                <i class="ti ti-info-circle me-1"></i>
                                Messages will appear as floating alerts on all admin dashboards until deleted.
                            </small>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Active Messages List -->
        <div class="col-lg-8">
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">
                        <i class="ti ti-list me-2"></i>Active Messages
                    </h5>
                    <div>
                        <button class="btn btn-outline-danger btn-sm me-2" onclick="clearAllMessages()">
                            <i class="ti ti-trash me-1"></i>Clear All
                        </button>
                        <span class="badge bg-primary" id="messageCount">0</span>
                    </div>
                </div>
                <div class="card-body">
                    <div id="messagesContainer">
                        <div id="loadingMessages" class="text-center text-muted py-4">
                            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                            Loading messages...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
        </div>
    </div>

<!-- Success/Error Toast -->
<div class="toast-container position-fixed top-0 end-0 p-3">
    <div id="messageToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
            <i class="ti ti-check-circle text-success me-2"></i>
            <strong class="me-auto" id="toastTitle">Success</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body" id="toastMessage">
            Message created successfully!
        </div>
    </div>
</div>

<style>
.message-card {
    border-left: 4px solid #007bff;
    transition: all 0.2s ease;
}
.message-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.message-type-info { border-left-color: #0dcaf0; }
.message-type-success { border-left-color: #198754; }
.message-type-warning { border-left-color: #ffc107; }
.message-type-error { border-left-color: #dc3545; }
.message-type-announcement { border-left-color: #6f42c1; }
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Load messages on page load
    loadMessages();
    
    // Setup form submission
    document.getElementById('globalMessageForm').addEventListener('submit', handleCreateMessage);
    
    // Character counter for message content
    const messageContent = document.getElementById('messageContent');
    messageContent.addEventListener('input', function() {
        const remaining = 500 - this.value.length;
        const formText = this.nextElementSibling;
        formText.textContent = `${remaining} characters remaining`;
        if (remaining < 50) {
            formText.classList.add('text-warning');
        } else {
            formText.classList.remove('text-warning');
        }
    });
});

async function handleCreateMessage(e) {
    e.preventDefault();
    
    const btn = document.getElementById('createMessageBtn');
    const originalText = btn.innerHTML;
    
    try {
        // Show loading state
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
        btn.disabled = true;
        
        const formData = {
            action: 'create_message',
            title: document.getElementById('messageTitle').value,
            content: document.getElementById('messageContent').value,
            type: document.getElementById('messageType').value
        };
        
        const response = await fetch('api/global_messages.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Success', 'Message created and broadcasted successfully!', 'success');
            document.getElementById('globalMessageForm').reset();
            loadMessages();
        } else {
            showToast('Error', 'Failed to create message: ' + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error creating message:', error);
        showToast('Error', 'Network error occurred. Please try again.', 'danger');
    } finally {
        // Restore button state
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function loadMessages() {
    try {
        const response = await fetch('api/global_messages.php?action=get_all_messages');
        const data = await response.json();
        
        if (data.success) {
            displayMessages(data.messages);
            document.getElementById('messageCount').textContent = data.messages.length;
        } else {
            showToast('Error', 'Failed to load messages: ' + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        showToast('Error', 'Failed to load messages', 'danger');
    }
}

function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="ti ti-message-off" style="font-size: 3rem; opacity: 0.3;"></i>
                <div class="mt-2">No active messages</div>
                <small>Create your first message to broadcast to all admin dashboards</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(message => `
        <div class="card mb-3 message-card message-type-${message.type}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="card-title mb-0">${escapeHtml(message.title)}</h6>
                    <div class="d-flex gap-2">
                        <span class="badge bg-primary">${message.type.toUpperCase()}</span>
                        ${message.is_active ? 
                            '<span class="badge bg-success">ACTIVE</span>' : 
                            '<span class="badge bg-secondary">INACTIVE</span>'
                        }
                    </div>
                </div>
                <p class="card-text mb-3">${escapeHtml(message.content)}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        <i class="ti ti-clock me-1"></i>
                        Created: ${formatDate(message.created_at)}
                    </small>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="toggleMessage(${message.id}, ${message.is_active})" title="${message.is_active ? 'Deactivate' : 'Activate'}">
                            <i class="ti ti-${message.is_active ? 'eye-off' : 'eye'}"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteMessage(${message.id})" title="Delete">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    try {
        const response = await fetch('api/global_messages.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_message',
                id: id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Success', 'Message deleted successfully', 'success');
            loadMessages();
        } else {
            showToast('Error', data.error || 'Failed to delete message', 'danger');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        showToast('Error', 'Network error occurred', 'danger');
    }
}

async function toggleMessage(id, currentStatus) {
    try {
        const response = await fetch('api/global_messages.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'toggle_message',
                id: id,
                is_active: currentStatus ? 0 : 1
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const action = currentStatus ? 'deactivated' : 'activated';
            showToast('Success', `Message ${action} successfully`, 'success');
            loadMessages();
        } else {
            showToast('Error', data.error || 'Failed to update message', 'danger');
        }
    } catch (error) {
        console.error('Error toggling message:', error);
        showToast('Error', 'Network error occurred', 'danger');
    }
}

async function clearAllMessages() {
    if (!confirm('Are you sure you want to clear ALL messages? This will delete all active messages permanently.')) {
        return;
    }
    
    try {
        const response = await fetch('api/global_messages.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'clear_all_messages'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Success', 'All messages cleared successfully', 'success');
            loadMessages();
        } else {
            showToast('Error', data.error || 'Failed to clear messages', 'danger');
        }
    } catch (error) {
        console.error('Error clearing messages:', error);
        showToast('Error', 'Network error occurred', 'danger');
    }
}

function refreshMessages() {
    loadMessages();
    showToast('Info', 'Messages refreshed', 'info');
}

function showToast(title, message, type) {
    const toast = document.getElementById('messageToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Update toast styling based on type
    const toastEl = new bootstrap.Toast(toast);
    toastEl.show();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}
</script>

<?php require_once 'includes/footer.php'; ?>