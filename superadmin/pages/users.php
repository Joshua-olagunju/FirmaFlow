<?php
// Start session first before any output
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$pageTitle = 'All Users Management';
$currentPage = 'users';
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
?>

<style>
.user-card {
    transition: all 0.3s ease;
}

.user-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.status-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
}

.role-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
}

.action-buttons .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
}

.search-filters {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
}

.stats-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.stats-item {
    text-align: center;
}

.stats-number {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.stats-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.table-responsive {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.table th {
    background: #f8f9fa;
    border: none;
    font-weight: 600;
    color: #495057;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.table td {
    border: none;
    border-bottom: 1px solid #f1f3f4;
    vertical-align: middle;
}

.user-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    margin-right: 0.75rem;
}

.company-link {
    color: #667eea;
    text-decoration: none;
}

.company-link:hover {
    color: #5a6fd8;
    text-decoration: underline;
}
</style>

<!-- Page Header -->
<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h1 class="h3 mb-1">All Users Management</h1>
        <p class="text-muted mb-0">Manage all users across all companies in the system</p>
    </div>
    <div class="d-flex gap-2">
        <button class="btn btn-success btn-sm" onclick="openCreateUserModal()">
            <i class="ti ti-plus me-1"></i>Create User
        </button>
        <button class="btn btn-outline-primary btn-sm" onclick="exportUsers()">
            <i class="ti ti-download me-1"></i>Export
        </button>
        <button class="btn btn-primary btn-sm" onclick="refreshData()">
            <i class="ti ti-refresh me-1"></i>Refresh
        </button>
    </div>
</div>

<!-- Stats Cards -->
<div class="stats-card">
    <div class="row">
        <div class="col-md-3">
            <div class="stats-item">
                <div class="stats-number" id="totalUsers">0</div>
                <div class="stats-label">Total Users</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-item">
                <div class="stats-number" id="activeUsers">0</div>
                <div class="stats-label">Active Users</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-item">
                <div class="stats-number" id="adminUsers">0</div>
                <div class="stats-label">Admins</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-item">
                <div class="stats-number" id="companiesWithUsers">0</div>
                <div class="stats-label">Companies</div>
            </div>
        </div>
    </div>
</div>

<!-- Search and Filters -->
<div class="search-filters">
    <div class="row g-3">
        <div class="col-md-4">
            <label class="form-label small fw-bold">Search Users</label>
            <input type="text" class="form-control" id="searchInput" placeholder="Search by name, email, or company...">
        </div>
        <div class="col-md-2">
            <label class="form-label small fw-bold">Role</label>
            <select class="form-select" id="roleFilter">
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">Basic User</option>
            </select>
        </div>
        <div class="col-md-2">
            <label class="form-label small fw-bold">Status</label>
            <select class="form-select" id="statusFilter">
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
            </select>
        </div>
        <div class="col-md-2">
            <label class="form-label small fw-bold">Company</label>
            <select class="form-select" id="companyFilter">
                <option value="">All Companies</option>
                <!-- Companies will be loaded dynamically -->
            </select>
        </div>
        <div class="col-md-2">
            <label class="form-label small fw-bold">Actions</label>
            <button class="btn btn-outline-secondary w-100" onclick="clearFilters()">
                <i class="ti ti-x me-1"></i>Clear
            </button>
        </div>
    </div>
</div>

<!-- Users Table -->
<div class="card">
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Company</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Created</th>
                        <th class="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody">
                    <tr>
                        <td colspan="7" class="text-center py-5">
                            <div class="spinner-border spinner-border-sm" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2 mb-0 text-muted">Loading users...</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Pagination -->
<div class="d-flex justify-content-between align-items-center mt-3">
    <div class="text-muted small">
        Showing <span id="showingFrom">0</span> to <span id="showingTo">0</span> of <span id="totalCount">0</span> users
    </div>
    <nav>
        <ul class="pagination pagination-sm mb-0" id="pagination">
            <!-- Pagination will be loaded dynamically -->
        </ul>
    </nav>
</div>

<!-- User Details Modal -->
<div class="modal fade" id="userDetailsModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">User Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="userDetailsContent">
                <!-- Content will be loaded dynamically -->
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<!-- Password Change Modal -->
<div class="modal fade" id="passwordModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Change User Password</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="passwordForm">
                    <input type="hidden" id="passwordUserId" name="user_id">
                    <div class="mb-3">
                        <label class="form-label fw-bold">User</label>
                        <input type="text" class="form-control" id="passwordUserName" readonly>
                    </div>
                    <div class="mb-3">
                        <label for="newPassword" class="form-label fw-bold">New Password</label>
                        <input type="password" class="form-control" id="newPassword" name="new_password" required minlength="6">
                        <div class="form-text">Password must be at least 6 characters long</div>
                    </div>
                    <div class="mb-3">
                        <label for="confirmPassword" class="form-label fw-bold">Confirm Password</label>
                        <input type="password" class="form-control" id="confirmPassword" name="confirm_password" required minlength="6">
                        <div id="passwordError" class="text-danger small" style="display: none;"></div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="notifyUser" name="notify_user" checked>
                            <label class="form-check-label" for="notifyUser">
                                Notify user via email about password change
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="changePassword()" id="changePasswordBtn">
                    <i class="ti ti-key me-1"></i>Change Password
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Create User Modal -->
<div class="modal fade" id="createUserModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="ti ti-user-plus me-2"></i>Create New User
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="createUserForm">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="createFirstName" class="form-label">First Name *</label>
                                <input type="text" class="form-control" id="createFirstName" name="first_name" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="createLastName" class="form-label">Last Name *</label>
                                <input type="text" class="form-control" id="createLastName" name="last_name" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="createEmail" class="form-label">Email Address *</label>
                                <input type="email" class="form-control" id="createEmail" name="email" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="createPhone" class="form-label">Phone Number</label>
                                <input type="tel" class="form-control" id="createPhone" name="phone">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="createCompany" class="form-label">Company *</label>
                                <select class="form-select" id="createCompany" name="company_id" required>
                                    <option value="">Select Company</option>
                                    <!-- Options will be loaded dynamically -->
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="createRole" class="form-label">Role *</label>
                                <select class="form-select" id="createRole" name="role" required>
                                    <option value="">Select Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="user">User</option>
                                    <option value="support">Support</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="createPassword" class="form-label">Password *</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="createPassword" name="password" required minlength="6">
                                    <button class="btn btn-outline-secondary" type="button" onclick="toggleCreatePasswordVisibility()">
                                        <i class="ti ti-eye" id="createPasswordIcon"></i>
                                    </button>
                                </div>
                                <div class="form-text">Minimum 6 characters</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="createConfirmPassword" class="form-label">Confirm Password *</label>
                                <input type="password" class="form-control" id="createConfirmPassword" name="confirm_password" required minlength="6">
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="createSendWelcome" name="send_welcome" checked>
                            <label class="form-check-label" for="createSendWelcome">
                                Send welcome email with login credentials
                            </label>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="createActive" name="is_active" checked>
                            <label class="form-check-label" for="createActive">
                                Activate account immediately
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success" onclick="createUser()" id="createUserBtn">
                    <i class="ti ti-user-plus me-1"></i>Create User
                </button>
            </div>
        </div>
    </div>
</div>

<script>
let currentPage = 1;
let currentFilters = {};

document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    loadCompanies();
    setupEventListeners();
});

