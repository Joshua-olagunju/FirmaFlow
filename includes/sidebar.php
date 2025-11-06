<?php
// includes/sidebar.php
// Must be included after header. Provide $active (string) on each page e.g. $active='dashboard'
$active = $active ?? 'dashboard';
?>
<div class="app-shell">
  <!-- Sidebar -->
  <aside id="appSidebar" class="app-sidebar card p-2">
    <!-- Fixed Header with Brand and Close Button -->
    <div class="d-flex align-items-center mb-3 px-2 sidebar-header">
      <?php 
      // Determine paths based on current location
      $basePath = (strpos($_SERVER['REQUEST_URI'], '/public/') !== false) ? '../' : '';
      $logoPath = $basePath . 'assets/firmaflow-logo.jpg';
      $indexPath = $basePath . 'index.php';
      ?>
      
      <a href="<?= $indexPath ?>" class="d-flex align-items-center text-decoration-none sidebar-brand-link flex-grow-1">
        <div class="logo-container position-relative me-2">
          <div class="logo-background"></div>
          <img src="<?= $logoPath ?>" alt="FirmaFlow Ledger" class="sidebar-logo">
          <div class="logo-overlay"></div>
        </div>
        <div class="brand-text ms-1">
          <div class="brand-main">FirmaFlow</div>
          <div class="brand-sub">Ledger</div>
        </div>
      </a>
      
      <!-- Mobile Close Button -->
      <button class="mobile-close-btn d-lg-none" onclick="toggleMobileSidebar()" aria-label="Close Navigation">
        <i class="ti ti-x"></i>
      </button>
      
      <!-- Desktop Collapse Button -->
      <button id="collapseBtn" class="btn btn-sm d-none d-lg-inline">⟨</button>
    </div>

    <style>
    .sidebar-brand-link {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 0.5rem;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
    }
    
    .sidebar-brand-link:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
    }
    
    .logo-container {
      width: 36px;
      height: 36px;
      position: relative;
      border-radius: 10px;
      overflow: hidden;
    }
    
    .logo-background {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      z-index: 1;
    }
    
    .sidebar-logo {
      position: relative;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 10px;
      z-index: 2;
      transition: transform 0.3s ease;
    }
    
    .logo-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
      border-radius: 10px;
      z-index: 3;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .sidebar-brand-link:hover .sidebar-logo {
      transform: scale(1.05);
    }
    
    .sidebar-brand-link:hover .logo-overlay {
      opacity: 1;
    }
    
    .brand-text {
      position: relative;
    }
    
    .brand-main {
      font-weight: 800;
      font-size: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.2;
      letter-spacing: -0.02em;
      position: relative;
    }
    
    .brand-sub {
      font-weight: 600;
      font-size: 0.7rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      line-height: 1;
      margin-top: -2px;
      position: relative;
    }
    
    .brand-sub::before {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 0;
      height: 1px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s ease;
    }
    
    .sidebar-brand-link:hover .brand-sub::before {
      width: 100%;
    }
    
    @keyframes logoGlow {
      0%, 100% { box-shadow: 0 0 10px rgba(102, 126, 234, 0.3); }
      50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.5); }
    }
    
    .sidebar-brand-link:hover .logo-container {
      animation: logoGlow 2s ease-in-out infinite;
    }
    </style>

    <nav class="nav nav-pills flex-column">
      <?php
      // Get user role for role-based menu
      $userRole = $currentUser['role'] ?? 'user';
      
      // Check subscription status for access control
      $hasAccess = true; // Default to true
      
      // Enable subscription checks
      if (function_exists('canUserAccessSystem') && isset($currentUser['id'])) {
        require_once __DIR__ . '/subscription_helper.php';
        $hasAccess = canUserAccessSystem($currentUser['id']);
      }
      
      // Define menu items in the requested order
      // Determine base path for navigation
      $navBasePath = (strpos($_SERVER['REQUEST_URI'], '/public/') !== false) ? '' : 'public/';
      
      $fullMenu = [
        'dashboard'=>['label'=>'Dashboard','href'=>$navBasePath.'user_dashboard.php','icon'=>'ti ti-layout-dashboard', 'roles'=>['admin','manager','user'], 'requires_subscription'=>false],
        'customers'=>['label'=>'Customers','href'=>$navBasePath.'customers.php','icon'=>'ti ti-users', 'roles'=>['admin','manager','user'], 'requires_subscription'=>true],
        'suppliers'=>['label'=>'Suppliers','href'=>$navBasePath.'suppliers.php','icon'=>'ti ti-truck', 'roles'=>['admin','manager'], 'requires_subscription'=>true],
        'products'=>['label'=>'Inventory','href'=>$navBasePath.'products.php','icon'=>'ti ti-package', 'roles'=>['admin','manager','user'], 'requires_subscription'=>true],
        'sales'=>['label'=>'Sales','href'=>$navBasePath.'sales.php','icon'=>'ti ti-receipt', 'roles'=>['admin','manager','user'], 'requires_subscription'=>true],
        'payments'=>['label'=>'Payments','href'=>$navBasePath.'payments.php','icon'=>'ti ti-credit-card', 'roles'=>['admin','manager','user'], 'requires_subscription'=>true],
        'purchases'=>['label'=>'Purchases','href'=>$navBasePath.'purchases.php','icon'=>'ti ti-package', 'roles'=>['admin','manager'], 'requires_subscription'=>true],
        'expenses'=>['label'=>'Expenses','href'=>$navBasePath.'expenses.php','icon'=>'ti ti-receipt-off', 'roles'=>['admin','manager'], 'requires_subscription'=>true],
        'reports'=>['label'=>'Reports','href'=>$navBasePath.'reports.php','icon'=>'ti ti-chart-pie', 'roles'=>['admin','manager'], 'requires_subscription'=>false],
        'advanced_reports'=>['label'=>'Advanced Reports','href'=>$navBasePath.'advanced_reports.php','icon'=>'ti ti-chart-line', 'roles'=>['admin','manager'], 'requires_subscription'=>false],
        'settings'=>['label'=>'Settings','href'=>$navBasePath.'settings.php','icon'=>'ti ti-settings', 'roles'=>['admin','manager'], 'requires_subscription'=>false],
      ];
      
      // Filter menu based on user role
      $menu = array_filter($fullMenu, function($item) use ($userRole) {
        return in_array($userRole, $item['roles']);
      });
      
      foreach ($menu as $key=>$m):
        $isActive = ($key === $active) ? 'active' : '';
        $requiresSubscription = $m['requires_subscription'] ?? false;
        
        // If subscription required and user doesn't have access, show disabled item
        if ($requiresSubscription && !$hasAccess):
      ?>
        <div class="sidebar-link disabled" style="opacity: 0.5; cursor: not-allowed;" onclick="showSubscriptionAlert()">
          <span class="sidebar-icon <?= $m['icon'] ?>" aria-hidden="true"></span>
          <span class="sidebar-label"><?= $m['label'] ?> <i class="ti ti-lock text-warning"></i></span>
        </div>
      <?php else: ?>
        <a class="sidebar-link <?= $isActive ?>" href="<?= $m['href'] ?>">
          <span class="sidebar-icon <?= $m['icon'] ?>" aria-hidden="true"></span>
          <span class="sidebar-label"><?= $m['label'] ?></span>
        </a>
      <?php endif; ?>
      <?php endforeach; ?>
      
      <?php if (!$hasAccess): ?>
      <!-- Subscription Alert in Sidebar -->
      <div class="mt-3 p-2 bg-warning bg-opacity-10 rounded border border-warning">
        <div class="text-center">
          <i class="ti ti-alert-triangle text-warning mb-1" style="font-size: 1.2rem;"></i>
          <div class="small fw-bold text-warning">Subscription Required</div>
          <div class="small text-muted mb-2">Renew to access all features</div>
          <a href="public/subscription.php" class="btn btn-warning btn-sm">
            <i class="ti ti-crown me-1"></i>Subscribe
          </a>
        </div>
      </div>
      <?php endif; ?>
    </nav>

    <div class="mt-auto px-2">
      <hr/>
      <?php 
      // Ensure we have fresh user data
      if (!isset($currentUser)) {
        require_once __DIR__ . '/auth.php';
        $currentUser = getCurrentUser();
      }
      
      if ($currentUser && !empty($currentUser['name'])): ?>
        <div class="d-flex align-items-center mb-2">
          <div class="avatar avatar-sm me-2" style="background: #667eea; color: white;">
            <?= strtoupper(substr($currentUser['name'], 0, 2)) ?>
          </div>
          <div class="flex-grow-1">
            <div class="small fw-semibold"><?= htmlspecialchars($currentUser['name']) ?></div>
            <div class="small text-muted"><?= htmlspecialchars($currentUser['company_name'] ?? 'Company') ?></div>
          </div>
        </div>
        <button class="btn btn-outline-danger btn-sm w-100" onclick="logout()">
          <span class="ti ti-logout me-1"></span>
          Logout
        </button>
      <?php else: ?>
        <div class="text-center text-muted small">
          <div class="mb-2">
            <i class="ti ti-user-off" style="font-size: 1.5rem;"></i>
          </div>
          <div>Not authenticated</div>
          <a href="public/login.php" class="btn btn-primary btn-sm mt-2">
            <span class="ti ti-login me-1"></span>
            Login
          </a>
        </div>
      <?php endif; ?>
    </div>
  </aside>

  <!-- overlay for mobile -->
  <div id="overlay" class="overlay" style="display:none;"></div>

  <!-- Main content area -->
  <div class="app-main">

<script>
// Function to show subscription alert when clicking disabled menu items
function showSubscriptionAlert() {
  // Create modal if it doesn't exist
  let modal = document.getElementById('subscriptionModal');
  if (!modal) {
    const modalHtml = `
      <div class="modal fade" id="subscriptionModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="ti ti-lock text-warning me-2"></i>Subscription Required
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center">
              <div class="mb-3">
                <i class="ti ti-alert-triangle text-warning" style="font-size: 3rem;"></i>
              </div>
              <h6>Access Restricted</h6>
              <p class="text-muted mb-4">Your subscription has expired. Please renew your subscription to continue using all features of Ledgerly.</p>
              <div class="d-grid gap-2">
                <a href="public/subscription.php" class="btn btn-warning">
                  <i class="ti ti-crown me-2"></i>Renew Subscription
                </a>
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    modal = document.getElementById('subscriptionModal');
  }
  
  // Show modal
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}
</script>
