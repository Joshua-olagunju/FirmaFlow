<?php
// Start session first before any output
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$pageTitle = 'SuperAdmin Dashboard';
require_once 'includes/header.php';
require_once 'includes/sidebar.php';
require_once 'includes/currency_helper.php';

// Get dashboard statistics
$pdo = getSuperAdminDB();

// Initialize currency helper
CurrencyHelper::init($pdo);

// Get total companies
$stmt = $pdo->query("SELECT COUNT(*) as total FROM companies WHERE 1");
$totalCompanies = $stmt->fetch()['total'] ?? 0;

// Get total users
$stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE 1");
$totalUsers = $stmt->fetch()['total'] ?? 0;

// Get active subscriptions
$stmt = $pdo->query("SELECT COUNT(*) as total FROM companies WHERE subscription_status = 'active'");
$activeSubscriptions = $stmt->fetch()['total'] ?? 0;

// Get total revenue using currency helper
$totalRevenue = CurrencyHelper::getMonthlyRevenue($pdo);

// Get recent companies
$stmt = $pdo->query("SELECT * FROM companies ORDER BY created_at DESC LIMIT 5");
$recentCompanies = $stmt->fetchAll();

// Get recent complaints (if complaints table exists)
$recentComplaints = [];
try {
    $stmt = $pdo->query("SELECT * FROM complaints ORDER BY created_at DESC LIMIT 5");
    $recentComplaints = $stmt->fetchAll();
} catch (Exception $e) {
    // Complaints table might not exist yet
}
?>

        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 mb-1">SuperAdmin Dashboard</h1>
                <p class="text-muted mb-0">Monitor and manage the entire Firmaflow system</p>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-primary btn-sm" onclick="window.location.reload()">
                    <i class="ti ti-refresh me-1"></i>Refresh
                </button>
                <a href="pages/monthly_revenue.php" class="btn btn-success btn-sm">
                    <i class="ti ti-chart-bar me-1"></i>Revenue Analytics
                </a>
                <a href="global_messages.php" class="btn btn-warning btn-sm">
                    <i class="ti ti-broadcast me-1"></i>Global Messages
                </a>
                <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#systemStatusModal">
                    <i class="ti ti-activity me-1"></i>System Status
                </button>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="row g-3 mb-4">
            <div class="col-6 col-lg-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value" data-stat="companies"><?= number_format($totalCompanies) ?></div>
                                <div class="stat-label">Total Companies</div>
                            </div>
                            <div class="text-primary opacity-50">
                                <i class="ti ti-building" style="font-size: 2rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-6 col-lg-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value" data-stat="users"><?= number_format($totalUsers) ?></div>
                                <div class="stat-label">Total Users</div>
                            </div>
                            <div class="text-success opacity-50">
                                <i class="ti ti-users" style="font-size: 2rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-6 col-lg-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value" data-stat="subscriptions"><?= number_format($activeSubscriptions) ?></div>
                                <div class="stat-label">Active Subscriptions</div>
                            </div>
                            <div class="text-warning opacity-50">
                                <i class="ti ti-credit-card" style="font-size: 2rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-6 col-lg-3">
                <div class="card stat-card h-100" style="cursor: pointer;" onclick="window.location.href='pages/monthly_revenue.php'">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value" data-stat="revenue"><?= formatCurrency($totalRevenue) ?></div>
                                <div class="stat-label">Monthly Revenue</div>
                                <small class="text-muted">
                                    <i class="ti ti-external-link me-1"></i>Click for detailed analytics
                                </small>
                            </div>
                            <div class="text-info opacity-50">
                                <i class="ti ti-chart-line" style="font-size: 2rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Row -->
        <div class="row g-3 mb-4">
            <div class="col-12 col-lg-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Revenue Trend</h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-12 col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">User Status</h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="usersChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tables Row -->
        <div class="row g-3">
            <div class="col-12 col-lg-7">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">Recent Companies</h5>
                        <a href="pages/companies.php" class="btn btn-sm btn-outline-primary">
                            View All <i class="ti ti-arrow-right ms-1"></i>
                        </a>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th class="d-none d-md-table-cell">Subscription</th>
                                        <th>Status</th>
                                        <th class="d-none d-sm-table-cell">Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($recentCompanies as $company): ?>
                                    <tr>
                                        <td>
                                            <div>
                                                <div class="fw-medium"><?= htmlspecialchars($company['company_name'] ?? 'N/A') ?></div>
                                                <div class="small text-muted"><?= htmlspecialchars($company['email'] ?? 'N/A') ?></div>
                                            </div>
                                        </td>
                                        <td class="d-none d-md-table-cell">
                                            <span class="badge bg-<?= ($company['subscription_plan'] ?? 'free') === 'free' ? 'secondary' : 'primary' ?>">
                                                <?= ucfirst($company['subscription_plan'] ?? 'free') ?>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge status-<?= ($company['subscription_status'] ?? 'active') === 'active' ? 'active' : 'inactive' ?>">
                                                <?= ucfirst($company['subscription_status'] ?? 'active') ?>
                                            </span>
                                        </td>
                                        <td class="d-none d-sm-table-cell">
                                            <small><?= date('M j, Y', strtotime($company['created_at'] ?? 'now')) ?></small>
                                        </td>
                                        <td>
                                            <div class="dropdown">
                                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                                    <i class="ti ti-dots-vertical"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item" href="pages/companies.php?view=<?= $company['id'] ?>">
                                                        <i class="ti ti-eye me-2"></i>View
                                                    </a></li>
                                                    <li><a class="dropdown-item" href="pages/companies.php?edit=<?= $company['id'] ?>">
                                                        <i class="ti ti-edit me-2"></i>Edit
                                                    </a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                    
                                    <?php if (empty($recentCompanies)): ?>
                                    <tr>
                                        <td colspan="5" class="text-center py-4 text-muted">
                                            <i class="ti ti-building mb-2" style="font-size: 2rem;"></i>
                                            <div>No companies found</div>
                                        </td>
                                    </tr>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-12 col-lg-5">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">Recent Activity</h5>
                        <a href="pages/complaints.php" class="btn btn-sm btn-outline-primary">
                            View All <i class="ti ti-arrow-right ms-1"></i>
                        </a>
                    </div>
                    <div class="card-body">
                        <?php if (!empty($recentComplaints)): ?>
                            <?php foreach ($recentComplaints as $complaint): ?>
                            <div class="d-flex align-items-start mb-3">
                                <div class="avatar bg-warning text-white rounded-circle me-3 flex-shrink-0" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                    <i class="ti ti-message-exclamation"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="fw-medium"><?= htmlspecialchars($complaint['subject'] ?? 'Support Request') ?></div>
                                    <div class="small text-muted"><?= htmlspecialchars($complaint['company_name'] ?? 'Unknown Company') ?></div>
                                    <div class="small text-muted"><?= date('M j, g:i A', strtotime($complaint['created_at'] ?? 'now')) ?></div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <div class="text-center py-4 text-muted">
                                <i class="ti ti-message-circle mb-2" style="font-size: 2rem;"></i>
                                <div>No recent activity</div>
                                <small>System monitoring and alerts will appear here</small>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>