function setupEventListeners() {
    // Search input with debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            loadUsers();
        }, 500);
    });
    
    // Filter changes
    document.getElementById('roleFilter').addEventListener('change', () => {
        currentPage = 1;
        loadUsers();
    });
    
    document.getElementById('statusFilter').addEventListener('change', () => {
        currentPage = 1;
        loadUsers();
    });
    
    document.getElementById('companyFilter').addEventListener('change', () => {
        currentPage = 1;
        loadUsers();
    });
}

async function loadUsers() {
    try {
        const search = document.getElementById('searchInput').value;
        const role = document.getElementById('roleFilter').value;
        const status = document.getElementById('statusFilter').value;
        const company = document.getElementById('companyFilter').value;
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10,
            search: search,
            role: role,
            status: status,
            company_id: company
        });
        
        const response = await fetch(`../api/users_management.php?${params}`);
        const data = await response.json();
        
        if (data.success) {
            updateStats(data.stats);
            populateUsersTable(data.users);
            updatePagination(data.pagination);
        } else {
            showError('Failed to load users: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Error loading users');
    }
}

async function loadCompanies() {
    try {
        const response = await fetch('../api/users_management.php?action=get_companies');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('companyFilter');
            select.innerHTML = '<option value="">All Companies</option>';
            
            data.companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

function updateStats(stats) {
    document.getElementById('totalUsers').textContent = stats.total_users || 0;
    document.getElementById('activeUsers').textContent = stats.active_users || 0;
    document.getElementById('adminUsers').textContent = stats.admin_users || 0;
    document.getElementById('companiesWithUsers').textContent = stats.companies_with_users || 0;
}

function populateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">No users found</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="user-avatar">
                        ${(user.first_name?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                        <div class="fw-medium">${user.first_name} ${user.last_name}</div>
                        <div class="text-muted small">${user.email}</div>
                        ${user.phone ? `<div class="text-muted small">${user.phone}</div>` : ''}
                    </div>
                </div>
            </td>
            <td>
                <a href="companies.php?id=${user.company_id}" class="company-link">
                    ${user.company_name || 'N/A'}
                </a>
            </td>
            <td>
                <span class="badge role-badge ${getRoleBadgeClass(user.role)}">${user.role}</span>
            </td>
            <td>
                <span class="badge status-badge ${user.is_active ? 'bg-success' : 'bg-danger'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td class="text-muted small">
                ${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
            </td>
            <td class="text-muted small">
                ${new Date(user.created_at).toLocaleDateString()}
            </td>
            <td>
                <div class="action-buttons d-flex gap-1 justify-content-center">
                    <button class="btn btn-outline-primary btn-sm" onclick="viewUser(${user.id})" title="View Details">
                        <i class="ti ti-eye me-1"></i>View
                    </button>
                    <button class="btn btn-outline-${user.is_active ? 'warning' : 'success'} btn-sm" 
                            onclick="toggleUserStatus(${user.id}, ${user.is_active})" 
                            title="${user.is_active ? 'Deactivate' : 'Activate'} User">
                        <i class="ti ti-${user.is_active ? 'ban' : 'check'} me-1"></i>${user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="openPasswordModal(${user.id}, '${user.first_name} ${user.last_name}')" title="Change Password">
                        <i class="ti ti-key me-1"></i>Password
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getRoleBadgeClass(role) {
    switch (role) {
        case 'admin': return 'bg-danger';
        case 'manager': return 'bg-warning';
        case 'user': return 'bg-secondary';
        default: return 'bg-secondary';
    }
}

function updatePagination(pagination) {
    const paginationEl = document.getElementById('pagination');
    const { current_page, total_pages, total_count, per_page } = pagination;
    
    // Update showing info
    const from = ((current_page - 1) * per_page) + 1;
    const to = Math.min(current_page * per_page, total_count);
    
    document.getElementById('showingFrom').textContent = total_count > 0 ? from : 0;
    document.getElementById('showingTo').textContent = to;
    document.getElementById('totalCount').textContent = total_count;
    
    // Build pagination
    let paginationHTML = '';
    
    // Previous button
    if (current_page > 1) {
        paginationHTML += `<li class="page-item">
            <a class="page-link" href="#" onclick="changePage(${current_page - 1})">Previous</a>
        </li>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, current_page - 2);
    const endPage = Math.min(total_pages, current_page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<li class="page-item ${i === current_page ? 'active' : ''}">
            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>`;
    }
    
    // Next button
    if (current_page < total_pages) {
        paginationHTML += `<li class="page-item">
            <a class="page-link" href="#" onclick="changePage(${current_page + 1})">Next</a>
        </li>`;
    }
    
    paginationEl.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    loadUsers();
}

async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        const response = await fetch('../api/users_management.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'toggle_status',
                user_id: userId,
                is_active: !currentStatus
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`User ${action}d successfully`);
            loadUsers();
        } else {
            showError(data.error || `Failed to ${action} user`);
        }
    } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        showError(`Error ${action}ing user`);
    }
}

async function resetPassword(userId) {
    const newPassword = prompt('Enter new password for this user (minimum 6 characters):');
    
    if (!newPassword || newPassword.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    if (!confirm('Are you sure you want to reset this user\'s password?')) {
        return;
    }
    
    try {
        const response = await fetch('../api/users_management.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'reset_password',
                user_id: userId,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Password reset successfully');
        } else {
            showError(data.error || 'Failed to reset password');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showError('Error resetting password');
    }
}

async function viewUser(userId) {
    try {
        const response = await fetch(`../api/users_management.php?action=get_user&id=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            showUserDetails(data.user);
        } else {
            showError(data.error || 'Failed to load user details');
        }
    } catch (error) {
        console.error('Error loading user details:', error);
        showError('Error loading user details');
    }
}

function showUserDetails(user) {
    const content = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-muted">Personal Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Name:</strong></td><td>${user.first_name} ${user.last_name}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${user.email}</td></tr>
                    <tr><td><strong>Phone:</strong></td><td>${user.phone || 'N/A'}</td></tr>
                    <tr><td><strong>Role:</strong></td><td><span class="badge ${getRoleBadgeClass(user.role)}">${user.role}</span></td></tr>
                    <tr><td><strong>Status:</strong></td><td><span class="badge ${user.is_active ? 'bg-success' : 'bg-danger'}">${user.is_active ? 'Active' : 'Inactive'}</span></td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Account Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Company:</strong></td><td>${user.company_name || 'N/A'}</td></tr>
                    <tr><td><strong>Created:</strong></td><td>${new Date(user.created_at).toLocaleString()}</td></tr>
                    <tr><td><strong>Last Login:</strong></td><td>${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td></tr>
                    <tr><td><strong>User ID:</strong></td><td>${user.id}</td></tr>
                    <tr><td><strong>Company ID:</strong></td><td>${user.company_id || 'N/A'}</td></tr>
                </table>
            </div>
        </div>
    `;
    
    document.getElementById('userDetailsContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
    modal.show();
}

// Password change functions
function openPasswordModal(userId, userName) {
    document.getElementById('passwordUserId').value = userId;
    document.getElementById('passwordUserName').value = userName;
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('notifyUser').checked = true;
    
    const modal = new bootstrap.Modal(document.getElementById('passwordModal'));
    modal.show();
}

async function changePassword() {
    const userId = document.getElementById('passwordUserId').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const notifyUser = document.getElementById('notifyUser').checked;
    const errorDiv = document.getElementById('passwordError');
    const button = document.getElementById('changePasswordBtn');
    
    // Reset error state
    errorDiv.style.display = 'none';
    
    // Validate passwords
    if (newPassword.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters long';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!confirm('Are you sure you want to change this user\'s password?')) {
        return;
    }
    
    try {
        button.disabled = true;
        button.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i>Changing...';
        
        const response = await fetch('../api/users_management.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'change_password',
                user_id: userId,
                new_password: newPassword,
                notify_user: notifyUser
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Password changed successfully');
            const modal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
            modal.hide();
        } else {
            errorDiv.textContent = data.error || 'Failed to change password';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error changing password:', error);
        errorDiv.textContent = 'Error changing password';
        errorDiv.style.display = 'block';
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="ti ti-key me-1"></i>Change Password';
    }
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('roleFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('companyFilter').value = '';
    currentPage = 1;
    loadUsers();
}

function refreshData() {
    loadUsers();
    loadCompanies();
}

function exportUsers() {
    const search = document.getElementById('searchInput').value;
    const role = document.getElementById('roleFilter').value;
    const status = document.getElementById('statusFilter').value;
    const company = document.getElementById('companyFilter').value;
    
    const params = new URLSearchParams({
        action: 'export',
        search: search,
        role: role,
        status: status,
        company_id: company
    });
    
    window.open(`../api/users_management.php?${params}`, '_blank');
}

function showError(message) {
    // You can implement a toast notification here
    alert('Error: ' + message);
}

function showSuccess(message) {
    // You can implement a toast notification here
    alert('Success: ' + message);
}

// Create User Functions
function openCreateUserModal() {
    // Reset form
    document.getElementById('createUserForm').reset();
    document.getElementById('createActive').checked = true;
    document.getElementById('createSendWelcome').checked = true;
    
    // Load companies for dropdown
    loadCompaniesForCreate();
    
    const modal = new bootstrap.Modal(document.getElementById('createUserModal'));
    modal.show();
}

async function loadCompaniesForCreate() {
    try {
        const response = await fetch('../api/users_management.php?action=get_companies');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('createCompany');
            select.innerHTML = '<option value="">Select Company</option>';
            
            data.companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading companies for create:', error);
    }
}

function toggleCreatePasswordVisibility() {
    const passwordInput = document.getElementById('createPassword');
    const icon = document.getElementById('createPasswordIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'ti ti-eye-off';
    } else {
        passwordInput.type = 'password';
        icon.className = 'ti ti-eye';
    }
}

async function createUser() {
    const form = document.getElementById('createUserForm');
    const formData = new FormData(form);
    const button = document.getElementById('createUserBtn');
    
    // Validate passwords match
    const password = document.getElementById('createPassword').value;
    const confirmPassword = document.getElementById('createConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    // Disable button and show loading
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating...';
    button.disabled = true;
    
    try {
        const userData = {
            action: 'create_user',
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company_id: formData.get('company_id'),
            role: formData.get('role'),
            password: formData.get('password'),
            is_active: formData.get('is_active') ? 1 : 0,
            send_welcome: formData.get('send_welcome') ? 1 : 0
        };
        
        const response = await fetch('../api/users_management.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('User created successfully!');
            bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
            loadUsers(); // Refresh the users list
        } else {
            showError(data.error || 'Failed to create user');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showError('Error creating user');
    } finally {
        // Restore button
        button.innerHTML = originalText;
        button.disabled = false;
    }
}
</script>

<?php require_once '../includes/footer.php'; ?>