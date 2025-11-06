<?php
// Start session first before any output
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$pageTitle = 'Analytics Dashboard';
$currentPage = 'analytics';
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
?>

<style>
.analytics-card {
    border: none;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
}

.analytics-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.metric-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
}

.metric-value {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.metric-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.metric-change {
    font-size: 0.8rem;
    margin-top: 0.5rem;
}

.chart-container {
    position: relative;
    height: 350px;
    width: 100%;
}

.data-table {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.data-table th {
    background: #f8f9fa;
    border: none;
    font-weight: 600;
    color: #495057;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.data-table td {
    border: none;
    border-bottom: 1px solid #f1f3f4;
    vertical-align: middle;
}

.activity-timeline {
    max-height: 400px;
    overflow-y: auto;
}

.timeline-item {
    border-left: 3px solid #e9ecef;
    padding-left: 1rem;
    margin-bottom: 1rem;
    position: relative;
}

.timeline-item::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 0.5rem;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #667eea;
}

.timeline-item.success::before {
    background: #28a745;
}

.timeline-item.warning::before {
    background: #ffc107;
}

.timeline-item.danger::before {
    background: #dc3545;
}

.filter-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
}

.insights-card {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border-radius: 12px;
    padding: 1.5rem;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}
</style>

<!-- Page Header -->
<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h1 class="h3 mb-1">Analytics Dashboard</h1>
        <p class="text-muted mb-0">Comprehensive insights into system performance and business metrics</p>
    </div>
    <div class="d-flex gap-2">
        <button class="btn btn-outline-primary btn-sm" onclick="exportReport()">
            <i class="ti ti-download me-1"></i>Export Report
        </button>
        <button class="btn btn-primary btn-sm" onclick="refreshData()">
            <i class="ti ti-refresh me-1"></i>Refresh
        </button>
    </div>
</div>

<!-- Filters -->
<div class="filter-section">
    <div class="row g-3">
        <div class="col-md-3">
            <label class="form-label small fw-bold">Time Period</label>
            <select class="form-select" id="timePeriod" onchange="updateAnalytics()">
                <option value="7d">Last 7 Days</option>
                <option value="30d" selected>Last 30 Days</option>
                <option value="90d">Last 3 Months</option>
                <option value="1y">Last Year</option>
            </select>
        </div>
        <div class="col-md-3">
            <label class="form-label small fw-bold">Data Type</label>
            <select class="form-select" id="dataType" onchange="updateAnalytics()">
                <option value="all">All Data</option>
                <option value="revenue">Revenue</option>
                <option value="users">Users</option>
                <option value="companies">Companies</option>
            </select>
        </div>
        <div class="col-md-3">
            <label class="form-label small fw-bold">Chart Type</label>
            <select class="form-select" id="chartType" onchange="updateCharts()">
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="area">Area Chart</option>
            </select>
        </div>
        <div class="col-md-3">
            <label class="form-label small fw-bold">Compare</label>
            <button class="btn btn-outline-secondary w-100" onclick="toggleComparison()">
                <i class="ti ti-compare me-1"></i>Compare Periods
            </button>
        </div>
    </div>
</div>

<!-- KPI Grid -->
<div class="kpi-grid">
    <div class="metric-card">
        <div class="metric-value" id="totalRevenue">₦0</div>
        <div class="metric-label">Total Revenue</div>
        <div class="metric-change" id="revenueChange">
            <i class="ti ti-trending-up"></i> +0% from last period
        </div>
    </div>
    
    <div class="metric-card" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
        <div class="metric-value" id="activeUsers">0</div>
        <div class="metric-label">Active Users</div>
        <div class="metric-change" id="usersChange">
            <i class="ti ti-trending-up"></i> +0% from last period
        </div>
    </div>
    
    <div class="metric-card" style="background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);">
        <div class="metric-value" id="totalCompanies">0</div>
        <div class="metric-label">Total Companies</div>
        <div class="metric-change" id="companiesChange">
            <i class="ti ti-trending-up"></i> +0% from last period
        </div>
    </div>
    
    <div class="metric-card" style="background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);">
        <div class="metric-value" id="conversionRate">0%</div>
        <div class="metric-label">Conversion Rate</div>
        <div class="metric-change" id="conversionChange">
            <i class="ti ti-trending-up"></i> +0% from last period
        </div>
    </div>
</div>

