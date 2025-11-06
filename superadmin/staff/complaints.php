<?php
// Staff Complaints Page - Staff-only access to complaints management
require_once '../includes/staff_auth_check.php';
requireStaffPermission('complaints');

$currentStaff = getCurrentStaff();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complaints Management - Staff Portal</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Tabler Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons@latest/tabler-icons.min.css">
    
    <style>
        body {
            background-color: #f8f9fa;
            font-size: 0.9rem;
        }
        .stat-card {
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-2px);
        }
        .complaint-card {
            transition: all 0.2s;
            border-left: 4px solid #e9ecef;
        }
        .complaint-card.priority-high {
            border-left-color: #dc3545;
        }
        .complaint-card.priority-medium {
            border-left-color: #ffc107;
        }
        .complaint-card.priority-low {
            border-left-color: #28a745;
        }
        .complaint-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .status-badge {
            font-size: 0.75rem;
        }
    </style>
</head>
<body>
    <div class="container-fluid p-3">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h4 class="mb-1">Complaints Management</h4>
                <p class="text-muted mb-0 small">Handle customer complaints and support requests</p>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-primary btn-sm" onclick="refreshComplaints()">
                    <i class="ti ti-refresh me-1"></i>Refresh
                </button>
                <div class="dropdown">
                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="ti ti-filter"></i> Filter
                    </button>
                    <div class="dropdown-menu">
                        <h6 class="dropdown-header">Filter by Status</h6>
                        <a class="dropdown-item" onclick="filterComplaints('all')">All Complaints</a>
                        <a class="dropdown-item" onclick="filterComplaints('new')">New</a>
                        <a class="dropdown-item" onclick="filterComplaints('in_progress')">In Progress</a>
                        <a class="dropdown-item" onclick="filterComplaints('resolved')">Resolved</a>
                        <div class="dropdown-divider"></div>
                        <h6 class="dropdown-header">Filter by Priority</h6>
                        <a class="dropdown-item" onclick="filterComplaints('high')">High Priority</a>
                        <a class="dropdown-item" onclick="filterComplaints('medium')">Medium Priority</a>
                        <a class="dropdown-item" onclick="filterComplaints('low')">Low Priority</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="row g-3 mb-4">
            <div class="col-3">
                <div class="card stat-card h-100 border-0 shadow-sm">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="fw-bold h5 mb-1" id="totalComplaints">0</div>
                                <div class="small text-muted">Total Complaints</div>
                            </div>
                            <div class="text-primary opacity-75">
                                <i class="ti ti-message-exclamation" style="font-size: 1.5rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-3">
                <div class="card stat-card h-100 border-0 shadow-sm">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="fw-bold h5 mb-1" id="newComplaints">0</div>
                                <div class="small text-muted">New</div>
                            </div>
                            <div class="text-warning opacity-75">
                                <i class="ti ti-alert-circle" style="font-size: 1.5rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-3">
                <div class="card stat-card h-100 border-0 shadow-sm">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="fw-bold h5 mb-1" id="inProgressComplaints">0</div>
                                <div class="small text-muted">In Progress</div>
                            </div>
                            <div class="text-info opacity-75">
                                <i class="ti ti-clock" style="font-size: 1.5rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-3">
                <div class="card stat-card h-100 border-0 shadow-sm">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="fw-bold h5 mb-1" id="resolvedComplaints">0</div>
                                <div class="small text-muted">Resolved</div>
                            </div>
                            <div class="text-success opacity-75">
                                <i class="ti ti-check-circle" style="font-size: 1.5rem;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Controls -->
        <div class="row g-3 mb-3">
            <div class="col-md-6">
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="ti ti-search"></i>
                    </span>
                    <input type="text" class="form-control" id="searchInput" placeholder="Search complaints by company, subject, or description...">
                </div>
            </div>
            <div class="col-md-6">
                <div class="d-flex gap-2">
                    <select class="form-select" id="statusFilter">
                        <option value="">All Status</option>
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                    <select class="form-select" id="priorityFilter">
                        <option value="">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Complaints List -->
        <div class="row" id="complaintsContainer">
            <div class="col-12 text-center py-5">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading complaints...</p>
            </div>
        </div>

        <!-- Load More Button -->
        <div class="text-center mt-4" id="loadMoreContainer" style="display: none;">
            <button class="btn btn-outline-primary" onclick="loadMoreComplaints()">
                <i class="ti ti-arrow-down me-2"></i>Load More
            </button>
        </div>
    </div>

    <!-- Complaint Details Modal -->
    <div class="modal fade" id="complaintModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="ti ti-message-exclamation me-2"></i>Complaint Details
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="complaintDetailsContent">
                        <div class="text-center py-4">
                            <div class="spinner-border" role="status"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="updateComplaintStatus()">
                        Update Status
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        let complaintsData = [];
        let currentFilter = { status: '', priority: '', search: '' };
        let currentPage = 1;
        let currentComplaintId = null;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            loadComplaints();
            setupSearchFilter();
            setupFilters();
        });

        // Setup search functionality
        function setupSearchFilter() {
            const searchInput = document.getElementById('searchInput');
            let searchTimeout;
            
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentFilter.search = this.value;
                    filterAndDisplayComplaints();
                }, 300);
            });
        }

        // Setup filter dropdowns
        function setupFilters() {
            document.getElementById('statusFilter').addEventListener('change', function() {
                currentFilter.status = this.value;
                filterAndDisplayComplaints();
            });
            
            document.getElementById('priorityFilter').addEventListener('change', function() {
                currentFilter.priority = this.value;
                filterAndDisplayComplaints();
            });
        }

        // Load complaints
        async function loadComplaints() {
            try {
                const response = await fetch('../api/staff_complaints.php?action=get_complaints');
                const data = await response.json();
                
                if (data.success) {
                    complaintsData = data.complaints || [];
                    updateStats(complaintsData);
                    filterAndDisplayComplaints();
                } else {
                    showError('Failed to load complaints: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error loading complaints:', error);
                showError('Error loading complaints: ' + error.message);
            }
        }

        // Update statistics
        function updateStats(complaints) {
            const total = complaints.length;
            const newCount = complaints.filter(c => c.status === 'new').length;
            const inProgress = complaints.filter(c => c.status === 'in_progress').length;
            const resolved = complaints.filter(c => c.status === 'resolved').length;
            
            document.getElementById('totalComplaints').textContent = total;
            document.getElementById('newComplaints').textContent = newCount;
            document.getElementById('inProgressComplaints').textContent = inProgress;
            document.getElementById('resolvedComplaints').textContent = resolved;
        }

        // Filter and display complaints
        function filterAndDisplayComplaints() {
            let filtered = complaintsData;
            
            // Apply status filter
            if (currentFilter.status) {
                filtered = filtered.filter(c => c.status === currentFilter.status);
            }
            
            // Apply priority filter
            if (currentFilter.priority) {
                filtered = filtered.filter(c => c.priority === currentFilter.priority);
            }
            
            // Apply search filter
            if (currentFilter.search) {
                const search = currentFilter.search.toLowerCase();
                filtered = filtered.filter(c => 
                    c.company_name.toLowerCase().includes(search) ||
                    c.subject.toLowerCase().includes(search) ||
                    c.description.toLowerCase().includes(search)
                );
            }
            
            displayComplaints(filtered);
        }

        // Display complaints
        function displayComplaints(complaints) {
            const container = document.getElementById('complaintsContainer');
            
            if (complaints.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="ti ti-message-off text-muted" style="font-size: 3rem;"></i>
                        <h5 class="mt-3 text-muted">No complaints found</h5>
                        <p class="text-muted">No complaints match your current filters.</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = complaints.map(complaint => `
                <div class="col-12 mb-3">
                    <div class="card complaint-card priority-${complaint.priority || 'medium'} h-100" onclick="viewComplaint(${complaint.id})">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <div class="d-flex align-items-center mb-2">
                                        <h6 class="mb-0 me-2">${escapeHtml(complaint.subject)}</h6>
                                        <span class="badge status-badge ${getStatusBadgeClass(complaint.status)}">${getStatusText(complaint.status)}</span>
                                        <span class="badge bg-light text-dark ms-1">${getPriorityText(complaint.priority || 'medium')}</span>
                                    </div>
                                    <p class="text-muted small mb-2">${escapeHtml(complaint.company_name)}</p>
                                    <p class="mb-2 small">${truncateText(complaint.description, 150)}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">
                                            <i class="ti ti-clock me-1"></i>
                                            ${formatDate(complaint.created_at)}
                                        </small>
                                        <button class="btn btn-outline-primary btn-sm">
                                            <i class="ti ti-eye me-1"></i>View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // View complaint details
        async function viewComplaint(id) {
            currentComplaintId = id;
            
            try {
                const response = await fetch(`../api/staff_complaints.php?action=get_complaint&id=${id}`);
                const data = await response.json();
                
                if (data.success) {
                    displayComplaintDetails(data.complaint);
                    const modal = new bootstrap.Modal(document.getElementById('complaintModal'));
                    modal.show();
                } else {
                    showAlert('Failed to load complaint details: ' + (data.error || 'Unknown error'), 'danger');
                }
            } catch (error) {
                console.error('Error loading complaint details:', error);
                showAlert('Error loading complaint details: ' + error.message, 'danger');
            }
        }

        // Display complaint details
        function displayComplaintDetails(complaint) {
            const content = document.getElementById('complaintDetailsContent');
            
            content.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="fw-bold mb-3">Complaint Information</h6>
                        <table class="table table-borderless table-sm">
                            <tr><td class="fw-medium">Subject:</td><td>${escapeHtml(complaint.subject)}</td></tr>
                            <tr><td class="fw-medium">Company:</td><td>${escapeHtml(complaint.company_name)}</td></tr>
                            <tr><td class="fw-medium">Status:</td><td><span class="badge ${getStatusBadgeClass(complaint.status)}">${getStatusText(complaint.status)}</span></td></tr>
                            <tr><td class="fw-medium">Priority:</td><td><span class="badge bg-light text-dark">${getPriorityText(complaint.priority || 'medium')}</span></td></tr>
                            <tr><td class="fw-medium">Created:</td><td>${formatDate(complaint.created_at)}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold mb-3">Update Status</h6>
                        <div class="mb-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="statusUpdate">
                                <option value="new" ${complaint.status === 'new' ? 'selected' : ''}>New</option>
                                <option value="in_progress" ${complaint.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                <option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Response (Optional)</label>
                            <textarea class="form-control" id="responseText" rows="4" placeholder="Add a response or update..."></textarea>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <h6 class="fw-bold mb-3">Description</h6>
                        <div class="border rounded p-3 bg-light">
                            ${escapeHtml(complaint.description).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
            `;
        }

        // Update complaint status
        async function updateComplaintStatus() {
            if (!currentComplaintId) return;
            
            const status = document.getElementById('statusUpdate').value;
            const response = document.getElementById('responseText').value;
            
            try {
                const updateResponse = await fetch('../api/staff_complaints.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'update_status',
                        complaint_id: currentComplaintId,
                        status: status,
                        response: response,
                        updated_by: '<?= $currentStaff['id'] ?>'
                    })
                });
                
                const data = await updateResponse.json();
                
                if (data.success) {
                    showAlert('Complaint status updated successfully!', 'success');
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('complaintModal'));
                    modal.hide();
                    
                    // Refresh complaints
                    loadComplaints();
                } else {
                    showAlert('Failed to update complaint: ' + (data.error || 'Unknown error'), 'danger');
                }
            } catch (error) {
                console.error('Error updating complaint:', error);
                showAlert('Error updating complaint: ' + error.message, 'danger');
            }
        }

        // Filter complaints by specific criteria
        function filterComplaints(type) {
            if (type === 'all') {
                currentFilter = { status: '', priority: '', search: '' };
                document.getElementById('statusFilter').value = '';
                document.getElementById('priorityFilter').value = '';
                document.getElementById('searchInput').value = '';
            } else if (['new', 'in_progress', 'resolved'].includes(type)) {
                currentFilter.status = type;
                document.getElementById('statusFilter').value = type;
            } else if (['high', 'medium', 'low'].includes(type)) {
                currentFilter.priority = type;
                document.getElementById('priorityFilter').value = type;
            }
            
            filterAndDisplayComplaints();
        }

        // Refresh complaints
        function refreshComplaints() {
            loadComplaints();
        }

        // Utility functions
        function getStatusBadgeClass(status) {
            const classes = {
                'new': 'bg-warning',
                'in_progress': 'bg-info',
                'resolved': 'bg-success'
            };
            return classes[status] || 'bg-secondary';
        }

        function getStatusText(status) {
            const texts = {
                'new': 'New',
                'in_progress': 'In Progress',
                'resolved': 'Resolved'
            };
            return texts[status] || 'Unknown';
        }

        function getPriorityText(priority) {
            const texts = {
                'high': 'High Priority',
                'medium': 'Medium Priority',
                'low': 'Low Priority'
            };
            return texts[priority] || 'Medium Priority';
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

        function formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        function showError(message) {
            const container = document.getElementById('complaintsContainer');
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="ti ti-alert-circle text-danger" style="font-size: 3rem;"></i>
                    <h5 class="mt-3 text-danger">Error</h5>
                    <p class="text-muted">${message}</p>
                    <button class="btn btn-primary" onclick="loadComplaints()">Try Again</button>
                </div>
            `;
        }

        function showAlert(message, type) {
            const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
            const alertHtml = `
                <div class="alert ${alertClass} alert-dismissible fade show position-fixed" style="top: 20px; right: 20px; z-index: 1050; min-width: 300px;" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', alertHtml);
            
            setTimeout(() => {
                const alerts = document.querySelectorAll('.alert');
                alerts.forEach(alert => {
                    if (alert.textContent.includes(message.substring(0, 20))) {
                        alert.remove();
                    }
                });
            }, 5000);
        }
    </script>
</body>
</html>