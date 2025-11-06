<?php
$pageTitle = 'Complaints Management';
require_once '../includes/header.php';
require_once '../includes/sidebar.php';

$pdo = getSuperAdminDB();

// Create complaints table if it doesn't exist
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS complaints (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT,
            user_id INT,
            subject VARCHAR(255),
            message TEXT,
            priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
            status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
            assigned_to VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(company_id),
            INDEX(status),
            INDEX(priority)
        )
    ");
} catch (Exception $e) {
    // Table might already exist
}

// Handle form submissions
$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'update_status') {
        $complaintId = $_POST['complaint_id'] ?? 0;
        $status = $_POST['status'] ?? '';
        $assignedTo = $_POST['assigned_to'] ?? '';
        
        $stmt = $pdo->prepare("UPDATE complaints SET status = ?, assigned_to = ?, updated_at = NOW() WHERE id = ?");
        if ($stmt->execute([$status, $assignedTo, $complaintId])) {
            $message = 'Complaint updated successfully';
            $messageType = 'success';
        }
    } elseif ($action === 'add_complaint') {
        // For demo purposes - in real app, users would submit complaints
        $companyId = $_POST['company_id'] ?? 1;
        $subject = $_POST['subject'] ?? '';
        $complaintMessage = $_POST['message'] ?? '';
        $priority = $_POST['priority'] ?? 'medium';
        
        $stmt = $pdo->prepare("INSERT INTO complaints (company_id, subject, message, priority) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$companyId, $subject, $complaintMessage, $priority])) {
            $message = 'Demo complaint added successfully';
            $messageType = 'success';
        }
    }
}

// Get complaints with filters
$status = $_GET['status'] ?? '';
$priority = $_GET['priority'] ?? '';
$search = $_GET['search'] ?? '';

$whereClause = "WHERE 1=1";
$params = [];

if ($status) {
    $whereClause .= " AND c.status = ?";
    $params[] = $status;
}

if ($priority) {
    $whereClause .= " AND c.priority = ?";
    $params[] = $priority;
}

