<?php
$pageTitle = 'Companies Management';
require_once '../includes/header.php';
require_once '../includes/sidebar.php';

$pdo = getSuperAdminDB();

// Handle actions
$action = $_GET['action'] ?? '';
$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'activate') {
        $companyId = $_POST['company_id'] ?? 0;
        $stmt = $pdo->prepare("UPDATE companies SET subscription_status = 'active' WHERE id = ?");
        if ($stmt->execute([$companyId])) {
            $message = 'Company activated successfully';
            $messageType = 'success';
        }
    } elseif ($action === 'deactivate') {
        $companyId = $_POST['company_id'] ?? 0;
        $stmt = $pdo->prepare("UPDATE companies SET subscription_status = 'inactive' WHERE id = ?");
        if ($stmt->execute([$companyId])) {
            $message = 'Company deactivated successfully';
            $messageType = 'warning';
        }
    } elseif ($action === 'delete') {
        $companyId = $_POST['company_id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM companies WHERE id = ?");
        if ($stmt->execute([$companyId])) {
            $message = 'Company deleted successfully';
            $messageType = 'danger';
        }
    }
}

// Get companies with pagination
$page = max(1, $_GET['page'] ?? 1);
$limit = 15;
$offset = ($page - 1) * $limit;
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? '';

$whereClause = "WHERE 1=1";
$params = [];

if ($search) {
    $whereClause .= " AND (c.name LIKE ? OR c.email LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($status) {
    $whereClause .= " AND subscription_status = ?";
    $params[] = $status;
}

// Get total count
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM companies c $whereClause");
$countStmt->execute($params);
$totalCompanies = $countStmt->fetchColumn();
$totalPages = ceil($totalCompanies / $limit);

