// Clean, functional customers page JavaScript

// Configuration
const CURRENCY_CONFIG = window.CURRENCY_CONFIG || { symbol: 'â‚¦', position: 'before', decimals: 2 };
const SYSTEM_CURRENCY = window.SYSTEM_CURRENCY || 'NGN';
const SUBSCRIPTION_INFO = window.SUBSCRIPTION_INFO || {};
const CUSTOMER_LIMITS = window.CUSTOMER_LIMITS || {free: 50, starter: 100, professional: 1000, enterprise: -1};

// State
let customers = [];
let currentFilter = 'all';
let pendingDeleteId = null;

// Utility functions
function formatCurrency(amount) {
  const n = parseFloat(amount || 0);
  if (isNaN(n)) return CURRENCY_CONFIG.symbol + '0.00';
  
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

// Show success/error messages
function showMessage(message, type = 'success') {
  const alertsContainer = document.getElementById('alerts');
  if (!alertsContainer) return;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  alertsContainer.appendChild(alertDiv);
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {

  
  // Check Bootstrap
  if (typeof bootstrap === 'undefined') {
    console.error('âŒ Bootstrap not loaded!');
    return;
  }
  
  // Initialize components
  setupEventListeners();
  setupSearch();
  setupTabs();
  
  // Load customers
  fetchCustomers();
  

});

// Setup event listeners
function setupEventListeners() {
  // Add customer button
  const addBtn = document.getElementById('btnAddCustomer');
  if (addBtn) {
    addBtn.addEventListener('click', () => openCustomerModal());
  }
  
  // Customer form submission
  const form = document.getElementById('customerForm');
  if (form) {
    form.addEventListener('submit', saveCustomer);
  }
  
  // Delete confirmation
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDeleteCustomer);
  }
  
  // Event delegation for action buttons
  document.addEventListener('click', function(e) {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      e.preventDefault();
      const action = actionEl.getAttribute('data-action');
      const id = actionEl.getAttribute('data-id');
      

      
      if (action === 'edit') {
        editCustomer(id);
      } else if (action === 'delete') {
        showDeleteModal(id);
      } else if (action === 'report') {
        showCustomerReport(id);
      }
    }
  });
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById('customer-search');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchTerm = e.target.value.trim();
        fetchCustomers(searchTerm);
      }, 300);
    });
  }
}

// Setup tab navigation
function setupTabs() {
  document.querySelectorAll('.nav-tabs .nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Update active tab
      document.querySelectorAll('.nav-tabs .nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Update filter and reload
      currentFilter = link.getAttribute('data-filter') || 'all';
      fetchCustomers();
    });
  });
}

