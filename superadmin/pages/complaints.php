<?php
$pageTitle = 'Complaints Management';
require_once '../includes/header.php';
require_once '../includes/sidebar.php';

$pdo = getSuperAdminDB();

$message = '';
$messageType = '';

// Handle actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'update_complaint') {
        $complaint_id = $_POST['complaint_id'] ?? '';
        $status = $_POST['status'] ?? '';
        $priority = $_POST['priority'] ?? '';
        $assigned_to = $_POST['assigned_to'] ?? '';
        $resolution = $_POST['resolution'] ?? '';
        
        try {
            $updateData = [
                'status' => $status,
                'priority' => $priority,
                'assigned_to' => $assigned_to,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($status === 'resolved' && !empty($resolution)) {
                $updateData['resolution'] = $resolution;
                $updateData['resolved_at'] = date('Y-m-d H:i:s');
            }
            
            $setParts = [];
            foreach ($updateData as $key => $value) {
                $setParts[] = "$key = :$key";
            }
            
            $stmt = $pdo->prepare("UPDATE complaints SET " . implode(', ', $setParts) . " WHERE id = :complaint_id");
            $updateData['complaint_id'] = $complaint_id;
            $stmt->execute($updateData);
            
            // Log action
            $user = getSuperAdminUser();
            $logStmt = $pdo->prepare("
                INSERT INTO superadmin_logs (username, action, details, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $logStmt->execute([
                $user['username'],
                'COMPLAINT_UPDATED',
                "Updated complaint #$complaint_id - Status: $status, Priority: $priority",
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);
            
            $message = 'Complaint updated successfully';
            $messageType = 'success';
        } catch (Exception $e) {
            $message = 'Error updating complaint: ' . $e->getMessage();
            $messageType = 'danger';
        }
    }
    
    if ($action === 'add_response') {
        $complaint_id = $_POST['complaint_id'] ?? '';
        $response_message = $_POST['response_message'] ?? '';
        $is_internal = isset($_POST['is_internal']) ? 1 : 0;
        
        try {
            $user = getSuperAdminUser();
            $stmt = $pdo->prepare("
                INSERT INTO complaint_responses (complaint_id, responder_name, responder_type, message, is_internal) 
                VALUES (?, ?, 'admin', ?, ?)
            ");
            $stmt->execute([$complaint_id, $user['username'], $response_message, $is_internal]);
            
            $message = 'Response added successfully';
            $messageType = 'success';
        } catch (Exception $e) {
            $message = 'Error adding response: ' . $e->getMessage();
            $messageType = 'danger';
        }
    }
}

// Get filter parameters
$status_filter = $_GET['status'] ?? '';
$priority_filter = $_GET['priority'] ?? '';
$category_filter = $_GET['category'] ?? '';
$search = $_GET['search'] ?? '';

// Build query
$whereConditions = [];
$params = [];

if ($status_filter) {
    $whereConditions[] = "status = :status";
    $params['status'] = $status_filter;
}
if ($priority_filter) {
    $whereConditions[] = "priority = :priority";
    $params['priority'] = $priority_filter;
}
if ($category_filter) {
    $whereConditions[] = "category = :category";
    $params['category'] = $category_filter;
}
if ($search) {
    $whereConditions[] = "(name LIKE :search OR email LIKE :search OR subject LIKE :search OR message LIKE :search)";
    $params['search'] = "%$search%";
}

$whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

// Get complaints
$stmt = $pdo->prepare("
    SELECT *, 
           (SELECT COUNT(*) FROM complaint_responses WHERE complaint_id = complaints.id) as response_count
    FROM complaints 
    $whereClause 
    ORDER BY created_at DESC
");
$stmt->execute($params);
$complaints = $stmt->fetchAll();

// Get statistics
$statsStmt = $pdo->query("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_count
    FROM complaints
");
$stats = $statsStmt->fetch();
?>

        <!-- Page Content -->
        <div class="container-fluid p-4">
            <!-- Page Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h3 mb-0">Complaints Management</h1>
                    <p class="text-muted">Manage customer feedback and support requests</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#exportModal">
                        <i class="ti ti-download me-2"></i>Export
                    </button>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#settingsModal">
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
                            <div class="stat-value text-primary"><?= number_format($stats['total']) ?></div>
                            <div class="stat-label">Total Complaints</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card border-warning">
                        <div class="card-body text-center">
                            <div class="stat-value text-warning"><?= number_format($stats['new_count']) ?></div>
                            <div class="stat-label">New</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card border-info">
                        <div class="card-body text-center">
                            <div class="stat-value text-info"><?= number_format($stats['in_progress_count']) ?></div>
                            <div class="stat-label">In Progress</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card border-success">
                        <div class="card-body text-center">
                            <div class="stat-value text-success"><?= number_format($stats['resolved_count']) ?></div>
                            <div class="stat-label">Resolved</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card border-danger">
                        <div class="card-body text-center">
                            <div class="stat-value text-danger"><?= number_format($stats['urgent_count']) ?></div>
                            <div class="stat-label">Urgent</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <form method="GET" class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Search</label>
                            <input type="text" class="form-control" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Search complaints...">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Status</label>
                            <select class="form-select" name="status">
                                <option value="">All Statuses</option>
                                <option value="new" <?= $status_filter === 'new' ? 'selected' : '' ?>>New</option>
                                <option value="assigned" <?= $status_filter === 'assigned' ? 'selected' : '' ?>>Assigned</option>
                                <option value="in_progress" <?= $status_filter === 'in_progress' ? 'selected' : '' ?>>In Progress</option>
                                <option value="resolved" <?= $status_filter === 'resolved' ? 'selected' : '' ?>>Resolved</option>
                                <option value="closed" <?= $status_filter === 'closed' ? 'selected' : '' ?>>Closed</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Priority</label>
                            <select class="form-select" name="priority">
                                <option value="">All Priorities</option>
                                <option value="low" <?= $priority_filter === 'low' ? 'selected' : '' ?>>Low</option>
                                <option value="medium" <?= $priority_filter === 'medium' ? 'selected' : '' ?>>Medium</option>
                                <option value="high" <?= $priority_filter === 'high' ? 'selected' : '' ?>>High</option>
                                <option value="urgent" <?= $priority_filter === 'urgent' ? 'selected' : '' ?>>Urgent</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Category</label>
                            <select class="form-select" name="category">
                                <option value="">All Categories</option>
                                <option value="bug" <?= $category_filter === 'bug' ? 'selected' : '' ?>>Bug</option>
                                <option value="feature_request" <?= $category_filter === 'feature_request' ? 'selected' : '' ?>>Feature Request</option>
                                <option value="billing" <?= $category_filter === 'billing' ? 'selected' : '' ?>>Billing</option>
                                <option value="technical" <?= $category_filter === 'technical' ? 'selected' : '' ?>>Technical</option>
                                <option value="general" <?= $category_filter === 'general' ? 'selected' : '' ?>>General</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">&nbsp;</label>
                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="ti ti-search me-1"></i>Filter
                                </button>
                                <a href="complaints.php" class="btn btn-outline-secondary">
                                    <i class="ti ti-x me-1"></i>Clear
                                </a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Complaints Table -->
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Complaints List</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover data-table mb-0">
                            <thead>
                                <tr>
                                    <th data-sort="id">ID</th>
                                    <th data-sort="name">Customer</th>
                                    <th data-sort="subject">Subject</th>
                                    <th data-sort="category">Category</th>
                                    <th data-sort="priority">Priority</th>
                                    <th data-sort="status">Status</th>
                                    <th data-sort="response_count">Responses</th>
                                    <th data-sort="created_at">Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($complaints as $complaint): ?>
                                <tr>
                                    <td><strong>#<?= $complaint['id'] ?></strong></td>
                                    <td>
                                        <div class="fw-medium"><?= htmlspecialchars($complaint['name']) ?></div>
                                        <small class="text-muted"><?= htmlspecialchars($complaint['email']) ?></small>
                                    </td>
                                    <td>
                                        <div class="fw-medium"><?= htmlspecialchars($complaint['subject']) ?></div>
                                        <small class="text-muted text-truncate" style="max-width: 200px; display: block;">
                                            <?= htmlspecialchars(substr($complaint['message'], 0, 80)) ?>...
                                        </small>
                                    </td>
                                    <td>
                                        <span class="badge bg-secondary"><?= ucfirst(str_replace('_', ' ', $complaint['category'])) ?></span>
                                    </td>
                                    <td>
                                        <span class="badge <?= $complaint['priority'] === 'urgent' ? 'bg-danger' : 
                                                             ($complaint['priority'] === 'high' ? 'bg-warning' : 
                                                             ($complaint['priority'] === 'medium' ? 'bg-info' : 'bg-secondary')) ?>">
                                            <?= ucfirst($complaint['priority']) ?>
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge <?= $complaint['status'] === 'resolved' ? 'bg-success' : 
                                                             ($complaint['status'] === 'in_progress' ? 'bg-primary' : 
                                                             ($complaint['status'] === 'assigned' ? 'bg-info' : 'bg-warning')) ?>">
                                            <?= ucfirst(str_replace('_', ' ', $complaint['status'])) ?>
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge bg-light text-dark"><?= $complaint['response_count'] ?></span>
                                    </td>
                                    <td>
                                        <small><?= date('M j, Y g:i A', strtotime($complaint['created_at'])) ?></small>
                                    </td>
                                    <td>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-primary" onclick="viewComplaint(<?= $complaint['id'] ?>)">
                                                <i class="ti ti-eye"></i>
                                            </button>
                                            <button class="btn btn-outline-secondary" onclick="editComplaint(<?= $complaint['id'] ?>)">
                                                <i class="ti ti-edit"></i>
                                            </button>
                                            <button class="btn btn-outline-success" onclick="respondToComplaint(<?= $complaint['id'] ?>)">
                                                <i class="ti ti-message"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                                
                                <?php if (empty($complaints)): ?>
                                <tr>
                                    <td colspan="9" class="text-center py-4 text-muted">
                                        <i class="ti ti-inbox ti-3x mb-3 d-block"></i>
                                        No complaints found
                                    </td>
                                </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

<!-- View Complaint Modal -->
<div class="modal fade" id="viewComplaintModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Complaint Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="complaintDetails">
                <!-- Complaint details will be loaded here -->
            </div>
        </div>
    </div>
</div>

<!-- Edit Complaint Modal -->
<div class="modal fade" id="editComplaintModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST">
                <div class="modal-header">
                    <h5 class="modal-title">Update Complaint</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" name="action" value="update_complaint">
                    <input type="hidden" name="complaint_id" id="editComplaintId">
                    
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="status" id="editStatus">
                            <option value="new">New</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Priority</label>
                        <select class="form-select" name="priority" id="editPriority">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Assigned To</label>
                        <input type="text" class="form-control" name="assigned_to" id="editAssignedTo" placeholder="Admin username">
                    </div>
                    
                    <div class="mb-3" id="resolutionField" style="display: none;">
                        <label class="form-label">Resolution</label>
                        <textarea class="form-control" name="resolution" id="editResolution" rows="3" placeholder="Describe how this complaint was resolved..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Complaint</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Respond to Complaint Modal -->
<div class="modal fade" id="respondModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST">
                <div class="modal-header">
                    <h5 class="modal-title">Add Response</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" name="action" value="add_response">
                    <input type="hidden" name="complaint_id" id="respondComplaintId">
                    
                    <div class="mb-3">
                        <label class="form-label">Response Message</label>
                        <textarea class="form-control" name="response_message" rows="4" placeholder="Type your response..." required></textarea>
                    </div>
                    
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="is_internal" id="isInternal">
                        <label class="form-check-label" for="isInternal">
                            Internal note (not visible to customer)
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Send Response</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>

<script>
// Complaint management functions
function viewComplaint(id) {
    fetch(`../api/complaint-details.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('complaintDetails').innerHTML = data.html;
                new bootstrap.Modal(document.getElementById('viewComplaintModal')).show();
            }
        });
}

function editComplaint(id) {
    fetch(`../api/complaint-details.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const complaint = data.complaint;
                document.getElementById('editComplaintId').value = complaint.id;
                document.getElementById('editStatus').value = complaint.status;
                document.getElementById('editPriority').value = complaint.priority;
                document.getElementById('editAssignedTo').value = complaint.assigned_to || '';
                document.getElementById('editResolution').value = complaint.resolution || '';
                
                toggleResolutionField();
                new bootstrap.Modal(document.getElementById('editComplaintModal')).show();
            }
        });
}

function respondToComplaint(id) {
    document.getElementById('respondComplaintId').value = id;
    new bootstrap.Modal(document.getElementById('respondModal')).show();
}

function toggleResolutionField() {
    const status = document.getElementById('editStatus').value;
    const resolutionField = document.getElementById('resolutionField');
    resolutionField.style.display = (status === 'resolved') ? 'block' : 'none';
}

// Event listeners
document.getElementById('editStatus').addEventListener('change', toggleResolutionField);
</script>