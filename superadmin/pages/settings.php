<?php
$pageTitle = 'System Settings';
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
require_once '../includes/currency_helper.php';

$pdo = getSuperAdminDB();
CurrencyHelper::init($pdo);

$message = '';
$messageType = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'update_currency') {
        $currency = $_POST['default_currency'] ?? '';
        
        try {
            CurrencyHelper::setDefaultCurrency($currency);
            $message = 'Currency settings updated successfully';
            $messageType = 'success';
            
            // Log action
            $user = getSuperAdminUser();
            $stmt = $pdo->prepare("
                INSERT INTO superadmin_logs (username, action, details, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $user['username'],
                'CURRENCY_UPDATED',
                "Changed default currency to: $currency",
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);
        } catch (Exception $e) {
            $message = 'Error updating currency: ' . $e->getMessage();
            $messageType = 'danger';
        }
    } elseif ($action === 'update_rates') {
        try {
            CurrencyHelper::updateExchangeRates();
            $message = 'Exchange rates updated successfully';
            $messageType = 'success';
        } catch (Exception $e) {
            $message = 'Error updating exchange rates: ' . $e->getMessage();
            $messageType = 'danger';
        }
    }
}

$currentCurrency = CurrencyHelper::getDefaultCurrency();
$currencies = CurrencyHelper::getCurrencies();
$revenueByPlan = CurrencyHelper::getRevenueByPlan($pdo);
?>

<!-- Main Content -->
<div class="main-content">
    <div class="container-fluid">
        
        <!-- Page Header -->
        <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4">
            <div class="mb-3 mb-lg-0">
                <h1 class="h3 mb-1">System Settings</h1>
                <p class="text-muted mb-0">Configure system-wide settings and preferences</p>
            </div>
        </div>

        <!-- Messages -->
        <?php if ($message): ?>
        <div class="alert alert-<?= $messageType ?> alert-dismissible fade show mb-4" role="alert">
            <?= htmlspecialchars($message) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
        <?php endif; ?>

        <div class="row g-4">
            <!-- Currency Settings -->
            <div class="col-12 col-lg-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="ti ti-currency-dollar me-2"></i>Currency Settings
                        </h5>
                    </div>
                    <div class="card-body">
                        <form method="POST" action="">
                            <input type="hidden" name="action" value="update_currency">
                            
                            <div class="row g-3">
                                <div class="col-12 col-md-6">
                                    <label for="default_currency" class="form-label">Default Currency</label>
                                    <select class="form-select" id="default_currency" name="default_currency" required>
                                        <?php foreach ($currencies as $code => $info): ?>
                                        <option value="<?= $code ?>" <?= $code === $currentCurrency ? 'selected' : '' ?>>
                                            <?= $info['symbol'] ?> <?= $code ?> - <?= $info['name'] ?>
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                    <div class="form-text">This currency will be used for all revenue displays and calculations.</div>
                                </div>
                                
                                <div class="col-12 col-md-6">
                                    <label class="form-label">Current Rate (vs USD)</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$1 =</span>
                                        <input type="text" class="form-control" 
                                               value="<?= $currencies[$currentCurrency]['symbol'] ?><?= number_format($currencies[$currentCurrency]['rate'], 2) ?>" 
                                               readonly>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-4">
                                <button type="submit" class="btn btn-primary">
                                    <i class="ti ti-device-floppy me-1"></i>Save Currency Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Currency Preview -->
            <div class="col-12 col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="ti ti-eye me-2"></i>Currency Preview
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="d-flex flex-column gap-3">
                            <div>
                                <small class="text-muted">Sample Amount</small>
                                <div class="h5 mb-0"><?= formatCurrency(1500) ?></div>
                            </div>
                            <div>
                                <small class="text-muted">Large Amount</small>
                                <div class="h5 mb-0"><?= formatCurrency(125000) ?></div>
                            </div>
                            <div>
                                <small class="text-muted">Decimal Amount</small>
                                <div class="h5 mb-0"><?= formatCurrency(29.99) ?></div>
                            </div>
                        </div>

                        <hr>

                        <form method="POST" class="mt-3">
                            <input type="hidden" name="action" value="update_rates">
                            <button type="submit" class="btn btn-outline-primary btn-sm w-100">
                                <i class="ti ti-refresh me-1"></i>Update Exchange Rates
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Revenue by Plan -->
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="ti ti-chart-bar me-2"></i>Revenue by Subscription Plan
                        </h5>
                    </div>
                    <div class="card-body">
                        <?php if (empty($revenueByPlan)): ?>
                        <div class="text-center py-4 text-muted">
                            <i class="ti ti-chart-line display-4"></i>
                            <p class="mt-2">No revenue data available</p>
                        </div>
                        <?php else: ?>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Subscription Plan</th>
                                        <th class="text-end">Active Users</th>
                                        <th class="text-end">Monthly Revenue</th>
                                        <th class="text-end">Annual Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php 
                                    $totalRevenue = 0;
                                    $totalUsers = 0;
                                    foreach ($revenueByPlan as $plan): 
                                        $annualRevenue = $plan['revenue'] * 12;
                                        $totalRevenue += $plan['revenue'];
                                        $totalUsers += $plan['count'];
                                    ?>
                                    <tr>
                                        <td>
                                            <span class="badge bg-<?= $plan['subscription_plan'] === 'free' ? 'secondary' : 'primary' ?>">
                                                <?= ucfirst($plan['subscription_plan']) ?>
                                            </span>
                                        </td>
                                        <td class="text-end"><?= $plan['count'] ?></td>
                                        <td class="text-end"><?= $plan['formatted_revenue'] ?></td>
                                        <td class="text-end"><?= formatCurrency($annualRevenue) ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                                <tfoot class="table-light">
                                    <tr>
                                        <th>Total</th>
                                        <th class="text-end"><?= $totalUsers ?></th>
                                        <th class="text-end"><?= formatCurrency($totalRevenue) ?></th>
                                        <th class="text-end"><?= formatCurrency($totalRevenue * 12) ?></th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Supported Currencies -->
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="ti ti-world me-2"></i>Supported Currencies
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <?php foreach ($currencies as $code => $info): ?>
                            <div class="col-6 col-md-4 col-lg-3">
                                <div class="d-flex align-items-center p-2 rounded <?= $code === $currentCurrency ? 'bg-primary bg-opacity-10 border border-primary border-opacity-25' : 'bg-light' ?>">
                                    <div class="me-2">
                                        <span class="badge bg-light text-dark"><?= $info['symbol'] ?></span>
                                    </div>
                                    <div class="flex-grow-1">
                                        <div class="fw-medium"><?= $code ?></div>
                                        <small class="text-muted"><?= $info['name'] ?></small>
                                    </div>
                                    <?php if ($code === $currentCurrency): ?>
                                    <div class="text-primary">
                                        <i class="ti ti-check"></i>
                                    </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Include Footer -->
<?php require_once '../includes/footer.php'; ?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const currencySelect = document.getElementById('default_currency');
    
    currencySelect.addEventListener('change', function() {
        // You could add real-time preview updates here
        console.log('Currency changed to:', this.value);
    });
});
</script>