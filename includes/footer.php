<?php
// includes/footer.php
// Determine asset path based on current location
$assetPath = (strpos($_SERVER['REQUEST_URI'], '/public/') !== false) ? '../assets/' : 'assets/';
?>
    <!-- Footer -->
    <footer class="main-footer mt-5 pt-4 pb-3">
      <div class="container-xl">
        <div class="row align-items-center">
          <div class="col-12 col-md-6">
            <div class="footer-brand d-flex align-items-center footer-brand-container">
              <div class="footer-logo-wrapper position-relative me-3">
                <div class="footer-logo-bg"></div>
                <img src="<?= $assetPath ?>firmaflow-logo.jpg" alt="FirmaFlow Ledger" class="footer-logo">
                <div class="footer-logo-shine"></div>
              </div>
              <div class="footer-brand-text">
                <h6 class="footer-brand-main mb-0">FirmaFlow Ledger</h6>
                <p class="footer-brand-tagline mb-0">Business Management Excellence</p>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-6 text-center text-md-end mt-3 mt-md-0">
            <div class="footer-links">
              <small class="footer-copyright">
                © <?= date('Y') ?> FirmaFlow Ledger. All rights reserved.
              </small>
            </div>
          </div>
        </div>
        <hr class="my-3">
        <div class="row">
          <div class="col-12">
            <div class="footer-stats text-center">
              <small class="text-muted">
                <span class="d-inline-block"><i class="ti ti-shield-check me-1"></i>Secure</span>
                <span class="mx-2 d-none d-sm-inline">•</span>
                <span class="d-inline-block"><i class="ti ti-clock me-1"></i>Real-time</span>
                <span class="mx-2 d-none d-sm-inline">•</span>
                <span class="d-inline-block"><i class="ti ti-device-mobile me-1"></i>Mobile Friendly</span>
              </small>
            </div>
          </div>
        </div>
      </div>
    </footer>

    <!-- Universal Confirmation Modals -->
    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-labelledby="deleteConfirmModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content shadow-lg border-0">
          <div class="modal-body p-4 text-center">
            <div class="mb-3">
              <i class="ti ti-alert-triangle text-danger" style="font-size: 3rem;"></i>
            </div>
            <h5 class="mb-3">Are you sure you want to delete?</h5>
            <p class="text-muted mb-4" id="deleteConfirmText">This action cannot be undone.</p>
            <div class="d-grid gap-2">
              <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                <i class="ti ti-check me-2"></i>Yes, Delete
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="ti ti-x me-2"></i>Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <div class="modal fade" id="logoutConfirmModal" tabindex="-1" aria-labelledby="logoutConfirmModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content shadow-lg border-0">
          <div class="modal-body p-4 text-center">
            <div class="mb-3">
              <i class="ti ti-logout text-warning" style="font-size: 3rem;"></i>
            </div>
            <h5 class="mb-3">Are you sure you want to logout?</h5>
            <p class="text-muted mb-4">You will need to login again to access your account.</p>
            <div class="d-grid gap-2">
              <button type="button" class="btn btn-warning" id="confirmLogoutBtn">
                <i class="ti ti-check me-2"></i>Yes, Logout
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="ti ti-x me-2"></i>Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div> <!-- .app-main -->
</div> <!-- .app-shell -->

<style>
.main-footer {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid var(--bs-border-color, #e2e8f0);
  margin-top: auto;
  position: relative;
  overflow: hidden;
}

.main-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%);
  background-size: 200% 100%;
  animation: footerGradient 3s ease-in-out infinite;
}

@keyframes footerGradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.footer-brand-container {
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 12px;
}

.footer-brand-container:hover {
  background: rgba(102, 126, 234, 0.05);
  transform: translateY(-2px);
}

.footer-logo-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
}

.footer-logo-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 1;
}

.footer-logo {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 2;
  transition: transform 0.3s ease;
}

.footer-logo-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.1) 100%);
  z-index: 3;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.footer-brand-container:hover .footer-logo {
  transform: scale(1.1);
}

.footer-brand-container:hover .footer-logo-shine {
  opacity: 1;
}