if ($search) {
    $whereClause .= " AND (c.subject LIKE ? OR c.message LIKE ? OR comp.company_name LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$stmt = $pdo->prepare("
    SELECT c.*, comp.company_name, comp.email as company_email
    FROM complaints c 
    LEFT JOIN companies comp ON c.company_id = comp.id 
    $whereClause 
    ORDER BY 
        CASE c.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
        END,
        c.created_at DESC
");
$stmt->execute($params);
$complaints = $stmt->fetchAll();

// Get statistics
$statsStmt = $pdo->query("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent
    FROM complaints
");
$stats = $statsStmt->fetch() ?: ['total' => 0, 'open' => 0, 'in_progress' => 0, 'resolved' => 0, 'urgent' => 0];
?>

<!-- Main Content -->
<div class="main-content">
    <div class="container-fluid">
        
        <!-- Page Header -->
        <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4">
            <div class="mb-3 mb-lg-0">
                <h1 class="h3 mb-1">Complaints & Support</h1>
                <p class="text-muted mb-0">Manage customer complaints and support requests</p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-outline-primary btn-sm" onclick="window.location.reload()">
                    <i class="ti ti-refresh me-1"></i>Refresh
                </button>
                <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addComplaintModal">
                    <i class="ti ti-plus me-1"></i>Add Demo Complaint
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
        <div class="row g-3 mb-4">
            <div class="col-6 col-lg-3">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value"><?= number_format($stats['total']) ?></div>
                                <div class="stat-label">Total Complaints</div>
                            </div>
                            <i class="ti ti-message-exclamation text-primary opacity-50" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value"><?= number_format($stats['open']) ?></div>
                                <div class="stat-label">Open</div>
                            </div>
                            <i class="ti ti-alert-circle text-danger opacity-50" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value"><?= number_format($stats['in_progress']) ?></div>
                                <div class="stat-label">In Progress</div>
                            </div>
                            <i class="ti ti-clock text-warning opacity-50" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value"><?= number_format($stats['urgent']) ?></div>
                                <div class="stat-label">Urgent</div>
                            </div>
                            <i class="ti ti-flame text-danger opacity-50" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="card mb-4">
            <div class="card-body">
                <form method="GET" class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Search</label>
                        <input type="text" class="form-control" name="search" 
                               placeholder="Search complaints..." 
                               value="<?= htmlspecialchars($search) ?>">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="status">
                            <option value="">All Status</option>
                            <option value="open" <?= $status === 'open' ? 'selected' : '' ?>>Open</option>
                            <option value="in_progress" <?= $status === 'in_progress' ? 'selected' : '' ?>>In Progress</option>
                            <option value="resolved" <?= $status === 'resolved' ? 'selected' : '' ?>>Resolved</option>
                            <option value="closed" <?= $status === 'closed' ? 'selected' : '' ?>>Closed</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Priority</label>
                        <select class="form-select" name="priority">
                            <option value="">All Priorities</option>
                            <option value="urgent" <?= $priority === 'urgent' ? 'selected' : '' ?>>Urgent</option>
                            <option value="high" <?= $priority === 'high' ? 'selected' : '' ?>>High</option>
                            <option value="medium" <?= $priority === 'medium' ? 'selected' : '' ?>>Medium</option>
                            <option value="low" <?= $priority === 'low' ? 'selected' : '' ?>>Low</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-flex align-items-end gap-2">
                        <button type="submit" class="btn btn-primary btn-sm">
                            <i class="ti ti-search me-1"></i>Filter
                        </button>
                        <a href="complaints.php" class="btn btn-outline-secondary btn-sm">
                            <i class="ti ti-x me-1"></i>Clear
                        </a>
                    </div>
                </form>
            </div>
        </div>

        <!-- Complaints List -->
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">Complaints List</h5>
            </div>
            <div class="card-body p-0">
                <?php foreach ($complaints as $complaint): ?>
                <div class="border-bottom p-3">
                    <div class="row align-items-center">
                        <div class="col-12 col-md-8">
                            <div class="d-flex align-items-start">
                                <div class="me-3">
                                    <?php
                                    $priorityColors = [
                                        'urgent' => 'danger',
                                        'high' => 'warning', 
                                        'medium' => 'info',
                                        'low' => 'secondary'
                                    ];
                                    $priorityColor = $priorityColors[$complaint['priority']] ?? 'secondary';
                                    ?>
                                    <span class="badge bg-<?= $priorityColor ?>"><?= ucfirst($complaint['priority']) ?></span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-1"><?= htmlspecialchars($complaint['subject']) ?></h6>
                                    <p class="text-muted mb-2 small"><?= htmlspecialchars(substr($complaint['message'], 0, 150)) ?>...</p>
                                    <div class="d-flex flex-wrap gap-2 small text-muted">
                                        <span><i class="ti ti-building me-1"></i><?= htmlspecialchars($complaint['company_name'] ?? 'Unknown Company') ?></span>
                                        <span><i class="ti ti-clock me-1"></i><?= date('M j, Y g:i A', strtotime($complaint['created_at'])) ?></span>
                                        <?php if ($complaint['assigned_to']): ?>
                                        <span><i class="ti ti-user me-1"></i>Assigned to: <?= htmlspecialchars($complaint['assigned_to']) ?></span>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 mt-2 mt-md-0">
                            <div class="d-flex align-items-center justify-content-md-end gap-2">
                                <?php
                                $statusColors = [
                                    'open' => 'danger',
                                    'in_progress' => 'warning',
                                    'resolved' => 'success',
                                    'closed' => 'secondary'
                                ];
                                $statusColor = $statusColors[$complaint['status']] ?? 'secondary';
                                ?>
                                <span class="badge bg-<?= $statusColor ?>"><?= ucfirst(str_replace('_', ' ', $complaint['status'])) ?></span>
                                <button class="btn btn-sm btn-outline-primary" onclick="updateComplaint(<?= $complaint['id'] ?>)">
                                    <i class="ti ti-edit"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
                
                <?php if (empty($complaints)): ?>
                <div class="text-center py-5 text-muted">
                    <i class="ti ti-message-circle mb-3" style="font-size: 3rem;"></i>
                    <h6>No complaints found</h6>
                    <p>All customer complaints and support requests will appear here</p>
                </div>
                <?php endif; ?>
            </div>
        </div>

    </div>
</div>

<!-- Add Demo Complaint Modal -->
<div class="modal fade" id="addComplaintModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST">
                <input type="hidden" name="action" value="add_complaint">
                <div class="modal-header">
                    <h5 class="modal-title">Add Demo Complaint</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Company ID</label>
                        <input type="number" class="form-control" name="company_id" value="1" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Subject</label>
                        <input type="text" class="form-control" name="subject" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Message</label>
                        <textarea class="form-control" name="message" rows="4" required></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Priority</label>
                        <select class="form-select" name="priority">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Complaint</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Update Complaint Modal -->
<div class="modal fade" id="updateComplaintModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST" id="updateComplaintForm">
                <input type="hidden" name="action" value="update_status">
                <input type="hidden" name="complaint_id" id="updateComplaintId">
                <div class="modal-header">
                    <h5 class="modal-title">Update Complaint</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="status" id="updateStatus">
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Assign To</label>
                        <select class="form-select" name="assigned_to">
                            <option value="">Unassigned</option>
                            <option value="Support Team">Support Team</option>
                            <option value="Technical Team">Technical Team</option>
                            <option value="Manager">Manager</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
function updateComplaint(complaintId) {
    document.getElementById('updateComplaintId').value = complaintId;
    new bootstrap.Modal(document.getElementById('updateComplaintModal')).show();
}
</script>

<?php require_once '../includes/footer.php'; ?>