<!-- System Status Modal -->
<div class="modal fade" id="systemStatusModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">System Status</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row g-3">
                    <div class="col-6">
                        <div class="d-flex align-items-center">
                            <div class="badge bg-success rounded-circle me-2" style="width: 12px; height: 12px;"></div>
                            <div>
                                <div class="fw-medium">Database</div>
                                <small class="text-muted">Connected</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="d-flex align-items-center">
                            <div class="badge bg-success rounded-circle me-2" style="width: 12px; height: 12px;"></div>
                            <div>
                                <div class="fw-medium">API Server</div>
                                <small class="text-muted">Running</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="d-flex align-items-center">
                            <div class="badge bg-success rounded-circle me-2" style="width: 12px; height: 12px;"></div>
                            <div>
                                <div class="fw-medium">File System</div>
                                <small class="text-muted">Healthy</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="d-flex align-items-center">
                            <div class="badge bg-warning rounded-circle me-2" style="width: 12px; height: 12px;"></div>
                            <div>
                                <div class="fw-medium">Backup</div>
                                <small class="text-muted">Last: 2 hours ago</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <a href="pages/monitoring.php" class="btn btn-primary">View Details</a>
        </div>
    </div>
</div>

<!-- Global Messages Modal -->
<div class="modal fade" id="globalMessagesModal" tabindex="-1" aria-labelledby="globalMessagesModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="globalMessagesModalLabel">
                    <i class="ti ti-broadcast me-2"></i>Global Messages Management
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <!-- Create Message Form -->
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="card-title mb-0">Create New Message</h6>
                            </div>
                            <div class="card-body">
                                <form id="globalMessageForm">
                                    <div class="mb-3">
                                        <label for="messageTitle" class="form-label">Message Title</label>
                                        <input type="text" class="form-control" id="messageTitle" required maxlength="100">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="messageContent" class="form-label">Message Content</label>
                                        <textarea class="form-control" id="messageContent" rows="4" required maxlength="500"></textarea>
                                        <div class="form-text">Maximum 500 characters</div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="messageType" class="form-label">Message Type</label>
                                        <select class="form-select" id="messageType" required>
                                            <option value="info">Info (Blue)</option>
                                            <option value="success">Success (Green)</option>
                                            <option value="warning">Warning (Yellow)</option>
                                            <option value="danger">Important (Red)</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="messagePriority" class="form-label">Priority</label>
                                        <select class="form-select" id="messagePriority" required>
                                            <option value="low">Low</option>
                                            <option value="medium" selected>Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="messageAutoExpire" checked>
                                            <label class="form-check-label" for="messageAutoExpire">
                                                Auto-expire after 24 hours
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="ti ti-send me-1"></i>Broadcast Message
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Active Messages -->
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="card-title mb-0">Active Messages</h6>
                                <button class="btn btn-outline-secondary btn-sm" onclick="refreshMessages()">
                                    <i class="ti ti-refresh"></i>
                                </button>
                            </div>
                            <div class="card-body p-0">
                                <div id="activeMessagesList" style="padding: 1rem;">
                                    <div id="messagesLoading" class="text-center text-muted">Loading messages...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-outline-danger" onclick="clearAllMessages()">
                    <i class="ti ti-trash me-1"></i>Clear All Messages
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Monthly Revenue Modal -->
<div class="modal fade" id="monthlyRevenueModal" tabindex="-1" aria-labelledby="monthlyRevenueModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="monthlyRevenueModalLabel">
                    <i class="ti ti-chart-line me-2"></i>Monthly Revenue Details
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h4 class="mb-1" id="totalRevenueAmount"><?= formatCurrency($totalRevenue) ?></h4>
                                <small>Total Revenue</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h4 class="mb-1" id="totalPayments">0</h4>
                                <small>Total Payments</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h4 class="mb-1" id="avgPaymentAmount">₦0</h4>
                                <small>Average Payment</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-white">
                            <div class="card-body text-center">
                                <h4 class="mb-1" id="successRate">0%</h4>
                                <small>Success Rate</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="monthFilter" class="form-label">Filter by Month</label>
                        <select id="monthFilter" class="form-select" onchange="filterPayments()">
                            <option value="">All Months</option>
                            <option value="2025-01">January 2025</option>
                            <option value="2025-02">February 2025</option>
                            <option value="2025-03">March 2025</option>
                            <option value="2025-04">April 2025</option>
                            <option value="2025-05">May 2025</option>
                            <option value="2025-06">June 2025</option>
                            <option value="2025-07">July 2025</option>
                            <option value="2025-08">August 2025</option>
                            <option value="2025-09">September 2025</option>
                            <option value="2025-10" selected>October 2025</option>
                            <option value="2025-11">November 2025</option>
                            <option value="2025-12">December 2025</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label for="statusFilter" class="form-label">Filter by Status</label>
                        <select id="statusFilter" class="form-select" onchange="filterPayments()">
                            <option value="">All Statuses</option>
                            <option value="successful">Successful</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Date</th>
                                <th>Transaction ID</th>
                                <th>Company</th>
                                <th>Plan</th>
                                <th>Amount</th>
                                <th>Currency</th>
                                <th>Status</th>
                                <th>Payment Method</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="paymentsTableBody">
                            <tr>
                                <td colspan="9" class="text-center py-4">
                                    <div class="spinner-border spinner-border-sm" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="mt-2 mb-0 text-muted">Loading payment data...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="exportPayments()">
                    <i class="ti ti-download me-1"></i>Export Data
                </button>
            </div>
        </div>
    </div>
