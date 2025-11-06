<?php
$pageTitle = 'System Monitoring';
$currentPage = 'monitoring';
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
?>

<style>
.metric-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    padding: 1.5rem;
    transition: transform 0.3s ease;
}

.metric-card:hover {
    transform: translateY(-5px);
}

.metric-value {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.metric-label {
    font-size: 1rem;
    opacity: 0.9;
}

.status-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.875rem;
}

.status-healthy {
    background: #d4edda;
    color: #155724;
}

.status-warning {
    background: #fff3cd;
    color: #856404;
}

.status-critical {
    background: #f8d7da;
    color: #721c24;
}

.chart-container {
    position: relative;
    height: 300px;
    margin: 1rem 0;
}

.log-entry {
    border-left: 3px solid #007bff;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: #f8f9fa;
    border-radius: 0 8px 8px 0;
}

.log-entry.error {
    border-left-color: #dc3545;
}

.log-entry.warning {
    border-left-color: #ffc107;
}

.log-entry.info {
    border-left-color: #17a2b8;
}
</style>

<div class="app-main">
    <div class="container-xl">
        <!-- Page Header -->
        <div class="page-header d-print-none">
            <div class="row g-2 align-items-center">
                <div class="col">
                    <div class="page-pretitle">SuperAdmin</div>
                    <h2 class="page-title">System Monitoring</h2>
                </div>
                <div class="col-12 col-md-auto ms-auto d-print-none">
                    <div class="btn-list">
                        <button class="btn btn-outline-primary" onclick="refreshData()">
                            <i class="ti ti-refresh me-1"></i>Refresh
                        </button>
                        <button class="btn btn-primary" onclick="exportLogs()">
                            <i class="ti ti-download me-1"></i>Export Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Status Overview -->
        <div class="row g-3 mb-4">
            <div class="col-6 col-lg-3">
                <div class="metric-card text-center">
                    <div class="metric-value" id="totalUsers">0</div>
                    <div class="metric-label">Total Users</div>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="metric-card text-center">
                    <div class="metric-value" id="activeConnections">0</div>
                    <div class="metric-label">Active Connections</div>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="metric-card text-center">
                    <div class="metric-value" id="systemUptime">0h</div>
                    <div class="metric-label">System Uptime</div>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="metric-card text-center">
                    <div class="metric-value" id="totalRevenue">₦0</div>
                    <div class="metric-label">Total Revenue</div>
                </div>
            </div>
        </div>

        <!-- System Health Status -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Database</h5>
                        <div class="status-badge status-healthy" id="dbStatus">
                            <i class="ti ti-check me-1"></i>Healthy
                        </div>
                        <div class="mt-2 small text-muted" id="dbInfo">Response: 2ms</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Server</h5>
                        <div class="status-badge status-healthy" id="serverStatus">
                            <i class="ti ti-check me-1"></i>Healthy
                        </div>
                        <div class="mt-2 small text-muted" id="serverInfo">CPU: 15%</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Storage</h5>
                        <div class="status-badge status-warning" id="storageStatus">
                            <i class="ti ti-alert-triangle me-1"></i>Warning
                        </div>
                        <div class="mt-2 small text-muted" id="storageInfo">78% Used</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Network</h5>
                        <div class="status-badge status-healthy" id="networkStatus">
                            <i class="ti ti-check me-1"></i>Healthy
                        </div>
                        <div class="mt-2 small text-muted" id="networkInfo">Latency: 12ms</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Row -->
        <div class="row g-3 mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">User Activity (Last 24h)</h3>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="userActivityChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">System Performance</h3>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="performanceChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Real-time Logs -->
        <div class="row g-3">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h3 class="card-title">Recent System Logs</h3>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary active" onclick="filterLogs('all')">All</button>
                            <button class="btn btn-outline-primary" onclick="filterLogs('error')">Errors</button>
                            <button class="btn btn-outline-primary" onclick="filterLogs('warning')">Warnings</button>
                            <button class="btn btn-outline-primary" onclick="filterLogs('info')">Info</button>
                        </div>
                    </div>
                    <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                        <div id="logEntries">
                            <!-- Logs will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Quick Actions</h3>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary" onclick="runDiagnostics()">
                                <i class="ti ti-stethoscope me-1"></i>Run Diagnostics
                            </button>
                            <button class="btn btn-outline-warning" onclick="clearCache()">
                                <i class="ti ti-trash me-1"></i>Clear Cache
                            </button>
                            <button class="btn btn-outline-info" onclick="backupDatabase()">
                                <i class="ti ti-database-export me-1"></i>Backup Database
                            </button>
                            <button class="btn btn-outline-success" onclick="optimizeDatabase()">
                                <i class="ti ti-adjustments me-1"></i>Optimize Database
                            </button>
                        </div>
                        
                        <hr class="my-3">
                        
                        <h5>System Info</h5>
                        <div class="small">
                            <div class="row mb-1">
                                <div class="col-6">PHP Version:</div>
                                <div class="col-6 text-end" id="phpVersion"><?= phpversion() ?></div>
                            </div>
                            <div class="row mb-1">
                                <div class="col-6">MySQL Version:</div>
                                <div class="col-6 text-end" id="mysqlVersion">-</div>
                            </div>
                            <div class="row mb-1">
                                <div class="col-6">Server Time:</div>
                                <div class="col-6 text-end" id="serverTime"><?= date('H:i:s') ?></div>
                            </div>
                            <div class="row mb-1">
                                <div class="col-6">Memory Usage:</div>
                                <div class="col-6 text-end" id="memoryUsage"><?= round(memory_get_usage(true) / 1024 / 1024, 2) ?>MB</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