// Fetch customers from API
async function fetchCustomers(searchTerm = '') {

  
  try {
    let url = '../api/customers.php';
    if (searchTerm) {
      url += '?search=' + encodeURIComponent(searchTerm);
    }
    
    const response = await fetch(url, {
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();

    
    if (data.success) {
      let customerList = data.data || [];
      
      // Apply client-side filtering
      if (currentFilter === 'active') {
        customerList = customerList.filter(c => c.is_active == 1);
      } else if (currentFilter === 'with_balance') {
        customerList = customerList.filter(c => parseFloat(c.balance || 0) > 0);
      }
      
      customers = customerList;
      displayCustomers(customers);
    } else {
      console.error('âŒ API Error:', data.error);
      displayCustomers([]);
    }
    
  } catch (error) {
    console.error('âŒ Fetch Error:', error);
    displayCustomers([]);
  }
}

// Display customers in table
function displayCustomers(customerList) {

  
  const tbody = document.getElementById('customerTableBody');
  if (!tbody) {
    console.error('âŒ Table body not found');
    return;
  }
  
  tbody.innerHTML = '';
  
  if (customerList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4">
          <div class="text-muted">
            <i class="fas fa-users-slash mb-2" style="font-size: 2rem;"></i>
            <br>No customers found
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  customerList.forEach(customer => {
    const row = createCustomerRow(customer);
    tbody.appendChild(row);
  });
  
  // Initialize dropdowns
  initializeDropdowns();
}

// Create customer table row
function createCustomerRow(customer) {
  const row = document.createElement('tr');
  row.dataset.id = customer.id;
  
  const name = customer.name || 'Unknown Customer';
  const email = customer.email || 'No email';
  const phone = customer.phone || 'No phone';
  const address = customer.billing_address || customer.address || 'No address';
  const balance = formatCurrency(customer.balance || 0);
  const isActive = customer.is_active == 1;
  
  row.innerHTML = `
    <td>${escapeHtml(name)}</td>
    <td>${escapeHtml(phone)}</td>
    <td>${escapeHtml(email)}</td>
    <td>${escapeHtml(address)}</td>
    <td class="text-end">${balance}</td>
    <td class="text-center">
      <span class="badge bg-${isActive ? 'success' : 'secondary'}">
        ${isActive ? 'Active' : 'Inactive'}
      </span>
    </td>
    <td class="text-center">
      <div class="dropdown">
        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false">
          <i class="fas fa-ellipsis-v"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="#" data-action="edit" data-id="${customer.id}">
            <i class="fas fa-edit me-2 text-primary"></i>Edit Customer
          </a></li>
          <li><a class="dropdown-item" href="#" data-action="report" data-id="${customer.id}">
            <i class="fas fa-chart-line me-2 text-success"></i>Customer Report
          </a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" data-action="delete" data-id="${customer.id}">
            <i class="fas fa-trash me-2"></i>Delete Customer
          </a></li>
        </ul>
      </div>
    </td>
  `;
  
  return row;
}

// Initialize dropdowns
function initializeDropdowns() {
  setTimeout(() => {
    const dropdownElements = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    dropdownElements.forEach(element => {
      try {
        // Remove existing instance
        const existingDropdown = bootstrap.Dropdown.getInstance(element);
        if (existingDropdown) {
          existingDropdown.dispose();
        }
        
        // Create new instance
        new bootstrap.Dropdown(element);
      } catch (error) {
        console.error('Dropdown initialization error:', error);
      }
    });
  }, 100);
}

// Open customer modal
function openCustomerModal(customerId = null) {

  
  // Check subscription limits for new customers
  if (!customerId) {
    const currentCount = customers.length;
    const plan = SUBSCRIPTION_INFO?.plan || 'free';
    const limit = CUSTOMER_LIMITS[plan];
    
    if (limit !== -1 && currentCount >= limit) {
      showMessage(`Customer limit reached! Your ${plan} plan allows up to ${limit} customers. Please upgrade to add more.`, 'warning');
      return;
    }
  }
  
  const modal = document.getElementById('customerModal');
  const modalTitle = document.getElementById('customer-modal-title');
  const form = document.getElementById('customerForm');
  
  if (!modal || !form) {
    console.error('âŒ Modal or form not found');
    return;
  }
  
  // Reset form
  form.reset();
  form.classList.remove('was-validated');
  
  if (customerId) {
    modalTitle.textContent = 'Edit Customer';
    loadCustomerForEdit(customerId);
  } else {
    modalTitle.textContent = 'Add Customer';
    document.getElementById('customer-id').value = '';
  }
  
  // Show modal
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

// Load customer data for editing
function loadCustomerForEdit(customerId) {
  const customer = customers.find(c => c.id == customerId);
  if (!customer) {
    showMessage('Customer not found', 'danger');
    return;
  }
  
  // Populate form fields
  document.getElementById('customer-id').value = customer.id;
  document.getElementById('customer-name').value = customer.name || '';
  document.getElementById('customer-phone').value = customer.phone || '';
  document.getElementById('customer-email').value = customer.email || '';
  document.getElementById('customer-address').value = customer.billing_address || '';
  document.getElementById('customer-type').value = customer.customer_type || 'individual';
  document.getElementById('customer-payment-terms').value = customer.payment_terms || 'Net 30';
  document.getElementById('customer-credit-limit').value = customer.credit_limit || '0';
  document.getElementById('customer-is-active').checked = customer.is_active == 1;
}

// Save customer
async function saveCustomer(e) {
  e.preventDefault();
  
  const form = document.getElementById('customerForm');
  const saveBtn = document.getElementById('saveCustomerBtn');
  
  if (!form) return;
  
  // Validate form
  form.classList.add('was-validated');
  if (!form.checkValidity()) {
    return;
  }
  
  const customerId = document.getElementById('customer-id').value;
  const isEdit = !!customerId;
  
  // Prepare data
  const formData = {
    name: document.getElementById('customer-name').value.trim(),
    phone: document.getElementById('customer-phone').value.trim(),
    email: document.getElementById('customer-email').value.trim(),
    billing_address: document.getElementById('customer-address').value.trim(),
    customer_type: document.getElementById('customer-type').value,
    payment_terms: document.getElementById('customer-payment-terms').value,
    credit_limit: parseFloat(document.getElementById('customer-credit-limit').value) || 0,
    is_active: document.getElementById('customer-is-active').checked ? 1 : 0
  };
  
  try {
    // Update button state
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
    }
    
    const url = isEdit ? `../api/customers.php?id=${encodeURIComponent(customerId)}` : '../api/customers.php';
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'same-origin'
    });
    
    let result;
    try {
      const text = await response.text();
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid response format');
    }
    
    if (response.ok && result.success) {
      showMessage(isEdit ? 'Customer updated successfully!' : 'Customer created successfully!', 'success');
      
      // Hide modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('customerModal'));
      if (modal) modal.hide();
      
      // Refresh list
      fetchCustomers();
      
    } else {
      throw new Error(result.message || result.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('Save error:', error);
    showMessage('Error: ' + error.message, 'danger');
  } finally {
    // Reset button state
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Customer';
    }
  }
}

// Edit customer
function editCustomer(id) {

  openCustomerModal(id);
}

// Show delete modal
function showDeleteModal(id) {

  
  const customer = customers.find(c => c.id == id);
  if (!customer) {
    showMessage('Customer not found', 'danger');
    return;
  }
  
  pendingDeleteId = id;
  
  const deleteText = document.getElementById('customerDeleteText');
  if (deleteText) {
    deleteText.textContent = `Are you sure you want to delete "${customer.name}"?`;
  }
  
  const modal = new bootstrap.Modal(document.getElementById('deleteCustomerModal'));
  modal.show();
}

// Confirm delete customer
async function confirmDeleteCustomer() {
  if (!pendingDeleteId) return;
  
  const customer = customers.find(c => c.id == pendingDeleteId);
  if (!customer) {
    showMessage('Customer not found', 'danger');
    return;
  }
  
  try {
    const response = await fetch(`../api/customers.php?id=${encodeURIComponent(pendingDeleteId)}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      showMessage(`Customer "${customer.name}" deleted successfully!`, 'success');
      
      // Hide modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteCustomerModal'));
      if (modal) modal.hide();
      
      // Remove from local array and update display immediately
      customers = customers.filter(c => c.id != pendingDeleteId);
      displayCustomers(customers);
      
      pendingDeleteId = null;
      
    } else {
      throw new Error(result.message || result.error || 'Delete failed');
    }
    
  } catch (error) {
    console.error('Delete error:', error);
    showMessage('Error deleting customer: ' + error.message, 'danger');
  }
}

// Show customer report
function showCustomerReport(id) {

  
  const customer = customers.find(c => c.id == id);
  if (!customer) {
    showMessage('Customer not found', 'danger');
    return;
  }
  
  const modal = new bootstrap.Modal(document.getElementById('customerReportModal'));
  const content = document.getElementById('customerReportContent');
  
  if (content) {
    content.innerHTML = `
      <div class="row">
        <div class="col-md-8">
          <h5>${escapeHtml(customer.name)}</h5>
          <p class="text-muted mb-1"><i class="fas fa-envelope me-2"></i>${escapeHtml(customer.email || 'No email')}</p>
          <p class="text-muted mb-1"><i class="fas fa-phone me-2"></i>${escapeHtml(customer.phone || 'No phone')}</p>
          <p class="text-muted"><i class="fas fa-map-marker-alt me-2"></i>${escapeHtml(customer.billing_address || 'No address')}</p>
        </div>
        <div class="col-md-4 text-end">
          <h4 class="text-primary">${formatCurrency(customer.balance || 0)}</h4>
          <small class="text-muted">Current Balance</small>
          <br>
          <span class="badge bg-${customer.is_active == 1 ? 'success' : 'secondary'} mt-2">
            ${customer.is_active == 1 ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <hr>
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        Detailed customer report functionality coming soon. This will include sales history, payments, and transaction details.
      </div>
    `;
  }
  
  modal.show();
}


