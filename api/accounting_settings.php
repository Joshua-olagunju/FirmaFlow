<?php
// Clean accounting settings API with AccountResolver
if (ob_get_level()) {
    ob_clean();
}
error_reporting(0);
ini_set('display_errors', 0);

session_start();
header('Content-Type: application/json');

try {
    // Check session
    if (!isset($_SESSION['company_id'])) {
        echo json_encode(['error' => 'Unauthorized - Please login']);
        exit;
    }
    
    $company_id = $_SESSION['company_id'];
    
    require_once __DIR__ . '/../includes/db.php';
    require_once __DIR__ . '/../includes/company_settings_helper.php';
    require_once __DIR__ . '/../includes/AccountResolver.php';
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Initialize AccountResolver to ensure accounts exist
        $resolver = new AccountResolver($pdo, $company_id);
        
        // Get settings from helper
        $settings = getAccountingSettings($pdo, $company_id);
        
        // Ensure all essential accounts exist and are in settings
        $essentialAccounts = [
            'sales_account_id' => $resolver->get('sales', true),
            'ar_account_id' => $resolver->get('ar', true),
            'ap_account_id' => $resolver->get('ap', true),
            'inventory_account_id' => $resolver->get('inventory', true),
            'cogs_account_id' => $resolver->get('cogs', true),
            'retained_earnings_account_id' => $resolver->get('retained', true),
        ];
        
        // Get cash account (first one from resolver)
        $cashAccountId = $resolver->get('cash', true);
        $settings['cash_account_ids'] = [$cashAccountId];
        
        // Update settings with resolved account IDs
        foreach ($essentialAccounts as $key => $accountId) {
            if (!$settings[$key]) {
                $settings[$key] = $accountId;
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => $settings
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $updateData = [
            'accounting_method' => $input['accounting_method'] ?? 'accrual',
            'sales_account_id' => !empty($input['sales_account_id']) ? intval($input['sales_account_id']) : null,
            'ar_account_id' => !empty($input['ar_account_id']) ? intval($input['ar_account_id']) : null,
            'ap_account_id' => !empty($input['ap_account_id']) ? intval($input['ap_account_id']) : null,
            'inventory_account_id' => !empty($input['inventory_account_id']) ? intval($input['inventory_account_id']) : null,
            'cogs_account_id' => !empty($input['cogs_account_id']) ? intval($input['cogs_account_id']) : null,
            'retained_earnings_account_id' => !empty($input['retained_earnings_account_id']) ? intval($input['retained_earnings_account_id']) : null,
        ];
        
        // Handle cash accounts array
        $cashAccountIds = [];
        if (isset($input['cash_account_ids']) && is_array($input['cash_account_ids'])) {
            foreach ($input['cash_account_ids'] as $cashId) {
                if (!empty($cashId)) {
                    $cashAccountIds[] = intval($cashId);
                }
            }
        }
        $updateData['cash_account_ids'] = $cashAccountIds;
        
        $success = updateCompanySettings($pdo, $company_id, $updateData);
        
        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Accounting settings updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Failed to update accounting settings'
            ]);
        }
    } else {
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