.footer-brand-main {
  font-weight: 800;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.footer-brand-tagline {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-copyright {
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.footer-brand h6 {
  color: #1e293b;
  font-weight: 700;
}

.footer-links small {
  font-size: 0.8125rem;
}

.footer-stats small {
  font-size: 0.75rem;
  color: #64748b;
}

.footer-stats i {
  color: var(--bs-primary, #206bc4);
}

@media (max-width: 768px) {
  .main-footer {
    padding: 1.5rem 0;
    margin-top: 2rem;
  }
  
  .footer-brand-container {
    justify-content: center;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .footer-brand-main {
    font-size: 1rem;
  }
  
  .footer-brand-tagline {
    font-size: 0.875rem;
  }
  
  .footer-stats small {
    font-size: 0.6875rem;
  }
  
  .footer-links {
    text-align: center !important;
  }
  
  .footer-copyright {
    font-size: 0.75rem;
  }
}

@media (max-width: 576px) {
  .main-footer {
    padding: 1rem 0;
  }
  
  .footer-brand-container {
    flex-direction: column;
    align-items: center;
  }
  
  .footer-logo-wrapper {
    margin-bottom: 0.75rem;
    margin-right: 0 !important;
  }
  
  .footer-brand-text {
    text-align: center;
  }
  
  .footer-brand-main {
    font-size: 0.9rem;
  }
  
  .footer-brand-tagline {
    font-size: 0.7rem;
  }
  
  .footer-stats {
    margin-top: 0.5rem;
  }
  
  .footer-stats small {
    font-size: 0.625rem;
    display: block;
    line-height: 1.4;
  }
  
  .footer-stats i {
    display: inline-block;
    margin: 0 0.25rem;
  }
  
  .footer-stats span {
    display: inline-block;
    margin: 0.125rem 0.5rem;
  }
}

/* Improved footer container responsiveness */
.footer-brand {
  width: 100%;
}

.footer-brand-container {
  transition: all 0.3s ease;
}

/* Better mobile logo positioning */
@media (max-width: 480px) {
  .footer-logo-wrapper {
    width: 28px;
    height: 28px;
  }
  
  .footer-brand-main {
    font-size: 0.85rem;
  }
  
  .footer-brand-tagline {
    font-size: 0.65rem;
  }
}
</style>

<script>
// Global Mobile Sidebar Functions
window.toggleMobileSidebar = function() {
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('overlay');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const body = document.body;
  
  if (sidebar && overlay) {
    const isOpen = sidebar.classList.contains('open');
    
    if (isOpen) {
      // Close sidebar
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      overlay.style.display = 'none';
      if (menuBtn) menuBtn.classList.remove('active');
      body.style.overflow = ''; // Restore body scroll
      body.style.position = '';
    } else {
      // Open sidebar
      sidebar.classList.add('open');
      overlay.classList.add('show');
      overlay.style.display = 'block';
      if (menuBtn) menuBtn.classList.add('active');
      body.style.overflow = 'hidden'; // Prevent body scroll when sidebar is open
      body.style.position = 'fixed';
      body.style.width = '100%';
    }
  }
};

// Close mobile sidebar when clicking overlay
document.addEventListener('click', function(e) {
  const sidebar = document.getElementById('appSidebar');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const overlay = document.getElementById('overlay');
  
  // Close if clicking overlay
  if (e.target.id === 'overlay') {
    window.toggleMobileSidebar();
    return;
  }
  
  // Close if clicking outside sidebar and not on menu button
  if (sidebar && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && menuBtn && !menuBtn.contains(e.target)) {
      window.toggleMobileSidebar();
    }
  }
});

// Close sidebar on ESC key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const sidebar = document.getElementById('appSidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      window.toggleMobileSidebar();
    }
  }
});

// Logout function
async function logout() {
  const confirmed = await showLogoutConfirmation();
  if (confirmed) {
    try {
      // Determine the correct API path based on current location
      const apiPath = window.location.pathname.includes('/public/') ? '../api/auth.php' : 'api/auth.php';
      
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'logout'
        })
      });
      
      if (response.ok) {
        window.location.href = 'login.php';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API call fails
      window.location.href = 'login.php';
    }
  }
}
</script>

<!-- PWA Install and Service Worker Registration -->
<script src="<?= (strpos($_SERVER['REQUEST_URI'], '/public/') !== false) ? '../assets/' : 'assets/' ?>js/pwa-install.js"></script>
<script src="<?= (strpos($_SERVER['REQUEST_URI'], '/public/') !== false) ? '../assets/' : 'assets/' ?>js/offline-utils.js"></script>
<script>
// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('PWA: Service Worker registered successfully:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('PWA: New version available');
                            }
                        });
                    }
                });
            })
            .catch(function(error) {
                console.log('PWA: Service Worker registration failed:', error);
            });
    });
}

// Handle online/offline status for PWA
window.addEventListener('online', function() {
    console.log('PWA: Back online');
    document.body.classList.remove('offline');
});

window.addEventListener('offline', function() {
    console.log('PWA: Gone offline');
    document.body.classList.add('offline');
});
</script>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<!-- Tabler JS -->
<script src="https://unpkg.com/tabler@latest/dist/js/tabler.min.js"></script>
<!-- Universal Confirmation System -->
<script src="<?= $assetPath ?>js/confirmations.js"></script>
<!-- Notification System -->
<script src="<?= $assetPath ?>js/notifications.js"></script>
<!-- Global Messages Widget -->
<script src="<?= (strpos($_SERVER['REQUEST_URI'], '/public/') !== false) ? '../js/' : 'js/' ?>global-messages.js"></script>
<!-- Theme Manager - REMOVED to disable floating toggle button
<script src="<?= $assetPath ?>js/theme-manager.js"></script>
-->

</body>
</html>
