/* Simple Customers page JavaScript - Fixed delete confirmation */
// Basic configuration
const CURRENCY_CONFIG = window.CURRENCY_CONFIG || { symbol: 'â‚¦', position: 'before', decimals: 2 };
const SYSTEM_CURRENCY = window.SYSTEM_CURRENCY || 'NGN';
// Utility functions
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
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
// State variables
let currentFilter = 'all';
let customers = [];
// DOM elements
  const countEl = document.getElementById('customers-count');
  const form = document.getElementById('customerForm');
  const saveBtn = document.getElementById('saveCustomerBtn');
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initializePage();
  });
  function initializePage() {
    // Check Bootstrap availability
    if (typeof bootstrap === 'undefined') {
      console.error('âŒ Customer Page: Bootstrap not loaded!');
      return;
    }
    // Load customers when page loads
    fetchCustomers();
    // Set up form submission
    if (form) {
      form.addEventListener('submit', saveCustomer);
    } else {
      console.error('âŒ Customer Page: Form element not found!');
    }
    // Set up delete confirmation button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', confirmDeleteCustomer);
    }
    // Set up Add Customer button
    const addCustomerBtn = document.getElementById('btnAddCustomer');
    if (addCustomerBtn) {
      addCustomerBtn.addEventListener('click', function() {
        openCustomerModal();
      });
    } else {
      console.error('âŒ Customer Page: Add Customer button not found!');
    }
    // Set up search functionality
    setupSearchFunctionality();
    // Initialize action menus
    initActionMenus();
    // Set up tab navigation
    setupTabNavigation();
  }
  // Setup search functionality
  function setupSearchFunctionality() {
    const searchInput = document.getElementById('customer-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.trim();
        searchTimeout = setTimeout(() => {
          fetchCustomers(searchTerm);
        }, 300); // Debounce search
      });
    } else {
      console.error('âŒ Search input not found');
    }
  }
  // Setup tab navigation
  function setupTabNavigation() {
    document.querySelectorAll('.nav-tabs .nav-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        // Update active tab
        document.querySelectorAll('.nav-tabs .nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        // Update current filter and fetch data
        currentFilter = this.dataset.filter || 'all';
        fetchCustomers();
      });
    });
  }
  // Action menu initialization (proper Bootstrap dropdowns)
  function initActionMenus() {
    // Wait a bit for DOM to be ready
    setTimeout(() => {
      // Initialize all Bootstrap dropdowns in the customer table
      const dropdownElements = document.querySelectorAll('#customerTableBody [data-bs-toggle="dropdown"]');
      dropdownElements.forEach((element, index) => {
        try {
          // Remove any existing Bootstrap instance
          const existingDropdown = bootstrap.Dropdown.getInstance(element);
          if (existingDropdown) {
            existingDropdown.dispose();
          }
          // Create new Bootstrap dropdown instance
          new bootstrap.Dropdown(element);
        } catch (error) {
          console.error(`    âŒ Error initializing dropdown ${index + 1}:`, error);
        }
      });
    }, 100);
  }
  // Fetch customers from API
  async function fetchCustomers(searchTerm = '') {
    try {
      // Build URL with search parameter
      let url = '../api/customers.php';
      if (searchTerm) {
        url += '?search=' + encodeURIComponent(searchTerm);
      }
      const response = await fetch(url, {
        credentials: 'same-origin'
      });
      if (!response.ok) {
        console.error('âŒ Customer API: HTTP Error', response.status);
        throw new Error('HTTP ' + response.status);
      }
      const data = await response.json();
      // Fix: API returns 'data' property, not 'customers'
      let customerList = data.data || [];
      // Apply client-side filtering for tabs
      if (currentFilter === 'active') {
        customerList = customerList.filter(c => c.is_active == 1);
      } else if (currentFilter === 'with_balance') {
        customerList = customerList.filter(c => parseFloat(c.balance || 0) > 0);
      }
      customers = customerList;
      displayCustomers(customers);
      updateCount(customers.length);
    } catch (err) {
      console.error('ðŸ’¥ Customer API: Error occurred:', err);
      console.error('  - Error message:', err.message);
      console.error('  - Error stack:', err.stack);
      showAlert('Error loading customers: ' + err.message, 'danger');
    }
  }
  // Display customers in table
  function displayCustomers(customerList) {
    // Get fresh reference to tbody element
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) {
      console.error('âŒ Display Customers: tbody element not found!');
      const table = document.getElementById('customers-table');
      if (table) {
        const allTbody = table.getElementsByTagName('tbody');
        for (let i = 0; i < allTbody.length; i++) {
        }
      }
      return;
    }
    tbody.innerHTML = '';
    if (customerList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="text-muted"><i class="ti ti-users-off mb-2" style="font-size: 2rem;"></i><br>No customers found</div></td></tr>';
      return;
    }
    customerList.forEach((customer, index) => {
      try {
        const row = createCustomerRow(customer);
        tbody.appendChild(row);
      } catch (error) {
        console.error(`    - Error creating row for customer ${index + 1}:`, error);
      }
    });
    // Initialize action menus after rendering
    initActionMenus();
  }
  // Create customer table row
  function createCustomerRow(customer) {
    try {
      const row = document.createElement('tr');
      row.dataset.id = customer.id;
      // Extract and validate customer data
      const name = customer.name || 'Unknown Customer';
      const email = customer.email || 'No email';
      const phone = customer.phone || 'No phone';
      const type = customer.customer_type || 'Regular';
      const isActive = customer.is_active;
      const initial = name.charAt(0).toUpperCase();
      // Build the row HTML matching product table format
      const rowHTML = `
        <td class="text-start">${escapeHtml(name)}</td>
        <td class="text-start">${escapeHtml(phone)}</td>
        <td class="text-start">${escapeHtml(email)}</td>
        <td class="text-start">${escapeHtml(customer.billing_address || customer.address || 'No address')}</td>
        <td class="text-end">${formatCurrency(customer.balance || 0)}</td>
        <td class="text-center">
          <span class="badge bg-${isActive ? 'success' : 'secondary'}">
            ${isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="text-center">
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle"
                    type="button"
                    id="customerActions${customer.id}"
                    aria-expanded="false"
                    aria-haspopup="true"
                    data-bs-toggle="dropdown"
                    title="Actions">
              <i class="ti ti-dots-vertical" aria-hidden="true"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="customerActions${customer.id}">
              <li><a class="dropdown-item" href="#" data-action="edit" data-id="${customer.id}">
                <i class="ti ti-edit me-2 text-primary" aria-hidden="true"></i>Edit Customer
              </a></li>
              <li><a class="dropdown-item" href="#" data-action="report" data-id="${customer.id}">
                <i class="ti ti-report me-2 text-success" aria-hidden="true"></i>Customer Report
              </a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" data-action="delete" data-id="${customer.id}">
                <i class="ti ti-trash me-2" aria-hidden="true"></i>Delete Customer
              </a></li>
            </ul>
          </div>
        </td>
      `;
      row.innerHTML = rowHTML;
      return row;
    } catch (error) {
      console.error('âŒ Create Customer Row: Error occurred:', error);
      console.error('  - Error details:', error.message);
      console.error('  - Customer data causing error:', customer);
      // Create fallback row
      const fallbackRow = document.createElement('tr');
      fallbackRow.innerHTML = `
        <td colspan="5" class="text-danger text-center">
          <i class="ti ti-alert-triangle"></i> Error displaying customer
        </td>
      `;
      return fallbackRow;
    }
  }
  // Edit customer function
  async function editCustomer(id) {
    try {
      // Find customer in current data
      const customer = customers.find(c => c.id == id);
      if (!customer) {
        console.error('âŒ Edit Customer: Customer not found in current data');
        return;
      }
      // Populate form with customer data
      const modal = document.getElementById('customerModal');
      const form = document.getElementById('customerForm');
      const modalTitle = document.getElementById('customer-modal-title');
      if (!modal || !form) {
        console.error('âŒ Edit Customer: Modal or form not found');
        return;
      }
      // Reset form and set title
      form.reset();
      modalTitle.textContent = 'Edit Customer';
      // Fill form fields
      document.getElementById('customer-id').value = customer.id;
      document.getElementById('customer-name').value = customer.name || '';
      document.getElementById('customer-phone').value = customer.phone || '';
      document.getElementById('customer-email').value = customer.email || '';
      // Set customer type
      const typeSelect = document.getElementById('customer-type');
      const typeSearch = document.getElementById('customer-type-search');
      if (typeSelect && typeSearch) {
        typeSelect.value = customer.customer_type || 'individual';
        typeSearch.value = customer.customer_type === 'business' ? 'Business' : 'Individual';
      }
      // Set other fields if they exist
      const addressField = document.getElementById('customer-address');
      if (addressField) {
        addressField.value = customer.billing_address || '';
      }
      const creditLimitField = document.getElementById('customer-credit-limit');
      if (creditLimitField) {
        creditLimitField.value = customer.credit_limit || '';
      }
      // Show modal
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    } catch (error) {
      console.error('âŒ Edit Customer: Error:', error);
    }
  }
  // Delete customer function
  async function deleteCustomer(id) {
    const confirmed = confirm('Are you sure you want to delete this customer? This action cannot be undone.');
    if (!confirmed) {
      return;
    }
    try {
      const response = await fetch(`../api/customers.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        fetchCustomers();
      } else {
        const errorMsg = data.error || data.message || 'Unknown error occurred';
        console.error('âŒ Delete Customer: API error:', errorMsg);
      }
    } catch (error) {
      console.error('âŒ Delete Customer: Network error:', error);
    }
  }
  // State for delete confirmation
  let pendingDeleteId = null;
  let pendingDeleteName = null;
  // Show delete customer modal
  function showDeleteCustomerModal(id) {
    // Get customer data for confirmation
    const customer = getCustomerFromTable(id);
    const customerName = customer ? customer.name : `Customer #${id}`;
    // Store customer to delete
    customerToDelete = { id: id, name: customerName };
    // Update modal text
    const textElement = document.getElementById('customerDeleteText');
    if (textElement) {
      textElement.textContent = `This will permanently delete "${customerName}" and all associated data.`;
    }
    // Show the modal
    const modalElement = document.getElementById('deleteCustomerModal');
    if (modalElement) {
      const deleteModal = new bootstrap.Modal(modalElement);
      deleteModal.show();
    } else {
      console.error('âŒ Delete modal not found!');
    }
  }
  // Delete customer with confirmation
  async function deleteCustomer(id) {
    // Get customer data for confirmation
    const customer = getCustomerFromTable(id);
    const customerName = customer ? customer.name : `Customer #${id}`;
    // Store pending delete info
    pendingDeleteId = id;
    pendingDeleteName = customerName;
    // Update modal text
    const textElement = document.getElementById('customerDeleteText');
    if (textElement) {
      textElement.textContent = `This will permanently delete "${customerName}" and all associated data.`;
    }
    // Show the modal
    const modalElement = document.getElementById('customerDeleteModal');
    if (modalElement) {
      const deleteModal = new bootstrap.Modal(modalElement);
      deleteModal.show();
    } else {
      console.error('Modal element not found!');
    }
  }
  // Actually perform the delete
  async function performCustomerDelete() {
    if (!pendingDeleteId) return;
    try {
      const response = await fetch(`../api/customers.php?id=${encodeURIComponent(pendingDeleteId)}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      fetchCustomers(); // Refresh the list
      // Hide modal and reset
      const deleteModal = bootstrap.Modal.getInstance(document.getElementById('customerDeleteModal'));
      deleteModal?.hide();
      pendingDeleteId = null;
      pendingDeleteName = null;
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  }
  // Get customer from table
  function getCustomerFromTable(id) {
    return customers.find(customer => customer.id == id);
  }
  // View customer details
  function viewCustomer(id) {
    const customer = getCustomerFromTable(id);
    if (!customer) {
      showAlert('Customer not found', 'danger');
      return;
    }
    // Implement view logic here
  }
  // Edit customer
  function editCustomer(id) {
    // Open modal with customer ID for editing
    openCustomerModal(id);
  }
  // Save customer (add/update)
  async function saveCustomer(e) {
    if (e) e.preventDefault();
    if (!form) return;
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;
    const customerId = document.getElementById('customer-id')?.value;
    const payload = {
      company_id: 1,
      name: document.getElementById('customer-name')?.value?.trim(),
      phone: document.getElementById('customer-phone')?.value?.trim(),
      email: document.getElementById('customer-email')?.value?.trim(),
      billing_address: document.getElementById('customer-address')?.value?.trim(),
      customer_type: document.getElementById('customer-type')?.value,
      payment_terms: document.getElementById('customer-payment-terms')?.value,
      credit_limit: parseFloat(document.getElementById('customer-credit-limit')?.value) || 0,
      is_active: document.getElementById('customer-is-active')?.checked ? 1 : 0
    };
    try {
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = 'Saving...';
      }
      const url = customerId ? `../api/customers.php?id=${encodeURIComponent(customerId)}` : '../api/customers.php';
      const method = customerId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });
      let result;
      try {
        const text = await response.text();
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return;
      }
      if (response.ok && result.success) {
        fetchCustomers();
        // Hide modal if exists
        const modal = bootstrap.Modal.getInstance(document.getElementById('customerModal'));
        modal?.hide();
      } else {
        console.error('Error saving customer:', result.message || result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error saving customer:', err);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Save Customer';
      }
    }
  }
  // Open customer modal for adding/editing
  function openCustomerModal(customerId = null) {
    const modal = document.getElementById('customerModal');
    const modalTitle = document.getElementById('customer-modal-title');
    const form = document.getElementById('customerForm');
    if (!modal || !form) return;
    // Check subscription limits for new customers (not for editing)
    if (!customerId) {
      // Get subscription info from PHP variables
      const subscriptionInfo = window.SUBSCRIPTION_INFO || null;
      const customerLimits = window.CUSTOMER_LIMITS || {free: 50, starter: 100, professional: 1000, enterprise: -1};
      const currentCount = customers.length;
      if (subscriptionInfo && subscriptionInfo.plan) {
        const limit = customerLimits[subscriptionInfo.plan];
        if (limit !== -1 && currentCount >= limit) {
          return;
        }
      }
    }
    // Reset form
    form.reset();
    // Set modal title and form data
    if (customerId) {
      modalTitle.textContent = 'Edit Customer';
      // Load customer data for editing
      loadCustomerForEdit(customerId);
    } else {
      modalTitle.textContent = 'Add Customer';
      // Clear any hidden customer ID field
      const customerIdField = form.querySelector('input[name="customer_id"]');
      if (customerIdField) customerIdField.value = '';
    }
    // Show modal
    const customerModal = new bootstrap.Modal(modal);
    customerModal.show();
  }
  // Load customer data for editing
  async function loadCustomerForEdit(customerId) {
    try {
      // Get customer data from table array
      const customer = getCustomerFromTable(customerId);
      if (!customer) {
        console.error('âŒ Load Customer: Customer not found for ID:', customerId);
        showAlert('Customer not found', 'danger');
        return;
      }
      // Populate form fields with customer data
      document.getElementById('customer-id').value = customer.id || '';
      document.getElementById('customer-name').value = customer.name || '';
      document.getElementById('customer-email').value = customer.email || '';
      document.getElementById('customer-phone').value = customer.phone || '';
      document.getElementById('customer-address').value = customer.address || customer.billing_address || '';
      // Set credit limit if available
      const creditLimitField = document.getElementById('customer-credit-limit');
      if (creditLimitField) {
        creditLimitField.value = customer.credit_limit || '';
      }
      // Set active status
      const isActiveCheckbox = document.getElementById('customer-is-active');
      if (isActiveCheckbox) {
        isActiveCheckbox.checked = customer.is_active == '1' || customer.is_active === true;
      }
    } catch (error) {
      console.error('âŒ Load Customer: Error:', error);
      showAlert('Error loading customer data: ' + error.message, 'danger');
    }
  }
  // Update customer count
  function updateCount(count) {
    if (countEl) {
      countEl.textContent = `${count} customers`;
    }
  }
  // Show alert message
  function showAlert(message, type = 'success') {
    // Use existing alert system if available
    if (typeof window.showAlert === 'function') {
      window.showAlert(message, type);
    } else {
      // Fallback alert
      alert(message);
    }
  }
  // Global delegated handler for dropdown actions (Bootstrap compatible)
  document.addEventListener('click', function(e) {
    const actionEl = e.target.closest('[data-action]');
    const dropdownBtn = e.target.closest('.dropdown-toggle');
    // Debug dropdown clicks
    if (dropdownBtn) {
    }
    // Handle action clicks
    if (actionEl) {
      e.preventDefault();
      e.stopPropagation();
      const action = actionEl.getAttribute('data-action');
      const id = actionEl.getAttribute('data-id');
      if (action === 'edit') {
        editCustomer(id);
      } else if (action === 'delete') {
        showDeleteCustomerModal(id);
      } else if (action === 'report') {
        showCustomerReport(id);
      }
      return;
    }
    // Don't interfere with Bootstrap dropdown functionality
    // Bootstrap handles dropdown open/close automatically
  });
  // Event listener for delete confirmation button
  document.addEventListener('DOMContentLoaded', function() {
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', confirmDeleteCustomer);
    }
  });
  // Confirm delete customer function
  async function confirmDeleteCustomer() {
    if (!customerToDelete) {
      console.error('âŒ Confirm Delete: No customer selected');
      return;
    }
    try {
      const confirmBtn = document.getElementById('confirmDeleteBtn');
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';
      }
      const response = await fetch(`../api/customers.php?id=${encodeURIComponent(customerToDelete.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Close modal immediately
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteCustomerModal'));
        if (modal) modal.hide();
        // Show success message immediately
        // Remove customer from local array immediately
        customers = customers.filter(c => c.id != customerToDelete.id);
        // Remove from table immediately for instant feedback
        const rows = document.querySelectorAll('#customerTableBody tr');
        rows.forEach(row => {
          const editBtn = row.querySelector('[data-action="edit"]');
          if (editBtn && editBtn.getAttribute('data-id') == customerToDelete.id) {
            row.style.transition = 'opacity 0.3s';
            row.style.opacity = '0';
            setTimeout(() => {
              row.remove();
              // Update count after removal
              updateCount(customers.length);
              // If no customers left, show empty state
              if (customers.length === 0) {
                displayCustomers(customers);
              }
            }, 300);
          }
        });
        // Reset
        customerToDelete = null;
      } else {
        const errorMsg = data.error || data.message || 'Unknown error occurred';
        console.error('âŒ Delete Customer: API error:', errorMsg);
        showAlert('Error deleting customer: ' + errorMsg, 'danger');
      }
    } catch (error) {
      console.error('âŒ Delete Customer: Network error:', error);
    } finally {
      const confirmBtn = document.getElementById('confirmDeleteBtn');
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="ti ti-trash me-2"></i>Delete Customer';
      }
    }
  }
  // Show customer report modal
  async function showCustomerReport(customerId) {
    try {
      // Get customer data from table
      const customer = getCustomerFromTable(customerId);
      if (!customer) {
        console.error('âŒ Customer Report: Customer not found for ID:', customerId);
        showAlert('Customer not found', 'danger');
        return;
      }
      // Populate customer header information
      document.getElementById('comprehensive-customer-name').textContent = customer.name || 'N/A';
      document.getElementById('customer-phone').textContent = customer.phone || 'Not specified';
      document.getElementById('customer-email').textContent = customer.email || 'Not specified';
      document.getElementById('customer-address').textContent = customer.address || customer.billing_address || 'Not specified';
      document.getElementById('comprehensive-customer-balance').textContent = formatCurrency(customer.balance || 0);
      const isActive = customer.is_active == '1' || customer.is_active === true;
      const statusEl = document.getElementById('comprehensive-customer-status');
      statusEl.textContent = isActive ? 'Active' : 'Inactive';
      statusEl.className = `badge bg-${isActive ? 'success' : 'secondary'}`;
      // Show loading message
      document.getElementById('comprehensive-customer-report-content').innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-3">Loading comprehensive customer report...</p></div>';
      // Show the customer report modal first
      const modal = new bootstrap.Modal(document.getElementById('customerReportModal'));
      modal.show();
      // Load detailed customer report data (exactly like supplier)
      const reportResponse = await fetch(`../api/customer-reports.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: 'comprehensive_report',
          customer_id: customerId
        })
      });
      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        if (reportData.success && reportData.data) {
          const data = reportData.data;
          // Generate comprehensive report content exactly like supplier
          const reportContent = generateEnhancedCustomerReportHTML({
            customer: customer,
            sales: data.sales || [],
            payments: data.payments || [],
            totals: {
              totalSales: data.total_sales || 0,
              totalPaid: data.total_payments || 0
            },
            salePaymentTracking: data.salePaymentTracking || [],
            owingDetails: data.owingDetails || {}
          });
          document.getElementById('comprehensive-customer-report-content').innerHTML = reportContent;
        } else {
          document.getElementById('comprehensive-customer-report-content').innerHTML = '<div class="alert alert-warning"><i class="ti ti-info-circle me-2"></i>No detailed report data available for this customer. This customer may not have any sales or payment transactions yet.</div>';
        }
      } else {
        const errorText = await reportResponse.text();
        console.error('âŒ Customer Report: API Error:', errorText);
        document.getElementById('comprehensive-customer-report-content').innerHTML = '<div class="alert alert-danger"><i class="ti ti-exclamation-triangle me-2"></i>Failed to load customer report data. Please try again later.</div>';
      }
    } catch (error) {
      console.error('âŒ Customer Report: Error:', error);
      showAlert('Error loading customer report: ' + error.message, 'danger');
    }
  }
  // Generate enhanced customer report HTML (exactly like supplier format)
  function generateEnhancedCustomerReportHTML(data) {
    const customer = data.customer || {};
    const sales = data.sales || [];
    const payments = data.payments || [];
    const totals = data.totals || {};
    const salePaymentTracking = data.salePaymentTracking || [];
    const owingDetails = data.owingDetails || {};
    const totalSales = totals.totalSales || 0;
    const totalPaid = totals.totalPaid || 0;
    const totalOutstanding = totalSales - totalPaid;
    return `
      <div class="customer-report">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4><i class="ti ti-user me-2"></i>${customer.name}</h4>
            <p class="text-muted mb-0">${customer.email || 'No email'} â€¢ ${customer.phone || 'No phone'}</p>
          </div>
          <div class="text-end">
            <span class="badge bg-${customer.is_active ? 'success' : 'secondary'} fs-6">${customer.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        <!-- Financial Summary Cards -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card border-primary">
              <div class="card-body text-center">
                <h6 class="card-title text-primary">Total Sales</h6>
                <h4 class="text-primary">${formatCurrency(totalSales)}</h4>
                <small class="text-muted">${sales.length} invoices</small>
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
                <h6 class="card-title text-${totalOutstanding > 0 ? 'warning' : 'success'}">Outstanding Balance</h6>
                <h4 class="text-${totalOutstanding > 0 ? 'warning' : 'success'}">${formatCurrency(totalOutstanding)}</h4>
                <small class="text-muted">${totalOutstanding > 0 ? 'Amount Due' : 'All Paid'}</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-info">
              <div class="card-body text-center">
                <h6 class="card-title text-info">Credit Terms</h6>
                <h4 class="text-info">${customer.payment_terms || 'Net 30'}</h4>
                <small class="text-muted">Payment Terms</small>
              </div>
            </div>
          </div>
        </div>
        <!-- Customer Details -->
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0"><i class="ti ti-info-circle me-2"></i>Customer Details</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Phone:</strong> ${customer.phone || 'Not specified'}</p>
                <p><strong>Payment Terms:</strong> ${customer.payment_terms || 'Net 30'}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Address:</strong> ${customer.address || customer.billing_address || 'No address on file'}</p>
                <p><strong>Current Balance:</strong> <span class="fw-bold ${(customer.balance || 0) >= 0 ? 'text-warning' : 'text-success'}">${formatCurrency(customer.balance || totalOutstanding)}</span></p>
              </div>
            </div>
          </div>
        </div>
        <!-- Detailed Sale-Payment Correlation -->
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0"><i class="ti ti-file-analytics me-2"></i>Detailed Invoice-Payment Analysis</h6>
          </div>
          <div class="card-body">
            ${sales.map(sale => {
              const salePayments = payments.filter(p => p.sale_id == sale.id || p.invoice_id == sale.id);
              const totalPaidForSale = salePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
              const outstanding = parseFloat(sale.total_amount || 0) - totalPaidForSale;
              const status = outstanding <= 0 ? 'Fully Paid' : totalPaidForSale > 0 ? 'Partially Paid' : 'Unpaid';
              return `
                <div class="border rounded p-3 mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${sale.invoice_number || 'INV-' + sale.id} - ${sale.notes || 'Sale transaction'}</h6>
                    <span class="badge bg-${status === 'Fully Paid' ? 'success' : status === 'Partially Paid' ? 'warning' : 'danger'}">
                      ${status}
                    </span>
                  </div>
                  <div class="row mb-2">
                    <div class="col-md-3"><strong>Sale Date:</strong> ${new Date(sale.date || sale.sale_date || sale.created_at).toLocaleDateString()}</div>
                    <div class="col-md-3"><strong>Invoice Amount:</strong> ${formatCurrency(sale.total_amount)}</div>
                    <div class="col-md-3"><strong>Total Paid:</strong> ${formatCurrency(totalPaidForSale)}</div>
                    <div class="col-md-3"><strong>Balance:</strong> 
                      <span class="fw-bold ${outstanding > 0 ? 'text-danger' : 'text-success'}">
                        ${outstanding > 0 ? formatCurrency(outstanding) + ' Due' : 'Paid'}
                      </span>
                    </div>
                  </div>
                  ${salePayments.length > 0 ? `
                    <div class="mt-2">
                      <small class="text-muted"><strong>Payments for this invoice (${salePayments.length}):</strong></small>
                      <div class="table-responsive mt-1">
                        <table class="table table-sm table-borderless">
                          ${salePayments.map(payment => `
                            <tr>
                              <td style="width: 120px;">${new Date(payment.payment_date || payment.created_at).toLocaleDateString()}</td>
                              <td style="width: 100px;">${payment.payment_method || 'Cash'}</td>
                              <td style="width: 120px;"><code class="small">${payment.reference_number || payment.transaction_id || '-'}</code></td>
                              <td class="text-end text-success fw-bold">${formatCurrency(payment.amount)}</td>
                            </tr>
                          `).join('')}
                        </table>
                      </div>
                    </div>
                  ` : '<small class="text-muted">No payments recorded for this invoice</small>'}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <!-- Sales History -->
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0"><i class="ti ti-file-invoice me-2"></i>Sales History (${sales.length} invoices)</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Invoice #</th>
                    <th>Description</th>
                    <th class="text-end">Amount</th>
                    <th class="text-end">Paid</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${sales.map(sale => {
                    const salePayments = payments.filter(p => p.sale_id == sale.id || p.invoice_id == sale.id);
                    const totalPaidForSale = salePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                    const outstanding = parseFloat(sale.total_amount || 0) - totalPaidForSale;
                    const status = outstanding <= 0 ? 'Paid' : totalPaidForSale > 0 ? 'Partial' : 'Unpaid';
                    return `
                      <tr>
                        <td>${new Date(sale.date || sale.sale_date || sale.created_at).toLocaleDateString()}</td>
                        <td><code>${sale.invoice_number || 'INV-' + sale.id}</code></td>
                        <td>${sale.notes || 'Sale transaction'}</td>
                        <td class="text-end">${formatCurrency(sale.total_amount)}</td>
                        <td class="text-end text-success">${formatCurrency(totalPaidForSale)}</td>
                        <td class="text-center">
                          <span class="badge bg-${status === 'Paid' ? 'success' : status === 'Partial' ? 'warning' : 'danger'}">${status}</span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <!-- Payment History -->
        <div class="card mb-4">
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
                    <th>Invoice #</th>
                    <th class="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${payments.map(payment => {
                    const relatedSale = sales.find(s => s.id == payment.sale_id || s.id == payment.invoice_id);
                    return `
                      <tr>
                        <td>${new Date(payment.payment_date || payment.created_at).toLocaleDateString()}</td>
                        <td>${payment.payment_method || 'Cash'}</td>
                        <td><code class="small">${payment.reference_number || payment.transaction_id || '-'}</code></td>
                        <td>${relatedSale ? (relatedSale.invoice_number || 'INV-' + relatedSale.id) : '-'}</td>
                        <td class="text-end text-success fw-bold">${formatCurrency(payment.amount)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }
