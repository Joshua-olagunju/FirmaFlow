<?php
/**
 * Company Settings Helper Functions (Key-Value Store)
 * Provides centralized access to company accounting configuration
 */

/**
 * Get a specific company setting value
 * @param PDO $pdo Database connection
 * @param int $company_id Company ID
 * @param string $key Setting key
 * @param mixed $default Default value if not found
 * @return mixed Setting value
 */
function getCompanySetting($pdo, $company_id, $key, $default = null) {
    try {
        $stmt = $pdo->prepare("
            SELECT setting_value, setting_type 
            FROM company_settings 
            WHERE company_id = ? AND setting_key = ?
        ");
        $stmt->execute([$company_id, $key]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return $default;
        }
        
        // Convert based on type
        switch ($result['setting_type']) {
            case 'integer':
                return intval($result['setting_value']);
            case 'number':
                return floatval($result['setting_value']);
            case 'boolean':
                return filter_var($result['setting_value'], FILTER_VALIDATE_BOOLEAN);
            case 'json':
                return json_decode($result['setting_value'], true);
            default:
                return $result['setting_value'];
        }
    } catch (Exception $e) {
        error_log("Error getting company setting $key: " . $e->getMessage());
        return $default;
    }
}

/**
 * Set a company setting value
 * @param PDO $pdo Database connection
 * @param int $company_id Company ID
 * @param string $key Setting key
 * @param mixed $value Setting value
 * @param string $type Setting type (string, integer, number, boolean, json)
 * @return bool Success
 */
function setCompanySetting($pdo, $company_id, $key, $value, $type = 'string') {
    try {
        // Convert value based on type
        switch ($type) {
            case 'json':
                $value = json_encode($value);
                break;
            case 'boolean':
                $value = $value ? '1' : '0';
                break;
            default:
                $value = strval($value);
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value),
                setting_type = VALUES(setting_type),
                updated_at = CURRENT_TIMESTAMP
        ");
        
        return $stmt->execute([$company_id, $key, $value, $type]);
    } catch (Exception $e) {
        error_log("Error setting company setting $key: " . $e->getMessage());
        return false;
    }
}

/**
 * Get company accounting settings with AccountResolver integration
 * @param PDO $pdo Database connection
 * @param int $company_id Company ID
 * @return array Company settings with defaults
 */
function getAccountingSettings($pdo, $company_id) {
    try {
        // Include AccountResolver for auto-account creation
        require_once __DIR__ . '/AccountResolver.php';
        $resolver = new AccountResolver($pdo, $company_id);
        
        // Get all accounting-related settings
        $settings = [
            'accounting_method' => getCompanySetting($pdo, $company_id, 'accounting_method', 'accrual'),
            'cogs_account_id' => getCompanySetting($pdo, $company_id, 'cogs_account_id', $resolver->cogs()),
            'inventory_account_id' => getCompanySetting($pdo, $company_id, 'inventory_account_id', $resolver->inventory()),
            'sales_account_id' => getCompanySetting($pdo, $company_id, 'sales_account_id', $resolver->sales()),
            'ar_account_id' => getCompanySetting($pdo, $company_id, 'ar_account_id', $resolver->ar()),
            'ap_account_id' => getCompanySetting($pdo, $company_id, 'ap_account_id', $resolver->ap()),
            'cash_account_ids' => getCompanySetting($pdo, $company_id, 'cash_account_ids', [$resolver->cash()], 'json'),
            'retained_earnings_account_id' => getCompanySetting($pdo, $company_id, 'retained_earnings_account_id', $resolver->retained()),
        ];
        
        // Ensure cash_account_ids is an array
        if (!is_array($settings['cash_account_ids'])) {
            $settings['cash_account_ids'] = [$resolver->cash()];
        }
        
        return $settings;
        
    } catch (Exception $e) {
        error_log("Error getting accounting settings: " . $e->getMessage());
        return [
            'accounting_method' => 'accrual',
            'cogs_account_id' => null,
            'inventory_account_id' => null,
            'sales_account_id' => null,
            'ar_account_id' => null,
            'ap_account_id' => null,
            'cash_account_ids' => [],
            'retained_earnings_account_id' => null
        ];
    }
}

/**
 * Update company settings (batch update)
 * @param PDO $pdo Database connection
 * @param int $company_id Company ID
 * @param array $settings Settings to update
 * @return bool Success
 */
function updateCompanySettings($pdo, $company_id, $settings) {
    try {
        $pdo->beginTransaction();
        
        foreach ($settings as $key => $value) {
            // Determine type
            $type = 'string';
            if (is_int($value)) {
                $type = 'integer';
            } elseif (is_float($value)) {
                $type = 'number';
            } elseif (is_bool($value)) {
                $type = 'boolean';
            } elseif (is_array($value)) {
                $type = 'json';
            }
            
            if (!setCompanySetting($pdo, $company_id, $key, $value, $type)) {
                $pdo->rollBack();
                return false;
            }
        }
        
        $pdo->commit();
        return true;
        
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Error updating company settings: " . $e->getMessage());
        return false;
    }
}
?>