    <!-- Sidebar -->
    <div class="sidebar bg-white border-end d-flex flex-column mobile-sidebar" id="sidebar">
        
        <!-- Logo -->
        <div class="p-3 border-bottom">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <h5 class="mb-0 text-primary fw-bold">Firmaflow</h5>
                    <small class="text-muted">SuperAdmin</small>
                </div>
                <button class="btn btn-sm btn-outline-secondary d-md-none" id="sidebarClose">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        </div>

        <!-- Navigation -->
        <div class="flex-grow-1 p-3">
            <!-- Dashboard -->
            <div class="nav-section">
                <a class="nav-link <?= $currentPage === 'index' ? 'active bg-danger-subtle text-danger' : 'text-dark' ?> mb-1 rounded" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? '' : '../' ?>index.php">
                    <i class="ti ti-dashboard me-2"></i>
                    <span>Dashboard</span>
                </a>
            </div>

            <!-- Company Management -->
            <div class="nav-section mt-3">
                <h6 class="nav-header text-muted text-uppercase small fw-bold mb-2">Company Management</h6>
                
                <a class="nav-link <?= $currentPage === 'companies' ? 'active bg-danger-subtle text-danger' : 'text-dark' ?> mb-1 rounded" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? 'pages/' : '' ?>companies.php">
                    <i class="ti ti-building me-2"></i>
                    <span>All Companies</span>
                </a>
                
                <a class="nav-link <?= $currentPage === 'users' ? 'active bg-danger-subtle text-danger' : 'text-dark' ?> mb-1 rounded" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? 'pages/' : '' ?>users.php">
                    <i class="ti ti-users me-2"></i>
                    <span>All Users</span>
                </a>
            </div>

            <!-- Support & Communication -->
            <div class="nav-section mt-3">
                <h6 class="nav-header text-muted text-uppercase small fw-bold mb-2">Support & Communication</h6>
                
                <a class="nav-link <?= $currentPage === 'complaints' ? 'active bg-danger-subtle text-danger' : 'text-dark' ?> mb-1 rounded" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? 'pages/' : '' ?>complaints.php">
                    <i class="ti ti-message-exclamation me-2"></i>
                    <span>Complaints</span>
                </a>
                
                <a class="nav-link <?= $currentPage === 'chat' ? 'active bg-danger-subtle text-danger' : 'text-dark' ?> mb-1 rounded" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? 'pages/' : '' ?>chat.php">
                    <i class="ti ti-message-circle me-2"></i>
                    <span>Live Chat</span>
                </a>
                
                <a class="nav-link <?= $currentPage === 'staff' ? 'active bg-danger-subtle text-danger' : 'text-dark' ?> mb-1 rounded" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? 'pages/' : '' ?>staff.php">
                    <i class="ti ti-users-group me-2"></i>
                    <span>Staff Management</span>
                </a>
            </div>

            <!-- System Management -->
            <div class="nav-section mt-3">
                <h6 class="nav-header text-muted text-uppercase small fw-bold mb-2">System Management</h6>
                
                <a class="nav-link <?= $currentPage === 'global_messages' ? 'active bg-danger-subtle text-danger' : 'text-dark' ?> mb-1 rounded" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? '' : '../' ?>global_messages.php">
                    <i class="ti ti-broadcast me-2"></i>
                    <span>Global Messages</span>
                </a>
                
                <a class="nav-link <?= $currentPage === 'monitoring' ? 'active bg-danger-subtle text-danger' : 'text-dark' ?> mb-1 rounded" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? 'pages/' : '' ?>monitoring.php">
                    <i class="ti ti-activity me-2"></i>
                    <span>System Monitoring</span>
                </a>
                
                <a class="nav-link <?= $currentPage === 'analytics' ? 'active bg-danger-subtle text-danger' : 'text-dark' ?> mb-1 rounded" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? 'pages/' : '' ?>analytics.php">
                    <i class="ti ti-chart-line me-2"></i>
                    <span>Analytics</span>
                </a>
                
                <a class="nav-link <?= $currentPage === 'settings' ? 'active bg-danger-subtle text-danger' : 'text-dark' ?> mb-1 rounded" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? 'pages/' : '' ?>settings.php">
                    <i class="ti ti-settings me-2"></i>
                    <span>System Settings</span>
                </a>
            </div>
        </div>

        <!-- User Info & Logout -->
        <div class="p-3 border-top mt-auto">
            <div class="dropdown">
                <button class="btn btn-light w-100 d-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false">
                    <div class="me-2">
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                            <i class="ti ti-user"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1 text-start">
                        <div class="fw-medium small"><?= htmlspecialchars($currentUser['full_name'] ?? $currentUser['username']) ?></div>
                        <div class="text-muted small"><?= ucfirst($currentUser['role']) ?></div>
                    </div>
                    <i class="ti ti-chevron-up"></i>
                </button>
                <ul class="dropdown-menu w-100">
                    <li><a class="dropdown-item" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? 'pages/' : '' ?>profile.php">
                        <i class="ti ti-user me-2"></i>Profile
                    </a></li>
                    <li><a class="dropdown-item" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? 'pages/' : '' ?>settings.php">
                        <i class="ti ti-settings me-2"></i>Settings
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? '' : '../' ?>logout.php" onclick="return confirmLogout()">
                        <i class="ti ti-logout me-2"></i>Logout
                    </a></li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-content flex-grow-1">
        
        <!-- Top Header Bar (Mobile) -->
        <div class="header-bar bg-white border-bottom d-md-none sticky-top">
            <div class="d-flex align-items-center justify-content-between p-3">
                <button class="btn btn-outline-primary btn-sm" id="sidebarToggle">
                    <i class="ti ti-menu-2"></i>
                </button>
                <h6 class="mb-0 fw-bold"><?= $pageTitle ?? 'SuperAdmin' ?></h6>
                <div class="dropdown">
                    <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="dropdown">
                        <i class="ti ti-user"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? '' : '../' ?>logout.php" onclick="return confirmLogout()">
                            <i class="ti ti-logout me-2"></i>Logout
                        </a></li>
                    </ul>
                </div>
            </div>
        </div>