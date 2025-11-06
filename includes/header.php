<?php
// includes/header.php
require_once __DIR__ . '/auth.php';

// Get current page name
$currentPage = basename($_SERVER['PHP_SELF']);
$publicPages = ['login.php', 'signup.php', 'landing.php', 'index.php'];

// Only check authentication for protected pages
if (!in_array($currentPage, $publicPages)) {
    checkAuthentication();
    // Get current user info for authenticated pages
    $currentUser = getCurrentUser();
} else {
    // For public pages, set currentUser to null
    $currentUser = null;
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title><?= htmlspecialchars($pageTitle ?? 'Ledgerly') ?></title>

  <?php 
  // Determine favicon path based on current location
  $iconBasePath = (strpos($_SERVER['REQUEST_URI'], '/public/') !== false) ? '../assets/icons/' : 'assets/icons/';
  $logoPath = (strpos($_SERVER['REQUEST_URI'], '/public/') !== false) ? '../assets/firmaflow-logo.jpg' : 'assets/firmaflow-logo.jpg';
  ?>
  
  <!-- Favicon and App Icons -->
  <link rel="icon" type="image/png" sizes="32x32" href="<?= $iconBasePath ?>icon-72x72.png">
  <link rel="icon" type="image/png" sizes="16x16" href="<?= $iconBasePath ?>icon-72x72.png">
  <link rel="shortcut icon" type="image/png" href="<?= $iconBasePath ?>icon-72x72.png">
  <link rel="apple-touch-icon" sizes="180x180" href="<?= $iconBasePath ?>icon-192x192.png">
  <link rel="apple-touch-icon" sizes="152x152" href="<?= $iconBasePath ?>icon-152x152.png">
  <link rel="apple-touch-icon" sizes="144x144" href="<?= $iconBasePath ?>icon-144x144.png">

  <!-- PWA Configuration -->
  <link rel="manifest" href="/manifest.json">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="FirmaFlow">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="msapplication-config" content="/browserconfig.xml">
  
  <!-- Additional PWA Icons for iOS -->
  <link rel="apple-touch-icon" sizes="72x72" href="<?= $iconBasePath ?>icon-72x72.png">
  <link rel="apple-touch-icon" sizes="96x96" href="<?= $iconBasePath ?>icon-96x96.png">
  <link rel="apple-touch-icon" sizes="128x128" href="<?= $iconBasePath ?>icon-128x128.png">
  <link rel="apple-touch-icon" sizes="384x384" href="<?= $iconBasePath ?>icon-384x384.png">
  <link rel="apple-touch-icon" sizes="512x512" href="<?= $iconBasePath ?>icon-512x512.png">

  <!-- Meta Tags for Social Media -->
  <meta name="theme-color" content="#667eea">
  <meta name="msapplication-TileColor" content="#667eea">
  <meta name="msapplication-TileImage" content="<?= $faviconPath ?>">
  <meta property="og:type" content="website">
  <meta property="og:image" content="<?= $faviconPath ?>">
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:image" content="<?= $faviconPath ?>">

  <!-- Bootstrap CSS (primary) -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <!-- Tabler Icons (secondary) -->
  <link href="https://unpkg.com/@tabler/icons-webfont@1.39.1/dist/tabler-icons.min.css" rel="stylesheet"/>
  
  <?php 
  // Determine asset path based on current location
  $assetPath = (strpos($_SERVER['REQUEST_URI'], '/public/') !== false) ? '../assets/' : 'assets/';
  ?>
  
  <!-- Theme System -->
  <link href="<?= $assetPath ?>css/themes.css" rel="stylesheet"/>
  <!-- Mobile CSS -->
  <link href="<?= $assetPath ?>css/mobile.css" rel="stylesheet"/>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    /* Layout tweaks */
    body { 
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }
    .app-shell { display:flex; min-height:100vh; }
    
    /* Desktop Sidebar Styles */
    @media (min-width: 992px) {
      .app-sidebar {
        display: block !important;
        position: relative !important;
        width: 260px !important;
        height: auto !important;
        transition: none !important;
        right: auto !important;
        transform: none !important;
        visibility: visible !important;
        opacity: 1 !important;
        /* Prevent sidebar from shrinking before breakpoint */
        flex: 0 0 260px !important; /* no grow, no shrink, fixed basis */
        flex-shrink: 0 !important;
        min-width: 260px !important;
        max-width: 260px !important;
      }
      .app-sidebar.collapsed { 
        width: 64px; 
        flex: 0 0 64px !important;
        min-width: 64px !important;
        max-width: 64px !important;
      }
      .app-main { 
        flex: 1; 
        margin-left: 0; 
        padding-left: 1rem;
        padding-right: 1rem;
        transition: none;
        /* Allow content to shrink, not the sidebar */
        min-width: 0;
        overflow: hidden;
      }
      /* Ensure overlay is hidden on desktop */
      .overlay {
        display: none !important;
      }
      /* Ensure mobile menu button is hidden on desktop */
      .mobile-menu-btn {
        display: none !important;
      }
    }
    
    .app-main { flex:1; }
    .sidebar-link { display:flex; align-items:center; gap:.75rem; padding:.6rem .8rem; border-radius:.375rem; color:inherit; text-decoration:none; }
    .sidebar-link.active { background:#f1f5f9; font-weight:600; }
    .sidebar-icon { font-size:1.15rem; width:28px; display:inline-block; text-align:center; }
    
    /* Main Header Styles */
    .main-header {
      background-color: var(--bs-primary, #206bc4);
      background-image: none;
      color: white;
      padding: 1.5rem 0;
      margin: -1rem -1rem 0 -1rem;
      border-radius: 0 0 16px 16px;
      box-shadow: 0 4px 20px var(--shadow-color, rgba(32, 107, 196, 0.15));
    }
    
    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
    }
    
    .page-subtitle {
      margin: 0.5rem 0 0 0;
      opacity: 0.9;
      font-size: 0.95rem;
    }
    
    .user-info-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      color: #667eea;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.1rem;
    }
    
    .user-name {
      font-weight: 600;
      font-size: 0.95rem;
    }
    
    .user-role {
      font-size: 0.8rem;
      opacity: 0.8;
    }
    
    /* Stat Cards */
    .stat-card {
      background: white;
      border-radius: 16px;
      
      padding: 1.5rem;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }
    
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
    }
    
    .stat-icon.customers { background: var(--bs-primary, #206bc4); }
    .stat-icon.products { background: var(--bs-success, #2fb344); }
    .stat-icon.sales { background: var(--bs-warning, #ffc107); }
    .stat-icon.warning { background: var(--bs-danger, #d63384); }
    .stat-icon.active { background: var(--bs-info, #17a2b8); }
    .stat-icon.outstanding { background: var(--bs-secondary, #6c757d); }
    
    .stat-content {
      flex: 1;
    }
    
    .stat-number {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      transition: transform 0.2s ease;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
      margin-top: 0.25rem;
    }
    
    .stat-change {
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .stat-change.positive { color: #16a34a; }
    .stat-change.negative { color: #dc2626; }
    .stat-change.neutral { color: #64748b; }
    
    /* Enhanced Cards */
    .card {
      border-radius: 16px;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }
    
    .card:hover {
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }
    
    .card-header {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 16px 16px 0 0;
      padding: 1.25rem 1.5rem;
    }
    
    .card-title {
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      margin: 0;
    }
    
    /* Empty States */
    .empty {
      text-align: center;
      padding: 3rem 1rem;
    }
    
    .empty-icon {
      font-size: 3rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }
    
    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
    }
    
    .empty-subtitle {
      color: #64748b;
      margin: 0;
    }
    
    /* Loading Overlays */
    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: 12px;
    }
    
    /* Mobile-First Responsive Design */
    @media (max-width: 991.98px) { 
      /* Ensure mobile menu button is visible */
      .mobile-menu-btn {
        display: flex !important;
      }
      
      /* Mobile Sidebar - Slide from Right with Perfect Scrolling */
      .app-sidebar { 
        position: fixed !important; 
        /* Prevent sidebar from shrinking before breakpoint */
        flex: 0 0 260px !important; /* no grow, no shrink, fixed basis */
        flex-shrink: 0 !important;
        min-width: 260px !important;
        top: 0 !important; 
        bottom: 0 !important; 
        right: -100% !important; /* Start completely hidden */
        width: 280px !important;
        height: 100vh !important;
        z-index: 9999 !important; /* Very high z-index */
        background: #ffffff !important;
        transition: none;
        /* Allow content to shrink, not the sidebar */
        min-width: 0;
        box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3) !important;
        transition: right 0.3s ease-in-out !important;
        padding: 0 !important; /* Remove padding to allow proper layout */
        overflow: hidden !important; /* Prevent main container scroll */
        /* Remove conflicting transforms */
        transform: none !important;
        visibility: visible !important;
        display: flex !important; /* Use flexbox for proper layout */
        flex-direction: column !important;
        /* Ensure content is visible */
        color: #333 !important;
        font-size: 14px !important;
      } 
      
      .app-sidebar.open { 
        right: 0 !important; /* Slide to visible position */
        box-shadow: -15px 0 40px rgba(0, 0, 0, 0.4) !important;
      }
      
      /* Mobile Sidebar Layout - Fixed Header, Scrollable Content, Fixed Footer */
      .app-sidebar > .sidebar-header,
      .app-sidebar > .d-flex:first-child {
        /* Sidebar brand/header - fixed at top */
        flex-shrink: 0 !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        padding: 1.25rem !important;
        margin: -0.5rem -0.5rem 0 -0.5rem !important;
        position: relative !important;
        border-radius: 0 !important;
      }
      
      .app-sidebar .sidebar-header *,
      .app-sidebar .d-flex:first-child * {
        color: white !important;
      }
      
      .app-sidebar .sidebar-header .brand-main,
      .app-sidebar .d-flex:first-child .brand-main {
        background: white !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
      }
      
      .app-sidebar > .nav {
        /* Navigation menu - scrollable middle section */
        flex: 1 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        padding: 1rem !important;
        margin: 0 !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: thin !important;
        scrollbar-color: #cbd5e1 transparent !important;
        max-height: calc(100vh - 240px) !important; /* Reserve space for header and footer */
      }
      
      .app-sidebar > .nav::-webkit-scrollbar {
        width: 6px !important;
      }
      
      .app-sidebar > .nav::-webkit-scrollbar-track {
        background: transparent !important;
      }
      
      .app-sidebar > .nav::-webkit-scrollbar-thumb {
        background: #cbd5e1 !important;
        border-radius: 3px !important;
      }
      
      .app-sidebar > .nav::-webkit-scrollbar-thumb:hover {
        background: #94a3b8 !important;
      }
      
      .app-sidebar > .mt-auto {
        /* User section/logout - fixed at bottom */
        flex-shrink: 0 !important;
        background: #f8faff !important;
        padding: 1rem !important;
        margin: 0 -0.5rem -0.5rem -0.5rem !important;
        border-top: 1px solid #e2e8f0 !important;
      }
      
      /* Mobile Close Button */
      .mobile-close-btn {
        background: rgba(255, 255, 255, 0.2) !important;
        border: none !important;
        color: white !important;
        border-radius: 50% !important;
        width: 32px !important;
        height: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 1.1rem !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        margin-left: auto !important;
      }
      
      .mobile-close-btn:hover {
        background: rgba(255, 255, 255, 0.3) !important;
        transform: scale(1.1) !important;
      }
      
      /* Mobile Navigation Links */
      .app-sidebar .sidebar-link {
        padding: 0.875rem 1rem !important;
        margin: 0.25rem 0 !important;
        border-radius: 12px !important;
        font-size: 1rem !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        position: relative !important;
        display: flex !important;
        align-items: center !important;
        gap: 1rem !important;
        color: #333 !important;
        text-decoration: none !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      
      .app-sidebar .sidebar-link:hover {
        background: #f8faff;
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
      }
      
      .app-sidebar .sidebar-link.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }
      
      .app-sidebar .sidebar-link.active .sidebar-icon {
        color: white;
      }
      
      .app-sidebar .sidebar-icon {
        font-size: 1.4rem !important;
        color: #667eea !important;
        width: 24px !important;
        text-align: center !important;
        display: inline-block !important;
        flex-shrink: 0 !important;
      }
      
      .app-sidebar .sidebar-label {
        color: #333 !important;
        font-weight: 500 !important;
        flex: 1 !important;
      }
      
      /* Ensure navigation container is visible */
      .app-sidebar .nav {
        display: block !important;
        width: 100% !important;
      }
      
      .app-sidebar .nav .sidebar-link {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        width: 100% !important;
      }
      
      /* Ensure all sidebar content is visible */
      .app-sidebar * {
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      .app-sidebar .sidebar-link.active .sidebar-icon {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      
      /* Mobile User Section */
      .app-sidebar .mt-auto {
        background: #f8faff;
        padding: 1rem;
        margin: 1rem -1rem -1rem -1rem;
        border-radius: 0 0 0 20px;
      }
      
      .app-sidebar .avatar {
        width: 45px;
        height: 45px;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 700;
      }
      
      .app-sidebar .btn-outline-danger {
        padding: 0.75rem 1rem;
        border-radius: 10px;
        font-weight: 600;
        transition: all 0.2s ease;
      }
      
      .app-sidebar .btn-outline-danger:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(214, 51, 132, 0.3);
      }
      
      /* Mobile Overlay */
      .overlay { 
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.5) !important;
        z-index: 9998 !important; /* Just below sidebar */
        backdrop-filter: blur(4px) !important;
        transition: all 0.3s ease !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        display: none !important;
      } 
      
      .overlay.show { 
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: all !important;
        display: block !important;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* Main Content Adjustments */
      .app-main {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .app-main.sidebar-open {
        transform: translateX(-20px);
      }
      
      .main-header { margin: -1rem -0.5rem 0 -0.5rem; }
      .stat-card { padding: 1rem; }
      .stat-icon { width: 48px; height: 48px; font-size: 1.25rem; }
      .stat-number { font-size: 1.5rem; }
      
      /* Hide desktop collapse button on mobile */
      #collapseBtn {
        display: none !important;
      }
      
      /* Override any desktop styles that might conflict */
      .app-sidebar {
        /* All mobile styles already defined above with !important */
        /* This ensures desktop width styles don't interfere */
        width: 280px !important;
        min-width: 280px !important;
        max-width: 280px !important;
        /* Final mobile styling */
      }
      
      .app-sidebar.collapsed {
        /* Prevent desktop collapsed state from affecting mobile */
        width: 280px !important;
        right: -100% !important;
      }
      
      .app-sidebar.collapsed.open {
        /* Ensure open state works even if collapsed class exists */
        right: 0 !important;
        width: 280px !important;
      }
    }
  </style>

  <?php if (!defined('NO_EXTRA_HEAD')): ?>
  <!-- extra head placeholder -->
  <?php endif; ?>
</head>
<body>

<!-- Offline Indicator -->
<div class="offline-indicator" id="offline-indicator">
  <i class="ti ti-wifi-off me-2"></i>
  You're working offline. Some features may be limited.
  <span class="offline-badge">OFFLINE</span>
</div>
