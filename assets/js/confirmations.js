// Universal Confirmation System
// This provides reusable confirmation modals for delete and logout actions

(function() {
  'use strict';

  // Global variables for confirmation system
  let pendingAction = null;
  let pendingCallback = null;

  // Initialize confirmation system when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initializeConfirmationSystem();
  });

  function initializeConfirmationSystem() {
    // Handle delete confirmation
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function() {
        if (pendingCallback && typeof pendingCallback === 'function') {
          const callback = pendingCallback;
          pendingCallback = null;
          pendingAction = null;
          
          // Hide modal first
          const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
          if (deleteModal) deleteModal.hide();
          
          // Resolve promise with true (confirmed)
          callback(true);
        }
      });
    }

    // Handle logout confirmation
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener('click', function() {
        if (pendingCallback && typeof pendingCallback === 'function') {
          const callback = pendingCallback;
          pendingCallback = null;
          
          // Hide modal first
          const logoutModal = bootstrap.Modal.getInstance(document.getElementById('logoutConfirmModal'));
          if (logoutModal) logoutModal.hide();
          
          // Resolve promise with true (confirmed)
          callback(true);
          
          // Then proceed with logout
          setTimeout(() => {
            window.location.href = 'logout.php';
          }, 100);
        } else {
          // Fallback if no callback
          window.location.href = 'logout.php';
        }
      });
    }

    // Handle logout links with confirmation
    document.addEventListener('click', function(e) {
      if (e.target.matches('a[href="logout.php"], a[href*="logout"]')) {
        e.preventDefault();
        showLogoutConfirmation();
      }
    });
  }

  // Public API for showing confirmations
  window.showDeleteConfirmation = function(message) {
    return new Promise((resolve) => {
      // Store the resolve function
      pendingCallback = resolve;
      pendingAction = 'delete';

      // Update modal text
      const confirmText = document.getElementById('deleteConfirmText');
      if (confirmText) {
        confirmText.textContent = message || 'This action cannot be undone.';
      }

      // Show modal
      const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
      deleteModal.show();
      
      // Handle modal close without confirmation
      const modalElement = document.getElementById('deleteConfirmModal');
      modalElement.addEventListener('hidden.bs.modal', function onHidden() {
        modalElement.removeEventListener('hidden.bs.modal', onHidden);
        if (pendingCallback) {
          const callback = pendingCallback;
          pendingCallback = null;
          callback(false); // User cancelled
        }
      });
    });
  };

  window.showLogoutConfirmation = function() {
    return new Promise((resolve) => {
      // Store the resolve function  
      pendingCallback = resolve;
      
      // Show modal
      const logoutModal = new bootstrap.Modal(document.getElementById('logoutConfirmModal'));
      logoutModal.show();
      
      // Handle modal close without confirmation
      const modalElement = document.getElementById('logoutConfirmModal');
      modalElement.addEventListener('hidden.bs.modal', function onHidden() {
        modalElement.removeEventListener('hidden.bs.modal', onHidden);
        if (pendingCallback) {
          const callback = pendingCallback;
          pendingCallback = null;
          callback(false); // User cancelled
        }
      });
    });
  };

  // Utility function for generic confirmations
  window.showConfirmation = function(title, message, confirmText, callback, type = 'danger') {
    if (!callback || typeof callback !== 'function') {
      return;
    }

    // For now, use the delete modal as a generic confirmation
    // In the future, we could create a more generic modal
    pendingCallback = callback;
    
    const modalLabel = document.getElementById('deleteConfirmModalLabel');
    const confirmTextEl = document.getElementById('deleteConfirmText');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    if (modalLabel) modalLabel.innerHTML = title;
    if (confirmTextEl) confirmTextEl.textContent = message;
    if (confirmBtn) {
      confirmBtn.className = `btn btn-${type}`;
      confirmBtn.innerHTML = confirmText;
    }

    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
  };

})();