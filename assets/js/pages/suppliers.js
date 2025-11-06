(() => {
  // state & elements
  const apiBase = '../api/suppliers.php';
  const alertsEl = document.getElementById('alerts');
  const tbody = document.querySelector('#suppliers-table tbody');
  const countEl = document.getElementById('suppliers-count');
  const btnAdd = document.getElementById('btnAddSupplier');
  const form = document.getElementById('supplierForm');
  const saveBtn = document.getElementById('saveSupplierBtn');
  const supplierModalEl = document.getElementById('supplierModal');
  const bsSupplierModal = new bootstrap.Modal(supplierModalEl, { backdrop: 'static' });

  // Navigation Guide Modal
  const navigationGuideModalEl = document.getElementById('navigationGuideModal');
  const bsNavigationGuideModal = new bootstrap.Modal(navigationGuideModalEl, { backdrop: 'static' });
  let navigationGuideTimer = null;

  // Pagination state
  let allSuppliers = []; // Store all suppliers data
  let currentPage = 1;
  const itemsPerPage = 10;

  // helpers
  function showAlert(msg, type='success', timeout=5000) {
    const id = 'alert-' + Date.now();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `\n      <div id="${id}" class="alert alert-${type} alert-dismissible fade show" role="alert">\n        ${escapeHtml(msg)}\n        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>\n      </div>\n    `;
    alertsEl.prepend(wrapper.firstElementChild);
    if (timeout) setTimeout(() => { const el = document.getElementById(id); if (el) el.remove(); }, timeout);
  }

  function escapeHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Navigation Guide Modal Functions
  function isTableEmpty() {
    const tbody = document.querySelector('#suppliers-table tbody');
    if (!tbody) return true;
    
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0) return true;
    
    // Check if it's showing "No suppliers yet" message
    const firstRow = rows[0];
    if (firstRow && firstRow.textContent.includes('No suppliers')) return true;
    
    return false;
  }

  function shouldShowNavigationGuide() {
    // Check if user has opted out
    if (localStorage.getItem('supplierNavigationGuideDisabled') === 'true') {
      return false;
    }
    
    // Check if table is empty
    return isTableEmpty();
  }

  function showNavigationGuide() {
    if (shouldShowNavigationGuide()) {

      bsNavigationGuideModal.show();
    } else {

    }
  }

  function startNavigationGuideTimer() {
    // Clear existing timer
    if (navigationGuideTimer) {
      clearInterval(navigationGuideTimer);
    }
    
    // Set up 10-minute recurring timer
    navigationGuideTimer = setInterval(() => {
      if (shouldShowNavigationGuide()) {
        showNavigationGuide();
      }
    }, 10 * 60 * 1000); // 10 minutes in milliseconds
    

  }

  function stopNavigationGuideTimer() {
    if (navigationGuideTimer) {
      clearInterval(navigationGuideTimer);
      navigationGuideTimer = null;

    }
  }

  // Make close function globally available
  window.closeNavigationGuide = function() {
    // Check if user wants to disable future popups
    const dontShowAgain = document.getElementById('dontShowAgain');
    if (dontShowAgain && dontShowAgain.checked) {
      localStorage.setItem('supplierNavigationGuideDisabled', 'true');
      stopNavigationGuideTimer();

    }
    
    bsNavigationGuideModal.hide();
  };

  // Dynamic currency formatting using system settings
  const CURRENCY_CONFIG = window.supplierCurrencyConfig || { symbol: '$', position: 'before', decimals: 2 };
  const SYSTEM_CURRENCY = window.supplierSystemCurrency || 'USD';
  

    currency: SYSTEM_CURRENCY,
    config: CURRENCY_CONFIG
  });
  
  function formatCurrency(amount) {
    const n = parseFloat(amount || 0);
    if (isNaN(n)) return CURRENCY_CONFIG.symbol + '0' + (CURRENCY_CONFIG.decimals > 0 ? '.' + '0'.repeat(CURRENCY_CONFIG.decimals) : '');
    
    const formatted = n.toFixed(CURRENCY_CONFIG.decimals);
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const numberStr = parts.join('.');
    
    return CURRENCY_CONFIG.position === 'before' 
      ? CURRENCY_CONFIG.symbol + numberStr
      : numberStr + CURRENCY_CONFIG.symbol;
  }
  
  // Function to refresh currency formatting (useful when settings change)
  function refreshCurrencyDisplay() {
    // Re-render all existing supplier data with updated currency
    if (window.allSuppliers && window.allSuppliers.length > 0) {
      displaySuppliers(window.allSuppliers);
    }
  }

  function normalizeApiResponse(json) {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (json.success && Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.suppliers)) return json.suppliers;
    if (Array.isArray(json.rows)) return json.rows;
    if (Array.isArray(json.items)) return json.items;
    return Object.values(json).filter(v => v && typeof v === 'object' && ('id' in v || 'name' in v));
  }

  function buildSupplierRow(s) {
    const isActive = Number(s.is_active) === 1 || s.is_active === true;
    const statusBadge = isActive ? 'success' : 'secondary';
    const phone = s.phone || 'N/A';
    const email = s.email || 'N/A';
    const address = s.address || s.billing_address || 'No address';
    const balance = formatCurrency(s.balance_due || s.balance || 0);

    return `
      <tr data-id="${s.id}">
        <td class="text-start">${escapeHtml(s.name || '')}</td>
        <td>${escapeHtml(s.contact_person || '')}</td>
        <td>${escapeHtml(phone)}</td>
        <td>${escapeHtml(email)}</td>
        <td class="text-end fw-semibold">${balance}</td>
        <td><span class="badge bg-${statusBadge}">${isActive ? 'Active' : 'Inactive'}</span></td>
        <td class="text-center">
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" aria-expanded="false">
              <i class="ti ti-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#" data-action="view" data-id="${s.id}">
                <i class="ti ti-eye me-2 text-info"></i>View Details
              </a></li>
              <li><a class="dropdown-item" href="#" data-action="edit" data-id="${s.id}">
                <i class="ti ti-edit me-2 text-primary"></i>Edit Supplier
              </a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#" data-action="comprehensive-report" data-id="${s.id}">
                <i class="ti ti-report me-2 text-success"></i>Complete Supplier Report
              </a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" data-action="delete" data-id="${s.id}">
                <i class="ti ti-trash me-2"></i>Delete Supplier
              </a></li>
            </ul>
          </div>
        </td>
      </tr>
    `;
  }

  // Dropdown moving map
  const movedMap = new WeakMap();

  /* ---------- ACTION MENU MOVING (so dropdowns are never clipped) ---------- */
  function initActionMenus() {
    // Avoid duplicate initialization - exactly like other pages
    document.querySelectorAll('#suppliers-table .dropdown, .table .dropdown').forEach(wrapper => {
      const toggle = wrapper.querySelector('[data-bs-toggle="dropdown"], .dropdown-toggle');
      const menu = wrapper.querySelector('.dropdown-menu');
      if (!toggle || !menu) return;
      if (toggle.getAttribute('data-action-initialized')) return;
      toggle.setAttribute('data-action-initialized', '1');

      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // If already moved and shown -> close
        if (menu.classList.contains('show') && movedMap.has(menu)) {
          closeMenu(menu);
          return;
        }
        openMenu(menu, toggle);
      });
    });
  }

  function openMenu(menu, toggle) {
    const parent = menu.parentElement;
    const nextSibling = menu.nextElementSibling;
    movedMap.set(menu, { parent, nextSibling, toggle });

    // prepare and move
    menu.style.visibility = 'hidden';
    menu.setAttribute('data-moving', '1');
    document.body.appendChild(menu);

    // show and position
    menu.classList.add('show');
    menu.style.position = 'absolute';
    const rect = toggle.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY}px`;

    const alignEnd = menu.classList.contains('dropdown-menu-end');
    const menuWidth = menu.offsetWidth;
    let left = rect.left + window.scrollX;
    if (alignEnd) left = rect.right + window.scrollX - menuWidth;

    const viewportWidth = document.documentElement.clientWidth;
    if (left + menuWidth + 8 > viewportWidth) left = Math.max(8, viewportWidth - menuWidth - 8);
    if (left < 8) left = 8;

    menu.style.left = `${Math.round(left)}px`;
    menu.style.minWidth = `${Math.max(rect.width, menuWidth)}px`;
    menu.style.zIndex = 2500;
    menu.style.visibility = 'visible';
    toggle.setAttribute('aria-expanded', 'true');

    // add listeners to close on outside click / esc / resize / scroll
    setTimeout(() => {
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onDocKeyDown);
      window.addEventListener('resize', onWindowChange);
      window.addEventListener('scroll', onWindowChange, true);
    }, 0);
  }

  function closeMenu(menu) {
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onDocKeyDown);
    window.removeEventListener('resize', onWindowChange);
    window.removeEventListener('scroll', onWindowChange, true);

    menu.classList.remove('show');
    const info = movedMap.get(menu);
    if (info) {
      const toggle = info.toggle;
      toggle.setAttribute('aria-expanded', 'false');

      // clean inline styles
      menu.style.position = '';
      menu.style.top = '';
      menu.style.left = '';
      menu.style.minWidth = '';
      menu.style.zIndex = '';
      menu.style.visibility = '';
      menu.removeAttribute('data-moving');

      // move back to original parent
      if (info.nextSibling) {
        info.parent.insertBefore(menu, info.nextSibling);
      } else {
        info.parent.appendChild(menu);
      }
      movedMap.delete(menu);
    }
  }

  function onDocClick(e) {
    const clickedDropdown = e.target.closest('.dropdown');
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      if (movedMap.has(menu)) {
        const info = movedMap.get(menu);
        const menuDropdown = info.parent;
        if (menuDropdown !== clickedDropdown) {
          closeMenu(menu);
        }
      }
    });
  }

  function onDocKeyDown(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        if (movedMap.has(menu)) closeMenu(menu);
      });
    }
  }

  function onWindowChange() {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      if (movedMap.has(menu)) closeMenu(menu);
    });
  }
  /* ---------- End action menus ---------- */

  async function fetchSuppliers(search = '') {
    try {
      // Reset pagination when searching or fetching new data
      currentPage = 1;
      
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-5 text-center text-muted">
            <div class="d-flex flex-column align-items-center">
              <div class="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>
              <div>Loading suppliers...</div>
            </div>
          </td>
        </tr>
      `;
      countEl.textContent = '';
      
      // Hide pagination while loading
      document.getElementById('pagination-container').style.display = 'none';

      let url = apiBase;
      if (search) url += `?search=${encodeURIComponent(search)}`;
      
      const resp = await fetch(url, { credentials: 'same-origin' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const json = await resp.json();
      const list = normalizeApiResponse(json);
      


      if (!Array.isArray(list) || list.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-5">
              <div class="empty-state">
                <div class="empty-icon mb-3">
                  <i class="ti ti-truck" style="font-size: 3rem; color: #cbd5e1;"></i>
                </div>
                <h5 class="empty-title">No suppliers found</h5>
                <p class="empty-subtitle mb-4">Start building your supplier network by adding your first supplier.</p>
                <button type="button" class="btn btn-primary" id="emptyAddSupplier">
                  <i class="ti ti-plus me-2"></i>Add First Supplier
                </button>
              </div>
            </td>
          </tr>
        `;
        const el = document.getElementById('emptyAddSupplier'); if (el) el.addEventListener('click', (e) => { e.preventDefault(); openAddSupplier(); });
        countEl.textContent = '0 suppliers';
        // Keep pagination hidden for empty state
        document.getElementById('pagination-container').style.display = 'none';
        
        // Check if we should show navigation guide for empty table
        setTimeout(() => {
          if (shouldShowNavigationGuide()) {
            // Start the timer if table is empty
            startNavigationGuideTimer();
            // Show immediately for first time (after 3 seconds)
            setTimeout(() => showNavigationGuide(), 3000);
          }
        }, 1000);
        
        return;
      }

      renderList(list);
      
      // Stop navigation guide timer if table has data
      stopNavigationGuideTimer();
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load suppliers: ${err.message}</td></tr>`;
      showAlert('Failed to load suppliers: ' + (err.message || err), 'danger');
      countEl.textContent = '0 suppliers';
      // Hide pagination on error
      document.getElementById('pagination-container').style.display = 'none';
    }
  }

  function renderList(list) {
    // Store all suppliers data
    allSuppliers = list;
    
    // Calculate pagination
    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Reset to page 1 if current page is beyond total pages
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = 1;
    }
    
    // Get current page data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = list.slice(startIndex, endIndex);
    
    // Render current page
    tbody.innerHTML = currentPageData.map(s => buildSupplierRow(s)).join('');
    countEl.textContent = `${totalItems} suppliers`;
    
    // Show/hide pagination based on total items
    const paginationContainer = document.getElementById('pagination-container');
    if (totalItems > itemsPerPage) {
      paginationContainer.style.display = 'flex';
      renderPagination(totalItems, totalPages);
    } else {
      paginationContainer.style.display = 'none';
    }
    
    initActionMenus();
    
    // Force bind all actions to ensure they work
    setTimeout(() => {
      bindSupplierActions();

    }, 100);
  }

  function renderPagination(totalItems, totalPages) {
    const paginationEl = document.getElementById('pagination-container');
    
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    let html = '<nav><ul class="pagination justify-content-center mb-0">';
    
    // Previous button
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">`;
    html += `<a class="page-link" href="#" data-page="${currentPage - 1}"${currentPage === 1 ? ' tabindex="-1"' : ''}>Previous</a>`;
    html += '</li>';
    
    // Page numbers (show max 5 pages)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">`;
      html += `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
      html += '</li>';
    }
    
    // Next button
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">`;
    html += `<a class="page-link" href="#" data-page="${currentPage + 1}"${currentPage === totalPages ? ' tabindex="-1"' : ''}>Next</a>`;
    html += '</li>';
    
    html += '</ul></nav>';
    paginationEl.innerHTML = html;
    
    // Bind pagination events
    bindPaginationEvents();
  }

  function bindPaginationEvents() {
    document.querySelectorAll('#pagination-container .page-link[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(e.target.closest('[data-page]').dataset.page);
        
        if (page && page !== currentPage) {
          goToPage(page);
        }
      });
    });
  }

  function goToPage(page) {
    const totalPages = Math.ceil(allSuppliers.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) {
      return; // Invalid page
    }
    
    currentPage = page;
    
    // Re-render with current data
    renderList(allSuppliers);
    
    // Scroll to top of table
    document.getElementById('suppliers-table-container').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }
  
  // Method 2: Direct binding after table updates
  function bindSupplierActions() {
    document.querySelectorAll('#suppliers-table [data-action]').forEach(element => {
      if (element.hasAttribute('data-bound')) return;
      element.setAttribute('data-bound', 'true');
      
      element.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const action = this.dataset.action;
        const id = this.dataset.id;
        

        
        // Close dropdowns
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
        });
        
        handleSupplierAction(action, id);
      });
    });
  }

  // Simple and reliable action handler for supplier actions
  function handleSupplierAction(action, id) {

    
    switch (action) {
      case 'view':

        viewSupplier(id);
        break;
      case 'edit':

        editSupplier(id);
        break;
      case 'delete':

        deleteSupplier(id);
        break;
      case 'comprehensive-report':

        showComprehensiveSupplierReport(id);
        break;
      case 'purchase-report':

        showSupplierPurchaseReport(id);
        break;
      case 'payment-history':

        showSupplierPaymentHistory(id);
        break;
      case 'supplier-statement':

        showSupplierStatement(id);
        break;
      default:
        console.warn('âš ï¸ Unknown action:', action);
        showAlert('Unknown action: ' + action, 'warning');
    }
  }

  // Multiple event delegation approaches to ensure it works
  
  // Method 1: Document level delegation
  document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) return;
    
    // Only handle supplier table actions
    const inSuppliersTable = actionElement.closest('#suppliers-table');
    if (!inSuppliersTable) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const action = actionElement.dataset.action;
    const id = actionElement.dataset.id;
    

    
    if (!action || !id) {
      console.error('âŒ Missing action or id:', { action, id });
      return;
    }
    
    // Close any open dropdowns
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      if (movedMap.has(menu)) {
        closeMenu(menu);
      } else {
        menu.classList.remove('show');
      }
    });
    
    // Execute action immediately

    handleSupplierAction(action, id);
  });
  
  // Helper function to get supplier details
  async function getSupplierDetails(supplierId) {
    try {
      const resp = await fetch(`../api/suppliers.php?id=${encodeURIComponent(supplierId)}`, { credentials: 'same-origin' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const json = await resp.json();
      const data = normalizeApiResponse(json);
      return Array.isArray(data) ? data[0] : (json.data || json || null);
    } catch (err) {
      console.error('Error fetching supplier details:', err);
      return null;
    }
  }

  // Add missing report functions if they don't exist
  async function showSupplierPurchaseReport(supplierId) {

    showAlert('Purchase report feature will be implemented', 'info');
  }

  async function showSupplierPaymentHistory(supplierId) {

    showAlert('Payment history feature will be implemented', 'info');
  }

  async function showSupplierStatement(supplierId) {

    showAlert('Supplier statement feature will be implemented', 'info');
  }

  // Get comprehensive supplier financial data (database only)
  async function getSupplierFinancialData(supplierId, supplierName) {

    
    let purchases = [];
    let payments = [];
    let totals = { totalPurchased: 0, totalPaid: 0 };

    try {
      // Get purchases for this specific supplier with precise filtering
      const purchasesResp = await fetch('../api/purchases.php', { credentials: 'same-origin' });
      if (purchasesResp.ok) {
        const purchasesData = await purchasesResp.json();

        
        // Filter purchases STRICTLY by supplier ID (primary) and name (secondary)
        const supplierPurchases = purchasesData.filter(purchase => {
          const matchesId = String(purchase.supplier_id) === String(supplierId);
          const matchesName = purchase.supplier_name && 
                            purchase.supplier_name.toLowerCase().trim() === supplierName.toLowerCase().trim();
          return matchesId || matchesName;
        });
        
        purchases = supplierPurchases.map(purchase => ({
          id: purchase.id,
          supplier_id: purchase.supplier_id,
          date: purchase.purchase_date || purchase.date,
          purchase_no: purchase.purchase_no || purchase.purchase_number || `PO-${purchase.id}`,
          description: purchase.description || 'Purchase Order',
          amount: parseFloat(purchase.total || purchase.amount || 0),
          amount_paid: parseFloat(purchase.amount_paid || 0),
          balance: parseFloat((purchase.total || 0) - (purchase.amount_paid || 0)),
          status: purchase.status || 'pending'
        }));
        

      }
    } catch (err) {

    }

    try {
      // Get payments for this specific supplier with precise filtering
      const paymentsResp = await fetch('../api/payments.php?reference_type=supplier', { credentials: 'same-origin' });
      if (paymentsResp.ok) {
        const paymentsData = await paymentsResp.json();

        
        // Filter payments STRICTLY by supplier ID (primary) and name (secondary)
        const supplierPayments = paymentsData.filter(payment => {
          const matchesId = String(payment.reference_id) === String(supplierId);
          const matchesName = payment.entity_name && 
                            payment.entity_name.toLowerCase().trim() === supplierName.toLowerCase().trim();
          return matchesId || matchesName;
        });
        
        payments = supplierPayments.map(payment => ({
          id: payment.id,
          reference_id: payment.reference_id,
          date: payment.payment_date || payment.date,
          method: payment.payment_method || 'Bank Transfer',
          amount: parseFloat(payment.amount || 0),
          reference: payment.reference || `PAY-${payment.id}`,
          notes: payment.notes || '',
          // Extract purchase ID from notes format [Purchase: {id}]
          linked_purchase_id: payment.notes ? payment.notes.match(/\[Purchase:\s*(\d+)\]/)?.[1] : null,
          status: payment.status || 'cleared'
        }));
        

      }
    } catch (err) {

    }

    // Calculate totals from real data only
    totals.totalPurchased = purchases.reduce((sum, purch) => sum + purch.amount, 0);
    totals.totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);
    

      purchases: purchases.length,
      payments: payments.length,
      totalPurchased: totals.totalPurchased,
      totalPaid: totals.totalPaid
    });
    
    // CREATE PURCHASE-PAYMENT TRACKING
    const purchasePaymentTracking = [];
    
    purchases.forEach(purchase => {
      // Find all payments linked to this specific purchase
      const matchingPayments = payments.filter(payment => 
        // Match by linked_purchase_id (from notes extraction)
        String(payment.linked_purchase_id) === String(purchase.id) ||
        // Match by amount for purchases that are exactly paid  
        (payment.amount === purchase.amount && purchase.amount_paid === payment.amount)
      );
      
      const totalPaidFromPayments = matchingPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Use real database amount_paid as primary source, fallback to calculated
      const actualPaid = purchase.amount_paid || totalPaidFromPayments;
      const remaining = purchase.amount - actualPaid;
      const overpaid = actualPaid > purchase.amount ? (actualPaid - purchase.amount) : 0;
      
      purchasePaymentTracking.push({
        purchase: purchase,
        payments: matchingPayments,
        totalPaid: actualPaid,
        owing: Math.max(0, remaining),
        overpaid: overpaid,
        status: remaining <= 0 ? (overpaid > 0 ? 'Overpaid' : 'Fully Paid') : (actualPaid > 0 ? 'Partially Paid' : 'Unpaid'),
        paymentCount: matchingPayments.length
      });
    });

    // Calculate owing details
    const owingDetails = {
      totalPurchased: purchases.reduce((sum, purch) => sum + purch.amount, 0),
      totalPaid: payments.reduce((sum, pay) => sum + pay.amount, 0),
      totalOwing: purchasePaymentTracking.reduce((sum, tracking) => sum + tracking.owing, 0),
      totalOverpaid: purchasePaymentTracking.reduce((sum, tracking) => sum + tracking.overpaid, 0),
      totalPayments: payments.length
    };
    

      purchases: purchases.length,
      payments: payments.length,
      trackingEntries: purchasePaymentTracking.length,
      totalPurchased: owingDetails.totalPurchased,
      totalPaid: owingDetails.totalPaid,
      totalOwing: owingDetails.totalOwing,
      totalOverpaid: owingDetails.totalOverpaid
    });
    
    return { 
      purchases, 
      payments, 
      totals,
      purchasePaymentTracking,
      owingDetails,
      totalSpent: owingDetails.totalPurchased,
      totalPaid: owingDetails.totalPaid,
      balance: owingDetails.totalOwing
    };
  }

  // Comprehensive Supplier Report Function
  async function showComprehensiveSupplierReport(supplierId) {

    
    try {
      // Clear previous report data to avoid caching issues
      currentReportData = null;
      currentSupplierName = '';
      currentReportType = '';
      
      const supplier = await getSupplierDetails(supplierId);
      if (!supplier) {
        showAlert('Supplier not found', 'danger');
        return;
      }



      // Get FRESH purchase and payment data specific to this supplier
      const { purchases, payments, totals, purchasePaymentTracking, owingDetails } = await getSupplierFinancialData(supplierId, supplier.name);
      
      const totalPurchased = totals.totalPurchased;
      const totalPaid = totals.totalPaid;
      const totalOutstanding = totalPurchased - totalPaid;
      
      // Update supplier balance with calculated data
      supplier.balance = totalOutstanding;


        purchases: purchases.length,
        payments: payments.length,
        totalPurchased,
        totalPaid,
        totalOutstanding
      });

      // Populate supplier header information with CURRENT supplier data
      document.getElementById('comprehensive-supplier-name').textContent = supplier.name || 'N/A';
      document.getElementById('contact-person').textContent = supplier.contact_person || 'Not specified';
      document.getElementById('contact-phone').textContent = supplier.phone || 'Not specified';
      document.getElementById('contact-email').textContent = supplier.email || 'Not specified';
      document.getElementById('supplier-address').textContent = supplier.address || supplier.billing_address || 'Not specified';
      document.getElementById('comprehensive-current-balance').textContent = formatCurrency(supplier.balance_due || supplier.balance || 0);
      
      const isActive = Number(supplier.is_active) === 1 || supplier.is_active === true;
      const statusEl = document.getElementById('comprehensive-status-badge');
      statusEl.textContent = isActive ? 'Active' : 'Inactive';
      statusEl.className = `badge bg-${isActive ? 'success' : 'secondary'}`;

      // Store FRESH data specific to this supplier
      currentReportData = {
        supplierId: supplierId, // Add supplier ID for reference
        supplier: supplier,
        purchases: purchases,
        payments: payments,
        totals: totals,
        purchasePaymentTracking: purchasePaymentTracking,
        owingDetails: owingDetails
      };
      currentSupplierName = supplier.name;
      currentReportType = 'comprehensive';

      // Generate comprehensive report HTML with detailed purchase-payment correlation
      const reportContent = generateEnhancedSupplierReportHTML(currentReportData);
      document.getElementById('comprehensive-report-content').innerHTML = reportContent;

      // Show modal
      supplierReportModal.show();



    } catch (err) {
      console.error('Comprehensive report error:', err);
      showAlert('Failed to load comprehensive supplier report: ' + err.message, 'danger');
    }
  }

  function generateEnhancedSupplierReportHTML(data) {
    const supplier = data.supplier || {};
    const purchases = data.purchases || [];
    const payments = data.payments || [];
    const totals = data.totals || {};
    const purchasePaymentTracking = data.purchasePaymentTracking || [];
    const owingDetails = data.owingDetails || {};
    
    const totalPurchased = totals.totalPurchased || 0;
    const totalPaid = totals.totalPaid || 0;
    const totalOutstanding = totalPurchased - totalPaid;

    return `
      <div class="supplier-report">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4><i class="ti ti-building me-2"></i>${supplier.name}</h4>
            <p class="text-muted mb-0">${supplier.email || 'No email'} â€¢ ${supplier.phone || 'No phone'}</p>
          </div>
          <div class="text-end">
            <span class="badge bg-${supplier.is_active ? 'success' : 'secondary'} fs-6">${supplier.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        <!-- Financial Summary Cards -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card border-primary">
              <div class="card-body text-center">
                <h6 class="card-title text-primary">Total Purchases</h6>
                <h4 class="text-primary">${formatCurrency(totalPurchased)}</h4>
                <small class="text-muted">${purchases.length} orders</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-success">
              <div class="card-body text-center">
                <h6 class="card-title text-success">Total Payments</h6>
                <h4 class="text-success">${formatCurrency(totalPaid)}</h4>
                <small class="text-muted">${payments.length} payments</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-${totalOutstanding > 0 ? 'warning' : 'success'}">
              <div class="card-body text-center">
                <h6 class="card-title text-${totalOutstanding > 0 ? 'warning' : 'success'}">Current Balance</h6>
                <h4 class="text-${totalOutstanding > 0 ? 'warning' : 'success'}">${formatCurrency(totalOutstanding)}</h4>
                <small class="text-muted">${totalOutstanding > 0 ? 'Amount Due' : 'All Paid'}</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-info">
              <div class="card-body text-center">
                <h6 class="card-title text-info">Credit Terms</h6>
                <h4 class="text-info">${supplier.payment_terms || 'Net 30'}</h4>
                <small class="text-muted">Payment Terms</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Purchase History -->
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0"><i class="ti ti-shopping-cart me-2"></i>Purchase History (${purchases.length} orders)</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Purchase #</th>
                    <th>Description</th>
                    <th class="text-end">Amount</th>
                    <th class="text-end">Paid</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${purchases.map(purch => `
                    <tr>
                      <td>${new Date(purch.date).toLocaleDateString()}</td>
                      <td><strong>${purch.purchase_no}</strong></td>
                      <td>${purch.description}</td>
                      <td class="text-end">${formatCurrency(purch.amount)}</td>
                      <td class="text-end">${formatCurrency(purch.amount_paid || 0)}</td>
                      <td class="text-center">
                        <span class="badge bg-${
                          (purch.amount_paid || 0) >= purch.amount ? 'success' : 
                          (purch.amount_paid || 0) > 0 ? 'warning' : 'danger'
                        }">
                          ${(purch.amount_paid || 0) >= purch.amount ? 'Paid' : (purch.amount_paid || 0) > 0 ? 'Partial' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <th colspan="3" class="text-end">Purchase Totals:</th>
                    <th class="text-end">${formatCurrency(totalPurchased)}</th>
                    <th class="text-end">${formatCurrency(totalPaid)}</th>
                    <th class="text-center">
                      <span class="badge bg-${totalOutstanding > 0 ? 'warning' : 'success'}">
                        ${totalOutstanding > 0 ? formatCurrency(totalOutstanding) + ' Due' : 'All Paid'}
                      </span>
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Payment History -->
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0"><i class="ti ti-credit-card me-2"></i>Payment History (${payments.length} payments)</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th class="text-end">Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${payments.map(pay => `
                    <tr>
                      <td>${new Date(pay.date).toLocaleDateString()}</td>
                      <td>${pay.method}</td>
                      <td><code>${pay.reference}</code></td>
                      <td class="text-end text-success"><strong>${formatCurrency(pay.amount)}</strong></td>
                      <td>${pay.notes || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <th colspan="3" class="text-end">Total Payments Made:</th>
                    <th class="text-end text-success"><strong>${formatCurrency(totals.totalPaid)}</strong></th>
                    <th></th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function openAddSupplier() {
    form.reset(); form.classList.remove('was-validated');
    document.getElementById('supplier-id').value = '';
    
    // Set default values for searchable dropdown
    document.getElementById('supplier-payment-terms').value = 'Net 30';
    document.getElementById('supplier-payment-terms-search').value = 'Net 30 days';
    
    document.getElementById('supplier-is-active').checked = true;
    document.getElementById('supplier-modal-title').textContent = 'Add Supplier';
    bsSupplierModal.show();
  }

  async function editSupplier(id) {
    try {
      const resp = await fetch(`api/suppliers.php?id=${encodeURIComponent(id)}`, { credentials: 'same-origin' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const json = await resp.json();
      const data = normalizeApiResponse(json);
      const supplier = Array.isArray(data) ? data[0] : (json.data || json || null);
      if (!supplier) throw new Error('Supplier not found');
      populateAndOpen(supplier);
    } catch (err) {
      console.error('Error loading supplier:', err);
      showAlert('Error loading supplier: ' + (err.message || err), 'danger');
    }
  }

  function populateAndOpen(supplier) {
    document.getElementById('supplier-modal-title').textContent = 'Edit Supplier';
    document.getElementById('supplier-id').value = supplier.id || '';
    document.getElementById('supplier-name').value = supplier.name || '';
    document.getElementById('supplier-contact-person').value = supplier.contact_person || '';
    document.getElementById('supplier-phone').value = supplier.phone || '';
    document.getElementById('supplier-email').value = supplier.email || '';
    document.getElementById('supplier-address').value = supplier.address || '';
    document.getElementById('supplier-tax-number').value = supplier.tax_number || '';
    
    // Set values for searchable dropdown
    const paymentTerms = supplier.payment_terms || 'Net 30';
    document.getElementById('supplier-payment-terms').value = paymentTerms;
    
    // Map payment terms to display text
    const paymentTermsMap = {
      'Net 15': 'Net 15 days',
      'Net 30': 'Net 30 days',
      'Net 45': 'Net 45 days',
      'Net 60': 'Net 60 days',
      'Cash': 'Cash on Delivery'
    };
    document.getElementById('supplier-payment-terms-search').value = paymentTermsMap[paymentTerms] || paymentTerms;
    
    document.getElementById('supplier-is-active').checked = (Number(supplier.is_active) === 1) || (supplier.is_active === true);
    form.classList.remove('was-validated');
    

    bsSupplierModal.show();
  }

  async function viewSupplier(id) {

    try {
      const resp = await fetch(`api/suppliers.php?id=${encodeURIComponent(id)}`, { credentials: 'same-origin' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const json = await resp.json();

      
      const data = normalizeApiResponse(json);
      const supplier = Array.isArray(data) ? data[0] : (json.data || json || null);
      
      if (!supplier) throw new Error('Supplier not found');
      
      const name = supplier.name || 'Unknown Supplier';
      const contact = supplier.contact_person || 'No contact person';
      const phone = supplier.phone || 'No phone';
      const email = supplier.email || 'No email';
      const balance = formatCurrency(supplier.balance_due || supplier.balance || 0);
      const status = (Number(supplier.is_active) === 1 || supplier.is_active === true) ? 'Active' : 'Inactive';
      const paymentTerms = supplier.payment_terms || 'Net 30';
      
      // Show detailed supplier information
      const supplierInfo = `
        <div class="supplier-view-details">
          <h6><i class="ti ti-building me-2"></i>${name}</h6>
          <div class="row small">
            <div class="col-md-6">
              <p class="mb-1"><strong>Contact:</strong> ${contact}</p>
              <p class="mb-1"><strong>Phone:</strong> ${phone}</p>
              <p class="mb-1"><strong>Email:</strong> ${email}</p>
            </div>
            <div class="col-md-6">
              <p class="mb-1"><strong>Payment Terms:</strong> ${paymentTerms}</p>
              <p class="mb-1"><strong>Status:</strong> <span class="badge bg-${status === 'Active' ? 'success' : 'secondary'}">${status}</span></p>
              <p class="mb-1"><strong>Balance Due:</strong> <span class="fw-bold text-${parseFloat(supplier.balance_due || 0) > 0 ? 'warning' : 'success'}">${balance}</span></p>
            </div>
          </div>
        </div>
      `;
      
      // Create a temporary div to show the supplier details
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = supplierInfo;
      tempDiv.className = 'alert alert-info fade show';
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '20px';
      tempDiv.style.right = '20px';
      tempDiv.style.zIndex = '9999';
      tempDiv.style.maxWidth = '400px';
      tempDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      
      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'btn-close';
      closeBtn.setAttribute('data-bs-dismiss', 'alert');
      closeBtn.setAttribute('aria-label', 'Close');
      tempDiv.appendChild(closeBtn);
      
      document.body.appendChild(tempDiv);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (tempDiv.parentNode) {
          tempDiv.remove();
        }
      }, 8000);
      

      
    } catch (err) {
      console.error('âŒ Error fetching supplier:', err);
      showAlert('âŒ Error loading supplier: ' + (err.message || err), 'danger');
    }
  }

  async function deleteSupplier(id) {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const resp = await fetch(`../api/suppliers.php?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'same-origin' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      showAlert('Supplier deleted successfully');
      fetchSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      showAlert('Error deleting supplier: ' + (err.message || err), 'danger');
    }
  }

  async function saveSupplier(e) {
    e.preventDefault();
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    const id = document.getElementById('supplier-id').value;
    const payload = {
      company_id: 1,
      name: document.getElementById('supplier-name').value.trim(),
      contact_person: document.getElementById('supplier-contact-person').value.trim(),
      phone: document.getElementById('supplier-phone').value.trim(),
      email: document.getElementById('supplier-email').value.trim(),
      address: document.getElementById('supplier-address').value.trim(),
      tax_number: document.getElementById('supplier-tax-number').value.trim(),
      payment_terms: document.getElementById('supplier-payment-terms').value,
      is_active: document.getElementById('supplier-is-active').checked ? 1 : 0
    };

    try {
      saveBtn.disabled = true; saveBtn.innerHTML = 'Saving...';

      const url = id ? `../api/suppliers.php?id=${encodeURIComponent(id)}` : '../api/suppliers.php';
      const method = id ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });

      const json = await resp.json();
      if (resp.ok) {
        showAlert(id ? 'Supplier updated successfully!' : 'Supplier created successfully!');
        bsSupplierModal.hide();
        fetchSuppliers();
      } else {
        const msg = (json && (json.message || json.error)) || 'Error saving supplier';
        showAlert(msg, 'danger');
      }
    } catch (err) {
      console.error(err);
      showAlert('Network error: ' + (err.message || err), 'danger');
    } finally {
      saveBtn.disabled = false; saveBtn.innerHTML = 'Save Supplier';
    }
  }

  // Report Modal Management
  const supplierReportModal = new bootstrap.Modal(document.getElementById('supplierReportModal'));
  const emailReportModal = new bootstrap.Modal(document.getElementById('emailReportModal'));
  let currentReportData = null;
  let currentSupplierName = '';
  let currentReportType = '';

  // Initialize searchable dropdown for supplier modal
  function initializeSupplierPaymentTermsSearch() {
    const searchInput = document.getElementById('supplier-payment-terms-search');
    const toggleBtn = searchInput?.nextElementSibling;
    const hiddenSelect = document.getElementById('supplier-payment-terms');
    const dropdown = searchInput?.parentElement.querySelector('.dropdown-options');
    
    if (!searchInput || !dropdown || !hiddenSelect) return;
    
    // Set default value
    searchInput.value = 'Net 30 days';
    hiddenSelect.value = 'Net 30';
    
    // Toggle dropdown
    const toggleDropdown = () => {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    };
    
    searchInput.addEventListener('click', toggleDropdown);
    toggleBtn.addEventListener('click', toggleDropdown);
    
    // Handle option selection
    dropdown.addEventListener('click', (e) => {
      if (e.target.classList.contains('dropdown-option')) {
        const value = e.target.dataset.value;
        const text = e.target.textContent;
        
        searchInput.value = text;
        hiddenSelect.value = value;
        dropdown.style.display = 'none';
      }
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!searchInput.parentElement.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  // events
  btnAdd.addEventListener('click', openAddSupplier);
  form.addEventListener('submit', saveSupplier);

  // Modal enhancement - focus management
  supplierModalEl.addEventListener('shown.bs.modal', () => {
    document.getElementById('supplier-name').focus();
  });

  supplierModalEl.addEventListener('hidden.bs.modal', () => {
    form.reset();
    form.classList.remove('was-validated');
  });

  document.addEventListener('DOMContentLoaded', () => { 

    fetchSuppliers();
    
    // Initialize searchable dropdown
    initializeSupplierPaymentTermsSearch();
    
    // Set up search functionality
    const searchInput = document.getElementById('supplier-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const searchTerm = e.target.value.trim();
          fetchSuppliers(searchTerm);
        }, 300);
      });
    }
    
    // Add a small delay to ensure DOM is fully loaded
    setTimeout(() => {


    }, 1000);
  });
  
  // Make navigation guide functions globally available for testing
  window.testSupplierNavigationGuide = function() {



    showNavigationGuide();
  };
  
  window.forceShowSupplierNavigationGuide = function() {

    bsNavigationGuideModal.show();
  };
  
  window.resetSupplierNavigationGuide = function() {
    localStorage.removeItem('supplierNavigationGuideDisabled');

  };
  
  window.checkSupplierNavigationGuideStatus = function() {





  };
  
})();
