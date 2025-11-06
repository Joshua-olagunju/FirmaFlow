/**
 * Firmaflow Pagination JavaScript
 * Handles pagination for all tables across the application
 */

class FirmaflowPagination {
    constructor(options = {}) {
        this.currentPage = options.currentPage || 1;
        this.itemsPerPage = options.itemsPerPage || 20;
        this.apiEndpoint = options.apiEndpoint || '';
        this.containerId = options.containerId || 'data-container';
        this.paginationId = options.paginationId || 'pagination-container';
        this.searchParams = options.searchParams || {};
        this.onDataLoad = options.onDataLoad || null;
        this.onError = options.onError || null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Handle pagination clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.page-link[data-page]')) {
                e.preventDefault();
                const page = parseInt(e.target.getAttribute('data-page'));
                this.goToPage(page);
            }
        });
        
        // Handle items per page change
        document.addEventListener('change', (e) => {
            if (e.target.matches('.items-per-page-select')) {
                this.itemsPerPage = parseInt(e.target.value);
                this.goToPage(1); // Reset to first page when changing items per page
            }
        });
        
        // Handle search input (with debounce)
        let searchTimeout;
        document.addEventListener('input', (e) => {
            if (e.target.matches('.pagination-search')) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchParams.search = e.target.value;
                    this.goToPage(1);
                }, 500);
            }
        });
    }
    
    async goToPage(page) {
        this.currentPage = page;
        await this.loadData();
    }
    
    async loadData() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                per_page: this.itemsPerPage,
                ...this.searchParams
            });
            
            const response = await fetch(`${this.apiEndpoint}?${params.toString()}`, {
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderData(data);
                this.renderPagination(data.pagination);
                
                if (this.onDataLoad) {
                    this.onDataLoad(data);
                }
            } else {
                throw new Error(data.message || 'Failed to load data');
            }
            
        } catch (error) {
            console.error('Pagination error:', error);
            this.showError(error.message);
            
            if (this.onError) {
                this.onError(error);
            }
        } finally {
            this.hideLoading();
        }
    }
    
    renderData(data) {
        const container = document.getElementById(this.containerId);
        if (container) {
            // This will be overridden by specific implementations
            container.innerHTML = this.formatData(data);
        }
    }
    
    renderPagination(paginationData) {
        const container = document.getElementById(this.paginationId);
        if (container && paginationData) {
            container.innerHTML = this.generatePaginationHTML(paginationData);
        }
    }
    
    generatePaginationHTML(pagination) {
        if (pagination.totalPages <= 1) {
            return '';
        }
        
        let html = '<nav aria-label="Page navigation" class="mt-4">';
        html += '<div class="d-flex justify-content-between align-items-center">';
        
        // Items info and per-page selector
        html += '<div class="d-flex align-items-center gap-3">';
        html += `<span class="text-muted">Showing ${pagination.startItem} to ${pagination.endItem} of ${pagination.totalItems} entries</span>`;
        html += '<select class="form-select form-select-sm items-per-page-select" style="width: auto;">';
        html += `<option value="10" ${this.itemsPerPage === 10 ? 'selected' : ''}>10 per page</option>`;
        html += `<option value="20" ${this.itemsPerPage === 20 ? 'selected' : ''}>20 per page</option>`;
        html += `<option value="50" ${this.itemsPerPage === 50 ? 'selected' : ''}>50 per page</option>`;
        html += `<option value="100" ${this.itemsPerPage === 100 ? 'selected' : ''}>100 per page</option>`;
        html += '</select>';
        html += '</div>';
        
        // Pagination controls
        html += '<ul class="pagination pagination-sm mb-0">';
        
        // Previous button
        if (pagination.hasPrevious) {
            html += '<li class="page-item">';
            html += `<a class="page-link" href="#" data-page="${pagination.currentPage - 1}">Previous</a>`;
            html += '</li>';
        } else {
            html += '<li class="page-item disabled">';
            html += '<span class="page-link">Previous</span>';
            html += '</li>';
        }
        
        // Page numbers
        const start = Math.max(1, pagination.currentPage - 2);
        const end = Math.min(pagination.totalPages, pagination.currentPage + 2);
        
        // First page
        if (start > 1) {
            html += '<li class="page-item">';
            html += '<a class="page-link" href="#" data-page="1">1</a>';
            html += '</li>';
            if (start > 2) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        // Page range
        for (let i = start; i <= end; i++) {
            if (i === pagination.currentPage) {
                html += '<li class="page-item active">';
                html += `<span class="page-link">${i}</span>`;
                html += '</li>';
            } else {
                html += '<li class="page-item">';
                html += `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
                html += '</li>';
            }
        }
        
        // Last page
        if (end < pagination.totalPages) {
            if (end < pagination.totalPages - 1) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            html += '<li class="page-item">';
            html += `<a class="page-link" href="#" data-page="${pagination.totalPages}">${pagination.totalPages}</a>`;
            html += '</li>';
        }
        
        // Next button
        if (pagination.hasNext) {
            html += '<li class="page-item">';
            html += `<a class="page-link" href="#" data-page="${pagination.currentPage + 1}">Next</a>`;
            html += '</li>';
        } else {
            html += '<li class="page-item disabled">';
            html += '<span class="page-link">Next</span>';
            html += '</li>';
        }
        
        html += '</ul>';
        html += '</div>';
        html += '</nav>';
        
        return html;
    }
    
    formatData(data) {
        // Default implementation - override in specific classes
        return '<p>No data formatting implemented</p>';
    }
    
    showLoading() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Loading data...</p>
                </div>
            `;
        }
    }
    
    hideLoading() {
        // Loading will be hidden when data is rendered
    }
    
    showError(message) {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p class="mb-0">Error loading data: ${message}</p>
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }
    
    // Utility methods
    updateSearchParams(params) {
        this.searchParams = { ...this.searchParams, ...params };
        this.goToPage(1);
    }
    
    refresh() {
        this.loadData();
    }
    
    setItemsPerPage(itemsPerPage) {
        this.itemsPerPage = itemsPerPage;
        this.goToPage(1);
    }
}

// Utility functions for common table operations
const PaginationUtils = {
    /**
     * Format currency for display
     */
    formatCurrency(amount, currency = 'NGN') {
        if (window.CURRENCY_SETTINGS) {
            const config = window.CURRENCY_SETTINGS;
            const formatted = amount.toLocaleString(undefined, {
                minimumFractionDigits: config.decimals,
                maximumFractionDigits: config.decimals
            });
            return config.position === 'before' ? config.symbol + formatted : formatted + config.symbol;
        }
        return '₦' + amount.toLocaleString();
    },
    
    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    },
    
    /**
     * Truncate text with ellipsis
     */
    truncateText(text, maxLength = 50) {
        if (!text) return '-';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    
    /**
     * Create action buttons for table rows
     */
    createActionButtons(id, actions = ['view', 'edit', 'delete']) {
        let html = '<div class="btn-group btn-group-sm">';
        
        if (actions.includes('view')) {
            html += `<button class="btn btn-outline-primary btn-sm" onclick="viewItem(${id})" title="View">
                        <i class="fas fa-eye"></i>
                     </button>`;
        }
        
        if (actions.includes('edit')) {
            html += `<button class="btn btn-outline-warning btn-sm" onclick="editItem(${id})" title="Edit">
                        <i class="fas fa-edit"></i>
                     </button>`;
        }
        
        if (actions.includes('delete')) {
            html += `<button class="btn btn-outline-danger btn-sm" onclick="deleteItem(${id})" title="Delete">
                        <i class="fas fa-trash"></i>
                     </button>`;
        }
        
        html += '</div>';
        return html;
    },
    
    /**
     * Create status badge
     */
    createStatusBadge(status) {
        const statusClasses = {
            'active': 'bg-success',
            'inactive': 'bg-secondary',
            'pending': 'bg-warning',
            'completed': 'bg-success',
            'cancelled': 'bg-danger',
            'draft': 'bg-secondary',
            'sent': 'bg-info',
            'paid': 'bg-success',
            'partially_paid': 'bg-warning',
            'overdue': 'bg-danger'
        };
        
        const className = statusClasses[status.toLowerCase()] || 'bg-secondary';
        return `<span class="badge ${className}">${status}</span>`;
    }
};

// Export for use in modules
window.FirmaflowPagination = FirmaflowPagination;
window.PaginationUtils = PaginationUtils;