// Get companies with user count
$stmt = $pdo->prepare("
    SELECT c.*, 
           COUNT(u.id) as user_count
    FROM companies c
    LEFT JOIN users u ON c.id = u.company_id
    $whereClause
    GROUP BY c.id
    ORDER BY c.created_at DESC 
    LIMIT $limit OFFSET $offset
");
$stmt->execute($params);
$companies = $stmt->fetchAll();

// Get statistics
$statsStmt = $pdo->query("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN subscription_status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN subscription_plan = 'free' THEN 1 ELSE 0 END) as free_plan,
        SUM(CASE WHEN subscription_plan IN ('starter', 'professional', 'enterprise') THEN 1 ELSE 0 END) as paid_plan
    FROM companies
");
$stats = $statsStmt->fetch();
?>

        <!-- Page Header -->
        <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4">
            <div class="mb-3 mb-lg-0">
                <h1 class="h3 mb-1">Companies Management</h1>
                <p class="text-muted mb-0">Monitor and manage all companies using Firmaflow</p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-outline-primary btn-sm" onclick="window.location.reload()">
                    <i class="ti ti-refresh me-1"></i>Refresh
                </button>
                <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addCompanyModal">
                    <i class="ti ti-plus me-1"></i>Add Company
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
            <div class="col-6 col-md-3">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value"><?= number_format($stats['total']) ?></div>
                                <div class="stat-label">Total Companies</div>
                            </div>
                            <i class="ti ti-building text-primary opacity-50" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value"><?= number_format($stats['active']) ?></div>
                                <div class="stat-label">Active</div>
                            </div>
                            <i class="ti ti-check text-success opacity-50" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value"><?= number_format($stats['paid_plan']) ?></div>
                                <div class="stat-label">Paid Plans</div>
                            </div>
                            <i class="ti ti-credit-card text-warning opacity-50" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="stat-value"><?= number_format($stats['free_plan']) ?></div>
                                <div class="stat-label">Free Plans</div>
                            </div>
                            <i class="ti ti-gift text-info opacity-50" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters and Search -->
        <div class="card mb-4">
            <div class="card-body">
                <form method="GET" class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Search Companies</label>
                        <input type="text" class="form-control" name="search" 
                               placeholder="Search by name or email..." 
                               value="<?= htmlspecialchars($search) ?>">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="status">
                            <option value="">All Status</option>
                            <option value="active" <?= $status === 'active' ? 'selected' : '' ?>>Active</option>
                            <option value="inactive" <?= $status === 'inactive' ? 'selected' : '' ?>>Inactive</option>
                            <option value="suspended" <?= $status === 'suspended' ? 'selected' : '' ?>>Suspended</option>
                        </select>
                    </div>
                    <div class="col-md-3 d-flex align-items-end gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="ti ti-search me-1"></i>Search
                        </button>
                        <a href="companies.php" class="btn btn-outline-secondary">
                            <i class="ti ti-x me-1"></i>Clear
                        </a>
                    </div>
                </form>
            </div>
        </div>

        <!-- Companies Table -->
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">Companies List</h5>
            </div>
            <div class="table-responsive">
                <table class="table table-hover mb-0 data-table">
                    <thead>
                        <tr>
                            <th data-sort="company_name">Company</th>
                            <th data-sort="subscription_plan" class="d-none d-md-table-cell">Plan</th>
                            <th data-sort="subscription_status">Status</th>
                            <th class="d-none d-lg-table-cell">Users</th>
                            <th data-sort="created_at" class="d-none d-sm-table-cell">Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($companies as $company): ?>
                        <tr>
                            <td>
                                <div>
                                    <div class="fw-medium"><?= htmlspecialchars($company['name']) ?></div>
                                    <div class="small text-muted"><?= htmlspecialchars($company['email']) ?></div>
                                </div>
                            </td>
                            <td class="d-none d-md-table-cell">
                                <span class="badge bg-<?= $company['subscription_plan'] === 'free' ? 'secondary' : 'primary' ?>">
                                    <?= ucfirst($company['subscription_plan']) ?>
                                </span>
                            </td>
                            <td>
                                <span class="badge status-<?= $company['subscription_status'] ?>">
                                    <?= ucfirst($company['subscription_status']) ?>
                                </span>
                            </td>
                            <td class="d-none d-lg-table-cell">
                                <span class="badge bg-light text-dark"><?= (int)($company['user_count'] ?? 0) ?> users</span>
                            </td>
                            <td class="d-none d-sm-table-cell">
                                <small><?= date('M j, Y', strtotime($company['created_at'])) ?></small>
                            </td>
                            <td>
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="#" onclick="viewCompany(<?= $company['id'] ?>)">
                                            <i class="ti ti-eye me-2"></i>View Details
                                        </a></li>
                                        <li><a class="dropdown-item" href="users.php?company_id=<?= $company['id'] ?>">
                                            <i class="ti ti-users me-2"></i>View Users
                                        </a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <?php if ($company['subscription_status'] === 'active'): ?>
                                        <li><a class="dropdown-item text-warning" href="#" onclick="toggleCompanyStatus(<?= $company['id'] ?>, 'deactivate')">
                                            <i class="ti ti-pause me-2"></i>Deactivate
                                        </a></li>
                                        <?php else: ?>
                                        <li><a class="dropdown-item text-success" href="#" onclick="toggleCompanyStatus(<?= $company['id'] ?>, 'activate')">
                                            <i class="ti ti-play me-2"></i>Activate
                                        </a></li>
                                        <?php endif; ?>
                                        <li><a class="dropdown-item text-danger" href="#" onclick="deleteCompany(<?= $company['id'] ?>, '<?= htmlspecialchars($company['company_name']) ?>')">
                                            <i class="ti ti-trash me-2"></i>Delete
                                        </a></li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                        
                        <?php if (empty($companies)): ?>
                        <tr>
                            <td colspan="6" class="text-center py-4 text-muted">
                                <i class="ti ti-building mb-2" style="font-size: 2rem;"></i>
                                <div>No companies found</div>
                                <?php if ($search || $status): ?>
                                <small>Try adjusting your search criteria</small>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            <?php if ($totalPages > 1): ?>
            <div class="card-footer">
                <nav>
                    <ul class="pagination pagination-sm justify-content-center mb-0">
                        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                        <li class="page-item <?= $i === $page ? 'active' : '' ?>">
                            <a class="page-link" href="?page=<?= $i ?>&search=<?= urlencode($search) ?>&status=<?= urlencode($status) ?>">
                                <?= $i ?>
                            </a>
                        </li>
                        <?php endfor; ?>
                    </ul>
                </nav>
            </div>
            <?php endif; ?>
        </div>

<!-- Action Forms (Hidden) -->
<form id="actionForm" method="POST" style="display: none;">
    <input type="hidden" name="company_id" id="actionCompanyId">
</form>

<script src="../js/superadmin.js"></script>
<script>
function toggleCompanyStatus(companyId, action) {
    if (confirm(`Are you sure you want to ${action} this company?`)) {
        document.getElementById('actionCompanyId').value = companyId;
        document.getElementById('actionForm').action = `?action=${action}`;
        document.getElementById('actionForm').submit();
    }
}

function deleteCompany(companyId, companyName) {
    if (confirm(`Are you sure you want to DELETE "${companyName}"? This action cannot be undone and will remove all associated data.`)) {
        document.getElementById('actionCompanyId').value = companyId;
        document.getElementById('actionForm').action = '?action=delete';
        document.getElementById('actionForm').submit();
    }
}

function viewCompany(companyId) {
    // Implementation for viewing company details
    alert('View company details - ID: ' + companyId);
}
</script>

<?php require_once '../includes/footer.php'; ?>