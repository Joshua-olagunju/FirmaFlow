/**
 * SuperAdmin Dashboard JavaScript
 * Mobile-first responsive functionality
 */

class SuperAdminDashboard {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileNavigation();
        this.setupDataTables();
        this.setupModals();
        this.setupForms();
        this.setupCharts();
        this.setupNotifications();
        this.setupRealTimeUpdates();
    }

    setupMobileNavigation() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarClose = document.getElementById('sidebarClose');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        const showSidebar = () => {
            sidebar?.classList.add('show');
            overlay?.classList.add('show');
            document.body.style.overflow = 'hidden';
        };

        const hideSidebar = () => {
            sidebar?.classList.remove('show');
            overlay?.classList.remove('show');
            document.body.style.overflow = '';
        };

        sidebarToggle?.addEventListener('click', showSidebar);
        sidebarClose?.addEventListener('click', hideSidebar);
        overlay?.addEventListener('click', hideSidebar);

        // Auto-hide sidebar on mobile when clicking nav links
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    hideSidebar();
                }
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                hideSidebar();
            }
        });
    }

    setupDataTables() {
        // Enhanced table functionality
        document.querySelectorAll('.data-table').forEach(table => {
            this.initDataTable(table);
        });
    }

    initDataTable(table) {
        // Add search functionality
        const searchInput = table.parentElement.querySelector('.table-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTable(table, e.target.value);
            });
        }

        // Add sorting functionality
        table.querySelectorAll('th[data-sort]').forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.sortTable(table, header.dataset.sort);
            });
        });

        // Add pagination
        this.setupPagination(table);
    }

    filterTable(table, searchTerm) {
        const rows = table.querySelectorAll('tbody tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    sortTable(table, column) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const index = [...table.querySelectorAll('th')].findIndex(th => th.dataset.sort === column);

        rows.sort((a, b) => {
            const aVal = a.cells[index]?.textContent.trim();
            const bVal = b.cells[index]?.textContent.trim();
            
            if (!isNaN(aVal) && !isNaN(bVal)) {
                return parseFloat(aVal) - parseFloat(bVal);
            }
            return aVal.localeCompare(bVal);
        });

        rows.forEach(row => tbody.appendChild(row));
    }

    setupPagination(table) {
        const rowsPerPage = 10;
        const rows = table.querySelectorAll('tbody tr');
        const totalPages = Math.ceil(rows.length / rowsPerPage);
        
        if (totalPages <= 1) return;

        const paginationContainer = document.createElement('nav');
        paginationContainer.className = 'mt-3';
        paginationContainer.innerHTML = this.createPaginationHTML(totalPages);
        
        table.parentElement.appendChild(paginationContainer);
        
        this.showPage(table, 1, rowsPerPage);
        this.setupPaginationEvents(table, paginationContainer, rowsPerPage);
    }

    createPaginationHTML(totalPages) {
        let html = '<ul class="pagination pagination-sm justify-content-center">';
        
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${i === 1 ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                     </li>`;
        }
        
        html += '</ul>';
        return html;
    }

    showPage(table, page, rowsPerPage) {
        const rows = table.querySelectorAll('tbody tr');
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        rows.forEach((row, index) => {
            row.style.display = (index >= start && index < end) ? '' : 'none';
        });
    }

    setupPaginationEvents(table, container, rowsPerPage) {
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                
                container.querySelectorAll('.page-item').forEach(item => {
                    item.classList.remove('active');
                });
                e.target.parentElement.classList.add('active');
                
                this.showPage(table, page, rowsPerPage);
            }
        });
    }

    setupModals() {
        // Enhanced modal functionality
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-modal-action')) {
                this.handleModalAction(e.target);
            }
        });
    }

    handleModalAction(element) {
        const action = element.dataset.modalAction;
        const target = element.dataset.modalTarget;
        
        switch (action) {
            case 'edit':
                this.openEditModal(target, element.dataset);
                break;
            case 'delete':
                this.openDeleteModal(target, element.dataset);
                break;
            case 'view':
                this.openViewModal(target, element.dataset);
                break;
        }
    }

    openEditModal(modalId, data) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Populate form fields with data
        Object.keys(data).forEach(key => {
            if (key.startsWith('field')) {
                const fieldName = key.replace('field', '').toLowerCase();
                const input = modal.querySelector(`[name="${fieldName}"]`);
                if (input) {
                    input.value = data[key];
                }
            }
        });

        new bootstrap.Modal(modal).show();
    }

    openDeleteModal(modalId, data) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const nameElement = modal.querySelector('.delete-item-name');
        if (nameElement && data.name) {
            nameElement.textContent = data.name;
        }

        const confirmButton = modal.querySelector('.confirm-delete');
        if (confirmButton && data.id) {
            confirmButton.dataset.deleteId = data.id;
        }

        new bootstrap.Modal(modal).show();
    }

    setupForms() {
        document.querySelectorAll('form[data-ajax]').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAjaxForm(form);
            });
        });
    }

    async handleAjaxForm(form) {
        const formData = new FormData(form);
        const url = form.action || window.location.href;
        
        try {
            this.setFormLoading(form, true);
            
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Success!', result.message, 'success');
                if (result.redirect) {
                    setTimeout(() => window.location.href = result.redirect, 1000);
                } else if (result.reload) {
                    setTimeout(() => window.location.reload(), 1000);
                }
            } else {
                this.showNotification('Error', result.message, 'error');
            }
        } catch (error) {
            this.showNotification('Error', 'An unexpected error occurred', 'error');
        } finally {
            this.setFormLoading(form, false);
        }
    }

    setFormLoading(form, loading) {
        const submitButton = form.querySelector('button[type="submit"]');
        const spinner = form.querySelector('.loading-spinner');
        
        if (loading) {
            form.classList.add('loading');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
            }
        } else {
            form.classList.remove('loading');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = submitButton.dataset.originalText || 'Submit';
            }
        }
    }

    setupCharts() {
        // Initialize charts for analytics
        this.initDashboardCharts();
    }

    initDashboardCharts() {
        // Revenue chart
        const revenueChart = document.getElementById('revenueChart');
        if (revenueChart) {
            this.createRevenueChart(revenueChart);
        }

        // Users chart
        const usersChart = document.getElementById('usersChart');
        if (usersChart) {
            this.createUsersChart(usersChart);
        }

        // Companies chart
        const companiesChart = document.getElementById('companiesChart');
        if (companiesChart) {
            this.createCompaniesChart(companiesChart);
        }
    }

    createRevenueChart(canvas) {
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    createUsersChart(canvas) {
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Active', 'Inactive', 'Pending'],
                datasets: [{
                    data: [65, 20, 15],
                    backgroundColor: ['#059669', '#dc2626', '#d97706'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createCompaniesChart(canvas) {
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Free', 'Starter', 'Professional', 'Enterprise'],
                datasets: [{
                    label: 'Companies',
                    data: [45, 30, 20, 5],
                    backgroundColor: '#dc2626',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    setupNotifications() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
    }

    showNotification(title, message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';
        
        notification.className = `alert ${alertClass} alert-dismissible fade show`;
        notification.innerHTML = `
            <strong>${title}</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, duration);
    }

    setupRealTimeUpdates() {
        // Setup WebSocket or polling for real-time updates
        this.startRealTimeUpdates();
    }

    startRealTimeUpdates() {
        // Poll for updates every 30 seconds
        setInterval(() => {
            this.updateDashboardStats();
        }, 30000);
    }

    async updateDashboardStats() {
        try {
            const response = await fetch('../api/dashboard-stats.php');
            const stats = await response.json();
            
            if (stats.success) {
                this.updateStatCards(stats.data);
            }
        } catch (error) {
            // Silently fail for real-time updates
        }
    }

    updateStatCards(stats) {
        Object.keys(stats).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SuperAdminDashboard();
});

// Utility functions
window.SuperAdmin = {
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...options.headers
                },
                ...options
            });
            
            return await response.json();
        } catch (error) {
            throw new Error('Request failed: ' + error.message);
        }
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    },

    formatDateTime(datetime) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(datetime));
    }
};