<!-- Charts and Data -->
<div class="row g-4 mb-4">
    <!-- Revenue Chart -->
    <div class="col-lg-8">
        <div class="card analytics-card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">Revenue Trends</h5>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary active" onclick="showChart('revenue')">Revenue</button>
                    <button type="button" class="btn btn-outline-primary" onclick="showChart('users')">Users</button>
                    <button type="button" class="btn btn-outline-primary" onclick="showChart('companies')">Companies</button>
                </div>
            </div>
            <div class="card-body">
                <div class="chart-container">
                    <canvas id="mainChart"></canvas>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Performance Summary -->
    <div class="col-lg-4">
        <div class="card analytics-card">
            <div class="card-header">
                <h5 class="card-title mb-0">Performance Summary</h5>
            </div>
            <div class="card-body">
                <div class="mb-4">
                    <label class="form-label small text-muted">System Uptime</label>
                    <div class="progress mb-1" style="height: 8px;">
                        <div class="progress-bar bg-success" style="width: 99.9%"></div>
                    </div>
                    <small class="text-muted">99.9% uptime</small>
                </div>
                
                <div class="mb-4">
                    <label class="form-label small text-muted">Database Performance</label>
                    <div class="progress mb-1" style="height: 8px;">
                        <div class="progress-bar bg-primary" style="width: 95%"></div>
                    </div>
                    <small class="text-muted">Excellent</small>
                </div>
                
                <div class="mb-4">
                    <label class="form-label small text-muted">API Response Time</label>
                    <div class="progress mb-1" style="height: 8px;">
                        <div class="progress-bar bg-warning" style="width: 78%"></div>
                    </div>
                    <small class="text-muted">Average: 120ms</small>
                </div>
                
                <div class="insights-card">
                    <h6 class="mb-2">Key Insights</h6>
                    <ul class="list-unstyled small mb-0">
                        <li>• Revenue up 15% this month</li>
                        <li>• User registrations increased 22%</li>
                        <li>• Conversion rate improved by 3.2%</li>
                        <li>• Support tickets down 18%</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Data Tables and Activity -->
<div class="row g-4">
    <!-- Top Companies -->
    <div class="col-lg-6">
        <div class="card analytics-card">
            <div class="card-header">
                <h5 class="card-title mb-0">Top Performing Companies</h5>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table data-table mb-0">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Users</th>
                                <th>Revenue</th>
                                <th>Growth</th>
                            </tr>
                        </thead>
                        <tbody id="topCompaniesTable">
                            <tr>
                                <td colspan="4" class="text-center py-3">
                                    <div class="spinner-border spinner-border-sm"></div>
                                    <span class="ms-2">Loading...</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="col-lg-6">
        <div class="card analytics-card">
            <div class="card-header">
                <h5 class="card-title mb-0">Recent System Activity</h5>
            </div>
            <div class="card-body">
                <div class="activity-timeline" id="activityTimeline">
                    <div class="text-center py-3">
                        <div class="spinner-border spinner-border-sm"></div>
                        <span class="ms-2">Loading activity...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- User Demographics -->
<div class="row g-4 mt-2">
    <div class="col-lg-4">
        <div class="card analytics-card">
            <div class="card-header">
                <h5 class="card-title mb-0">User Distribution by Role</h5>
            </div>
            <div class="card-body">
                <div class="chart-container" style="height: 250px;">
                    <canvas id="roleChart"></canvas>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-lg-4">
        <div class="card analytics-card">
            <div class="card-header">
                <h5 class="card-title mb-0">Subscription Plans</h5>
            </div>
            <div class="card-body">
                <div class="chart-container" style="height: 250px;">
                    <canvas id="subscriptionChart"></canvas>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-lg-4">
        <div class="card analytics-card">
            <div class="card-header">
                <h5 class="card-title mb-0">Payment Status</h5>
            </div>
            <div class="card-body">
                <div class="chart-container" style="height: 250px;">
                    <canvas id="paymentChart"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Chart.js Library -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
let mainChart = null;
let roleChart = null;
let subscriptionChart = null;
let paymentChart = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    loadAnalyticsData();
});

