<?php
// Staff Dashboard - Restricted Access for Customer Support
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if staff is logged in
if (!isset($_SESSION['staff_id'])) {
    header('Location: staff_login.php');
    exit;
}

// Get staff information
$staffName = $_SESSION['staff_full_name'] ?? 'Staff Member';
$staffUsername = $_SESSION['staff_username'] ?? '';
$staffPermissions = $_SESSION['staff_permissions'] ?? ['complaints', 'chat'];

// Verify permissions
$canAccessComplaints = in_array('complaints', $staffPermissions);
$canAccessChat = in_array('chat', $staffPermissions);

// If no permissions, redirect to login
if (!$canAccessComplaints && !$canAccessChat) {
    header('Location: staff_login.php');
    exit;
}

// Default redirect to first available page
$defaultPage = $canAccessComplaints ? 'complaints' : 'chat';
$currentPage = $_GET['page'] ?? $defaultPage;

// Validate current page access
if (($currentPage === 'complaints' && !$canAccessComplaints) ||
    ($currentPage === 'chat' && !$canAccessChat)) {
    $currentPage = $defaultPage;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Dashboard - Firmaflow</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Tabler Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons@latest/tabler-icons.min.css">
    
    <style>
        body {
            background-color: #f8f9fa;
        }
        .sidebar {
            min-height: 100vh;
            background: #fff;
            border-right: 1px solid #e9ecef;
            position: fixed;
            top: 0;
            left: 0;
            width: 250px;
            z-index: 1000;
        }
        .main-content {
            margin-left: 250px;
            min-height: 100vh;
        }
        .nav-link {
            color: #495057;
            padding: 0.75rem 1rem;
            border-radius: 0.375rem;
            margin: 0.125rem 0;
            text-decoration: none;
            transition: all 0.2s;
        }
        .nav-link:hover {
            background-color: #f8f9fa;
            color: #212529;
        }
        .nav-link.active {
            background-color: #dc3545;
            color: #fff;
        }
        .nav-link.active:hover {
            background-color: #bb2d3b;
            color: #fff;
        }
        .nav-header {
            font-size: 0.75rem;
            font-weight: 600;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 1rem 0 0.5rem 0;
        }
        .content-frame {
            width: 100%;
            height: calc(100vh - 80px);
            border: none;
            border-radius: 0.5rem;
            background: #fff;
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
        .header-bar {
            background: #fff;
            border-bottom: 1px solid #e9ecef;
            padding: 1rem 1.5rem;
            position: sticky;
            top: 0;
            z-index: 999;
        }
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s;
            }
            .sidebar.show {
                transform: translateX(0);
            }
            .main-content {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <!-- Logo -->
        <div class="p-3 border-bottom">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <h5 class="mb-0 text-primary fw-bold">Firmaflow</h5>
                    <small class="text-muted">Staff Portal</small>
                </div>
                <button class="btn btn-sm btn-outline-secondary d-md-none" onclick="toggleSidebar()">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        </div>

        <!-- Navigation -->
        <div class="p-3">
            <!-- Support Tools -->
            <div class="nav-section">
                <h6 class="nav-header">Support Tools</h6>
                
                <?php if ($canAccessComplaints): ?>
                <a class="nav-link <?= $currentPage === 'complaints' ? 'active' : '' ?>" href="?page=complaints" onclick="switchPage('complaints')">
                    <i class="ti ti-message-exclamation me-2"></i>
                    <span>Complaints</span>
                </a>
                <?php endif; ?>
                
                <?php if ($canAccessChat): ?>
                <a class="nav-link <?= $currentPage === 'chat' ? 'active' : '' ?>" href="?page=chat" onclick="switchPage('chat')">
                    <i class="ti ti-message-circle me-2"></i>
                    <span>Live Chat</span>
                </a>
                <?php endif; ?>
            </div>

            <!-- Staff Info -->
            <div class="nav-section mt-4 pt-3 border-top">
                <h6 class="nav-header">Account</h6>
                <div class="nav-link" style="cursor: default; background-color: #f8f9fa;">
                    <div class="d-flex align-items-center">
                        <div class="bg-primary text-white rounded-circle me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                            <i class="ti ti-user"></i>
                        </div>
                        <div>
                            <div class="fw-medium small"><?= htmlspecialchars($staffName) ?></div>
                            <div class="text-muted small">@<?= htmlspecialchars($staffUsername) ?></div>
                        </div>
                    </div>
                </div>
                <a class="nav-link text-danger" href="#" onclick="logout()">
                    <i class="ti ti-logout me-2"></i>
                    <span>Logout</span>
                </a>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <!-- Header Bar -->
        <div class="header-bar d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
                <button class="btn btn-outline-primary btn-sm d-md-none me-3" onclick="toggleSidebar()">
                    <i class="ti ti-menu-2"></i>
                </button>
                <div>
                    <h5 class="mb-0 fw-bold">
                        <?php if ($currentPage === 'complaints'): ?>
                            <i class="ti ti-message-exclamation me-2"></i>Complaints Management
                        <?php elseif ($currentPage === 'chat'): ?>
                            <i class="ti ti-message-circle me-2"></i>Live Chat Support
                        <?php endif; ?>
                    </h5>
                    <p class="text-muted mb-0 small">Welcome back, <?= htmlspecialchars($staffName) ?></p>
                </div>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary btn-sm" onclick="refreshContent()">
                    <i class="ti ti-refresh"></i>
                </button>
                <div class="dropdown">
                    <button class="btn btn-outline-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="ti ti-user"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><span class="dropdown-item-text">
                            <strong><?= htmlspecialchars($staffName) ?></strong><br>
                            <small class="text-muted">@<?= htmlspecialchars($staffUsername) ?></small>
                        </span></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="logout()">
                            <i class="ti ti-logout me-2"></i>Logout
                        </a></li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Content Area -->
        <div class="p-3">
            <iframe id="contentFrame" class="content-frame" src="staff/<?= htmlspecialchars($currentPage) ?>.php"></iframe>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Verify session
            verifySession();
            
            // Set up periodic session check
            setInterval(verifySession, 5 * 60 * 1000); // Check every 5 minutes
        });

        // Toggle sidebar (mobile)
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('show');
        }

        // Switch page
        function switchPage(page) {
            const frame = document.getElementById('contentFrame');
            frame.src = `staff/${page}.php`;
            
            // Update URL without reload
            const url = new URL(window.location);
            url.searchParams.set('page', page);
            window.history.pushState({}, '', url);
            
            // Update header
            updateHeader(page);
        }

        // Update header based on current page
        function updateHeader(page) {
            const headerTitle = document.querySelector('.header-bar h5');
            if (page === 'complaints') {
                headerTitle.innerHTML = '<i class="ti ti-message-exclamation me-2"></i>Complaints Management';
            } else if (page === 'chat') {
                headerTitle.innerHTML = '<i class="ti ti-message-circle me-2"></i>Live Chat Support';
            }
        }

        // Refresh content
        function refreshContent() {
            const frame = document.getElementById('contentFrame');
            frame.src = frame.src;
        }

        // Verify session
        async function verifySession() {
            try {
                const response = await fetch('api/staff_auth.php?action=verify_session');
                const data = await response.json();
                
                if (!data.success) {
                    console.log('Session expired, redirecting to login');
                    window.location.href = 'staff_login.php';
                }
            } catch (error) {
                console.error('Session verification error:', error);
                // Don't redirect on network errors, just log
            }
        }

        // Logout
        async function logout() {
            if (!confirm('Are you sure you want to logout?')) {
                return;
            }
            
            try {
                const response = await fetch('api/staff_auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'logout'
                    })
                });
                
                const data = await response.json();
                
                // Redirect regardless of response
                window.location.href = 'staff_login.php';
            } catch (error) {
                console.error('Logout error:', error);
                // Still redirect on error
                window.location.href = 'staff_login.php';
            }
        }

        // Handle iframe communication
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'staff_redirect') {
                // Handle redirects from iframe content
                if (event.data.url === 'login') {
                    window.location.href = 'staff_login.php';
                }
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = event.target.closest('[onclick*="toggleSidebar"]');
            
            if (window.innerWidth <= 768 && 
                !sidebar.contains(event.target) && 
                !sidebarToggle && 
                sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const page = urlParams.get('page') || '<?= $defaultPage ?>';
            switchPage(page);
        });
    </script>
</body>
</html>