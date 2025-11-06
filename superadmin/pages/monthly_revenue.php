<?php
session_start();
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

// Check if user is logged in as super admin
if (!isSuperAdmin()) {
    header('Location: ../login.php');
    exit;
}

$pageTitle = 'Monthly Revenue Analytics';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $pageTitle ?> - SuperAdmin</title>
    
    <!-- Bootstrap 5.3.0 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Tabler Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons@2.44.0/tabler-icons.min.css">
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <style>
        :root {
            --primary: #dc2626;
            --sidebar-bg: #1e293b;
            --sidebar-hover: #334155;
        }
        
        body {
            background-color: #f8fafc;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .sidebar {
            background-color: var(--sidebar-bg);
            min-height: 100vh;
            width: 280px;
            position: fixed;
            left: 0;
            top: 0;
            z-index: 1000;
            transition: transform 0.3s ease;
        }
        
        .sidebar-brand {
            padding: 1.5rem;
            border-bottom: 1px solid #334155;
        }
        
        .main-content {
            margin-left: 280px;
            min-height: 100vh;
            padding: 2rem;
        }
        
        .revenue-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: none;
        }
        
        .revenue-stat {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            padding: 1.5rem;
        }
        
        .revenue-stat.success {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .revenue-stat.warning {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .revenue-stat.info {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        
        .revenue-stat.primary {
            background: linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%);
        }
        
        .chart-container {
            position: relative;
            height: 400px;
            margin: 20px 0;
        }
        
        .filter-card {
            background: white;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .table-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .status-completed { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-failed { background: #fee2e2; color: #991b1b; }
        
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                position: fixed;
            }
            
            .main-content {
                margin-left: 0;
                padding: 1rem;
            }
        }
    </style>
</head>
<body>

<!-- Sidebar -->
<div class="sidebar">
    <div class="sidebar-brand">
        <h4 class="text-white mb-0">
            <i class="ti ti-shield-lock me-2"></i>SuperAdmin
        </h4>
    </div>
    
    <div class="p-3">
        <a href="../index.php" class="btn btn-outline-light btn-sm w-100 mb-2">
            <i class="ti ti-arrow-left me-2"></i>Back to Dashboard
        </a>
    </div>
</div>

<!-- Main Content -->
<div class="main-content">
    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h1 class="h3 mb-1">Monthly Revenue Analytics</h1>
            <p class="text-muted mb-0">Comprehensive subscription revenue analysis and insights</p>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm" onclick="exportData()">
                <i class="ti ti-download me-1"></i>Export
            </button>
            <button class="btn btn-primary btn-sm" onclick="refreshData()">
                <i class="ti ti-refresh me-1"></i>Refresh
            </button>
        </div>
    </div>

    <!-- Filter Card -->
    <div class="filter-card">
        <div class="row g-3">
            <div class="col-md-3">
                <label for="monthFilter" class="form-label">Month</label>
                <select id="monthFilter" class="form-select" onchange="applyFilters()">
                    <option value="">All Months</option>
                    <option value="2025-01">January 2025</option>
                    <option value="2025-02">February 2025</option>
                    <option value="2025-03">March 2025</option>
                    <option value="2025-04">April 2025</option>
                    <option value="2025-05">May 2025</option>
                    <option value="2025-06">June 2025</option>
                    <option value="2025-07">July 2025</option>
                    <option value="2025-08">August 2025</option>
                    <option value="2025-09">September 2025</option>
                    <option value="2025-10" selected>October 2025</option>
                    <option value="2025-11">November 2025</option>
                    <option value="2025-12">December 2025</option>
                    <option value="2024-12">December 2024</option>
                    <option value="2024-11">November 2024</option>
                    <option value="2024-10">October 2024</option>
                </select>
            </div>
            <div class="col-md-3">
                <label for="statusFilter" class="form-label">Payment Status</label>
                <select id="statusFilter" class="form-select" onchange="applyFilters()">
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            <div class="col-md-3">
                <label for="planFilter" class="form-label">Plan Type</label>
                <select id="planFilter" class="form-select" onchange="applyFilters()">
                    <option value="">All Plans</option>
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                </select>
            </div>
            <div class="col-md-3">
                <label for="billingFilter" class="form-label">Billing Type</label>
                <select id="billingFilter" class="form-select" onchange="applyFilters()">
                    <option value="">All Types</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Revenue Stats -->
    <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
            <div class="revenue-stat primary">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="h4 mb-0" id="totalRevenue">₦0</div>
                        <div class="small opacity-75">Total Revenue</div>
                    </div>
                    <i class="ti ti-currency-naira" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        
        <div class="col-6 col-lg-3">
            <div class="revenue-stat success">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="h4 mb-0" id="totalTransactions">0</div>
                        <div class="small opacity-75">Total Transactions</div>
                    </div>
                    <i class="ti ti-receipt" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        
        <div class="col-6 col-lg-3">
            <div class="revenue-stat warning">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="h4 mb-0" id="averageRevenue">₦0</div>
                        <div class="small opacity-75">Average Per Transaction</div>
                    </div>
                    <i class="ti ti-chart-line" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        
        <div class="col-6 col-lg-3">
            <div class="revenue-stat info">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="h4 mb-0" id="successRate">0%</div>
                        <div class="small opacity-75">Success Rate</div>
                    </div>
                    <i class="ti ti-trending-up" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- Charts Row -->
    <div class="row g-3 mb-4">
        <div class="col-lg-8">
            <div class="revenue-card">
                <div class="card-header border-0 pb-0">
                    <h5 class="card-title mb-0">Revenue Trend</h5>
                    <small class="text-muted">Monthly subscription revenue over time</small>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-lg-4">
            <div class="revenue-card">
                <div class="card-header border-0 pb-0">
                    <h5 class="card-title mb-0">Plan Distribution</h5>
                    <small class="text-muted">Revenue by subscription plan</small>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="planChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Billing Type Chart -->
    <div class="row g-3 mb-4">
        <div class="col-lg-6">
            <div class="revenue-card">
                <div class="card-header border-0 pb-0">
                    <h5 class="card-title mb-0">Billing Type Revenue</h5>
                    <small class="text-muted">Monthly vs Yearly subscriptions</small>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="billingChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-lg-6">
            <div class="revenue-card">
                <div class="card-header border-0 pb-0">
                    <h5 class="card-title mb-0">Payment Status</h5>
                    <small class="text-muted">Transaction status distribution</small>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="statusChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Detailed Transactions Table -->
    <div class="table-container">
        <div class="card-header border-0 bg-white">
            <div class="d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">Recent Transactions</h5>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-secondary btn-sm" onclick="prevPage()">
                        <i class="ti ti-chevron-left"></i>
                    </button>
                    <span id="pageInfo" class="small text-muted align-self-center">Page 1 of 1</span>
                    <button class="btn btn-outline-secondary btn-sm" onclick="nextPage()">
                        <i class="ti ti-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr>
                        <th>Transaction ID</th>
                        <th>Company</th>
                        <th>Plan</th>
                        <th>Billing</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment Method</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="transactionsTable">
                    <tr>
                        <td colspan="9" class="text-center py-4">
                            <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                            Loading transactions...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Transaction Details Modal -->
<div class="modal fade" id="transactionModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Transaction Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="transactionDetails">
                <!-- Transaction details will be loaded here -->
            </div>
        </div>
    </div>
</div>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
let currentPage = 1;
let totalPages = 1;
let revenueChart, planChart, billingChart, statusChart;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    loadRevenueData();
});

function initializeCharts() {
    // Revenue Trend Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue (₦)',
                data: [],
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₦' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Plan Distribution Chart
    const planCtx = document.getElementById('planChart').getContext('2d');
    planChart = new Chart(planCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#dc2626', '#059669', '#d97706', '#7c3aed']
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

    // Billing Type Chart
    const billingCtx = document.getElementById('billingChart').getContext('2d');
    billingChart = new Chart(billingCtx, {
        type: 'bar',
        data: {
            labels: ['Monthly', 'Yearly'],
            datasets: [{
                label: 'Revenue (₦)',
                data: [0, 0],
                backgroundColor: ['#3b82f6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₦' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Status Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    statusChart = new Chart(statusCtx, {
        type: 'pie',
        data: {
            labels: ['Completed', 'Pending', 'Failed'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
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

async function loadRevenueData() {
    try {
        const filters = getFilters();
        // Use relative path to api folder
        const response = await fetch(`../api/revenue_api.php?action=get_revenue_data&${new URLSearchParams(filters)}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.success) {
            updateStats(data.stats);
            updateCharts(data.charts);
            updateTransactionsTable(data.transactions);
            updatePagination(data.pagination);
        } else {
            showError('Failed to load revenue data: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading revenue data:', error);
        showError('Error loading revenue data: ' + error.message);
    }
}

function getFilters() {
    return {
        month: document.getElementById('monthFilter').value,
        status: document.getElementById('statusFilter').value,
        plan: document.getElementById('planFilter').value,
        billing: document.getElementById('billingFilter').value,
        page: currentPage
    };
}

function updateStats(stats) {
    document.getElementById('totalRevenue').textContent = formatCurrency(stats.total_revenue || 0);
    document.getElementById('totalTransactions').textContent = (stats.total_transactions || 0).toLocaleString();
    document.getElementById('averageRevenue').textContent = formatCurrency(stats.average_revenue || 0);
    document.getElementById('successRate').textContent = (stats.success_rate || 0) + '%';
}

function updateCharts(charts) {
    // Update revenue trend chart
    if (charts.revenue_trend) {
        revenueChart.data.labels = charts.revenue_trend.labels;
        revenueChart.data.datasets[0].data = charts.revenue_trend.data;
        revenueChart.update();
    }

    // Update plan distribution chart
    if (charts.plan_distribution) {
        planChart.data.labels = charts.plan_distribution.labels;
        planChart.data.datasets[0].data = charts.plan_distribution.data;
        planChart.update();
    }

    // Update billing type chart
    if (charts.billing_type) {
        billingChart.data.datasets[0].data = [
            charts.billing_type.monthly || 0,
            charts.billing_type.yearly || 0
        ];
        billingChart.update();
    }

    // Update status chart
    if (charts.status_distribution) {
        statusChart.data.datasets[0].data = [
            charts.status_distribution.completed || 0,
            charts.status_distribution.pending || 0,
            charts.status_distribution.failed || 0
        ];
        statusChart.update();
    }
}

function updateTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsTable');
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4 text-muted">
                    <i class="ti ti-inbox me-2"></i>No transactions found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td>
                <span class="font-monospace small">${tx.transaction_id}</span>
            </td>
            <td>
                <div>
                    <div class="fw-medium">${tx.company_name || 'N/A'}</div>
                    <small class="text-muted">ID: ${tx.company_id}</small>
                </div>
            </td>
            <td>
                <span class="badge bg-primary">${tx.plan_type}</span>
            </td>
            <td>
                <span class="badge bg-secondary">${tx.billing_type}</span>
            </td>
            <td class="fw-bold">
                ${formatCurrency(tx.amount)}
            </td>
            <td>
                <span class="status-badge status-${tx.status}">${tx.status}</span>
            </td>
            <td>
                ${tx.payment_method || 'N/A'}
            </td>
            <td>
                <small>${formatDate(tx.created_at)}</small>
            </td>
            <td>
                <button class="btn btn-outline-primary btn-sm" onclick="viewTransaction('${tx.id}')">
                    <i class="ti ti-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updatePagination(pagination) {
    currentPage = pagination.current_page;
    totalPages = pagination.total_pages;
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
}

function applyFilters() {
    currentPage = 1;
    loadRevenueData();
}

function refreshData() {
    loadRevenueData();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadRevenueData();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadRevenueData();
    }
}

async function viewTransaction(transactionId) {
    try {
        const response = await fetch(`../api/revenue_api.php?action=get_transaction&id=${transactionId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.success) {
            document.getElementById('transactionDetails').innerHTML = generateTransactionDetails(data.transaction);
            new bootstrap.Modal(document.getElementById('transactionModal')).show();
        } else {
            showError('Failed to load transaction details: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading transaction:', error);
        showError('Error loading transaction details: ' + error.message);
    }
}

function generateTransactionDetails(tx) {
    return `
        <div class="row g-3">
            <div class="col-md-6">
                <h6>Transaction Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>ID:</strong></td><td>${tx.id}</td></tr>
                    <tr><td><strong>Transaction ID:</strong></td><td class="font-monospace">${tx.transaction_id}</td></tr>
                    <tr><td><strong>Reference:</strong></td><td class="font-monospace">${tx.tx_ref}</td></tr>
                    <tr><td><strong>Amount:</strong></td><td class="fw-bold">${formatCurrency(tx.amount)}</td></tr>
                    <tr><td><strong>Currency:</strong></td><td>${tx.currency}</td></tr>
                    <tr><td><strong>Status:</strong></td><td><span class="status-badge status-${tx.status}">${tx.status}</span></td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Subscription Details</h6>
                <table class="table table-sm">
                    <tr><td><strong>Plan Type:</strong></td><td><span class="badge bg-primary">${tx.plan_type}</span></td></tr>
                    <tr><td><strong>Billing Type:</strong></td><td><span class="badge bg-secondary">${tx.billing_type}</span></td></tr>
                    <tr><td><strong>Start Date:</strong></td><td>${formatDate(tx.subscription_start)}</td></tr>
                    <tr><td><strong>End Date:</strong></td><td>${formatDate(tx.subscription_end)}</td></tr>
                    <tr><td><strong>Payment Method:</strong></td><td>${tx.payment_method || 'N/A'}</td></tr>
                    <tr><td><strong>Created:</strong></td><td>${formatDate(tx.created_at)}</td></tr>
                </table>
            </div>
        </div>
    `;
}

function exportData() {
    const filters = getFilters();
    const exportUrl = `../api/revenue_api.php?action=export&${new URLSearchParams(filters)}`;
    // Open in current window to avoid popup blockers and HTTPS issues
    window.location.href = exportUrl;
}

function formatCurrency(amount) {
    return '₦' + parseFloat(amount || 0).toLocaleString('en-NG');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(message) {
    // Simple error display - could be enhanced with toast notifications
    alert(message);
}
</script>

</body>
</html>