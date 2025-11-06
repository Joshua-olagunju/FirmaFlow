<?php
// Staff Management Page
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if superadmin is logged in
if (!isset($_SESSION['superadmin_logged_in']) || $_SESSION['superadmin_logged_in'] !== true) {
    header('Location: ../login.php');
    exit;
}

$pageTitle = 'Staff Management';
$currentPage = 'staff';
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
?>

        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 mb-1">Staff Management</h1>
                <p class="text-muted mb-0">Manage customer support staff members</p>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-primary btn-sm" onclick="refreshStaffList()">
                    <i class="ti ti-refresh me-1"></i>Refresh
                </button>
                <button class="btn btn-success btn-sm" onclick="setupStaffTables()">
                    <i class="ti ti-database me-1"></i>Setup Tables
                </button>
                <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#staffModal" onclick="openCreateStaffModal()">
                    <i class="ti ti-plus me-1"></i>Add Staff Member
                </button>
            </div>
        </div>

        <!-- Staff Statistics -->
        <div class="row g-3 mb-4">
            <div class="col-6 col-lg-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value" id="totalStaffCount">0</div>
                                <div class="stat-label">Total Staff</div>
                            </div>
                            <div class="text-primary opacity-50">
                                <i class="ti ti-users-group" style="font-size: 2rem;"></i>
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
                                <div class="stat-value" id="activeStaffCount">0</div>
                                <div class="stat-label">Active Staff</div>
                            </div>
                            <div class="text-success opacity-50">
                                <i class="ti ti-user-check" style="font-size: 2rem;"></i>
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
                                <div class="stat-value" id="onlineStaffCount">0</div>
                                <div class="stat-label">Online Now</div>
                            </div>
                            <div class="text-info opacity-50">
                                <i class="ti ti-user-online" style="font-size: 2rem;"></i>
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
                                <div class="stat-value" id="inactiveStaffCount">0</div>
                                <div class="stat-label">Inactive Staff</div>
                            </div>
                            <div class="text-warning opacity-50">
                                <i class="ti ti-user-off" style="font-size: 2rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Staff Table -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">Staff Members</h5>
                <div class="d-flex gap-2">
                    <input type="search" id="staffSearch" class="form-control form-control-sm" placeholder="Search staff..." style="width: 200px;">
                    <select id="statusFilter" class="form-select form-select-sm" style="width: 120px;" onchange="filterStaff()">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0" id="staffTable">
                        <thead class="table-light">
                            <tr>
                                <th>Staff Member</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Permissions</th>
                                <th>Last Login</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="staffTableBody">
                            <tr>
                                <td colspan="8" class="text-center py-4">
                                    <div class="spinner-border spinner-border-sm" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="mt-2 mb-0 text-muted">Loading staff members...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>
</div>

<!-- Staff Create/Edit Modal -->
<div class="modal fade" id="staffModal" tabindex="-1" aria-labelledby="staffModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="staffModalLabel">
                    <i class="ti ti-user-plus me-2"></i><span id="modalTitle">Add Staff Member</span>
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="staffForm">
                    <input type="hidden" id="staffId" name="staffId">
                    
                    <div class="mb-3">
                        <label for="fullName" class="form-label">Full Name *</label>
                        <input type="text" class="form-control" id="fullName" name="fullName" required maxlength="100">
                    </div>
                    
                    <div class="mb-3">
                        <label for="username" class="form-label">Username *</label>
                        <input type="text" class="form-control" id="username" name="username" required maxlength="50">
                        <div class="form-text">Used for staff login. Must be unique.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="email" class="form-label">Email Address *</label>
                        <input type="email" class="form-control" id="email" name="email" required maxlength="100">
                    </div>
                    
                    <div class="mb-3">
                        <label for="password" class="form-label">Password *</label>
                        <input type="password" class="form-control" id="password" name="password" minlength="6">
                        <div class="form-text" id="passwordHelp">Minimum 6 characters. Leave empty when editing to keep current password.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Permissions</label>
                        <div class="border rounded p-3 bg-light">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="permComplains" value="complaints" checked disabled>
                                <label class="form-check-label" for="permComplains">
                                    <i class="ti ti-message-exclamation me-1"></i>Complaints Management
                                </label>
                            </div>
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="checkbox" id="permChat" value="chat" checked disabled>
                                <label class="form-check-label" for="permChat">
                                    <i class="ti ti-message-circle me-1"></i>Live Chat Support
                                </label>
                            </div>
                            <small class="text-muted">Staff members have access to Complaints and Live Chat only.</small>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="saveStaff()">
                    <span id="saveButtonText">Create Staff Member</span>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Staff Details Modal -->