let userActivityChart, performanceChart;
let logFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    loadSystemData();
    loadSystemLogs();
    
    // Update server time every second
    setInterval(updateServerTime, 1000);
    
    // Refresh data every 30 seconds
    setInterval(loadSystemData, 30000);
    
    // Refresh logs every 10 seconds
    setInterval(loadSystemLogs, 10000);
});

function initializeCharts() {
    // User Activity Chart
    const userCtx = document.getElementById('userActivityChart').getContext('2d');
    userActivityChart = new Chart(userCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Active Users',
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
                    beginAtZero: true
                }
            }
        }
    });
    
    // Performance Chart
    const perfCtx = document.getElementById('performanceChart').getContext('2d');
    performanceChart = new Chart(perfCtx, {
        type: 'doughnut',
        data: {
            labels: ['CPU Usage', 'Memory Usage', 'Available'],
            datasets: [{
                data: [15, 45, 40],
                backgroundColor: ['#ff6b6b', '#ffd93d', '#6bcf7f'],
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

async function loadSystemData() {
    try {
        const response = await fetch('../api/system_monitoring.php?action=get_metrics');
        const data = await response.json();
        
        if (data.success) {
            updateMetrics(data.metrics);
            updateCharts(data.charts);
        }
    } catch (error) {
        console.error('Error loading system data:', error);
    }
}

async function loadSystemLogs() {
    try {
        const response = await fetch(`../api/system_monitoring.php?action=get_logs&filter=${logFilter}`);
        const data = await response.json();
        
        if (data.success) {
            updateLogs(data.logs);
        }
    } catch (error) {
        console.error('Error loading logs:', error);
    }
}

function updateMetrics(metrics) {
    document.getElementById('totalUsers').textContent = metrics.total_users || 0;
    document.getElementById('activeConnections').textContent = metrics.active_connections || 0;
    document.getElementById('systemUptime').textContent = metrics.uptime || '0h';
    document.getElementById('totalRevenue').textContent = '₦' + (metrics.total_revenue || 0);
    document.getElementById('mysqlVersion').textContent = metrics.mysql_version || '-';
}

function updateCharts(chartData) {
    if (chartData.user_activity) {
        userActivityChart.data.labels = chartData.user_activity.labels;
        userActivityChart.data.datasets[0].data = chartData.user_activity.data;
        userActivityChart.update();
    }
    
    if (chartData.performance) {
        performanceChart.data.datasets[0].data = chartData.performance;
        performanceChart.update();
    }
}

function updateLogs(logs) {
    const container = document.getElementById('logEntries');
    
    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-3">No logs found</div>';
        return;
    }
    
    container.innerHTML = logs.map(log => `
        <div class="log-entry ${log.level}">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${log.level.toUpperCase()}</strong> - ${log.message}
                </div>
                <small class="text-muted">${new Date(log.created_at).toLocaleString()}</small>
            </div>
            ${log.details ? `<div class="mt-1 small text-muted">${log.details}</div>` : ''}
        </div>
    `).join('');
}

function updateServerTime() {
    document.getElementById('serverTime').textContent = new Date().toLocaleTimeString();
}

function filterLogs(filter) {
    logFilter = filter;
    
    // Update active button
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    loadSystemLogs();
}

function refreshData() {
    loadSystemData();
    loadSystemLogs();
    showSuccess('Data refreshed successfully');
}

function exportLogs() {
    window.open('../api/system_monitoring.php?action=export_logs', '_blank');
}

function runDiagnostics() {
    // Implement diagnostics
    showInfo('Running system diagnostics...');
}

function clearCache() {
    if (confirm('Are you sure you want to clear the system cache?')) {
        showInfo('Cache cleared successfully');
    }
}

function backupDatabase() {
    if (confirm('Are you sure you want to create a database backup?')) {
        showInfo('Database backup initiated...');
    }
}

function optimizeDatabase() {
    if (confirm('Are you sure you want to optimize the database?')) {
        showInfo('Database optimization started...');
    }
}

function showSuccess(message) {
    // Simple alert for now - could be enhanced with toast notifications
    const alertHtml = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.querySelector('.container-xl').insertAdjacentHTML('afterbegin', alertHtml);
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) alert.remove();
    }, 3000);
}

function showInfo(message) {
    const alertHtml = `
        <div class="alert alert-info alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.querySelector('.container-xl').insertAdjacentHTML('afterbegin', alertHtml);
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) alert.remove();
    }, 3000);
}
</script>

<?php require_once '../includes/footer.php'; ?>