
(() => {
  // state
  let currentFilter = 'all';
  const apiBase = 'api/customers.php?company_id=1';
  const customerModalEl = document.getElementById('customerModal');
  const bsCustomerModal = new bootstrap.Modal(customerModalEl, { backdrop: 'static' });

  // elements
  const alertsEl = document.getElementById('alerts');
  const tbody = document.querySelector('#customers-table tbody');
  const countEl = document.getElementById('customers-count');
  const btnAdd = document.getElementById('btnAddCustomer');
  const saveBtn = document.getElementById('saveCustomerBtn');
  const form = document.getElementById('customerForm');

  // helpers
  function showAlert(msg, type='success', timeout=5000) {
    const id = 'alert-' + Date.now();
    alertsEl.innerHTML = `
      <div id="${id}" class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${escapeHtml(msg)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    ` + alertsEl.innerHTML;
    if (timeout) setTimeout(()=> {
      const el = document.getElementById(id);
      if (el) el.remove();
    }, timeout);
  }

  function escapeHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    return String(str).replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCurrency(amount) {
    const n = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(isNaN(n) ? 0 : n);
  }

  // robust JSON normalizer (supports array or { success, data } or { accounts: [] } etc.)
  function normalizeApiResponse(json) {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (json.success && Array.isArray(json.data)) return json.data;
    if (json.success && Array.isArray(json.customers)) return json.customers;
    if (Array.isArray(json.customers)) return json.customers;
    if (Array.isArray(json.rows)) return json.rows;
    if (Array.isArray(json.accounts)) return json.accounts;
    // Fallback: if object with numeric keys, map to array
    return Object.values(json).filter(v => v && typeof v === 'object' && ('id' in v || 'name' in v));
  }

  // fetch customers, render table
  async function fetchCustomers(filter = 'all') {
    try {
      tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-muted">Loading...</td></tr>`;
      countEl.textContent = '';

      let url = apiBase;
      if (filter && filter !== 'all') {
        url += `&filter=${encodeURIComponent(filter)}`;
      }

      const resp = await fetch(url, { credentials: 'same-origin' });
      const json = await resp.json();
      const list = normalizeApiResponse(json);

      // handle empty
      if (!Array.isArray(list) || list.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted py-4">
              No customers found. <a href="#" id="emptyAdd">Add your first customer</a>
            </td>
          </tr>
        `;
        const el = document.getElementById('emptyAdd');
        if (el) el.addEventListener('click', (e) => { e.preventDefault(); openAddCustomer(); });
        countEl.textContent = '0 customers';
        return;
      }

      // populate rows
      tbody.innerHTML = '';
      list.forEach(customer => {
        const isActive = Number(customer.is_active) === 1 || customer.is_active === true;
        const statusBadge = isActive ? 'success' : 'secondary';
        const statusText = isActive ? 'Active' : 'Inactive';
        const phone = customer.phone || 'N/A';
        const email = customer.email || 'N/A';
        const address = customer.billing_address || customer.address || 'No address';
        const balance = formatCurrency(customer.balance || customer.opening_balance || 0);

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="text-start">${escapeHtml(customer.name || '')}</td>
          <td>${escapeHtml(phone)}</td>
          <td>${escapeHtml(email)}</td>
          <td><span class="text-truncate-200" title="${escapeHtml(address)}">${escapeHtml(address)}</span></td>
          <td class="text-end fw-semibold">${balance}</td>
          <td><span class="badge bg-${statusBadge}">${statusText}</span></td>
          <td class="text-center">
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button"
                      data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#" data-action="view" data-id="${customer.id}"><i class="fas fa-eye me-2"></i>View</a></li>
                <li><a class="dropdown-item" href="#" data-action="edit" data-id="${customer.id}"><i class="fas fa-edit me-2"></i>Edit</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#" data-action="delete" data-id="${customer.id}"><i class="fas fa-trash me-2"></i>Delete</a></li>
              </ul>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      countEl.textContent = `${list.length} customers`;
      // attach dropdown action listeners (event delegation)
      tbody.querySelectorAll('[data-action]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const action = el.getAttribute('data-action');
          const id = el.getAttribute('data-id');
          if (action === 'view') viewCustomer(id);
          else if (action === 'edit') editCustomer(id);
          else if (action === 'delete') deleteCustomer(id);
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load customers</td></tr>`;
      showAlert('Failed to load customers: ' + (err.message || err), 'danger', 7000);
    }
  }

  // Open Add
  function openAddCustomer() {
    form.reset();
    form.classList.remove('was-validated');
    document.getElementById('customer-id').value = '';
    document.getElementById('customer-payment-terms').value = 'Net 30';
    document.getElementById('customer-is-active').checked = true;
    document.getElementById('customer-modal-title').textContent = 'Add Customer';
    bsCustomerModal.show();
  }

  // Edit
  async function editCustomer(id) {
    try {
      const resp = await fetch(`api/customers.php?id=${encodeURIComponent(id)}`);
      const json = await resp.json();
      const data = normalizeApiResponse(json);
      const customer = Array.isArray(data) ? data[0] : (json.data || json || null);
      if (!customer || (!customer.id && !customer.name)) {
        showAlert('Failed to load customer details', 'danger');
        return;
      }

      document.getElementById('customer-modal-title').textContent = 'Edit Customer';
      document.getElementById('customer-id').value = customer.id || '';
      document.getElementById('customer-name').value = customer.name || '';
      document.getElementById('customer-phone').value = customer.phone || '';
      document.getElementById('customer-email').value = customer.email || '';
      document.getElementById('customer-address').value = customer.billing_address || customer.address || '';
      document.getElementById('customer-payment-terms').value = customer.payment_terms || 'Net 30';
      document.getElementById('customer-credit-limit').value = customer.credit_limit || '';
      document.getElementById('customer-is-active').checked = (Number(customer.is_active) === 1) || (customer.is_active === true);

      form.classList.remove('was-validated');
      bsCustomerModal.show();
    } catch (err) {
      showAlert('Error loading customer: ' + (err.message || err), 'danger');
    }
  }

  // View (simple info alert for now)
  async function viewCustomer(id) {
    try {
      const resp = await fetch(`api/customers.php?id=${encodeURIComponent(id)}`);
      const json = await resp.json();
      const data = normalizeApiResponse(json);
      const customer = Array.isArray(data) ? data[0] : (json.data || json || null);
      if (!customer) { showAlert('Failed to get customer', 'danger'); return; }
      showAlert(`${customer.name} • Balance: ${formatCurrency(customer.balance || 0)}`, 'info', 7000);
    } catch (err) {
      showAlert('Error loading customer: ' + (err.message || err), 'danger');
    }
  }

  // Delete
  async function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      const resp = await fetch(`api/customers.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      const json = await resp.json();
      if (resp.ok) {
        showAlert('Customer deleted successfully');
        fetchCustomers(currentFilter);
      } else {
        const msg = (json && (json.message || json.error)) || 'Error deleting customer';
        showAlert(msg, 'danger');
      }
    } catch (err) {
      showAlert('Network error: ' + (err.message || err), 'danger');
    }
  }

  // Save (create/update)
  async function saveCustomer(e) {
    e.preventDefault();
    // client-side validation
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    const customerId = document.getElementById('customer-id').value;
    const payload = {
      company_id: 1,
      name: document.getElementById('customer-name').value.trim(),
      phone: document.getElementById('customer-phone').value.trim(),
      email: document.getElementById('customer-email').value.trim(),
      billing_address: document.getElementById('customer-address').value.trim(),
      payment_terms: document.getElementById('customer-payment-terms').value,
      credit_limit: parseFloat(document.getElementById('customer-credit-limit').value) || 0,
      is_active: document.getElementById('customer-is-active').checked ? 1 : 0
    };

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = 'Saving...';

      const url = customerId ? `api/customers.php?id=${encodeURIComponent(customerId)}` : 'api/customers.php';
      const method = customerId ? 'PUT' : 'POST';
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });

      const json = await resp.json();
      if (resp.ok) {
        showAlert(customerId ? 'Customer updated successfully!' : 'Customer added successfully!');
        bsCustomerModal.hide();
        fetchCustomers(currentFilter);
      } else {
        const msg = (json && (json.message || json.error)) || 'Error saving customer';
        showAlert(msg, 'danger');
      }
    } catch (err) {
      showAlert('Network error: ' + (err.message || err), 'danger');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Customer';
    }
  }

  // Filter handling (tabs)
  document.querySelectorAll('.nav-tabs .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-tabs .nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentFilter = link.getAttribute('data-filter') || 'all';
      fetchCustomers(currentFilter);
    });
  });

  // attach events
  btnAdd.addEventListener('click', openAddCustomer);
  form.addEventListener('submit', saveCustomer);

  // Close modal on ESC is handled by bootstrap automatically.
  // Clicking outside will close modal; we used static backdrop only while shown.

  // Initial load
  document.addEventListener('DOMContentLoaded', () => {
    fetchCustomers();
  });
})();