<div class="modal fade" id="staffDetailsModal" tabindex="-1" aria-labelledby="staffDetailsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="staffDetailsModalLabel">
                    <i class="ti ti-user me-2"></i>Staff Details
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="staffDetailsContent">
                    <div class="text-center py-4">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script>
// Global variables
let staffData = [];
let currentStaffId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadStaffList();
    setupSearchFilter();
});

// Setup search functionality
function setupSearchFilter() {
    const searchInput = document.getElementById('staffSearch');
    searchInput.addEventListener('input', function() {
        filterStaff();
    });
}

// Setup staff tables
async function setupStaffTables() {
    if (!confirm('This will create the staff management tables in the database. Continue?')) {
        return;
    }
    
    try {
        const response = await fetch('../api/staff_management.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'setup_tables'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Staff tables created successfully!', 'success');
            loadStaffList();
        } else {
            showAlert('Failed to setup tables: ' + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error setting up tables:', error);
        showAlert('Error setting up tables: ' + error.message, 'danger');
    }
}

// Load staff list
async function loadStaffList() {
    try {
        const response = await fetch('../api/staff_management.php?action=get_staff');
        const data = await response.json();
        
        if (data.success) {
            staffData = data.staff;
            populateStaffTable(staffData);
            updateStaffStats(staffData);
        } else {
            showAlert('Failed to load staff: ' + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error loading staff:', error);
        showAlert('Error loading staff: ' + error.message, 'danger');
        showErrorInTable();
    }
}

// Populate staff table
function populateStaffTable(staff) {
    const tbody = document.getElementById('staffTableBody');
    
    if (!staff || staff.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted">
                    <i class="ti ti-users mb-2" style="font-size: 2rem;"></i>
                    <div>No staff members found</div>
                    <small>Click "Add Staff Member" to create your first staff member</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = staff.map(member => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="bg-primary text-white rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                        <i class="ti ti-user"></i>
                    </div>
                    <div>
                        <div class="fw-medium">${escapeHtml(member.full_name)}</div>
                        <div class="small text-muted">${escapeHtml(member.email)}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="font-monospace">${escapeHtml(member.username)}</span>
            </td>
            <td>
                <span class="badge bg-secondary">${escapeHtml(member.role.charAt(0).toUpperCase() + member.role.slice(1))}</span>
            </td>
            <td>
                <span class="badge ${member.status === 'active' ? 'bg-success' : 'bg-warning'}">${member.status.charAt(0).toUpperCase() + member.status.slice(1)}</span>
            </td>
            <td>
                <div class="d-flex gap-1">
                    ${member.permissions.map(perm => `
                        <span class="badge bg-light text-dark border">
                            <i class="ti ti-${perm === 'complaints' ? 'message-exclamation' : 'message-circle'} me-1"></i>${perm}
                        </span>
                    `).join('')}
                </div>
            </td>
            <td>
                <small>${member.last_login ? formatDate(member.last_login) : 'Never'}</small>
            </td>
            <td>
                <small>${formatDate(member.created_at)}</small>
            </td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="ti ti-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" onclick="viewStaffDetails(${member.id})">
                            <i class="ti ti-eye me-2"></i>View Details
                        </a></li>
                        <li><a class="dropdown-item" onclick="editStaff(${member.id})">
                            <i class="ti ti-edit me-2"></i>Edit
                        </a></li>
                        <li><a class="dropdown-item" onclick="toggleStaffStatus(${member.id}, '${member.status}')">
                            <i class="ti ti-${member.status === 'active' ? 'user-off' : 'user-check'} me-2"></i>${member.status === 'active' ? 'Deactivate' : 'Activate'}
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" onclick="deleteStaff(${member.id}, '${escapeHtml(member.full_name)}')">
                            <i class="ti ti-trash me-2"></i>Delete
                        </a></li>
                    </ul>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update staff statistics
function updateStaffStats(staff) {
    const totalCount = staff.length;
    const activeCount = staff.filter(s => s.status === 'active').length;
    const inactiveCount = staff.filter(s => s.status === 'inactive').length;
    const onlineCount = 0; // Placeholder for online detection
    
    document.getElementById('totalStaffCount').textContent = totalCount;
    document.getElementById('activeStaffCount').textContent = activeCount;
    document.getElementById('onlineStaffCount').textContent = onlineCount;
    document.getElementById('inactiveStaffCount').textContent = inactiveCount;
}

// Filter staff
function filterStaff() {
    const searchTerm = document.getElementById('staffSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredStaff = staffData;
    
    // Apply search filter
    if (searchTerm) {
        filteredStaff = filteredStaff.filter(member =>
            member.full_name.toLowerCase().includes(searchTerm) ||
            member.username.toLowerCase().includes(searchTerm) ||
            member.email.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply status filter
    if (statusFilter) {
        filteredStaff = filteredStaff.filter(member => member.status === statusFilter);
    }
    
    populateStaffTable(filteredStaff);
}

// Open create staff modal
function openCreateStaffModal() {
    currentStaffId = null;
    document.getElementById('modalTitle').textContent = 'Add Staff Member';
    document.getElementById('saveButtonText').textContent = 'Create Staff Member';
    document.getElementById('staffForm').reset();
    document.getElementById('passwordHelp').textContent = 'Minimum 6 characters.';
    document.getElementById('password').required = true;
}

// Edit staff
async function editStaff(id) {
    try {
        const response = await fetch(`../api/staff_management.php?action=get_staff_by_id&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            currentStaffId = id;
            const staff = data.staff;
            
            document.getElementById('modalTitle').textContent = 'Edit Staff Member';
            document.getElementById('saveButtonText').textContent = 'Update Staff Member';
            document.getElementById('staffId').value = staff.id;
            document.getElementById('fullName').value = staff.full_name;
            document.getElementById('username').value = staff.username;
            document.getElementById('email').value = staff.email;
            document.getElementById('password').value = '';
            document.getElementById('password').required = false;
            document.getElementById('passwordHelp').textContent = 'Minimum 6 characters. Leave empty to keep current password.';
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('staffModal'));
            modal.show();
        } else {
            showAlert('Failed to load staff details: ' + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error loading staff details:', error);
        showAlert('Error loading staff details: ' + error.message, 'danger');
    }
}

// Save staff (create or update)
async function saveStaff() {
    const form = document.getElementById('staffForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = {
        full_name: document.getElementById('fullName').value,
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };
    
    // Determine if creating or updating
    const isUpdate = currentStaffId !== null;
    const url = '../api/staff_management.php';
    const method = isUpdate ? 'PUT' : 'POST';
    
    if (isUpdate) {
        formData.id = currentStaffId;
        formData.action = 'update_staff';
        // Don't send password if empty
        if (!formData.password) {
            delete formData.password;
        }
    } else {
        formData.action = 'create_staff';
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(`Staff member ${isUpdate ? 'updated' : 'created'} successfully!`, 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('staffModal'));
            modal.hide();
            
            // Reload staff list
            loadStaffList();
        } else {
            showAlert(`Failed to ${isUpdate ? 'update' : 'create'} staff: ` + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error saving staff:', error);
        showAlert('Error saving staff: ' + error.message, 'danger');
    }
}

// Toggle staff status
async function toggleStaffStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this staff member?`)) {
        return;
    }
    
    try {
        const response = await fetch('../api/staff_management.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'toggle_status',
                id: id,
                status: newStatus
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(`Staff member ${action}d successfully!`, 'success');
            loadStaffList();
        } else {
            showAlert(`Failed to ${action} staff: ` + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error(`Error ${action}ing staff:`, error);
        showAlert(`Error ${action}ing staff: ` + error.message, 'danger');
    }
}

// Delete staff
async function deleteStaff(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch('../api/staff_management.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_staff',
                id: id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Staff member deleted successfully!', 'success');
            loadStaffList();
        } else {
            showAlert('Failed to delete staff: ' + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
        showAlert('Error deleting staff: ' + error.message, 'danger');
    }
}

// View staff details
async function viewStaffDetails(id) {
    try {
        const response = await fetch(`../api/staff_management.php?action=get_staff_by_id&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            const staff = data.staff;
            
            document.getElementById('staffDetailsContent').innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="fw-bold mb-3">Basic Information</h6>
                        <table class="table table-borderless table-sm">
                            <tr><td class="fw-medium">Full Name:</td><td>${escapeHtml(staff.full_name)}</td></tr>
                            <tr><td class="fw-medium">Username:</td><td><code>${escapeHtml(staff.username)}</code></td></tr>
                            <tr><td class="fw-medium">Email:</td><td>${escapeHtml(staff.email)}</td></tr>
                            <tr><td class="fw-medium">Role:</td><td><span class="badge bg-secondary">${staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}</span></td></tr>
                            <tr><td class="fw-medium">Status:</td><td><span class="badge ${staff.status === 'active' ? 'bg-success' : 'bg-warning'}">${staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}</span></td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold mb-3">Access & Activity</h6>
                        <table class="table table-borderless table-sm">
                            <tr><td class="fw-medium">Permissions:</td><td>
                                ${staff.permissions.map(perm => `
                                    <span class="badge bg-light text-dark border me-1">
                                        <i class="ti ti-${perm === 'complaints' ? 'message-exclamation' : 'message-circle'} me-1"></i>${perm}
                                    </span>
                                `).join('')}
                            </td></tr>
                            <tr><td class="fw-medium">Created:</td><td>${formatDate(staff.created_at)}</td></tr>
                            <tr><td class="fw-medium">Last Updated:</td><td>${formatDate(staff.updated_at)}</td></tr>
                            <tr><td class="fw-medium">Last Login:</td><td>${staff.last_login ? formatDate(staff.last_login) : 'Never'}</td></tr>
                        </table>
                    </div>
                </div>
            `;
            
            const modal = new bootstrap.Modal(document.getElementById('staffDetailsModal'));
            modal.show();
        } else {
            showAlert('Failed to load staff details: ' + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Error loading staff details:', error);
        showAlert('Error loading staff details: ' + error.message, 'danger');
    }
}

// Refresh staff list
function refreshStaffList() {
    loadStaffList();
}

// Show error in table
function showErrorInTable() {
    const tbody = document.getElementById('staffTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4 text-danger">
                <i class="ti ti-alert-circle mb-2" style="font-size: 2rem;"></i>
                <div>Error loading staff members</div>
                <small>Please refresh the page or contact support</small>
            </td>
        </tr>
    `;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function showAlert(message, type) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show position-fixed" style="top: 80px; right: 20px; z-index: 1050; min-width: 300px;" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            if (alert.textContent.includes(message)) {
                alert.remove();
            }
        });
    }, 5000);
}
</script>

<?php require_once '../includes/footer.php'; ?>