</div>

<script>
// Global Messages Functions
document.addEventListener('DOMContentLoaded', function() {
    // Setup global messages form
    document.getElementById('globalMessageForm').addEventListener('submit', handleMessageSubmit);
    
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

async function handleMessageSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('messageTitle').value,
        content: document.getElementById('messageContent').value,
        type: document.getElementById('messageType').value,
        priority: document.getElementById('messagePriority').value,
        auto_expire: document.getElementById('messageAutoExpire').checked
    };
    
    try {
        const response = await fetch('api/global_messages.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'create_message',
                ...formData
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Message broadcasted successfully!', 'success');
            document.getElementById('globalMessageForm').reset();
            loadActiveMessages();
        } else {
            showAlert('Failed to broadcast message: ' + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error broadcasting message:', error);
        showAlert('Error broadcasting message', 'danger');
    }
}

async function loadActiveMessages() {
    console.log('loadActiveMessages called');
    try {
        console.log('Fetching messages from API...');
        const response = await fetch('api/global_messages.php?action=get_all_messages');
        console.log('API response received:', response);
        
        const data = await response.json();
        console.log('API data:', data);
        
        if (data.success) {
            console.log('API success, populating table with', data.messages.length, 'messages');
            populateMessagesTable(data.messages);
        } else {
            console.error('API error:', data.error);
            showAlert('Failed to load messages: ' + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        showAlert('Error loading messages: ' + error.message, 'danger');
    }
}

function populateMessagesTable(messages) {
    console.log('populateMessagesTable called with:', messages);
    const list = document.getElementById('activeMessagesList');
    const loading = document.getElementById('messagesLoading');
    
    if (!list) {
        console.error('activeMessagesList element not found!');
        return;
    }
    
    if (loading) loading.style.display = 'none';
    
    if (!messages || messages.length === 0) {
        console.log('No messages to display');
        list.innerHTML = '<div class="text-center text-muted">No active messages found</div>';
        return;
    }
    
    console.log('Rendering', messages.length, 'messages');
    list.innerHTML = messages.map((msg, idx) => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="card-title">${msg.title}</h6>
                        <p class="card-text">${msg.content}</p>
                        <div class="d-flex gap-2">
                            <span class="badge bg-${getTypeBadgeClass(msg.type)}">${msg.type}</span>
                            <span class="badge bg-${getPriorityBadgeClass(msg.priority)}">${msg.priority}</span>
                            <span class="badge ${msg.is_active ? 'bg-success' : 'bg-secondary'}">${msg.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <small class="text-muted">Created: ${formatDate(msg.created_at)}</small>
                    </div>
                    <div class="d-flex gap-1 ms-3">
                        <button class="btn btn-sm ${msg.is_active ? 'btn-outline-warning' : 'btn-outline-success'}" 
                                onclick="toggleMessage(${msg.id}, ${msg.is_active})"
                                title="${msg.is_active ? 'Deactivate' : 'Activate'} message">
                            <i class="ti ti-${msg.is_active ? 'eye-off' : 'eye'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="deleteMessage(${msg.id})"
                                title="Delete message">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getPriorityBadgeClass(priority) {
    switch (priority) {
        case 'urgent': return 'danger';
        case 'high': return 'warning';
        case 'medium': return 'primary';
        case 'low': return 'secondary';
        default: return 'bg-secondary';
    }
}

function getTypeBadgeClass(type) {
    switch (type) {
        case 'info': return 'info';
        case 'success': return 'success';
        case 'warning': return 'warning';
        case 'danger': return 'danger';
        default: return 'secondary';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

async function toggleMessage(messageId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} this message?`)) {
        return;
    }
    
    try {
        const response = await fetch('api/global_messages.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'toggle_message',
                message_id: messageId,
                is_active: !currentStatus
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(`Message ${action}d successfully`, 'success');
            loadActiveMessages();
        } else {
            showAlert(data.error || `Failed to ${action} message`, 'danger');
        }
    } catch (error) {
        console.error(`Error ${action}ing message:`, error);
        showAlert(`Error ${action}ing message`, 'danger');
    }
}

async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
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
                message_id: messageId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Message deleted successfully', 'success');
            loadActiveMessages();
        } else {
            showAlert(data.error || 'Failed to delete message', 'danger');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        showAlert('Error deleting message', 'danger');
    }
}

async function clearAllMessages() {
    if (!confirm('Are you sure you want to clear ALL messages? This will deactivate all active messages.')) {
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
            showAlert('All messages cleared successfully', 'success');
            loadActiveMessages();
        } else {
            showAlert(data.error || 'Failed to clear messages', 'danger');
        }
    } catch (error) {
        console.error('Error clearing messages:', error);
        showAlert('Error clearing messages', 'danger');
    }
}

function refreshMessages() {
    loadActiveMessages();
}

// Load messages when modal is shown
document.getElementById('globalMessagesModal').addEventListener('shown.bs.modal', function() {
    console.log('Global Messages Modal shown event fired');
    loadActiveMessages();
});

// Test function to debug modal
function testModalFunction() {
    console.log('🔥 Test modal function called');
    console.log('🔍 Bootstrap available:', typeof bootstrap !== 'undefined');
    
    const modal = document.getElementById('globalMessagesModal');
    console.log('🔍 Modal element found:', !!modal);
    
    if (modal) {
        console.log('🔍 Modal classes:', modal.className);
        console.log('🔍 Modal style display:', modal.style.display);
    }
    
    // Try manual modal creation
    setTimeout(() => {
        try {
            if (typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(modal, {
                    backdrop: true,
                    keyboard: true,
                    focus: true
                });
                console.log('✅ Bootstrap Modal object created:', bsModal);
                bsModal.show();
                console.log('✅ Modal show() called');
            } else {
                console.error('❌ Bootstrap not available');
                alert('Bootstrap not loaded - modal cannot open');
            }
        } catch (error) {
            console.error('❌ Error creating/showing modal:', error);
            alert('Modal error: ' + error.message);
        }
    }, 100);
}

function showAlert(message, type) {
    // Simple alert for now - could be enhanced with toast notifications
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Insert after modal header
    const modalBody = document.querySelector('#globalMessagesModal .modal-body');
    modalBody.insertAdjacentHTML('afterbegin', alertHtml);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alert = modalBody.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

function openMonthlyRevenueModal() {
    console.log('openMonthlyRevenueModal called');
    
    const modalElement = document.getElementById('monthlyRevenueModal');
    console.log('Modal element:', modalElement);
    
    if (!modalElement) {
        console.error('Modal element not found!');
        alert('Modal element not found. Please refresh the page.');
        return;
    }
    
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap library not loaded!');
        alert('Bootstrap library not loaded. Please refresh the page.');
        return;
    }
    
    try {
        const modal = new bootstrap.Modal(modalElement);
        console.log('Bootstrap modal created:', modal);
        modal.show();
        console.log('Modal show() called');
        loadPaymentData();
    } catch (error) {
        console.error('Error creating/showing modal:', error);
        alert('Error opening modal: ' + error.message);
    }
}

async function loadPaymentData() {
    try {
        const response = await fetch('api/revenue_api.php?action=get_revenue_data');
        const data = await response.json();
        
        if (data.success) {
            updatePaymentStats(data.stats);
            populatePaymentsTable(data.transactions);
        } else {
            showError('Failed to load payment data: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading payment data:', error);
        showError('Error loading payment data');
    }
}

function updatePaymentStats(stats) {
    document.getElementById('totalPayments').textContent = stats.total_transactions || 0;
    document.getElementById('avgPaymentAmount').textContent = '₦' + (stats.average_revenue || 0).toLocaleString('en-NG');
    document.getElementById('successRate').textContent = (stats.success_rate || 0) + '%';
}

function populatePaymentsTable(transactions) {
    const tbody = document.getElementById('paymentsTableBody');
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4 text-muted">No payment data found</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = transactions.map(payment => `
        <tr>
            <td>${new Date(payment.created_at).toLocaleDateString()}</td>
            <td>
                <span class="font-monospace small">${payment.transaction_id || payment.tx_ref || 'N/A'}</span>
            </td>
            <td>${payment.company_name || 'N/A'}</td>
            <td>
                <span class="badge bg-secondary">${payment.plan_type || 'N/A'}</span>
            </td>
            <td class="fw-bold">${formatCurrency(payment.amount)}</td>
            <td>${payment.currency || 'NGN'}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(payment.status)}">${payment.status}</span>
            </td>
            <td>${payment.payment_method || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewPaymentDetails('${payment.id}')">
                    <i class="ti ti-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'completed': return 'bg-success';
        case 'successful': return 'bg-success';
        case 'failed': return 'bg-danger';
        case 'pending': return 'bg-warning';
        default: return 'bg-secondary';
    }
}

function filterPayments() {
    const month = document.getElementById('monthFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    // Reload data with filters
    loadPaymentData(month, status);
}

function exportPayments() {
    const month = document.getElementById('monthFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    let exportUrl = 'api/revenue_api.php?action=export';
    if (month) exportUrl += '&month=' + encodeURIComponent(month);
    if (status) exportUrl += '&status=' + encodeURIComponent(status);
    
    window.open(exportUrl, '_blank');
}

function viewPaymentDetails(paymentId) {
    // Implementation for viewing payment details
    console.log('View payment details for ID:', paymentId);
}

function showError(message) {
    const tbody = document.getElementById('paymentsTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-4 text-danger">
                <i class="ti ti-alert-circle me-1"></i>${message}
            </td>
        </tr>
    `;
}

function formatCurrency(amount) {
    return '₦' + parseFloat(amount).toLocaleString('en-NG');
}
</script>

<?php require_once 'includes/footer.php'; ?>