function initializeCharts() {
    // Main chart
    const mainCtx = document.getElementById('mainChart').getContext('2d');
    mainChart = new Chart(mainCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
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
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Role distribution chart
    const roleCtx = document.getElementById('roleChart').getContext('2d');
    roleChart = new Chart(roleCtx, {
        type: 'doughnut',
        data: {
            labels: ['Admin', 'Manager', 'User'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
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
    
    // Subscription chart
    const subCtx = document.getElementById('subscriptionChart').getContext('2d');
    subscriptionChart = new Chart(subCtx, {
        type: 'doughnut',
        data: {
            labels: ['Free', 'Starter', 'Professional', 'Enterprise'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#6c757d', '#17a2b8', '#667eea', '#764ba2'],
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
    
    // Payment status chart
    const payCtx = document.getElementById('paymentChart').getContext('2d');
    paymentChart = new Chart(payCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending', 'Cancelled'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
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

async function loadAnalyticsData() {
    try {
        const period = document.getElementById('timePeriod').value;
        const dataType = document.getElementById('dataType').value;
        
        const response = await fetch(`../api/analytics.php?period=${period}&type=${dataType}`);
        const data = await response.json();
        
        if (data.success) {
            updateKPIs(data.kpis);
            updateMainChart(data.trends);
            updateTopCompanies(data.top_companies);
            updateActivity(data.recent_activity);
            updateDistributionCharts(data.distributions);
        } else {
            showError('Failed to load analytics data: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showError('Error loading analytics data');
    }
}

function updateKPIs(kpis) {
    document.getElementById('totalRevenue').textContent = formatCurrency(kpis.total_revenue || 0);
    document.getElementById('activeUsers').textContent = kpis.active_users || 0;
    document.getElementById('totalCompanies').textContent = kpis.total_companies || 0;
    document.getElementById('conversionRate').textContent = (kpis.conversion_rate || 0) + '%';
    
    // Update change indicators
    updateChangeIndicator('revenueChange', kpis.revenue_change || 0);
    updateChangeIndicator('usersChange', kpis.users_change || 0);
    updateChangeIndicator('companiesChange', kpis.companies_change || 0);
    updateChangeIndicator('conversionChange', kpis.conversion_change || 0);
}

function updateChangeIndicator(elementId, change) {
    const element = document.getElementById(elementId);
    const icon = change >= 0 ? 'ti-trending-up' : 'ti-trending-down';
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'inherit' : 'rgba(255,255,255,0.7)';
    
    element.innerHTML = `<i class="ti ${icon}"></i> ${sign}${change}% from last period`;
    element.style.color = color;
}

function updateMainChart(trends) {
    if (!mainChart || !trends) return;
    
    mainChart.data.labels = trends.labels || [];
    mainChart.data.datasets[0].data = trends.data || [];
    mainChart.update();
}

function updateTopCompanies(companies) {
    const tbody = document.getElementById('topCompaniesTable');
    
    if (!companies || companies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data available</td></tr>';
        return;
    }
    
    tbody.innerHTML = companies.map(company => `
        <tr>
            <td class="fw-medium">${company.name}</td>
            <td>${company.user_count}</td>
            <td>${formatCurrency(company.revenue || 0)}</td>
            <td>
                <span class="badge ${company.growth >= 0 ? 'bg-success' : 'bg-danger'}">
                    ${company.growth >= 0 ? '+' : ''}${company.growth}%
                </span>
            </td>
        </tr>
    `).join('');
}

function updateActivity(activities) {
    const container = document.getElementById('activityTimeline');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No recent activity</div>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="timeline-item ${activity.type || ''}">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="fw-medium">${activity.title}</div>
                    <div class="text-muted small">${activity.description}</div>
                </div>
                <small class="text-muted">${formatTimeAgo(activity.timestamp)}</small>
            </div>
        </div>
    `).join('');
}

function updateDistributionCharts(distributions) {
    if (distributions.roles) {
        roleChart.data.datasets[0].data = [
            distributions.roles.admin || 0,
            distributions.roles.manager || 0,
            distributions.roles.user || 0
        ];
        roleChart.update();
    }
    
    if (distributions.subscriptions) {
        subscriptionChart.data.datasets[0].data = [
            distributions.subscriptions.free || 0,
            distributions.subscriptions.starter || 0,
            distributions.subscriptions.professional || 0,
            distributions.subscriptions.enterprise || 0
        ];
        subscriptionChart.update();
    }
    
    if (distributions.payments) {
        paymentChart.data.datasets[0].data = [
            distributions.payments.completed || 0,
            distributions.payments.pending || 0,
            distributions.payments.cancelled || 0
        ];
        paymentChart.update();
    }
}

function updateAnalytics() {
    loadAnalyticsData();
}

function updateCharts() {
    const chartType = document.getElementById('chartType').value;
    mainChart.config.type = chartType;
    mainChart.update();
}

function showChart(type) {
    // Update button states
    document.querySelectorAll('.btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // This would typically update the chart data based on type
    console.log('Showing chart for:', type);
}

function toggleComparison() {
    // Implementation for period comparison
    console.log('Toggle comparison');
}

function refreshData() {
    loadAnalyticsData();
}

function exportReport() {
    const period = document.getElementById('timePeriod').value;
    window.open(`../api/analytics.php?action=export&period=${period}`, '_blank');
}

function formatCurrency(amount) {
    return '₦' + parseFloat(amount).toLocaleString('en-NG');
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
}

function showError(message) {
    alert('Error: ' + message);
}
</script>

<?php require_once '../includes/footer.php'; ?>